import { beforeEach, describe, expect, it, vi } from "vitest";

type SelectQueueItem = unknown[];

const selectQueue: SelectQueueItem[] = [];

function dequeueSelect(): SelectQueueItem {
	const next = selectQueue.shift();
	return next ?? [];
}

const dbMock = {
	select: vi.fn(() => ({
		from: vi.fn(() => ({
			where: vi.fn(() => ({
				limit: vi.fn(async () => dequeueSelect()),
				groupBy: vi.fn(() => ({
					orderBy: vi.fn(async () => dequeueSelect()),
				})),
				orderBy: vi.fn(() => ({
					limit: vi.fn(async () => dequeueSelect()),
				})),
			})),
			limit: vi.fn(async () => dequeueSelect()),
		})),
	})),
	update: vi.fn(() => ({
		set: vi.fn(() => ({
			where: vi.fn(async () => ({ rowCount: 1 })),
		})),
	})),
	insert: vi.fn(() => ({
		values: vi.fn(async () => undefined),
	})),
	transaction: vi.fn(async (cb: (tx: unknown) => Promise<void>) => {
		const tx = {
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(async () => ({ rowCount: 1 })),
				})),
			})),
			insert: vi.fn(() => ({
				values: vi.fn(async () => undefined),
			})),
		};
		await cb(tx);
	}),
};

vi.mock("#/db/index", () => ({
	db: dbMock,
}));

function createBaseInput() {
	return {
		fullName: "علی رضایی",
		studentId: "12345678",
		nationalId: "0084575948",
		universityName: "دانشگاه تهران",
		facultyName: "مهندسی",
		displayConsent: {
			nameDisplayMode: "masked",
			showIdLastDigitsMasked: true,
		},
		nonce: "nonce-1",
		csrfToken: "csrf-1",
		clientSignals: {
			sessionId: "session-1",
			fingerprint: "fp-1",
			userAgent: "ua-1",
			submissionLatencyMs: 3000,
		},
	} as const;
}

describe.skip("submitSignature pipeline", () => {
	beforeEach(() => {
		selectQueue.splice(0, selectQueue.length);
		vi.clearAllMocks();
		process.env.PETITION_HMAC_SECRET = "test-secret";
	});

	it("returns NONCE_INVALID when nonce is missing", async () => {
		selectQueue.push([]);
		const { submitSignatureInternal } = await import("#/lib/petition-server");
		const result = await submitSignatureInternal(createBaseInput(), {
			ip: "1.2.3.4",
			userAgent: "ua",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("NONCE_INVALID");
		}
	});

	it("returns NONCE_REPLAYED when nonce already used", async () => {
		selectQueue.push([
			{
				nonce: "nonce-1",
				sessionId: "session-1",
				csrfToken: "csrf-1",
				expiresAt: new Date(Date.now() + 60_000),
				usedAt: new Date(),
			},
		]);
		const { submitSignatureInternal } = await import("#/lib/petition-server");
		const result = await submitSignatureInternal(createBaseInput(), {
			ip: "1.2.3.4",
			userAgent: "ua",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("NONCE_REPLAYED");
		}
	});

	it("returns DUPLICATE_DETECTED when duplicate hash exists", async () => {
		selectQueue.push(
			[
				{
					nonce: "nonce-1",
					sessionId: "session-1",
					csrfToken: "csrf-1",
					expiresAt: new Date(Date.now() + 60_000),
					usedAt: null,
				},
			],
			[{ id: "sig-1" }],
		);
		const { submitSignatureInternal } = await import("#/lib/petition-server");
		const result = await submitSignatureInternal(createBaseInput(), {
			ip: "1.2.3.4",
			userAgent: "ua",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("DUPLICATE_DETECTED");
		}
	});

	it("returns NONCE_REPLAYED if nonce is consumed concurrently", async () => {
		selectQueue.push(
			[
				{
					nonce: "nonce-1",
					sessionId: "session-1",
					csrfToken: "csrf-1",
					expiresAt: new Date(Date.now() + 60_000),
					usedAt: null,
				},
			],
			[],
			[{ value: 0 }],
			[{ value: 0 }],
			[{ value: 0 }],
			[{ value: 0 }],
			[{ id: "petition-1" }],
		);
		dbMock.transaction.mockImplementationOnce(
			async (cb: (tx: unknown) => Promise<void>) => {
				const tx = {
					update: vi.fn(() => ({
						set: vi.fn(() => ({
							where: vi.fn(async () => ({ rowCount: 0 })),
						})),
					})),
					insert: vi.fn(() => ({
						values: vi.fn(async () => undefined),
					})),
				};
				await cb(tx);
			},
		);

		const { submitSignatureInternal } = await import("#/lib/petition-server");
		const result = await submitSignatureInternal(createBaseInput(), {
			ip: "1.2.3.4",
			userAgent: "ua",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("NONCE_REPLAYED");
		}
	});
});
