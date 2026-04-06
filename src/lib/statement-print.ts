export type StatementRenderableBlock =
	| { type: "heading"; level: 1 | 2; text: string }
	| { type: "paragraph"; text: string };

export type PrintableStatementSection = {
	heading: string;
	order: number;
	blocks: StatementRenderableBlock[];
};

type PrintableStatementInput = {
	introBlocks: StatementRenderableBlock[];
	sections: PrintableStatementSection[];
};

export function extractQuotedLine(text: string): string | null {
	const trimmed = text.trim();
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("«") && trimmed.endsWith("»"))
	) {
		return trimmed.slice(1, -1).trim();
	}
	return null;
}

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function inlineMarkdownToHtml(text: string): string {
	const escaped = escapeHtml(text);
	const withBold = escaped.replace(
		/\*\*(.+?)\*\*/g,
		'<strong class="print-inline-strong">$1</strong>',
	);
	return withBold.replace(
		/__(.+?)__/g,
		'<span class="print-inline-underline">$1</span>',
	);
}

export function buildPrintableStatementHtml({
	introBlocks,
	sections,
}: PrintableStatementInput): string {
	const totalSections = sections.length;
	const renderBlock = (block: StatementRenderableBlock): string => {
		if (block.type === "heading" && block.level === 1) {
			return `<h1 class="print-main-title">${inlineMarkdownToHtml(block.text)}</h1>`;
		}
		if (block.type === "heading") {
			return `<h2 class="print-intro-title">${inlineMarkdownToHtml(block.text)}</h2>`;
		}
		const quoted = extractQuotedLine(block.text);
		if (quoted) {
			return `<blockquote class="print-quote">${inlineMarkdownToHtml(quoted)}</blockquote>`;
		}
		return `<p class="print-paragraph">${inlineMarkdownToHtml(block.text)}</p>`;
	};

	const introHtml = introBlocks.map(renderBlock).join("");
	const sectionCards = sections
		.map((section) => {
			const content = section.blocks.map(renderBlock).join("");
			return `<section class="print-card">
				<div class="print-card-head">
					<span class="print-badge">بخش ${section.order} از ${totalSections}</span>
					<h3 class="print-card-title">${inlineMarkdownToHtml(section.heading)}</h3>
				</div>
				<div class="print-card-body">${content}</div>
			</section>`;
		})
		.join("");

	return `<!doctype html>
<html lang="fa" dir="rtl">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>پویش ایران آزاد</title>
		<style>
			@font-face {
				font-family: "IRANYekanX";
				src:
					url("/fonts/IRANYekanX/IRANYekanX-Bold.woff2") format("woff2"),
					url("/fonts/IRANYekanX/IRANYekanX-Regular.woff") format("woff");
				font-weight: 400;
				font-style: normal;
				font-display: swap;
			}
			@font-face {
				font-family: "IRANYekanX";
				src:
					url("/fonts/IRANYekanX/IRANYekanX-Bold.woff2") format("woff2"),
					url("/fonts/IRANYekanX/IRANYekanX-Bold.woff") format("woff");
				font-weight: 700 900;
				font-style: normal;
				font-display: swap;
			}
			:root {
				--iran-green: #239f40;
				--iran-white: #ffffff;
				--iran-red: #da0000;
				--ink: #0f172a;
				--ink-soft: #334155;
				--paper-edge: #e2e8f0;
			}
			@page {
				size: A4;
				margin: 12mm;
			}
			* { box-sizing: border-box; }
			html, body { direction: rtl; }
			body {
				margin: 0;
				padding: 0;
				font-family: "Vazirmatn", Tahoma, "Noto Sans Arabic", sans-serif;
				background:
					linear-gradient(180deg, rgba(35, 159, 64, 0.07) 0%, rgba(35, 159, 64, 0) 24%),
					linear-gradient(0deg, rgba(218, 0, 0, 0.07) 0%, rgba(218, 0, 0, 0) 24%),
					#f8fafc;
				color: var(--ink);
				line-height: 2.05;
				-webkit-print-color-adjust: exact;
				print-color-adjust: exact;
			}
			.sheet {
				max-width: 900px;
				margin: 0 auto;
				padding: 18px 20px 20px;
				background: #fff;
				border: 1px solid var(--paper-edge);
				border-radius: 16px;
				box-shadow: 0 8px 26px rgba(2, 6, 23, 0.08);
			}
			.print-flag-band {
				height: 14px;
				border-radius: 999px;
				background: linear-gradient(
					90deg,
					var(--iran-green) 0%,
					var(--iran-green) 33.33%,
					var(--iran-white) 33.33%,
					var(--iran-white) 66.66%,
					var(--iran-red) 66.66%,
					var(--iran-red) 100%
				);
				border: 1px solid #d1d5db;
				margin-bottom: 14px;
			}
			.print-main-title {
				margin: 0 0 8px 0;
				font-size: 2.1rem;
				font-weight: 900;
				color: #166534;
				text-decoration: underline;
				text-decoration-color: var(--iran-red);
				text-decoration-thickness: 2px;
				text-underline-offset: 5px;
				text-wrap: balance;
			}
			.print-intro-title {
				margin: 0 0 18px 0;
				font-size: 1.25rem;
				font-weight: 800;
				color: #1f2937;
			}
			.print-paragraph {
				margin: 0 0 14px 0;
				font-size: 1rem;
				text-align: justify;
				direction: rtl;
				unicode-bidi: isolate;
				color: var(--ink-soft);
				orphans: 3;
				widows: 3;
			}
			.print-inline-strong {
				font-weight: 800;
				text-decoration: underline;
				text-decoration-thickness: 2px;
				text-decoration-color: var(--iran-red);
			}
			.print-inline-underline {
				text-decoration: underline;
				text-decoration-thickness: 1px;
				text-decoration-color: var(--iran-green);
			}
			.print-quote {
				margin: 16px 0;
				padding: 12px 16px;
				border-right: 4px solid var(--iran-red);
				background: linear-gradient(90deg, #fff5f5 0%, #ffffff 100%);
				font-style: italic;
				font-weight: 600;
				color: #7f1d1d;
			}
			.print-grid { display: grid; gap: 14px; margin-top: 18px; }
			.print-card {
				position: relative;
				overflow: hidden;
				background: #ffffff;
				border: 1px solid #d1d5db;
				border-radius: 14px;
				padding: 14px 16px 16px;
				break-inside: avoid;
			}
			.print-card::before {
				content: "";
				position: absolute;
				inset: 0 0 auto 0;
				height: 5px;
				background: linear-gradient(
					90deg,
					var(--iran-green) 0%,
					var(--iran-white) 50%,
					var(--iran-red) 100%
				);
			}
			.print-card-head { margin-bottom: 10px; }
			.print-badge {
				display: inline-block;
				padding: 2px 10px;
				border-radius: 999px;
				background: #ecfdf3;
				color: #14532d;
				font-size: 0.8rem;
				font-weight: 700;
				border: 1px solid #bbf7d0;
			}
			.print-card-title {
				margin: 8px 0 0 0;
				font-size: 1.15rem;
				font-weight: 900;
				color: #1f2937;
				text-decoration: underline;
				text-decoration-color: var(--iran-green);
				text-underline-offset: 4px;
			}
			.print-card-body .print-paragraph:last-child { margin-bottom: 0; }
			.print-links {
				margin-top: 24px;
				padding-top: 12px;
				border-top: 1px dashed #94a3b8;
				font-size: 0.95rem;
			}
			.print-links p { margin: 0; }
			.print-links a {
				color: #0f766e;
				font-weight: 700;
				text-decoration: underline;
				text-underline-offset: 2px;
				direction: ltr;
				unicode-bidi: embed;
				display: inline-block;
			}
			@media print {
				body { background: #fff; padding: 0; }
				.sheet {
					max-width: 100%;
					border: 0;
					border-radius: 0;
					box-shadow: none;
					padding: 0;
				}
				.print-card { border-color: #9ca3af; }
			}
		</style>
	</head>
	<body>
		<main class="sheet">
			<div class="print-flag-band" aria-hidden="true"></div>
			<section>${introHtml}</section>
			<section class="print-grid">${sectionCards}</section>
			<footer class="print-links">
				<p>
					وب‌سایت‌ها:
					<a href="https://iranazad.me">iranazad.me</a>
					|
					<a href="https://iranazad.tech">iranazad.tech</a>
					|
					<a href="https://iranazad.online">iranazad.online</a>
				</p>
			</footer>
		</main>
	</body>
</html>`;
}
