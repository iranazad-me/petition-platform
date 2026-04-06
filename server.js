import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join } from "node:path";

// Environment variables are already set by Docker's --env-file
// No need to call dotenv.config() - it would only override if .env.local exists
// and we want Docker env vars to take precedence

// Import the TanStack Start server
// Note: ESM modules are cached by URL, so ensure clean builds during deployment
const { default: server } = await import("./dist/server/server.js");

const port = process.env.PORT || 3000;
const clientDist = join(process.cwd(), "dist", "client");

// Load the PDF asset once at startup: compute an ETag from file metadata
// (mtime + size) and cache the content in memory to avoid per-request I/O.
function loadPdf(filePath) {
	try {
		const { mtimeMs, size } = statSync(filePath);
		const etag = `"${mtimeMs.toString(16)}-${size.toString(16)}"`;
		const content = readFileSync(filePath);
		return { etag, content };
	} catch {
		return null;
	}
}
const pdfFilePath = join(clientDist, "statement.pdf");
const pdfAsset = loadPdf(pdfFilePath);

// MIME types for static files
const mimeTypes = {
	".js": "text/javascript",
	".mjs": "text/javascript",
	".css": "text/css",
	".html": "text/html",
	".json": "application/json",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".ttf": "font/ttf",
	".eot": "application/vnd.ms-fontobject",
	".pdf": "application/pdf",
};

const httpServer = createServer(async (req, res) => {
	const url = new URL(req.url, `http://${req.headers.host}`);

	// Serve PDF file with ETag-based caching (no-cache forces revalidation but
	// allows browsers/CDNs to serve the cached copy on a 304 Not Modified).
	if (url.pathname === "/statement.pdf") {
		if (!pdfAsset) {
			res.statusCode = 404;
			res.end("Not Found");
			return;
		}
		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", "attachment; filename=statement.pdf");
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("ETag", pdfAsset.etag);
		if (req.headers["if-none-match"] === pdfAsset.etag) {
			res.statusCode = 304;
			res.end();
			return;
		}
		res.statusCode = 200;
		res.end(pdfAsset.content);
		return;
	}

	if (url.pathname === "/favicon.ico") {
		const svgPath = join(clientDist, "favicon.svg");
		if (!existsSync(svgPath)) {
			res.statusCode = 404;
			res.end("Not Found");
			return;
		}

		try {
			const content = readFileSync(svgPath);
			res.statusCode = 200;
			res.setHeader("Content-Type", "image/svg+xml");
			res.setHeader("Cache-Control", "public, max-age=300");
			res.end(content);
			return;
		} catch (error) {
			console.error("Error serving favicon fallback:", error);
			res.statusCode = 500;
			res.end("Internal Server Error");
			return;
		}
	}

	// Serve static files - try both client and server locations
	if (
		url.pathname.startsWith("/assets/") ||
		url.pathname.startsWith("/styles/") ||
		url.pathname.startsWith("/fonts/") ||
		url.pathname === "/favicon.svg" ||
		url.pathname === "/manifest.json"
	) {
			// Try client dist first (standard TanStack Start location)
		let filePath = join(clientDist, url.pathname);

		// If not found, try server assets (fallback for some builds)
		if (!existsSync(filePath)) {
			filePath = join(process.cwd(), "dist", "server", "assets", url.pathname.split("/").pop());
		}

		if (existsSync(filePath)) {
			const ext = extname(filePath);
			const contentType = mimeTypes[ext] || "application/octet-stream";

			try {
				const content = readFileSync(filePath);
				res.statusCode = 200;
				res.setHeader("Content-Type", contentType);
				res.setHeader("Cache-Control", "public, max-age=31536000");
				res.end(content);
				return;
			} catch (error) {
				console.error("Error serving static file:", error);
				res.statusCode = 500;
				res.end("Internal Server Error");
				return;
			}
		} else {
			res.statusCode = 404;
			res.end("Not Found");
			return;
		}
	}

	// Handle all other requests through TanStack Start
	const fetchRequest = new Request(url, {
		method: req.method,
		headers: req.headers,
		body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
		duplex: req.method === "GET" || req.method === "HEAD" ? undefined : "half",
	});

	try {
		const response = await server.fetch(fetchRequest);
		res.statusCode = response.status;

		// Add cache control headers for HTML files to prevent stale references
		res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
		res.setHeader("Pragma", "no-cache");
		res.setHeader("Expires", "0");

		response.headers.forEach((value, key) => {
			res.setHeader(key, value);
		});
		if (response.body) {
			const reader = response.body.getReader();
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				res.write(value);
			}
		}
		res.end();
	} catch (error) {
		console.error("Error handling request:", error);
		res.statusCode = 500;
		res.end("Internal Server Error");
	}
});

httpServer.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
