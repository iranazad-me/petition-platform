import { Link } from "@tanstack/react-router";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
	return (
		<header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] backdrop-blur-lg">
			<nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 px-4 sm:py-4 sm:px-6">
				<h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
					<Link
						to="/"
						className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-sm transition-all hover:shadow-md sm:px-4 sm:py-2"
					>
						<span
							className="relative flex h-2.5 w-2.5 overflow-hidden rounded-full"
							aria-hidden="true"
						>
							<span className="absolute inset-0 bg-[linear-gradient(90deg,var(--iran-green),var(--iran-red))]" />
							<span className="absolute inset-0 animate-[pulse_2s_ease-in-out_infinite] bg-[linear-gradient(90deg,var(--iran-green)_0%,var(--iran-white)_50%,var(--iran-red)_100%)]" />
						</span>
						<span className="truncate">پویش ایران آزاد</span>
					</Link>
				</h2>

				<div className="mr-auto flex items-center gap-1.5 sm:mr-0 sm:gap-2">
					<ThemeToggle />
				</div>

				<div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--line)] pt-3 text-sm font-semibold sm:order-2 sm:w-auto sm:flex-nowrap sm:border-0 sm:pt-0">
					<Link to="/" hash="sign" className="nav-link py-1">
						ثبت امضا
					</Link>
					<Link to="/stats" className="nav-link py-1">
						آمار زنده
					</Link>
					<Link to="/about-security" className="nav-link py-1">
						شفافیت ضدتقلب
					</Link>
				</div>
			</nav>
		</header>
	);
}
