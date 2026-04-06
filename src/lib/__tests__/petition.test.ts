import { describe, expect, it } from "vitest";

describe("petition transparency", () => {
	it("returns persian non-otp transparency text", async () => {
		const originalDatabaseUrl = process.env.DATABASE_URL;
		const originalSecret = process.env.PETITION_HMAC_SECRET;
		process.env.DATABASE_URL =
			"postgres://postgres:postgres@localhost:5432/test";
		process.env.PETITION_HMAC_SECRET = "test-secret";
		const { getFraudTransparencyInternal } = await import(
			"#/lib/petition-server"
		);
		const data = getFraudTransparencyInternal();
		expect(data.textFa).toContain("OTP");
		expect(data.textFa).toContain("حریم خصوصی");
		process.env.DATABASE_URL = originalDatabaseUrl;
		process.env.PETITION_HMAC_SECRET = originalSecret;
	});
});
