import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about-security")({
	loader: async () => {
		// During SSR, import server functions directly
		// During client navigation, use fetch to avoid bundling server code
		if (
			typeof import.meta.env.SSR === "undefined" ||
			import.meta.env.SSR === false
		) {
			// Client-side: use fetch
			const response = await fetch("/api/transparency");
			const data = await response.json();
			return data.data;
		} else {
			// Server-side: import directly
			const { getFraudTransparency } = await import("#/lib/petition-server");
			return getFraudTransparency();
		}
	},
	component: AboutSecurityPage,
});

function AboutSecurityPage() {
	const data = Route.useLoaderData();
	return (
		<main className="page-wrap px-2 md:px-4 pb-16 pt-8">
			<section className="island-shell rounded-[2rem] px-4 md:px-6 py-10 sm:px-12 sm:py-12">
				<p className="island-kicker mb-2">شفافیت ضدتقلب</p>
				<h1 className="display-title mb-4 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
					چگونه مشروعیت امضاها حفظ می‌شود؟
				</h1>
				<div className="max-w-3xl space-y-4 text-base leading-8 text-[var(--sea-ink-soft)]">
					<p>{data.textFa}</p>
					<ul className="list-disc space-y-4 pr-6">
						<li>
							<strong className="text-[var(--lagoon-deep)]">رویکرد ضدتقلب:</strong>{" "}
							سامانه به‌جای اتکا به یک عامل واحد، از کنترل‌های چندلایه برای
							تشخیص و محدودسازی ارسال‌های غیرعادی استفاده می‌کند.
						</li>
						<li>
							<strong className="text-[var(--lagoon-deep)]">یکتاسازی امضا:</strong>{" "}
							برای جلوگیری از ثبت تکراری، بررسی یکتایی با شناسه‌های محافظت‌شده
							انجام می‌شود، نه با نمایش داده‌های هویتی خام.
						</li>
						<li>
							<strong className="text-[var(--lagoon-deep)]">حریم خصوصی:</strong>{" "}
							ورودی‌های حساس برای اعتبارسنجی دریافت می‌شوند اما در پایگاه‌داده به
							شکل خام نگهداری نمی‌شوند؛ خروجی عمومی نیز فقط در چارچوب رضایت کاربر
							نمایش داده می‌شود.
						</li>
					</ul>

					<div className="mt-8 rounded-2xl border border-[rgba(79,184,178,0.3)] bg-[rgba(79,184,178,0.08)] px-4 md:px-6 py-8 sm:px-10 sm:py-10">
						<h2 className="mb-6 text-2xl font-bold text-[var(--sea-ink)]">
							آنچه اکنون در سامانه اجرا می‌شود
						</h2>
						<div className="space-y-4">
							<div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-5 sm:px-6">
								<h3 className="mb-2 text-lg font-semibold text-[var(--sea-ink)]">
									اعتبارسنجی ورودی پیش از ثبت
								</h3>
								<ul className="mt-2 list-disc space-y-1 pr-4 text-sm leading-7 text-[var(--sea-ink-soft)]">
									<li>
										<span className="font-semibold text-[var(--lagoon-deep)]">
											کنترل فیلدهای ضروری:
										</span>{" "}
										پیش از هر اقدامی بررسی می‌شوند.
									</li>
									<li>
										<span className="font-semibold text-[var(--lagoon-deep)]">
											اعتبار فرمت:
										</span>{" "}
										فرمت شناسه‌ها و سازگاری نشست/درخواست کنترل می‌شود.
									</li>
									<li>
										<span className="font-semibold text-[var(--lagoon-deep)]">
											توقف داده نامعتبر:
										</span>{" "}
										درخواست‌های ناقص یا نامعتبر وارد مرحله ثبت نمی‌شوند.
									</li>
								</ul>
							</div>

							<div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-5 sm:px-6">
								<h3 className="mb-2 text-lg font-semibold text-[var(--sea-ink)]">
									محافظت از داده‌های حساس
								</h3>
								<p className="text-sm leading-7 text-[var(--sea-ink-soft)]">
									برای سنجش یکتایی و تشخیص الگوهای تکراری، از{" "}
									<span className="font-semibold text-[var(--lagoon-deep)]">
										شناسه‌های مشتق‌شده و کلیددار
									</span>{" "}
									استفاده می‌شود تا نیاز به نگهداری مقادیر هویتی خام از بین برود.
								</p>
								<p className="mt-3 text-sm leading-7 text-[var(--sea-ink-soft)]">
									کلیدهای امنیتی و منطق حساس{" "}
									<span className="font-semibold text-[var(--lagoon-deep)]">
										فقط در سمت سرور
									</span>{" "}
									استفاده می‌شوند و در خروجی عمومی یا پایگاه‌داده به شکل افشاگرانه
									منتشر نمی‌گردند.
								</p>
							</div>

							<div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-5 sm:px-6">
								<h3 className="mb-2 text-lg font-semibold text-[var(--sea-ink)]">
									کنترل سوءاستفاده و تقلب
								</h3>
								<ul className="list-disc space-y-2 pr-4 text-sm leading-7 text-[var(--sea-ink-soft)]">
									<li>
										<strong className="text-[var(--lagoon-deep)]">
											توکن یک‌بارمصرف:
										</strong>{" "}
										هر درخواست ثبت باید از مسیر
										توکن معتبر و نشست متناظر عبور کند.
									</li>
									<li>
										<strong className="text-[var(--lagoon-deep)]">
											محدودسازی نرخ و ارزیابی ریسک:
										</strong>{" "}
										الگوهای تکراری و
										رفتارهای غیرعادی شناسایی و محدود می‌شوند.
									</li>
									<li>
										<strong className="text-[var(--lagoon-deep)]">
											ممانعت از ثبت تکراری:
										</strong>{" "}
										بررسی یکتایی برای اطلاعات
										کلیدی انجام می‌شود تا امضای تکراری ثبت نشود.
									</li>
									<li>
										<strong className="text-[var(--lagoon-deep)]">
											ثبت رویداد امنیتی:
										</strong>{" "}
										رویدادهای مرتبط برای رصد
										سلامت سامانه ثبت و تحلیل می‌شوند.
									</li>
								</ul>
							</div>

							<div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-5 sm:px-6">
								<h3 className="mb-2 text-lg font-semibold text-[var(--sea-ink)]">
									نمایش عمومی اطلاعات
								</h3>
								<p className="text-sm leading-7 text-[var(--sea-ink-soft)]">
									در بخش عمومی، اطلاعات صرفاً در حد لازم برای{" "}
									<span className="font-semibold text-[var(--lagoon-deep)]">
										شفافیت پویش
									</span>{" "}
									نمایش
									داده می‌شود و جزئیات هویتی کامل منتشر نمی‌گردد.
								</p>
								<p className="mt-3 text-sm leading-7 text-[var(--sea-ink-soft)]">
									نمایش نام براساس انتخاب کاربر{" "}
									<span className="font-semibold text-[var(--lagoon-deep)]">
										(مخفی/ماسک‌شده/کامل)
									</span>{" "}
									انجام می‌شود و شناسه نمایشی نیز به‌صورت محدود ارائه می‌گردد.
								</p>
								<p className="mt-2 text-sm leading-7 text-[var(--sea-ink-soft)]">
									این صفحه عمداً از انتشار جزئیات فنی حساس خودداری می‌کند تا میان
									<span className="font-semibold text-[var(--lagoon-deep)]">
										شفافیت عمومی و امنیت عملیاتی
									</span>{" "}
									توازن حفظ شود.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
