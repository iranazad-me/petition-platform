import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { SearchableSelect } from "#/components/SearchableSelect";
import { COMMON_FACULTIES, IRANIAN_UNIVERSITIES } from "#/data/universities";
import { hasAlreadySigned } from "#/lib/api-client";
import type { LiveStats, PublicSignature } from "#/lib/petition-types";
import { buildDeviceFingerprintInput } from "#/lib/security";
import { type StatementBlock, statementBlocks } from "#/lib/statement";
import { extractQuotedLine } from "#/lib/statement-print";

// Server functions are called via fetch to avoid bundling into client

type FormState = {
	fullName: string;
	studentId: string;
	nationalId: string;
	universityName: string;
	facultyName: string;
	nameDisplayMode: "hidden" | "masked" | "unmasked";
	honeypot: string;
};

type SubmitState =
	| { status: "idle" }
	| { status: "submitting" }
	| { status: "success"; messageFa: string }
	| { status: "error"; messageFa: string };

type IndexLoaderData = {
	stats: LiveStats;
	recent: PublicSignature[];
	transparency: { textFa: string };
};

type StatementSection = {
	headingText: string;
	blocks: StatementBlock[];
};

type StatementLayout = {
	introBlocks: StatementBlock[];
	sections: StatementSection[];
	outroBlocks: StatementBlock[];
};

const mainStatementSectionHeadingPattern =
	/^(یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده|یازده|نهایت)\s*:/;

function isMainStatementSectionHeading(
	block: StatementBlock,
): block is Extract<StatementBlock, { type: "heading" }> {
	return (
		block.type === "heading" &&
		block.level === 2 &&
		mainStatementSectionHeadingPattern.test(block.text)
	);
}

function isFinalMainStatementSection(headingText: string): boolean {
	return /^نهایت\s*:/.test(headingText);
}

function buildStatementLayout(blocks: StatementBlock[]): StatementLayout {
	const introBlocks: StatementBlock[] = [];
	const sections: StatementSection[] = [];
	const outroBlocks: StatementBlock[] = [];

	let currentSection: StatementSection | null = null;
	let sectionMode = false;

	for (const block of blocks) {
		if (isMainStatementSectionHeading(block)) {
			if (currentSection) {
				sections.push(currentSection);
			}

			sectionMode = true;
			currentSection = {
				headingText: block.text,
				blocks: [],
			};
			continue;
		}

		if (!sectionMode) {
			introBlocks.push(block);
			continue;
		}

		if (currentSection) {
			if (block.type === "separator") {
				if (isFinalMainStatementSection(currentSection.headingText)) {
					sections.push(currentSection);
					currentSection = null;
				}
				continue;
			}

			currentSection.blocks.push(block);
			continue;
		}

		outroBlocks.push(block);
	}

	if (currentSection) {
		sections.push(currentSection);
	}

	return { introBlocks, sections, outroBlocks };
}

function parseSectionHeading(headingText: string): { badge: string; title: string } {
	const delimiterIndex = headingText.indexOf(":");
	if (delimiterIndex === -1) {
		return {
			badge: "بخش",
			title: headingText,
		};
	}

	const badge = headingText.slice(0, delimiterIndex).trim();
	const title = headingText.slice(delimiterIndex + 1).trim();

	return {
		badge,
		title,
	};
}

function isCollapsibleStatementSection(badge: string): boolean {
	return badge !== "نهایت";
}

