/**
 * Client-side API wrapper for petition endpoints
 * Uses fetch to call server-side API routes
 */

// Import types from the shared types file
import type {
	IssuedNonce,
	IssueNonceInput,
	LiveStats,
	PublicSignature,
	SignInput,
	SignResult,
} from "#/lib/petition-types";

// Re-export types for convenience
export type {
	IssueNonceInput,
	IssuedNonce,
	SignInput,
	SignResult,
	PublicSignature,
	LiveStats,
};

async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
	// Check if running on server
	const isServer = typeof window === "undefined";

	if (isServer) {
		// During SSR, we can't use fetch with relative URLs
		throw new Error(
			`API client called during SSR: ${url}. Use internal functions instead.`,
		);
	}

	const response = await fetch(url, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options?.headers,
		},
	});

	if (!response.ok) {
		throw new Error(`API error: ${response.status} ${response.statusText}`);
	}

	return response;
}

// Client-side functions (used from browser)
export async function issueSubmissionNonce(
	data: IssueNonceInput,
): Promise<IssuedNonce> {
	const response = await apiFetch("/api/issue-nonce", {
		method: "POST",
		body: JSON.stringify(data),
	});

	return response.json();
}

export async function submitSignature(data: SignInput): Promise<SignResult> {
	const response = await apiFetch("/api/submit-signature", {
		method: "POST",
		body: JSON.stringify(data),
	});

	return response.json();
}

export async function hasAlreadySigned(data: {
	fingerprint: string;
	sessionId: string;
}): Promise<{ signed: boolean; signatureData?: PublicSignature }> {
	const response = await apiFetch("/api/has-already-signed", {
		method: "POST",
		body: JSON.stringify(data),
	});

	return response.json();
}

export async function getLiveStats(): Promise<LiveStats> {
	const response = await apiFetch("/api/stats", {
		method: "GET",
	});

	return response.json();
}

export async function getRecentPublicSignatures(): Promise<PublicSignature[]> {
	const response = await apiFetch("/api/signatures/recent", {
		method: "GET",
	});

	return response.json();
}

export async function getFraudTransparency(): Promise<{ textFa: string }> {
	const response = await apiFetch("/api/fraud-transparency", {
		method: "GET",
	});

	return response.json();
}
