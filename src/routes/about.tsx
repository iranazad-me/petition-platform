import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
	component: About,
});

function About() {
	return (
		<main className="page-wrap px-2 md:px-4 pb-16 pt-8">
			<section className="island-shell rounded-[2rem] px-4 md:px-6 py-10 sm:px-12 sm:py-12">
				<p className="island-kicker mb-2">درباره پلتفرم</p>
				<h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
					پلتفرم امضای حریم‌خصوصی‌محور
				</h1>
				<div className="max-w-3xl space-y-4 text-base leading-8 text-[var(--sea-ink-soft)]">
					<p>
						این سامانه برای ثبت امضای یکتا، کاهش سوءاستفاده و حفظ حریم خصوصی
						طراحی شده است. اطلاعات خام هویتی ذخیره نمی‌شود و کنترل‌های ضدتقلب بدون
						OTP اعمال می‌شوند.
					</p>
					<p>
						برای مشاهده جزئیات روش‌های امنیتی و ضدتقلب، به صفحه «شفافیت ضدتقلب»
						مراجعه کنید.
					</p>
				</div>
			</section>
		</main>
	);
}