function renderInlineText(text: string): Array<string | ReactNode> {
	const rendered: Array<string | ReactNode> = [];
	let cursor = 0;
	let elementKey = 0;

	while (cursor < text.length) {
		const boldStart = text.indexOf("**", cursor);
		const underlineStart = text.indexOf("__", cursor);
		let nextStart = -1;
		let marker = "";

		if (boldStart !== -1 && underlineStart !== -1) {
			if (boldStart < underlineStart) {
				nextStart = boldStart;
				marker = "**";
			} else {
				nextStart = underlineStart;
				marker = "__";
			}
		} else if (boldStart !== -1) {
			nextStart = boldStart;
			marker = "**";
		} else if (underlineStart !== -1) {
			nextStart = underlineStart;
			marker = "__";
		}

		if (nextStart === -1) {
			rendered.push(text.slice(cursor));
			break;
		}

		if (nextStart > cursor) {
			rendered.push(text.slice(cursor, nextStart));
		}

		const end = text.indexOf(marker, nextStart + 2);
		if (end === -1) {
			rendered.push(text.slice(nextStart));
			break;
		}

		const content = text.slice(nextStart + 2, end);
		if (marker === "**") {
			rendered.push(
				<strong key={`strong-${elementKey++}`} className="statement-strong">
					{content}
				</strong>,
			);
		} else {
			rendered.push(
				<span key={`underline-${elementKey++}`} className="statement-underline">
					{content}
				</span>,
			);
		}

		cursor = end + 2;
	}

	return rendered;
}

function renderStatementBlock(block: StatementBlock, key: string) {
	if (block.type === "separator") {
		return (
			<div key={key} className="statement-separator" aria-hidden="true">
				<span className="separator-line" />
				<span className="separator-accent" />
				<span className="separator-line" />
			</div>
		);
	}

	if (block.type === "heading") {
		if (block.level === 1) {
			return (
				<h2 key={key} className="statement-heading statement-heading--primary">
					{renderInlineText(block.text)}
				</h2>
			);
		}
		return (
			<h3 key={key} className="statement-heading statement-heading--secondary">
				{renderInlineText(block.text)}
			</h3>
		);
	}

	const quoted = extractQuotedLine(block.text);
	if (quoted) {
		return (
			<blockquote key={key} className="statement-quote">
				{renderInlineText(quoted)}
			</blockquote>
		);
	}

	const isStrongCallout = /^\*\*[^*]+\*\*$/.test(block.text.trim());

	return (
		<p
			key={key}
			className={`statement-paragraph${isStrongCallout ? " statement-callout" : ""}`}
		>
			{renderInlineText(block.text)}
		</p>
	);
}

function formatPersianDateTime(iso: string): string {
	return new Date(iso).toLocaleString("fa-IR", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		timeZone: "Asia/Tehran",
	});
}

// Session management utilities
function getOrCreateSessionId(): string {
	if (typeof window === "undefined") {
		return "";
	}
	let sessionId = localStorage.getItem("petition_session_id");
	if (!sessionId) {
		sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
		localStorage.setItem("petition_session_id", sessionId);
	}
	return sessionId;
}

function buildClientFingerprint(): string {
	if (typeof window === "undefined" || typeof navigator === "undefined") {
		return "unknown";
	}

	return buildDeviceFingerprintInput({
		userAgent: navigator.userAgent,
		language: navigator.language,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
		screen:
			typeof screen !== "undefined"
				? `${screen.width}x${screen.height}x${screen.colorDepth}`
				: "unknown",
		platform: navigator.platform,
	});
}

