export const MIN_SYNC_CONCURRENCY = 1;
export const MAX_SYNC_CONCURRENCY = 20;

/**
 * Clamps a user-supplied value to the allowed sync concurrency range.
 * Returns `fallback` when the value is not a parseable positive integer
 * (e.g. when the user clears the input or types non-numeric text).
 */
export function clampSyncConcurrency(
	value: string | number,
	fallback: number
): number {
	const num =
		typeof value === "number" ? value : parseInt(String(value).trim(), 10);
	if (!Number.isFinite(num) || Number.isNaN(num)) return fallback;
	const floored = Math.floor(num);
	if (floored < MIN_SYNC_CONCURRENCY) return MIN_SYNC_CONCURRENCY;
	if (floored > MAX_SYNC_CONCURRENCY) return MAX_SYNC_CONCURRENCY;
	return floored;
}

/**
 * Normalizes a vault-relative folder path. Strips leading / trailing
 * separators, collapses duplicates, filters out `.` and `..` segments
 * (which would allow escaping the vault), and trims whitespace.
 * Returns `fallback` when the resulting path is empty.
 */
export function normalizeFolderPath(
	input: string,
	fallback: string
): string {
	if (typeof input !== "string") return fallback;
	const segments = input
		.split(/[\\/]+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0 && s !== "." && s !== "..");
	if (segments.length === 0) return fallback;
	return segments.join("/");
}
