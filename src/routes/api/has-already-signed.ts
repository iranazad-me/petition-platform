import { createFileRoute } from "@tanstack/react-router";
import { hasAlreadySignedInternal } from "#/lib/petition";

export const Route = createFileRoute("/api/has-already-signed")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const body = await request.json();
					const { fingerprint, sessionId } = body;

					if (
						typeof fingerprint !== "string" ||
						typeof sessionId !== "string"
					) {
						return new Response(JSON.stringify({ error: "Invalid input" }), {
							status: 400,
							headers: { "Content-Type": "application/json; charset=utf-8" },
						});
					}

					const result = await hasAlreadySignedInternal(fingerprint, sessionId);
					return new Response(JSON.stringify(result), {
						status: 200,
						headers: { "Content-Type": "application/json; charset=utf-8" },
					});
				} catch (error) {
					console.error("Error in has-already-signed:", error);
					return new Response(
						JSON.stringify({ error: "Internal server error" }),
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