function StatementRenderer() {
	const { introBlocks, sections, outroBlocks } = buildStatementLayout(statementBlocks);
	const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

	function toggleSection(sectionIndex: number): void {
		setExpandedSections((prev) => ({
			...prev,
			[sectionIndex]: !prev[sectionIndex],
		}));
	}

	return (
		<article className="statement-content">
			<section className="statement-intro">
				{introBlocks.map((block, idx) =>
					renderStatementBlock(block, generateStatementBlockKey(block, idx)),
				)}
			</section>
			{sections.length > 0 && (
				<section className="statement-segment-grid" aria-label="بخش‌های اصلی بیانیه">
					{sections.map((section, sectionIndex) => {
						const heading = parseSectionHeading(section.headingText);
						const isCollapsible = isCollapsibleStatementSection(heading.badge);
						const paragraphIndexes = section.blocks.reduce<number[]>(
							(acc, block, index) => {
								if (block.type === "paragraph") {
									acc.push(index);
								}
								return acc;
							},
							[],
						);
						const previewLastBlockIndex =
							paragraphIndexes.length >= 2 ? paragraphIndexes[1] : paragraphIndexes[0] ?? -1;
						const hasExpandableContent =
							isCollapsible &&
							previewLastBlockIndex !== -1 &&
							previewLastBlockIndex < section.blocks.length - 1;
						const isExpanded = expandedSections[sectionIndex] ?? false;

						const visibleBlocks = hasExpandableContent
							? section.blocks.slice(0, previewLastBlockIndex + 1)
							: section.blocks;
						const collapsibleBlocks = hasExpandableContent
							? section.blocks.slice(previewLastBlockIndex + 1)
							: [];
						const collapsibleContentId = `statement-section-content-${sectionIndex}`;

						return (
							<article key={`statement-section-${sectionIndex}`} className="statement-segment-card">
								<header className="statement-segment-head">
									<span className="statement-segment-badge">{heading.badge}</span>
									<h3 className="statement-segment-title">{renderInlineText(heading.title)}</h3>
								</header>
								<div className="statement-segment-body">
									{visibleBlocks.map((block, blockIndex) =>
										renderStatementBlock(
												block,
												`statement-section-${sectionIndex}-${generateStatementBlockKey(block, blockIndex)}`,
										),
									)}
									{hasExpandableContent && isExpanded && (
										<div id={collapsibleContentId}>
											{collapsibleBlocks.map((block, blockIndex) =>
												renderStatementBlock(
													block,
													`statement-section-${sectionIndex}-extra-${generateStatementBlockKey(block, blockIndex)}`,
												),
											)}
										</div>
									)}
									{hasExpandableContent && (
										<button
											type="button"
											className="statement-segment-toggle"
											onClick={() => toggleSection(sectionIndex)}
											aria-expanded={isExpanded}
											aria-controls={collapsibleContentId}
										>
											{isExpanded ? "جمع‌کردن" : "نمایش ادامه"}
										</button>
									)}
								</div>
							</article>
						);
					})}
				</section>
			)}
			{outroBlocks.length > 0 && (
				<section className="statement-intro mt-8">
					{outroBlocks.map((block, idx) =>
						renderStatementBlock(
							block,
							`statement-outro-${generateStatementBlockKey(block, idx)}`,
						),
					)}
				</section>
			)}
		</article>
	);
}

function generateStatementBlockKey(block: StatementBlock, idx: number): string {
	return `${block.type}${block.type === "heading" ? `-${block.level}` : ""}-${idx}`;
}

function SignatureCounter({ total }: { total: number }) {
	return (
		<div className="flex items-center gap-3 rounded-2xl border border-[rgba(79,184,178,0.3)] bg-[rgba(79,184,178,0.12)] px-6 py-4">
			<span className="text-3xl font-black text-[var(--lagoon-deep)] sm:text-4xl">
				{total.toLocaleString("fa-IR")}
			</span>
			<span className="text-sm font-bold text-[var(--sea-ink)] sm:text-base">
				امضای ثبت‌شده
			</span>
		</div>
	);
}

function RecentSignatures({ recent }: { recent: PublicSignature[] }) {
	if (recent.length === 0) {
		return (
			<p className="py-6 text-center text-sm text-[var(--sea-ink-soft)]">
				هنوز امضایی ثبت نشده است.
			</p>
		);
	}

	return (
		<ul className="divide-y divide-[var(--line)]">
			{recent.map((item) => (
				<li
					key={`${item.createdAt}-${item.universityName}-${item.facultyName}`}
					className="space-y-1 py-4"
				>
					<div className="flex flex-wrap items-center justify-between gap-2 text-sm">
						<span className="font-semibold text-[var(--sea-ink)]">
							{item.universityName}
						</span>
						<span className="text-xs text-[var(--sea-ink-soft)]">
							{item.facultyName}
						</span>
					</div>
					<div className="flex flex-wrap items-center gap-2 text-xs text-[var(--sea-ink-soft)]">
						{item.displayNameMasked ? (
							<span>نام: {item.displayNameMasked}</span>
						) : (
							<span>نام: مخفی</span>
						)}
						{item.displayIdentifierLastDigitsMasked ? (
							<span dir="ltr">
								شناسه: {item.displayIdentifierLastDigitsMasked}
							</span>
						) : (
							<span>شناسه: مخفی</span>
						)}
						<span>{formatPersianDateTime(item.createdAt)}</span>
					</div>
				</li>
			))}
		</ul>
	);
}

