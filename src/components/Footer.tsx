export default function Footer() {
	const year = new Date().getFullYear();
	const repoUrl = import.meta.env.VITE_GITHUB_REPO_URL;
	let safeRepoUrl: string | null = null;

	if (repoUrl) {
		try {
			const parsed = new URL(repoUrl);
			if (parsed.protocol === "https:" || parsed.protocol === "http:") {
				safeRepoUrl = parsed.toString();
			}
		} catch {
			safeRepoUrl = null;
		}
	}

	return (
		<footer className="mt-12 border-t border-[var(--line)] px-4 pb-12 pt-8 text-[var(--sea-ink-soft)] sm:mt-20 sm:pb-14 sm:pt-10">
			<div className="page-wrap flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-right">
				<p className="m-0 text-sm">
					© {year} پویش ایران آزاد. استفاده عمومی آزاد است.
				</p>
				<p className="island-kicker m-0 text-xs sm:text-sm">
					نسخه حریم‌خصوصی‌محور
				</p>
			</div>
			<div className="mx-auto mt-4 max-w-lg px-4 text-center text-xs leading-relaxed text-[var(--sea-ink-soft)] sm:mt-6">
				<p className="m-0">
					این پلتفرم داده خام هویتی ذخیره نمی‌کند؛ فقط نسخه‌های هش‌شده برای
					یکتاسازی و جلوگیری از تقلب نگهداری می‌شود.
				</p>
				<p className="m-0 mt-2">
					توسعه داده‌شده توسط دانشجویان ایرانی برای مردم ایران برای ایران آزاد —{" "}
					{safeRepoUrl ? (
						<a
							href={safeRepoUrl}
							target="_blank"
							rel="noreferrer noopener"
							className="underline hover:text-[var(--lagoon-deep)] transition-colors"
						>
							گیت‌هاب پروژه
						</a>
					) : (
						<span>گیت‌هاب پروژه</span>
					)}
				</p>
			</div>
		</footer>
	);
}
