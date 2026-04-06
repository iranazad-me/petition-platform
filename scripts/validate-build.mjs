import { existsSync } from "node:fs";

const buildOutputPath = "dist/server/server.js";

if (!existsSync(buildOutputPath)) {
console.error(`Build artifact not found at ${buildOutputPath}. Run 'pnpm build' before starting the server.`);
process.exit(1);
}