function AlreadySignedBox({ signature }: { signature: PublicSignature }) {
	return (
		<div className="rounded-xl border-2 border-green-200 bg-green-50 px-6 py-6">
			<div className="mb-4 flex items-center gap-3">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
					<svg
						className="h-6 w-6 text-green-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<h3 className="text-xl font-bold text-green-800">
					شما قبلاً امضا کرده‌اید
				</h3>
			</div>

			<div className="space-y-3 text-sm text-green-900">
				<div className="flex items-center gap-2">
					<span className="font-semibold">دانشگاه:</span>
					<span>{signature.universityName}</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="font-semibold">دانشکده:</span>
					<span>{signature.facultyName}</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="font-semibold">تاریخ امضا:</span>
					<span>{formatPersianDateTime(signature.createdAt)}</span>
				</div>
				{signature.displayNameMasked && (
					<div className="flex items-center gap-2">
						<span className="font-semibold">نام:</span>
						<span>{signature.displayNameMasked}</span>
					</div>
				)}
				{signature.displayIdentifierLastDigitsMasked && (
					<div className="flex items-center gap-2">
						<span className="font-semibold">۴ رقم آخر کد ملی:</span>
						<span dir="ltr">{signature.displayIdentifierLastDigitsMasked}</span>
					</div>
				)}
				<div className="mt-4 rounded-lg border border-green-200 bg-green-100 px-4 py-3 text-xs text-green-800">
					این امضا با دستگاه فعلی شما ثبت شده است. اگر از دستگاه دیگری استفاده
					می‌کنید، لطفاً دوباره وارد شوید.
				</div>
			</div>
		</div>
	);
}

