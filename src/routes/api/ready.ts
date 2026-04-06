import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ready")({
	server: {
		handlers: {
			GET: async () => {
				try {
					const { db } = await import("#/db/index");
					const { sql } = await import("drizzle-orm");

					if (!db) {
						return new Response(JSON.stringify({ status: "not_ready" }), {
							status: 503,
							headers: { "Content-Type": "application/json; charset=utf-8" },
						});
					}
					try {
						const result = await db.execute(sql`select 1`);
						console.log("[READY] Database query successful:", result);
						return new Response(JSON.stringify({ status: "ready" }), {
							status: 200,
							headers: { "Content-Type": "application/json; charset=utf-8" },
						});
					} catch (error) {
						console.error("[READY] Database query failed:", error);
						return new Response(JSON.stringify({ status: "not_ready" }), {
							status: 503,
							headers: { "Content-Type": "application/json; charset=utf-8" },
						});
					}
				} catch (error) {
					console.error("[READY] Import failed:", error);
					return new Response(JSON.stringify({ status: "not_ready" }), {
						status: 503,
						headers: { "Content-Type": "application/json; charset=utf-8" },
					});
				}
			},
		},
	},
});
