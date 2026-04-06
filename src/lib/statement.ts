import statementTextRaw from "../../statement.md?raw";

export type StatementBlock =
	| {
			type: "heading";
			level: 1 | 2;
			text: string;
	  }
	| {
			type: "separator";
	  }
	| {
			type: "paragraph";
			text: string;
	  };

function normalizeLine(line: string): string {
	return line.replace(/\r/g, "").trim();
}

export function parseStatementMarkdown(markdown: string): StatementBlock[] {
	const lines = markdown.split("\n");
	const blocks: StatementBlock[] = [];

	for (const rawLine of lines) {
		const line = normalizeLine(rawLine);
		if (!line) {
			continue;
		}
		if (line === "---") {
			blocks.push({ type: "separator" });
			continue;
		}
		if (line.startsWith("## ")) {
			blocks.push({
				type: "heading",
				level: 2,
				text: line.slice(3).trim(),
			});
			continue;
		}
		if (line.startsWith("# ")) {
			blocks.push({
				type: "heading",
				level: 1,
				text: line.slice(2).trim(),
			});
			continue;
		}
		blocks.push({ type: "paragraph", text: line });
	}

	return blocks;
}

export const statementMarkdown = statementTextRaw;
export const statementBlocks = parseStatementMarkdown(statementTextRaw);
