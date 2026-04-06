import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/issueSubmissionNonce")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const body = await request.json();
					const { issueNonce } = await import("#/lib/petition-server");
					const result = await issueNonce(body);
					return new Response(JSON.stringify({ data: result }), {
						status: 200,
						headers: { "Content-Type": "application/json; charset=utf-8" },
					});
				} catch (error) {
					console.error("[API] Issue nonce failed:", error);
					return new Response(
						JSON.stringify({ error: "Failed to issue nonce" }),
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
