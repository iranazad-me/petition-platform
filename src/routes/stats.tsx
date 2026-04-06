import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

function BarList({
	title,
	rows,
}: {
	title: string;
	rows: Array<{ name: string; count: number }>;
}) {
	const max = Math.max(...rows.map((r) => r.count), 1);
	return (
		<section className="island-shell rounded-[2rem] px-4 md:px-6 py-10 sm:px-12 sm:py-12">
			<h2 className="display-title mb-4 text-2xl font-bold text-[var(--sea-ink)]">
				{title}
			</h2>
			{rows.length === 0 ? (
				<p className="text-sm text-[var(--sea-ink-soft)]">
					داده‌ای برای نمایش وجود ندارد.
				</p>
			) : (
				<ul className="space-y-3">
					{rows.map((row) => {
						const width = Math.max(8, Math.round((row.count / max) * 100));
						return (
							<li key={`${title}-${row.name}`} className="space-y-1">
								<div className="flex items-center justify-between gap-3 text-sm">
									<span className="font-semibold text-[var(--sea-ink)]">
										{row.name}
									</span>
									<span className="text-[var(--sea-ink-soft)]">
										{row.count.toLocaleString("fa-IR")}
									</span>
								</div>
								<div className="h-2.5 rounded-full bg-[rgba(79,184,178,0.12)]">
									<div
										className="h-full rounded-full bg-[var(--lagoon-deep)]"
										style={{ width: `${width}%` }}
									/>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}

export const Route = createFileRoute("/stats")({
	loader: async () => {
		// During SSR, import server functions directly
		// During client navigation, use fetch to avoid bundling server code
		if (
			typeof import.meta.env.SSR === "undefined" ||
			import.meta.env.SSR === false
		) {
			// Client-side: use fetch
			const response = await fetch("/api/stats");
			const data = await response.json();
			return data.data.stats;
		} else {
			// Server-side: import directly
			const { getLiveStats } = await import("#/lib/petition-server");
			return getLiveStats();
		}
	},
	component: StatsPage,
});

function StatsPage() {
	const initial = Route.useLoaderData();
	const [sortType, setSortType] = useState<"count" | "name">("count");

	const byUniversity = useMemo(() => {
		const rows = [...initial.byUniversity];
		if (sortType === "name") {
			rows.sort((a, b) => a.name.localeCompare(b.name, "fa-IR"));
			return rows;
		}
		rows.sort((a, b) => b.count - a.count);
		return rows;
	}, [initial.byUniversity, sortType]);

	const byFaculty = useMemo(() => {
		const rows = [...initial.byFaculty];
		if (sortType === "name") {
			rows.sort((a, b) => a.name.localeCompare(b.name, "fa-IR"));
			return rows;
		}
		rows.sort((a, b) => b.count - a.count);
		return rows;
	}, [initial.byFaculty, sortType]);

	return (
		<main className="page-wrap space-y-6 px-2 md:px-4 pb-16 pt-8">
			<section className="island-shell rounded-[2rem] px-4 md:px-6 py-10 sm:px-12 sm:py-12">
				<p className="island-kicker mb-2">آمار زنده امضاها</p>
				<h1 className="display-title mb-3 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
					داشبورد امضاها
				</h1>
				<p className="m-0 text-sm leading-relaxed text-[var(--sea-ink-soft)]">
					آخرین بروزرسانی: {new Date(initial.updatedAt).toLocaleString("fa-IR")}
				</p>
				<div className="mt-5 flex flex-wrap items-center gap-3">
					<div className="rounded-xl border border-[rgba(79,184,178,0.25)] bg-[rgba(79,184,178,0.12)] px-5 py-3 text-sm font-bold text-[var(--sea-ink)]">
						مجموع امضاها: {initial.total.toLocaleString("fa-IR")}
					</div>
					<label className="text-sm text-[var(--sea-ink)]">
						مرتب‌سازی:
						<select
							className="form-input mr-2 inline-block w-auto"
							value={sortType}
							onChange={(e) =>
								setSortType(e.target.value === "name" ? "name" : "count")
							}
						>
							<option value="count">بر اساس تعداد</option>
							<option value="name">بر اساس نام</option>
						</select>
					</label>
				</div>
			</section>

			<BarList title="امضاها به‌تفکیک دانشگاه" rows={byUniversity} />
			<BarList title="امضاها به‌تفکیک دانشکده" rows={byFaculty} />
		</main>
	);
}
