import { createFileRoute } from "@tanstack/react-router";
import { getRecentSignaturesInternal } from "#/lib/petition";

export const Route = createFileRoute("/api/signatures/recent")({
	server: {
		handlers: {
			GET: async () => {
				const data = await getRecentSignaturesInternal();
				return new Response(JSON.stringify(data), {
					status: 200,
					headers: { "Content-Type": "application/json; charset=utf-8" },
				});
			},
		},
	},
});
