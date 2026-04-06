import { createFileRoute } from "@tanstack/react-router";
import { issueNonce } from "#/lib/petition";

export const Route = createFileRoute("/api/issue-nonce")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const body = await request.json();
					const { sessionId } = body;

					if (typeof sessionId !== "string" || !sessionId.trim()) {
						return new Response(
							JSON.stringify({ error: "Invalid session ID" }),
							{
								status: 400,
								headers: { "Content-Type": "application/json; charset=utf-8" },
							},
						);
					}

					const result = await issueNonce({ sessionId: sessionId.trim() });
					return new Response(JSON.stringify(result), {
						status: 200,
						headers: { "Content-Type": "application/json; charset=utf-8" },
					});
				} catch (error) {
					console.error("Error in issue-nonce:", error);
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
