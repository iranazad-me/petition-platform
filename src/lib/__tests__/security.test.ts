import { describe, expect, it } from "vitest";
import {
	evaluateRisk,
	isValidIranNationalId,
	maskIdentifierLastDigits,
	maskName,
	normalizeDigits,
	normalizePersianText,
} from "#/lib/security";

describe("security helpers", () => {
	it("normalizes persian and arabic digits", () => {
		expect(normalizeDigits("۱۲٣٤۵")).toBe("12345");
	});

	it("normalizes persian text variants", () => {
		expect(normalizePersianText("  علي  كاظمي ")).toBe("علی کاظمی");
	});

	it("validates iran national id", () => {
		expect(isValidIranNationalId("0084575948")).toBe(true);
		expect(isValidIranNationalId("1234567890")).toBe(false);
	});

	it("masks name and identifier", () => {
		expect(maskName("علی رضایی")).toContain("*");
		expect(maskIdentifierLastDigits("1234567890")).toBe("******7890");
	});

	it("evaluates high risk", () => {
		const risk = evaluateRisk({
			deviceRecentCount: 4,
			ipRecentCount: 8,
			sessionRecentCount: 3,
			duplicateFingerprintSeen: true,
			honeypotTriggered: true,
			submissionLatencyMs: 500,
		});
		expect(risk.decision).toBe("reject");
		expect(risk.level).toBe("high");
	});
});
