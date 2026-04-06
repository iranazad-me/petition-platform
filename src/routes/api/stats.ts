import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/stats")({
	server: {
		handlers: {
			GET: async () => {
				try {
					const { getLiveStats, getRecentPublicSignatures } = await import(
						"#/lib/petition-server"
					);
					const [stats, recent] = await Promise.all([
						getLiveStats(),
						getRecentPublicSignatures(),
					]);
					return new Response(JSON.stringify({ data: { stats, recent } }), {
						status: 200,
						headers: { "Content-Type": "application/json; charset=utf-8" },
					});
				} catch (error) {
					console.error("[API] Stats request failed:", error);
					return new Response(
						JSON.stringify({
							error: "Failed to fetch stats",
							data: { stats: { total: 0 }, recent: [] },
						}),
						{
							status: 500,
							headers: { "Content-Type": "application/json; charset=utf-8" },
						},
					);
				}
			},
		},
	},
});
