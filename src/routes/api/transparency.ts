import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/transparency")({
	server: {
		handlers: {
			GET: async () => {
				try {
					const { getFraudTransparency } = await import(
						"#/lib/petition-server"
					);
					const transparency = await getFraudTransparency();
					return new Response(JSON.stringify({ data: transparency }), {
						status: 200,
						headers: { "Content-Type": "application/json; charset=utf-8" },
					});
				} catch (error) {
					console.error("[API] Transparency request failed:", error);
					return new Response(
						JSON.stringify({
							error: "Failed to fetch transparency",
							data: { textFa: "خطا در دریافت اطلاعات" },
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
