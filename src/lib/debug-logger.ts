export interface DebugLog {
	timestamp: string;
	operation: string;
	details: Record<string, unknown>;
	error?: string;
}

const logs: DebugLog[] = [];
const MAX_LOGS = 1000;

export function logDebug(
	operation: string,
	details: Record<string, unknown>,
	error?: string,
): void {
	// Completely disable debug logging in production
	if (process.env.NODE_ENV === "production") {
		return;
	}

	const log: DebugLog = {
		timestamp: new Date().toISOString(),
		operation,
		details,
		error,
	};

	// Implement log rotation to prevent unbounded memory growth
	logs.push(log);
	if (logs.length > MAX_LOGS) {
		logs.shift(); // Remove oldest log
	}

	// Also log to console in development
	console.log(`[DEBUG] ${operation}`, details, error || "");
}

export function getDebugLogs(): DebugLog[] {
	return [...logs];
}

export function clearDebugLogs(): void {
	logs.length = 0;
}
