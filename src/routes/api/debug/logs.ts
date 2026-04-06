import { createFileRoute } from "@tanstack/react-router";
import { getDebugLogs } from "#/lib/debug-logger";

export const Route = createFileRoute("/api/debug/logs")({
	server: {
		handlers: {
			GET: async () => {
				// Completely disable debug endpoint in production
				if (process.env.NODE_ENV === "production") {
					return new Response("Not Found", {
						status: 404,
						headers: { "Content-Type": "text/plain; charset=utf-8" },
					});
				}

				const logs = getDebugLogs();
				return new Response(JSON.stringify({ logs }, null, 2), {
					status: 200,
					headers: { "Content-Type": "application/json; charset=utf-8" },
				});
			},
		},
	},
});
