/**
 * Server-side petition functions with database access
 * This file should only be imported on the server
 */

import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, gte, isNull, or } from "drizzle-orm";
import { db } from "#/db/index";
import {
	fraudSignals,
	petitions,
	signatures,
	submissionNonces,
} from "#/db/schema";
import { logDebug } from "#/lib/debug-logger";
import type {
	IssuedNonce,
	IssueNonceInput,
	LiveStats,
	PublicSignature,
	SignInput,
	SignResult,
} from "#/lib/petition-types";
import {
	evaluateRisk,
	isValidIranNationalId,
	maskIdentifierLastDigits,
	maskName,
	normalizeDigits,
	normalizePersianText,
} from "#/lib/security";

export const PETITION_ID = "petition-1";
export const PETITION_TITLE = "پویش ایران آزاد";

const NONCE_TTL_MS = 10 * 60 * 1000;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_IP_WINDOW = 8;

function getRequiredSecret(): string {
	const secret = process.env.PETITION_HMAC_SECRET;
	if (!secret) {
		throw new Error("PETITION_HMAC_SECRET environment variable is not set");
	}
	return secret;
}

function createUuid(): string {
	// Try the modern API first
	if (typeof globalThis.crypto?.randomUUID === "function") {
		return globalThis.crypto.randomUUID();
	}

	// Fallback for browsers that don't support crypto.randomUUID()
	if (typeof globalThis.crypto?.getRandomValues === "function") {
		const bytes = new Uint8Array(16);
		globalThis.crypto.getRandomValues(bytes);

		// Set version (4) and variant bits
		bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
		bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10

		// Convert to UUID format
		const hex = Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		return [
			hex.slice(0, 8),
			hex.slice(8, 12),
			hex.slice(12, 16),
			hex.slice(16, 20),
			hex.slice(20, 32),
		].join("-");
	}

	// Last resort: Math.random() fallback (not cryptographically secure but prevents crashes)
	const bytes = new Uint8Array(16);
	for (let i = 0; i < 16; i++) {
		bytes[i] = Math.floor(Math.random() * 256);
	}

	// Set version (4) and variant bits
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;

	const hex = Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	return [
		hex.slice(0, 8),
		hex.slice(8, 12),
		hex.slice(12, 16),
		hex.slice(16, 20),
		hex.slice(20, 32),
	].join("-");
}

