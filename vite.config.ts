import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
	plugins: [
		devtools(),
		tsconfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
	define: {
		// Polyfill for Buffer and process in browser only
		// Don't override process.env for server-side code
		"import.meta.env.DEV": JSON.stringify(false),
	},
	optimizeDeps: {
		include: ["buffer", "process", "util", "events", "stream-browserify"],
		exclude: ["pg", "drizzle-orm"],
	},
	build: {
		commonjsOptions: {
			// Exclude Node.js modules from browser build
			exclude: ["pg", "drizzle-orm"],
		},
		rollupOptions: {
			output: {
				// Use consistent asset names to avoid SSR/client mismatches
				assetFileNames: (assetInfo) => {
					if (assetInfo.name === "styles.css") {
						return "assets/styles.css";
					}
					return "assets/[name]-[hash][extname]";
				},
			},
		},
	},
	resolve: {
		alias: {
			// Import path aliases
			"#/": "/src/",
			"@/": "/src/",
			// Polyfill for Node.js modules
			crypto: "crypto-browserify",
			stream: "stream-browserify",
			buffer: "buffer",
			events: "events",
			process: "process",
			util: "util",
		},
	},
});

export default config;
