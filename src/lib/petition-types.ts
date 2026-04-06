/**
 * Shared types for petition system
 * These types can be safely imported by both client and server code
 */

export type SignApiErrorCode =
	| "VALIDATION_FAILED"
	| "DUPLICATE_DETECTED"
	| "RATE_LIMITED"
	| "RISK_REJECTED"
	| "NONCE_INVALID"
	| "NONCE_REPLAYED";

export type SignResult =
	| {
			success: true;
			signatureId: string;
			messageFa: string;
	  }
	| {
			success: false;
			code: SignApiErrorCode;
			messageFa: string;
			retryAfterSeconds?: number;
	  };

export type IssueNonceInput = {
	sessionId: string;
};

export type IssuedNonce = {
	nonce: string;
	csrfToken: string;
	expiresAt: string;
};

export type SignInput = {
	fullName?: string;
	studentId: string;
	nationalId: string;
	universityName: string;
	facultyName: string;
	displayConsent: {
		nameDisplayMode: "hidden" | "masked" | "unmasked";
	};
	nonce: string;
	csrfToken: string;
	clientSignals: {
		sessionId: string;
		fingerprint: string;
		userAgent?: string;
		honeypotValue?: string;
		submissionLatencyMs: number;
	};
};

export type PublicSignature = {
	universityName: string;
	facultyName: string;
	displayNameMasked: string | null;
	displayIdentifierLastDigitsMasked: string | null;
	createdAt: string;
};

export type LiveStats = {
	total: number;
	byUniversity: Array<{ name: string; count: number }>;
	byFaculty: Array<{ name: string; count: number }>;
	updatedAt: string;
};