function SigningForm({ onSuccess }: { onSuccess: () => void }) {
	const [form, setForm] = useState<FormState>({
		fullName: "",
		studentId: "",
		nationalId: "",
		universityName: "",
		facultyName: "",
		nameDisplayMode: "hidden",
		honeypot: "",
	});
	const [state, setState] = useState<SubmitState>({ status: "idle" });
	const [nonce, setNonce] = useState<{
		nonce: string;
		csrfToken: string;
	} | null>(null);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [formShownAt, setFormShownAt] = useState<number>(0);
	// Track if user has already signed: null = checking, false = not signed, true = signed
	const [hasSigned, setHasSigned] = useState<boolean | null>(null);
	const [existingSignature, setExistingSignature] =
		useState<PublicSignature | null>(null);

	// Initialize session on mount
	useEffect(() => {
		const id = getOrCreateSessionId();
		setSessionId(id);
		if (formShownAt === 0) {
			setFormShownAt(Date.now());
		}
	}, [formShownAt]);

	// Check if user has already signed
	useEffect(() => {
		async function checkAlreadySigned() {
			if (!sessionId) return;

			const fingerprint = buildClientFingerprint();
			try {
				const result = await hasAlreadySigned({ fingerprint, sessionId });
				setHasSigned(result.signed);
				if (result.signed && result.signatureData) {
					setExistingSignature(result.signatureData);
				}
			} catch {
				// On error, default to showing the form (fail-open)
				setHasSigned(false);
			}
		}

		void checkAlreadySigned();
	}, [sessionId]);

	function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
		setForm((prev) => ({ ...prev, [key]: value }));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (!sessionId) {
			setState({
				status: "error",
				messageFa: "خطا در شناسایی نشست. لطفاً صفحه را تازه‌سازی کنید.",
			});
			return;
		}

		setState({ status: "submitting" });

		try {
			// Request nonce if not already issued
			let currentNonce = nonce;
			if (!currentNonce) {
				const nonceResponse = await fetch("/api/issue-nonce", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ sessionId: sessionId || "" }),
				});
				if (!nonceResponse.ok) {
					throw new Error("Failed to get nonce");
				}
				const nonceResult = await nonceResponse.json();
				currentNonce = {
					nonce: nonceResult.nonce,
					csrfToken: nonceResult.csrfToken,
				};
				setNonce(currentNonce);
			}

			const submissionLatencyMs = Date.now() - formShownAt;

			// Submit the signature
			const submitResponse = await fetch("/api/submit-signature", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					fullName: form.fullName || undefined,
					studentId: form.studentId,
					nationalId: form.nationalId,
					universityName: form.universityName,
					facultyName: form.facultyName,
					displayConsent: {
						nameDisplayMode: form.nameDisplayMode,
					},
					nonce: currentNonce.nonce,
					csrfToken: currentNonce.csrfToken,
					clientSignals: {
						sessionId,
						fingerprint: buildClientFingerprint(),
						userAgent:
							typeof navigator !== "undefined"
								? navigator.userAgent
								: undefined,
						honeypotValue: form.honeypot || undefined,
						submissionLatencyMs,
					},
				}),
			});
			if (!submitResponse.ok) {
				throw new Error("Failed to submit signature");
			}
			const result = await submitResponse.json();

			if (result.success) {
				setState({
					status: "success",
					messageFa: result.messageFa || "امضای شما با موفقیت ثبت شد!",
				});
				// After success, show fingerprint box
				setTimeout(() => {
					setHasSigned(true);
					setExistingSignature({
						universityName: form.universityName,
						facultyName: form.facultyName,
						displayNameMasked:
							form.nameDisplayMode === "hidden"
								? null
								: form.nameDisplayMode === "masked"
									? form.fullName
										? `${form.fullName.charAt(0)}*** ${form.fullName.at(-1)}`
										: null
									: form.fullName || null,
						displayIdentifierLastDigitsMasked: form.nationalId.slice(-4),
						createdAt: new Date().toISOString(),
					});
					setForm({
						fullName: "",
						studentId: "",
						nationalId: "",
						universityName: "",
						facultyName: "",
						nameDisplayMode: "hidden",
						honeypot: "",
					});
					setNonce(null);
					setFormShownAt(Date.now());
					setState({ status: "idle" });
					onSuccess();
				}, 2000);
			} else {
				setState({
					status: "error",
					messageFa: result.messageFa || "ثبت امضا ناموفق بود.",
				});
			}
		} catch (error) {
			console.error("Failed to submit signature:", error);
			setState({
				status: "error",
				messageFa: "خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.",
			});
		}
	}

	return (
		<div className="space-y-4">
			{hasSigned === true && existingSignature ? (
				<AlreadySignedBox signature={existingSignature} />
			) : (
				<form onSubmit={handleSubmit} className="space-y-4" noValidate>
					<div className="grid gap-4">
						{/* Full name and studentId can share a row on larger screens */}
						<div className="grid gap-4 sm:grid-cols-2">
							<label className="block">
								<span className="mb-1.5 block text-sm font-semibold text-[var(--sea-ink)]">
									نام و نام خانوادگی (اختیاری)
								</span>
								<input
									type="text"
									value={form.fullName}
									onChange={(e) => setField("fullName", e.target.value)}
									placeholder="اختیاری"
									className="form-input"
								/>
							</label>

							<label className="block">
								<span className="mb-1.5 block text-sm font-semibold text-[var(--sea-ink)]">
									شماره دانشجویی *
								</span>
								<input
									type="text"
									value={form.studentId}
									onChange={(e) => setField("studentId", e.target.value)}
									placeholder="فقط عدد"
									required
									inputMode="numeric"
									className="form-input"
								/>
							</label>
						</div>

						<label className="block">
							<span className="mb-1.5 block text-sm font-semibold text-[var(--sea-ink)]">
								کد ملی *
							</span>
							<input
								type="text"
								value={form.nationalId}
								onChange={(e) => setField("nationalId", e.target.value)}
								placeholder="۱۰ رقم"
								required
								maxLength={10}
								inputMode="numeric"
								className="form-input"
							/>
						</label>

						<SearchableSelect
							label="دانشگاه"
							placeholder="دانشگاه خود را انتخاب یا جستجو کنید..."
							options={IRANIAN_UNIVERSITIES.map((u) => ({
								id: u.id,
								name: u.name,
								nameEn: u.nameEn,
							}))}
							value={form.universityName}
							onChange={(value) => setField("universityName", value)}
							required
							allowCustom
							customPlaceholder="نام دانشگاه را وارد کنید..."
						/>

						<SearchableSelect
							label="دانشکده"
							placeholder="دانشکده خود را انتخاب یا جستجو کنید..."
							options={COMMON_FACULTIES.map((f) => ({
								id: f.id,
								name: f.name,
								nameEn: f.nameEn,
							}))}
							value={form.facultyName}
							onChange={(value) => setField("facultyName", value)}
							required
							allowCustom
							customPlaceholder="نام دانشکده را وارد کنید..."
						/>
					</div>

					<div className="rounded-xl border border-[rgba(79,184,178,0.25)] bg-[rgba(79,184,178,0.08)] p-4 text-sm leading-relaxed text-[var(--sea-ink)] space-y-4">
						{/* Name Display Options */}
						<div>
							<p className="mb-3 font-semibold text-[var(--sea-ink)]">
								نحوه نمایش اطلاعات شما در لیست امضاها:
							</p>
							<div className="flex flex-col gap-2.5">
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name="nameDisplayMode"
										value="unmasked"
										checked={form.nameDisplayMode === "unmasked"}
										onChange={() => setField("nameDisplayMode", "unmasked")}
									/>
									<span>نمایش کامل نام (همراه با ۴ رقم آخر کد ملی)</span>
								</label>
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name="nameDisplayMode"
										value="masked"
										checked={form.nameDisplayMode === "masked"}
										onChange={() => setField("nameDisplayMode", "masked")}
									/>
									<span>
										نمایش مخفی - فقط حروف اول (همراه با ۴ رقم آخر کد ملی)
									</span>
								</label>
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name="nameDisplayMode"
										value="hidden"
										checked={form.nameDisplayMode === "hidden"}
										onChange={() => setField("nameDisplayMode", "hidden")}
									/>
									<span>
										عدم نمایش نام (کاملاً مخفی - فقط ۴ رقم آخر کد ملی نمایش داده
										می‌شود)
									</span>
								</label>
							</div>
						</div>

						{/* ID Display Options */}

						<p className="m-0 mt-2 text-xs text-[var(--sea-ink-soft)]">
							اطلاعات خام هویتی ذخیره نمی‌شود و فقط نسخه‌ی رمزنگاری‌شده‌ی
							غیرقابل‌بازگشت نگهداری می‌گردد.
						</p>
					</div>
					<label className="hidden" htmlFor="hp-field">
						فیلد مخفی
						<input
							id="hp-field"
							tabIndex={-1}
							autoComplete="off"
							value={form.honeypot}
							onChange={(e) => setField("honeypot", e.target.value)}
							className="form-input"
						/>
					</label>

					{state.status === "error" && (
						<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							{state.messageFa}
						</div>
					)}
					{state.status === "success" && (
						<div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
							{state.messageFa}
						</div>
					)}

					<button
						type="submit"
						className="btn-primary w-full sm:w-auto"
						disabled={state.status === "submitting"}
					>
						{state.status === "submitting" ? "در حال ثبت..." : "امضا می‌کنم"}
					</button>
				</form>
			)}
		</div>
	);
}

