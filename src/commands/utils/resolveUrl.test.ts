import { describe, it, expect } from "vitest";
import { resolveUrl } from "./resolveUrl";

describe("resolveUrl", () => {
	it("should return absolute URLs unchanged", () => {
		expect(resolveUrl("https://example.com/post", "https://example.com/feed")).toBe(
			"https://example.com/post"
		);
	});

	it("should resolve root-relative paths", () => {
		expect(resolveUrl("/post/1", "https://example.com/feed.xml")).toBe(
			"https://example.com/post/1"
		);
	});

	it("should resolve relative paths against base directory", () => {
		expect(resolveUrl("post/1", "https://example.com/blog/feed.xml")).toBe(
			"https://example.com/blog/post/1"
		);
	});

	it("should resolve protocol-relative URLs", () => {
		expect(resolveUrl("//cdn.example.com/img.png", "https://example.com/feed")).toBe(
			"https://cdn.example.com/img.png"
		);
	});

	it("should return empty string for empty link", () => {
		expect(resolveUrl("", "https://example.com/feed")).toBe("");
	});

	it("should return original link when base URL is invalid", () => {
		expect(resolveUrl("/post", "not-a-url")).toBe("/post");
	});

	it("should return original link when both are invalid", () => {
		expect(resolveUrl(":::bad", ":::also-bad")).toBe(":::bad");
	});
});
