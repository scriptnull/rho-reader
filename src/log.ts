// Routes plugin diagnostics through a single switch so the console stays
// quiet for users by default. Flip DEBUG to surface internal errors while
// developing.
const DEBUG = false;

export function logError(...args: unknown[]): void {
	if (DEBUG) {
		console.error("[Rho Reader]", ...args);
	}
}
