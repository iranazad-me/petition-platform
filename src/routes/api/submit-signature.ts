import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/submit-signature")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const body = (await request.json()) as Record<string, unknown>;
					const payload =
						body && typeof body.data === "object"
							? (body.data as Record<string, unknown>)
							: body;

					const displayConsentRaw =
						typeof payload.displayConsent === "object"
							? (payload.displayConsent as Record<string, unknown>)
							: null;
					const rawNameDisplayMode =
						typeof displayConsentRaw?.nameDisplayMode === "string"
							? displayConsentRaw.nameDisplayMode
							: typeof payload.nameDisplayMode === "string"
								? payload.nameDisplayMode
								: "hidden";
					const nameDisplayMode = (
						["hidden", "masked", "unmasked"] as const
					).includes(rawNameDisplayMode as "hidden" | "masked" | "unmasked")
						? (rawNameDisplayMode as "hidden" | "masked" | "unmasked")
						: "hidden";

					const clientSignalsRaw =
						typeof payload.clientSignals === "object"
							? (payload.clientSignals as Record<string, unknown>)
							: null;

					const submissionLatencyMs =
						typeof clientSignalsRaw?.submissionLatencyMs === "number"
							? clientSignalsRaw.submissionLatencyMs
							: typeof payload.formShownAt === "number"
								? Math.max(0, Date.now() - payload.formShownAt)
								: 0;

					const requestData = {
						fullName:
							typeof payload.fullName === "string"
								? payload.fullName
								: undefined,
						studentId:
							typeof payload.studentId === "string" ? payload.studentId : "",
						nationalId:
							typeof payload.nationalId === "string" ? payload.nationalId : "",
						universityName:
							typeof payload.universityName === "string"
								? payload.universityName
								: "",
						facultyName:
							typeof payload.facultyName === "string"
								? payload.facultyName
								: "",
						displayConsent: {
							nameDisplayMode,
						},
						nonce: typeof payload.nonce === "string" ? payload.nonce : "",
						csrfToken:
							typeof payload.csrfToken === "string" ? payload.csrfToken : "",
						clientSignals: {
							sessionId:
								typeof clientSignalsRaw?.sessionId === "string"
									? clientSignalsRaw.sessionId
									: typeof payload.sessionId === "string"
										? payload.sessionId
										: "",
							fingerprint:
								typeof clientSignalsRaw?.fingerprint === "string"
									? clientSignalsRaw.fingerprint
									: "unknown",
							userAgent:
								typeof clientSignalsRaw?.userAgent === "string"
									? clientSignalsRaw.userAgent
									: (request.headers.get("user-agent") ?? undefined),
							honeypotValue:
								typeof clientSignalsRaw?.honeypotValue === "string"
									? clientSignalsRaw.honeypotValue
									: typeof payload.honeypot === "string"
										? payload.honeypot
										: undefined,
							submissionLatencyMs,
						},
					};

					if (
						!requestData.studentId ||
						!requestData.nationalId ||
						!requestData.universityName ||
						!requestData.facultyName ||
						!requestData.nonce ||
						!requestData.csrfToken ||
						!requestData.clientSignals.sessionId
					) {
						return new Response(
							JSON.stringify({
								success: false,
								code: "VALIDATION_FAILED",
								messageFa: "ساختار درخواست نامعتبر است.",
							}),
							{
								status: 400,
								headers: { "Content-Type": "application/json; charset=utf-8" },
							},
						);
					}

					const ip =
						request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
						request.headers.get("x-real-ip") ||
						"unknown";
					const userAgent = request.headers.get("user-agent") || "unknown";

					const { submitSignatureInternal } = await import("#/lib/petition");
					const result = await submitSignatureInternal(requestData, {
						ip,
						userAgent,
					});

					return new Response(JSON.stringify({ ...result, data: result }), {
						status: 200,
						headers: { "Content-Type": "application/json; charset=utf-8" },
					});
				} catch (error) {
					console.error("[API] Submit signature failed:", error);
					return new Response(
						JSON.stringify({
							error: "Failed to submit signature",
							data: { success: false, messageFa: "خطا در ثبت امضا" },
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
