import { describe, it, expect } from "vitest";
import {
	MAX_SYNC_CONCURRENCY,
	MIN_SYNC_CONCURRENCY,
	clampSyncConcurrency,
	normalizeFolderPath,
} from "./validation";

describe("clampSyncConcurrency", () => {
	it("returns valid integers unchanged", () => {
		expect(clampSyncConcurrency(5, 1)).toBe(5);
		expect(clampSyncConcurrency("3", 1)).toBe(3);
	});

	it("clamps values below the minimum", () => {
		expect(clampSyncConcurrency(0, 1)).toBe(MIN_SYNC_CONCURRENCY);
		expect(clampSyncConcurrency(-10, 1)).toBe(MIN_SYNC_CONCURRENCY);
	});

	it("clamps values above the maximum", () => {
		expect(clampSyncConcurrency(999, 1)).toBe(MAX_SYNC_CONCURRENCY);
		expect(clampSyncConcurrency(MAX_SYNC_CONCURRENCY + 1, 1)).toBe(
			MAX_SYNC_CONCURRENCY
		);
	});

	it("floors fractional inputs", () => {
		expect(clampSyncConcurrency(3.9, 1)).toBe(3);
		expect(clampSyncConcurrency("7.4", 1)).toBe(7);
	});

	it("returns fallback when input is empty", () => {
		expect(clampSyncConcurrency("", 4)).toBe(4);
		expect(clampSyncConcurrency("   ", 4)).toBe(4);
	});

	it("returns fallback when input is non-numeric", () => {
		expect(clampSyncConcurrency("abc", 4)).toBe(4);
		expect(clampSyncConcurrency(Number.NaN, 4)).toBe(4);
	});

	it("handles non-finite numbers with fallback", () => {
		expect(clampSyncConcurrency(Number.POSITIVE_INFINITY, 4)).toBe(4);
		expect(clampSyncConcurrency(Number.NEGATIVE_INFINITY, 4)).toBe(4);
	});
});

describe("normalizeFolderPath", () => {
	it("returns valid paths unchanged", () => {
		expect(normalizeFolderPath("Rho", "Fallback")).toBe("Rho");
		expect(normalizeFolderPath("Rho/Sub", "Fallback")).toBe("Rho/Sub");
	});

	it("strips leading slashes", () => {
		expect(normalizeFolderPath("/Rho", "Fallback")).toBe("Rho");
		expect(normalizeFolderPath("///Rho/Sub", "Fallback")).toBe("Rho/Sub");
	});

	it("strips trailing slashes", () => {
		expect(normalizeFolderPath("Rho/", "Fallback")).toBe("Rho");
		expect(normalizeFolderPath("Rho/Sub//", "Fallback")).toBe("Rho/Sub");
	});

	it("collapses duplicate separators", () => {
		expect(normalizeFolderPath("Rho//Sub", "Fallback")).toBe("Rho/Sub");
	});

	it("converts backslashes to forward slashes", () => {
		expect(normalizeFolderPath("Rho\\Sub", "Fallback")).toBe("Rho/Sub");
	});

	it("filters out '..' segments to prevent escaping the vault", () => {
		expect(normalizeFolderPath("../Rho", "Fallback")).toBe("Rho");
		expect(normalizeFolderPath("Rho/../../Other", "Fallback")).toBe(
			"Rho/Other"
		);
		expect(normalizeFolderPath("..", "Fallback")).toBe("Fallback");
	});

	it("filters out '.' segments", () => {
		expect(normalizeFolderPath("./Rho/./Sub", "Fallback")).toBe("Rho/Sub");
	});

	it("returns fallback for empty or whitespace-only input", () => {
		expect(normalizeFolderPath("", "Fallback")).toBe("Fallback");
		expect(normalizeFolderPath("   ", "Fallback")).toBe("Fallback");
		expect(normalizeFolderPath("/", "Fallback")).toBe("Fallback");
		expect(normalizeFolderPath("///", "Fallback")).toBe("Fallback");
	});

	it("returns fallback for non-string inputs", () => {
		// @ts-expect-error - intentionally passing wrong type
		expect(normalizeFolderPath(null, "Fallback")).toBe("Fallback");
		// @ts-expect-error - intentionally passing wrong type
		expect(normalizeFolderPath(undefined, "Fallback")).toBe("Fallback");
	});

	it("trims whitespace from segments", () => {
		expect(normalizeFolderPath("  Rho  /  Sub  ", "Fallback")).toBe(
			"Rho/Sub"
		);
	});
});
