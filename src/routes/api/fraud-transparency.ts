import { createFileRoute } from "@tanstack/react-router";
import { getFraudTransparencyInternal } from "#/lib/petition";

export const Route = createFileRoute("/api/fraud-transparency")({
	server: {
		handlers: {
			GET: () => {
				const data = getFraudTransparencyInternal();
				return new Response(JSON.stringify(data), {
					status: 200,
					headers: { "Content-Type": "application/json; charset=utf-8" },
				});
			},
		},
	},
});