export const Route = createFileRoute("/")({
	loader: async (): Promise<IndexLoaderData> => {
		// During SSR, import server functions directly
		// During client navigation, use fetch to avoid bundling server code
		if (
			typeof import.meta.env.SSR === "undefined" ||
			import.meta.env.SSR === false
		) {
			// Client-side: use fetch
			const [statsResponse, transparencyResponse] = await Promise.all([
				fetch("/api/stats"),
				fetch("/api/transparency"),
			]);
			const statsData = await statsResponse.json();
			const transparencyData = await transparencyResponse.json();
			return {
				stats: statsData.data.stats,
				recent: statsData.data.recent,
				transparency: transparencyData.data,
			};
		} else {
			// Server-side: import directly
			const { getLiveStats, getRecentPublicSignatures, getFraudTransparency } =
				await import("#/lib/petition-server");
			const [stats, recent, transparency] = await Promise.all([
				getLiveStats(),
				getRecentPublicSignatures(),
				getFraudTransparency(),
			]);
			return { stats, recent, transparency };
		}
	},
	component: PetitionPage,
});

function PetitionPage() {
	const router = useRouter();
	const data = Route.useLoaderData();
	const statementDownloadHref = "/statement.pdf";

	async function refreshAll() {
		// TODO: Task 3 - Refresh will be handled by router.invalidate() after action
		await router.invalidate();
	}

	return (
		<main className="page-wrap space-y-8 px-2 md:px-4 pb-16 pt-8">
			<section className="island-shell rounded-[2rem] px-4 md:px-6 py-12 text-center sm:px-12 sm:py-16">
				<h1 className="display-title statement-hero-title statement-hero-title--bold mb-5 text-3xl font-extrabold sm:text-5xl">
					<span className="statement-hero-title-word statement-hero-title-word--green">
						پویش
					</span>{" "}
					<span className="statement-hero-title-word statement-hero-title-word--white">
						ایران
					</span>{" "}
					<span className="statement-hero-title-word statement-hero-title-word--red">
						آزاد
					</span>
				</h1>
				<p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-[var(--sea-ink-soft)] sm:text-lg">
					این سامانه با تمرکز بر مشروعیت، ضدتقلب و حفظ حریم خصوصی طراحی شده است.
				</p>
				<div className="flex items-center justify-center">
					<SignatureCounter total={data.stats.total} />
				</div>
				<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
					<a href="#sign" className="btn-primary">
						امضا می‌کنم
					</a>
					<Link to="/stats" className="btn-secondary">
						مشاهده آمار زنده
					</Link>
				</div>
			</section>

			<section className="island-shell rounded-[1.5rem] px-4 md:px-6 py-5 text-center sm:px-10 sm:py-6">
				<p className="m-0 text-lg font-bold text-[var(--sea-ink)] sm:text-xl">
					تاکنون{" "}
					<span className="mx-1 text-[var(--lagoon-deep)]">
						{data.stats.total.toLocaleString("fa-IR")}
					</span>{" "}
					دانشجو امضا کرده‌اند
				</p>
			</section>

			<section className="island-shell rounded-[2rem] px-4 md:px-6 py-10 sm:px-12 sm:py-12">
				<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
					<p className="island-kicker m-0">متن بیانیه</p>
					<a
						href={statementDownloadHref}
						download="statement.pdf"
						className="btn-secondary"
					>
						دانلود فایل بیانیه (PDF)
					</a>
				</div>
				<StatementRenderer />
			</section>

			<section
				id="sign"
				className="island-shell rounded-[2rem] px-4 md:px-6 py-10 sm:px-12 sm:py-12"
			>
				<p className="island-kicker mb-2">ثبت امضا</p>
				<h2 className="display-title mb-3 text-2xl font-bold text-[var(--sea-ink)] sm:text-3xl">
					امضای شما، بدون ذخیره اطلاعات خام
				</h2>
				<p className="mb-5 text-sm leading-relaxed text-[var(--sea-ink-soft)]">
					{data.transparency.textFa}
				</p>
				<SigningForm onSuccess={() => void refreshAll()} />
			</section>

			<section
				id="recent"
				className="island-shell rounded-[2rem] px-4 md:px-6 py-10 sm:px-12 sm:py-12"
			>
				<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
					<div>
						<p className="island-kicker mb-1">شفافیت عمومی</p>
						<h2 className="display-title m-0 text-2xl font-bold text-[var(--sea-ink)]">
							آخرین امضاهای عمومی
						</h2>
					</div>
					<Link to="/about-security" className="btn-secondary">
						روش ضدتقلب
					</Link>
				</div>
				<RecentSignatures recent={data.recent} />
			</section>
		</main>
	);
}