async function hmacHash(value: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await globalThis.crypto.subtle.importKey(
		"raw",
		encoder.encode(getRequiredSecret()),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await globalThis.crypto.subtle.sign(
		"HMAC",
		key,
		encoder.encode(value),
	);
	return Array.from(new Uint8Array(signature))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

async function recordFraudEvent(input: {
	signatureId: string | null;
	hIpWindowed: string;
	hDeviceFingerprint: string;
	hUserAgent: string;
	hSessionBinding: string;
	riskScore: number;
	riskLevel: "low" | "medium" | "high";
	decision: "accept" | "step_up" | "reject";
	reasons: string[];
}): Promise<void> {
	if (!db) {
		throw new Error("Database not available - DATABASE_URL not set");
	}
	await db.insert(fraudSignals).values({
		id: createUuid(),
		signatureId: input.signatureId,
		petitionId: PETITION_ID,
		hIpWindowed: input.hIpWindowed,
		hDeviceFingerprint: input.hDeviceFingerprint,
		hUserAgent: input.hUserAgent,
		hSessionBinding: input.hSessionBinding,
		riskScore: input.riskScore,
		riskLevel: input.riskLevel,
		decision: input.decision,
		reasonsJson: JSON.stringify(input.reasons),
		createdAt: new Date(),
	});
}

type ValidationResult =
	| { ok: true; data: SignInput }
	| {
			ok: false;
			error: SignResult;
	  };

function validationError(messageFa: string): SignResult {
	return {
		success: false,
		code: "VALIDATION_FAILED",
		messageFa,
	};
}

function normalizeInput(data: SignInput): ValidationResult {
	if (
		!data.displayConsent ||
		!["hidden", "masked", "unmasked"].includes(
			data.displayConsent.nameDisplayMode,
		)
	) {
		return {
			ok: false,
			error: validationError("تنظیمات نمایش عمومی نامعتبر است."),
		};
	}
	const studentId = normalizeDigits(data.studentId).trim();
	const nationalId = normalizeDigits(data.nationalId).trim();
	const universityName = normalizePersianText(data.universityName);
	const facultyName = normalizePersianText(data.facultyName);
	const fullName = normalizePersianText(data.fullName ?? "");
	const nonce = data.nonce.trim();
	const csrfToken = data.csrfToken.trim();

	if (
		!studentId ||
		!nationalId ||
		!universityName ||
		!facultyName ||
		!nonce ||
		!csrfToken
	) {
		return {
			ok: false,
			error: validationError("لطفاً همه فیلدهای الزامی را تکمیل کنید."),
		};
	}
	if (!/^\d{5,20}$/.test(studentId)) {
		return {
			ok: false,
			error: validationError("شماره دانشجویی معتبر نیست."),
		};
	}
	if (!isValidIranNationalId(nationalId)) {
		return {
			ok: false,
			error: validationError("کد ملی معتبر نیست."),
		};
	}
	if (!data.clientSignals?.sessionId || !data.clientSignals?.fingerprint) {
		return {
			ok: false,
			error: validationError("شناسه نشست نامعتبر است."),
		};
	}

	return {
		ok: true,
		data: {
			...data,
			fullName,
			studentId,
			nationalId,
			universityName,
			facultyName,
			nonce,
			csrfToken,
			clientSignals: {
				...data.clientSignals,
				sessionId: data.clientSignals.sessionId.trim(),
				fingerprint: data.clientSignals.fingerprint.trim(),
				honeypotValue: data.clientSignals.honeypotValue?.trim(),
				submissionLatencyMs: Number.isFinite(
					data.clientSignals.submissionLatencyMs,
				)
					? Math.max(0, data.clientSignals.submissionLatencyMs)
					: 0,
			},
		},
	};
}

export async function ensurePetitionExists(text: string): Promise<void> {
	if (!db) {
		throw new Error("Database not available - DATABASE_URL not set");
	}
	const existing = await db
		.select({ id: petitions.id })
		.from(petitions)
		.where(eq(petitions.id, PETITION_ID))
		.limit(1);

	if (existing.length === 0) {
		await db.insert(petitions).values({
			id: PETITION_ID,
			title: PETITION_TITLE,
			text,
			createdAt: new Date(),
		});
	}
}

export async function issueNonce(input: IssueNonceInput): Promise<IssuedNonce> {
	const sessionId = input.sessionId.trim();
	if (!sessionId) {
		throw new Error("sessionId is required");
	}

	const nonce = createUuid();
	const csrfToken = createUuid();
	const expiresAt = new Date(Date.now() + NONCE_TTL_MS);

	if (!db) {
		throw new Error("Database not available - DATABASE_URL not set");
	}
	await db.insert(submissionNonces).values({
		nonce,
		sessionId,
		csrfToken,
		expiresAt,
		createdAt: new Date(),
	});

	return {
		nonce,
		csrfToken,
		expiresAt: expiresAt.toISOString(),
	};
}

async function submitSignatureInternal(
	raw: SignInput,
	serverSignals?: { ip?: string; userAgent?: string },
): Promise<SignResult> {
	const normalized = normalizeInput(raw);
	if (!normalized.ok) {
		return normalized.error;
	}
	const data = normalized.data;

	if (!db) {
		throw new Error("Database not available - DATABASE_URL not set");
	}

	logDebug("submitSignature_start", {
		hasNonce: !!raw.nonce,
		sessionId: raw.clientSignals?.sessionId,
		universityName: raw.universityName,
		facultyName: raw.facultyName,
	});

	const nonceRow = await db
		.select()
		.from(submissionNonces)
		.where(eq(submissionNonces.nonce, data.nonce))
		.limit(1);

	const nonceEntity = nonceRow[0];
	if (!nonceEntity) {
		return {
			success: false,
			code: "NONCE_INVALID",
			messageFa: "توکن ارسال نامعتبر است. لطفاً صفحه را تازه‌سازی کنید.",
		};
	}
	if (nonceEntity.usedAt) {
		return {
			success: false,
			code: "NONCE_REPLAYED",
			messageFa: "این درخواست قبلاً استفاده شده است. دوباره تلاش کنید.",
		};
	}
	if (nonceEntity.expiresAt.getTime() < Date.now()) {
		return {
			success: false,
			code: "NONCE_INVALID",
			messageFa: "زمان درخواست به پایان رسیده است. دوباره تلاش کنید.",
		};
	}
	if (
		nonceEntity.sessionId !== data.clientSignals.sessionId ||
		nonceEntity.csrfToken !== data.csrfToken
	) {
		return {
			success: false,
			code: "NONCE_INVALID",
			messageFa: "اعتبار نشست نامعتبر است. لطفاً دوباره تلاش کنید.",
		};
	}

	const normalizedRequestIp = normalizePersianText(
		serverSignals?.ip ?? "unknown",
	);
	const userAgent = normalizePersianText(serverSignals?.userAgent ?? "unknown");
	const hourWindow = new Date().toISOString().slice(0, 13);
	const hStudentId = await hmacHash(`student|${data.studentId}`);
	const hNationalId = await hmacHash(`national|${data.nationalId}`);
	const hStudentNationalCombo = await hmacHash(
		`combo|${data.studentId}|${data.nationalId}|${PETITION_ID}`,
	);
	const hIpWindowed = await hmacHash(`ip|${normalizedRequestIp}|${hourWindow}`);
	const normalizedFingerprint = normalizePersianText(
		data.clientSignals.fingerprint,
	);
	const hDeviceFingerprint = await hmacHash(`fp|${normalizedFingerprint}`);
	const hUserAgent = await hmacHash(`ua|${userAgent}`);
	const hSessionBinding = await hmacHash(
		`session|${data.clientSignals.sessionId}`,
	);
	const hSubmissionFingerprint = await hmacHash(
		`submission|${hDeviceFingerprint}|${hSessionBinding}|${hIpWindowed}`,
	);

	const duplicateRows = await db
		.select({
			id: signatures.id,
		})
		.from(signatures)
		.where(
			and(
				eq(signatures.petitionId, PETITION_ID),
				or(
					eq(signatures.hStudentId, hStudentId),
					eq(signatures.hNationalId, hNationalId),
					eq(signatures.hStudentNationalCombo, hStudentNationalCombo),
				),
			),
		)
		.limit(1);

	if (duplicateRows.length > 0) {
		return {
			success: false,
			code: "DUPLICATE_DETECTED",
			messageFa: "این اطلاعات قبلاً برای ثبت امضا استفاده شده است.",
		};
	}

	const oneHourAgo = new Date(Date.now() - RATE_WINDOW_MS);
	if (!db) {
		throw new Error("Database not available - DATABASE_URL not set");
	}
	const [deviceCountRow, ipCountRow, sessionCountRow, fingerprintSeenRow] =
		await Promise.all([
			db
				.select({ value: count() })
				.from(fraudSignals)
				.where(
					and(
						eq(fraudSignals.petitionId, PETITION_ID),
						eq(fraudSignals.hDeviceFingerprint, hDeviceFingerprint),
						gte(fraudSignals.createdAt, oneHourAgo),
					),
				),
			db
				.select({ value: count() })
				.from(fraudSignals)
				.where(
					and(
						eq(fraudSignals.petitionId, PETITION_ID),
						eq(fraudSignals.hIpWindowed, hIpWindowed),
						gte(fraudSignals.createdAt, oneHourAgo),
					),
				),
			db
				.select({ value: count() })
				.from(fraudSignals)
				.where(
					and(
						eq(fraudSignals.petitionId, PETITION_ID),
						eq(fraudSignals.hSessionBinding, hSessionBinding),
						gte(fraudSignals.createdAt, oneHourAgo),
					),
				),
			db
				.select({ value: count() })
				.from(signatures)
				.where(
					and(
						eq(signatures.petitionId, PETITION_ID),
						eq(signatures.hSubmissionFingerprint, hSubmissionFingerprint),
					),
				),
		]);

	const risk = evaluateRisk({
		deviceRecentCount: deviceCountRow[0]?.value ?? 0,
		ipRecentCount: ipCountRow[0]?.value ?? 0,
		sessionRecentCount: sessionCountRow[0]?.value ?? 0,
		duplicateFingerprintSeen: (fingerprintSeenRow[0]?.value ?? 0) > 0,
		honeypotTriggered: Boolean(data.clientSignals.honeypotValue),
		submissionLatencyMs: data.clientSignals.submissionLatencyMs,
	});

	if ((ipCountRow[0]?.value ?? 0) >= MAX_REQUESTS_PER_IP_WINDOW) {
		await db
			.update(submissionNonces)
			.set({ usedAt: new Date() })
			.where(
				and(
					eq(submissionNonces.nonce, data.nonce),
					isNull(submissionNonces.usedAt),
				),
			);
		await recordFraudEvent({
			signatureId: null,
			hIpWindowed,
			hDeviceFingerprint,
			hUserAgent,
			hSessionBinding,
			riskScore: Math.max(65, risk.score),
			riskLevel: "high",
			decision: "reject",
			reasons: [...risk.reasons, "rate-limit-hit"],
		});
		return {
			success: false,
			code: "RATE_LIMITED",
			messageFa: "تعداد درخواست‌های شما بیش از حد مجاز است. کمی بعد تلاش کنید.",
			retryAfterSeconds: 1800,
		};
	}

	if (risk.decision !== "accept") {
		await db
			.update(submissionNonces)
			.set({ usedAt: new Date() })
			.where(
				and(
					eq(submissionNonces.nonce, data.nonce),
					isNull(submissionNonces.usedAt),
				),
			);
		await recordFraudEvent({
			signatureId: null,
			hIpWindowed,
			hDeviceFingerprint,
			hUserAgent,
			hSessionBinding,
			riskScore: risk.score,
			riskLevel: risk.level,
			decision: risk.decision,
			reasons: risk.reasons,
		});
		return {
			success: false,
			code: "RISK_REJECTED",
			messageFa:
				risk.decision === "step_up"
					? "رفتار ارسال مشکوک تشخیص داده شد. لطفاً کمی بعد دوباره تلاش کنید."
					: "درخواست به دلیل ریسک بالا رد شد.",
			retryAfterSeconds: risk.decision === "step_up" ? 600 : 3600,
		};
	}

	let displayNameMasked: string | null = null;

	if (data.fullName) {
		if (data.displayConsent.nameDisplayMode === "unmasked") {
			// Unmasked: Shows the full name completely
			displayNameMasked = data.fullName;
		} else if (data.displayConsent.nameDisplayMode === "masked") {
			// Masked: Shows first letters and asterisks
			displayNameMasked = maskName(data.fullName);
		}
		// If "hidden", it remains null
	}

	// Always show last 4 digits of national ID for verification
	const displayIdentifierLastDigitsMasked = maskIdentifierLastDigits(
		data.nationalId,
	);

	await ensurePetitionExists(PETITION_TITLE);

	const signatureId = createUuid();
	let nonceConsumed = false;
	let signatureInserted = false;

	logDebug("transaction_start", { signatureId });

	await db.transaction(async (tx) => {
		const nonceUpdate = await tx
			.update(submissionNonces)
			.set({ usedAt: new Date() })
			.where(
				and(
					eq(submissionNonces.nonce, data.nonce),
					isNull(submissionNonces.usedAt),
				),
			);

		logDebug("nonce_update_attempt", {
			nonce: data.nonce,
			rowCount: nonceUpdate.rowCount,
		});

		if (nonceUpdate.rowCount !== 1) {
			logDebug("nonce_update_failed", { rowCount: nonceUpdate.rowCount });
			return;
		}
		nonceConsumed = true;

		await tx.insert(signatures).values({
			id: signatureId,
			petitionId: PETITION_ID,
			universityName: data.universityName,
			facultyName: data.facultyName,
			displayNameMasked,
			displayIdentifierLastDigitsMasked,
			displayConsentName: data.displayConsent.nameDisplayMode !== "hidden",
			displayConsentIdentifier: true, // Always true since we always show last 4 digits
			hStudentId,
			hNationalId,
			hStudentNationalCombo,
			hSubmissionFingerprint,
			hDeviceFingerprint,
			hSessionBinding,
			createdAt: new Date(),
		});

		logDebug("signature_inserted", {
			signatureId,
			universityName: data.universityName,
			facultyName: data.facultyName,
		});

		signatureInserted = true;

		await tx.insert(fraudSignals).values({
			id: createUuid(),
			signatureId,
			petitionId: PETITION_ID,
			hIpWindowed,
			hDeviceFingerprint,
			hUserAgent,
			hSessionBinding,
			riskScore: risk.score,
			riskLevel: risk.level,
			decision: risk.decision,
			reasonsJson: JSON.stringify(risk.reasons),
			createdAt: new Date(),
		});

		logDebug("fraud_signal_recorded", { signatureId });
	});

	logDebug("transaction_complete", {
		nonceConsumed,
		signatureInserted,
	});

	if (!nonceConsumed) {
		logDebug("error_nonce_not_consumed", {});
		return {
			success: false,
			code: "NONCE_REPLAYED",
			messageFa: "این درخواست قبلاً استفاده شده است. دوباره تلاش کنید.",
		};
	}

	if (!signatureInserted) {
		logDebug("error_signature_not_inserted", {});
		return {
			success: false,
			code: "VALIDATION_FAILED",
			messageFa: "خطا در ذخیره امضا. لطفاً دوباره تلاش کنید.",
		};
	}

	logDebug("submitSignature_success", { signatureId });

	return {
		success: true,
		signatureId,
		messageFa: "امضای شما با موفقیت ثبت شد.",
	};
}

async function getLiveStatsInternal(): Promise<LiveStats> {
	if (!db) {
		throw new Error("Database not available - DATABASE_URL not set");
	}
	const [totalRows, uniRows, facultyRows] = await Promise.all([
		db
			.select({ value: count() })
			.from(signatures)
			.where(eq(signatures.petitionId, PETITION_ID)),
		db
			.select({ name: signatures.universityName, count: count() })
			.from(signatures)
			.where(eq(signatures.petitionId, PETITION_ID))
			.groupBy(signatures.universityName)
			.orderBy(desc(count())),
		db
			.select({ name: signatures.facultyName, count: count() })
			.from(signatures)
			.where(eq(signatures.petitionId, PETITION_ID))
			.groupBy(signatures.facultyName)
			.orderBy(desc(count())),
	]);

	return {
		total: totalRows[0]?.value ?? 0,
		byUniversity: uniRows,
		byFaculty: facultyRows,
		updatedAt: new Date().toISOString(),
	};
}

async function getRecentSignaturesInternal(): Promise<PublicSignature[]> {
	if (!db) {
		throw new Error("Database not available - DATABASE_URL not set");
	}
	const rows = await db
		.select({
			universityName: signatures.universityName,
			facultyName: signatures.facultyName,
			displayNameMasked: signatures.displayNameMasked,
			displayIdentifierLastDigitsMasked:
				signatures.displayIdentifierLastDigitsMasked,
			createdAt: signatures.createdAt,
		})
		.from(signatures)
		.where(eq(signatures.petitionId, PETITION_ID))
		.orderBy(desc(signatures.createdAt))
		.limit(20);

	return rows.map((row) => ({
		universityName: row.universityName,
		facultyName: row.facultyName,
		displayNameMasked: row.displayNameMasked,
		displayIdentifierLastDigitsMasked: row.displayIdentifierLastDigitsMasked,
		createdAt: row.createdAt.toISOString(),
	}));
}

async function hasAlreadySignedInternal(
	fingerprint: string,
	sessionId: string,
): Promise<{ signed: boolean; signatureData?: PublicSignature }> {
	const normalizedFingerprint = normalizePersianText(fingerprint);
	const hDeviceFingerprint = await hmacHash(`fp|${normalizedFingerprint}`);
	const hSessionBinding = await hmacHash(`session|${sessionId}`);

	if (!db) {
		throw new Error("Database not available - DATABASE_URL not set");
	}
	const existingRows = await db
		.select({
			universityName: signatures.universityName,
			facultyName: signatures.facultyName,
			displayNameMasked: signatures.displayNameMasked,
			displayIdentifierLastDigitsMasked:
				signatures.displayIdentifierLastDigitsMasked,
			createdAt: signatures.createdAt,
		})
		.from(signatures)
		.where(
			and(
				eq(signatures.petitionId, PETITION_ID),
				eq(signatures.hDeviceFingerprint, hDeviceFingerprint),
				eq(signatures.hSessionBinding, hSessionBinding),
			),
		)
		.orderBy(desc(signatures.createdAt))
		.limit(1);

	if (existingRows.length === 0) {
		return { signed: false };
	}

	const row = existingRows[0];
	return {
		signed: true,
		signatureData: {
			universityName: row.universityName,
			facultyName: row.facultyName,
			displayNameMasked: row.displayNameMasked,
			displayIdentifierLastDigitsMasked: row.displayIdentifierLastDigitsMasked,
			createdAt: row.createdAt.toISOString(),
		},
	};
}

function getFraudTransparencyInternal(): { textFa: string } {
	return {
		textFa:
			"این سامانه با ترکیبی از اعتبارسنجی ورودی، کنترل نشست، توکن یک‌بارمصرف، محدودسازی نرخ و ارزیابی رفتاری از ثبت‌های غیرمعتبر جلوگیری می‌کند. اطلاعات حساس برای بررسی یکتایی و سلامت فرایند به‌صورت محافظت‌شده پردازش می‌شوند و مقادیر هویتی خام در پایگاه‌داده نگهداری نمی‌گردند. همچنین اطلاعات عمومی امضاها فقط در چارچوب رضایت کاربر و با نمایش حداقلی منتشر می‌شود.",
	};
}

// TanStack Start server functions (these can be imported by client routes)
export const hasAlreadySigned = createServerFn({ method: "POST" })
	.inputValidator((raw: unknown) => {
		if (!raw || typeof raw !== "object") {
			throw new Error("ورودی نامعتبر است.");
		}
		const data = raw as Record<string, unknown>;
		if (
			typeof data.fingerprint !== "string" ||
			typeof data.sessionId !== "string"
		) {
			throw new Error("ورودی نامعتبر است.");
		}
		return {
			fingerprint: data.fingerprint.trim(),
			sessionId: data.sessionId.trim(),
		};
	})
	.handler(async ({ data }) =>
		hasAlreadySignedInternal(data.fingerprint, data.sessionId),
	);

export const issueSubmissionNonce = createServerFn({ method: "POST" })
	.inputValidator((raw: unknown) => {
		if (!raw || typeof raw !== "object") {
			throw new Error("ورودی نامعتبر است.");
		}
		const data = raw as Record<string, unknown>;
		if (typeof data.sessionId !== "string" || !data.sessionId.trim()) {
			throw new Error("شناسه نشست نامعتبر است.");
		}
		return { sessionId: data.sessionId.trim() } satisfies IssueNonceInput;
	})
	.handler(async ({ data }) => issueNonce(data));

export const submitSignature = createServerFn({ method: "POST" })
	.inputValidator((raw: unknown) => {
		if (!raw || typeof raw !== "object") {
			throw new Error("ورودی نامعتبر است.");
		}
		const data = raw as Record<string, unknown>;
		if (
			typeof data.studentId !== "string" ||
			typeof data.nationalId !== "string" ||
			typeof data.universityName !== "string" ||
			typeof data.facultyName !== "string" ||
			typeof data.nonce !== "string" ||
			typeof data.csrfToken !== "string"
		) {
			throw new Error("ساختار درخواست نامعتبر است.");
		}
		const displayConsentRaw = data.displayConsent;
		if (!displayConsentRaw || typeof displayConsentRaw !== "object") {
			throw new Error("ساختار درخواست نامعتبر است.");
		}
		const displayConsent = displayConsentRaw as Record<string, unknown>;
		if (
			typeof displayConsent.nameDisplayMode !== "string" ||
			!["hidden", "masked", "unmasked"].includes(displayConsent.nameDisplayMode)
		) {
			throw new Error("ساختار درخواست نامعتبر است.");
		}
		const clientSignalsRaw = data.clientSignals;
		if (!clientSignalsRaw || typeof clientSignalsRaw !== "object") {
			throw new Error("ساختار درخواست نامعتبر است.");
		}
		const clientSignals = clientSignalsRaw as Record<string, unknown>;
		if (
			typeof clientSignals.sessionId !== "string" ||
			typeof clientSignals.fingerprint !== "string" ||
			typeof clientSignals.submissionLatencyMs !== "number"
		) {
			throw new Error("ساختار درخواست نامعتبر است.");
		}
		if (
			typeof data.fullName !== "undefined" &&
			typeof data.fullName !== "string"
		) {
			throw new Error("ساختار درخواست نامعتبر است.");
		}
		if (
			typeof clientSignals.userAgent !== "undefined" &&
			typeof clientSignals.userAgent !== "string"
		) {
			throw new Error("ساختار درخواست نامعتبر است.");
		}
		if (
			typeof clientSignals.honeypotValue !== "undefined" &&
			typeof clientSignals.honeypotValue !== "string"
		) {
			throw new Error("ساختار درخواست نامعتبر است.");
		}
		return {
			fullName: data.fullName,
			studentId: data.studentId,
			nationalId: data.nationalId,
			universityName: data.universityName,
			facultyName: data.facultyName,
			displayConsent: {
				nameDisplayMode: displayConsent.nameDisplayMode as
					| "hidden"
					| "masked"
					| "unmasked",
			},
			nonce: data.nonce,
			csrfToken: data.csrfToken,
			clientSignals: {
				sessionId: clientSignals.sessionId,
				fingerprint: clientSignals.fingerprint,
				userAgent: clientSignals.userAgent,
				honeypotValue: clientSignals.honeypotValue,
				submissionLatencyMs: clientSignals.submissionLatencyMs,
			},
		} satisfies SignInput;
	})
	.handler(async ({ data }) => {
		const { getRequest, getRequestIP } = await import(
			"@tanstack/react-start/server"
		);
		return submitSignatureInternal(data, {
			ip: getRequestIP({ xForwardedFor: true }) ?? "unknown",
			userAgent: getRequest().headers.get("user-agent") ?? "unknown",
		});
	});

export const getLiveStats = createServerFn({ method: "GET" }).handler(
	async () => getLiveStatsInternal(),
);

export const getRecentPublicSignatures = createServerFn({
	method: "GET",
}).handler(async () => getRecentSignaturesInternal());

export const getFraudTransparency = createServerFn({ method: "GET" }).handler(
	async () => getFraudTransparencyInternal(),
);

// Export internal functions for testing
export {
	submitSignatureInternal,
	getLiveStatsInternal,
	getRecentSignaturesInternal,
	hasAlreadySignedInternal,
	getFraudTransparencyInternal,
};
