import { describe, it, expect, vi } from "vitest";
import { findFileForFeedUrl } from "./findFileForFeedUrl";
import type RhoReader from "../../main";
import type { TFile } from "obsidian";

function createMockPlugin(files: Array<{ path: string; feedUrl?: string }>): RhoReader {
	const mockFiles = files.map((f) => ({
		path: f.path,
		basename: f.path.split("/").pop(),
	})) as TFile[];

	return {
		app: {
			vault: {
				getMarkdownFiles: vi.fn(() => mockFiles),
			},
			metadataCache: {
				getFileCache: vi.fn((file: TFile) => {
					const match = files.find((f) => f.path === file.path);
					if (match?.feedUrl) {
						return { frontmatter: { feed_url: match.feedUrl } };
					}
					return { frontmatter: {} };
				}),
			},
		},
	} as unknown as RhoReader;
}

describe("findFileForFeedUrl", () => {
	it("should return the file that matches the feed URL", () => {
		const plugin = createMockPlugin([
			{ path: "notes/blog.md", feedUrl: "https://example.com/feed.xml" },
			{ path: "notes/other.md", feedUrl: "https://other.com/feed.xml" },
		]);

		const result = findFileForFeedUrl(plugin, "https://example.com/feed.xml");
		expect(result).not.toBeNull();
		expect(result?.path).toBe("notes/blog.md");
	});

	it("should return null when no file matches the feed URL", () => {
		const plugin = createMockPlugin([
			{ path: "notes/blog.md", feedUrl: "https://example.com/feed.xml" },
		]);

		const result = findFileForFeedUrl(plugin, "https://unknown.com/feed.xml");
		expect(result).toBeNull();
	});

	it("should return null when no files have feed_url frontmatter", () => {
		const plugin = createMockPlugin([
			{ path: "notes/blog.md" },
			{ path: "notes/other.md" },
		]);

		const result = findFileForFeedUrl(plugin, "https://example.com/feed.xml");
		expect(result).toBeNull();
	});

	it("should return first matching file when multiple files have same feed URL", () => {
		const plugin = createMockPlugin([
			{ path: "notes/first.md", feedUrl: "https://example.com/feed.xml" },
			{ path: "notes/second.md", feedUrl: "https://example.com/feed.xml" },
		]);

		const result = findFileForFeedUrl(plugin, "https://example.com/feed.xml");
		expect(result?.path).toBe("notes/first.md");
	});
});
