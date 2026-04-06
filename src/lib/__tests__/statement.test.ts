import { describe, expect, it } from "vitest";
import { parseStatementMarkdown } from "#/lib/statement";

describe("statement markdown parser", () => {
	it("parses headings and paragraphs", () => {
		const blocks = parseStatementMarkdown("# عنوان\n\n## بخش\n\nمتن");
		expect(blocks[0]).toMatchObject({
			type: "heading",
			level: 1,
			text: "عنوان",
		});
		expect(blocks[1]).toMatchObject({ type: "heading", level: 2, text: "بخش" });
		expect(blocks[2]).toMatchObject({ type: "paragraph", text: "متن" });
	});
});
