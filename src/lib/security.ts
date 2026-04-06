const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const MIN_SUBMISSION_LATENCY_MS = 1500;

export function normalizeDigits(value: string): string {
	let out = "";
	for (const char of value) {
		const pIndex = PERSIAN_DIGITS.indexOf(char);
		if (pIndex >= 0) {
			out += String(pIndex);
			continue;
		}
		const aIndex = ARABIC_DIGITS.indexOf(char);
		if (aIndex >= 0) {
			out += String(aIndex);
			continue;
		}
		out += char;
	}
	return out;
}

export function normalizePersianText(value: string): string {
	return normalizeDigits(value)
		.replace(/\u0643/g, "ک")
		.replace(/\u064A/g, "ی")
		.replace(/\s+/g, " ")
		.trim();
}

export function isValidIranNationalId(value: string): boolean {
	const normalized = normalizeDigits(value).trim();
	if (!/^\d{10}$/.test(normalized)) {
		return false;
	}
	if (/^(\d)\1{9}$/.test(normalized)) {
		return false;
	}
	const check = Number(normalized[9]);
	const sum = normalized
		.slice(0, 9)
		.split("")
		.reduce((acc, digit, i) => acc + Number(digit) * (10 - i), 0);
	const remainder = sum % 11;
	const expected = remainder < 2 ? remainder : 11 - remainder;
	return check === expected;
}

export function maskName(value: string): string {
	const normalized = normalizePersianText(value);
	if (!normalized) {
		return "";
	}
	const words = normalized.split(" ").filter(Boolean);
	return words
		.map((word) => {
			if (word.length <= 1) {
				return "*";
			}
			return `${word[0]}${"*".repeat(Math.max(1, word.length - 1))}`;
		})
		.join(" ");
}

export function maskIdentifierLastDigits(value: string): string {
	const normalized = normalizeDigits(value).replace(/\D+/g, "");
	if (!normalized) {
		return "";
	}
	const suffix = normalized.slice(-4);
	return `******${suffix}`;
}

export type RiskInput = {
	deviceRecentCount: number;
	ipRecentCount: number;
	sessionRecentCount: number;
	duplicateFingerprintSeen: boolean;
	honeypotTriggered: boolean;
	submissionLatencyMs: number;
};

export type RiskDecision = "accept" | "step_up" | "reject";

export type RiskResult = {
	score: number;
	level: "low" | "medium" | "high";
	decision: RiskDecision;
	reasons: string[];
};

export function evaluateRisk(input: RiskInput): RiskResult {
	let score = 0;
	const reasons: string[] = [];

	if (input.honeypotTriggered) {
		score += 70;
		reasons.push("honeypot-triggered");
	}
	if (input.duplicateFingerprintSeen) {
		score += 25;
		reasons.push("duplicate-fingerprint");
	}
	if (input.deviceRecentCount >= 3) {
		score += 20;
		reasons.push("high-device-rate");
	}
	if (input.ipRecentCount >= 5) {
		score += 20;
		reasons.push("high-ip-rate");
	}
	if (input.sessionRecentCount >= 2) {
		score += 12;
		reasons.push("high-session-rate");
	}
	if (
		input.submissionLatencyMs > 0 &&
		input.submissionLatencyMs < MIN_SUBMISSION_LATENCY_MS
	) {
		score += 30;
		reasons.push("too-fast-submission");
	}

	if (score >= 80) {
		return {
			score,
			level: "high",
			decision: "reject",
			reasons,
		};
	}
	if (score >= 45) {
		return {
			score,
			level: "medium",
			decision: "step_up",
			reasons,
		};
	}
	return {
		score,
		level: "low",
		decision: "accept",
		reasons,
	};
}

export function createClientSessionId(raw: string | null | undefined): string {
	const normalized = raw?.trim();
	if (normalized) {
		return normalized;
	}

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

	// Last resort: Math.random() fallback
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

export type ClientSignals = {
	sessionId: string;
	fingerprint: string;
	userAgent?: string;
	honeypotValue?: string;
	submissionLatencyMs: number;
};

export function buildDeviceFingerprintInput(signals: {
	userAgent: string;
	language: string;
	timezone: string;
	screen: string;
	platform: string;
}): string {
	return [
		normalizePersianText(signals.userAgent),
		normalizePersianText(signals.language),
		normalizePersianText(signals.timezone),
		normalizePersianText(signals.screen),
		normalizePersianText(signals.platform),
	].join("|");
}
