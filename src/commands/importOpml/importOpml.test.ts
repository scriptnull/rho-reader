import { describe, it, expect, vi } from "vitest";
import type RhoReader from "../../main";
import type { TFile } from "obsidian";
import type { FeedToImport } from "./ImportOpmlModal";
import {
	sanitizeFileName,
	getExistingFeedUrls,
	categorizeFeeds,
} from "./importOpml";

function createMockPlugin(options: {
	files?: Array<{ path: string; feedUrl?: string }>;
}): RhoReader {
	const files = (options.files ?? []).map((f) => ({ path: f.path }) as TFile);

	return {
		app: {
			vault: {
				getMarkdownFiles: vi.fn(() => files),
			},
			metadataCache: {
				getFileCache: vi.fn((file: TFile) => {
					const match = options.files?.find((f) => f.path === file.path);
					if (match?.feedUrl) {
						return { frontmatter: { feed_url: match.feedUrl } };
					}
					return { frontmatter: {} };
				}),
			},
		},
	} as unknown as RhoReader;
}

describe("sanitizeFileName", () => {
	it("should replace backslash with hyphen", () => {
		expect(sanitizeFileName("foo\\bar")).toBe("foo-bar");
	});

	it("should replace forward slash with hyphen", () => {
		expect(sanitizeFileName("foo/bar")).toBe("foo-bar");
	});

	it("should replace colon with hyphen", () => {
		expect(sanitizeFileName("foo:bar")).toBe("foo-bar");
	});

	it("should replace asterisk with hyphen", () => {
		expect(sanitizeFileName("foo*bar")).toBe("foo-bar");
	});

	it("should replace question mark with hyphen", () => {
		expect(sanitizeFileName("foo?bar")).toBe("foo-bar");
	});

	it("should replace double quotes with hyphen", () => {
		expect(sanitizeFileName('foo"bar')).toBe("foo-bar");
	});

	it("should replace angle brackets with hyphen", () => {
		expect(sanitizeFileName("foo<bar>baz")).toBe("foo-bar-baz");
	});

	it("should replace pipe with hyphen", () => {
		expect(sanitizeFileName("foo|bar")).toBe("foo-bar");
	});

	it("should replace hash with hyphen", () => {
		expect(sanitizeFileName("foo#bar")).toBe("foo-bar");
	});

	it("should replace caret with hyphen", () => {
		expect(sanitizeFileName("foo^bar")).toBe("foo-bar");
	});

	it("should replace square brackets with hyphen", () => {
		expect(sanitizeFileName("foo[bar]")).toBe("foo-bar-");
	});

	it("should trim whitespace", () => {
		expect(sanitizeFileName("  foo bar  ")).toBe("foo bar");
	});

	it("should handle multiple invalid characters", () => {
		expect(sanitizeFileName("My: Feed? <Test>")).toBe("My- Feed- -Test-");
	});

	it("should return unchanged valid names", () => {
		expect(sanitizeFileName("ValidFeedName")).toBe("ValidFeedName");
	});
});

describe("getExistingFeedUrls", () => {
	it("should return empty set when no files exist", () => {
		const plugin = createMockPlugin({ files: [] });
		const result = getExistingFeedUrls(plugin);
		expect(result.size).toBe(0);
	});

	it("should return empty set when files have no feed_url", () => {
		const plugin = createMockPlugin({
			files: [{ path: "note1.md" }, { path: "note2.md" }],
		});
		const result = getExistingFeedUrls(plugin);
		expect(result.size).toBe(0);
	});

	it("should collect feed_url from files", () => {
		const plugin = createMockPlugin({
			files: [
				{ path: "feed1.md", feedUrl: "https://example.com/feed1.xml" },
				{ path: "feed2.md", feedUrl: "https://example.com/feed2.xml" },
			],
		});
		const result = getExistingFeedUrls(plugin);
		expect(result.size).toBe(2);
		expect(result.has("https://example.com/feed1.xml")).toBe(true);
		expect(result.has("https://example.com/feed2.xml")).toBe(true);
	});

	it("should handle mixed files with and without feed_url", () => {
		const plugin = createMockPlugin({
			files: [
				{ path: "note.md" },
				{ path: "feed.md", feedUrl: "https://example.com/feed.xml" },
			],
		});
		const result = getExistingFeedUrls(plugin);
		expect(result.size).toBe(1);
		expect(result.has("https://example.com/feed.xml")).toBe(true);
	});
});

describe("categorizeFeeds", () => {
	const feed1: FeedToImport = {
		title: "Feed 1",
		xmlUrl: "https://example.com/feed1.xml",
	};
	const feed2: FeedToImport = {
		title: "Feed 2",
		xmlUrl: "https://example.com/feed2.xml",
	};
	const feed3: FeedToImport = {
		title: "Feed 3",
		xmlUrl: "https://example.com/feed3.xml",
	};

	it("should put all feeds in toImport when none exist", () => {
		const feeds = [feed1, feed2];
		const existingUrls = new Set<string>();

		const result = categorizeFeeds(feeds, existingUrls);

		expect(result.toImport).toEqual([feed1, feed2]);
		expect(result.alreadyExists).toEqual([]);
	});

	it("should put all feeds in alreadyExists when all exist", () => {
		const feeds = [feed1, feed2];
		const existingUrls = new Set([feed1.xmlUrl, feed2.xmlUrl]);

		const result = categorizeFeeds(feeds, existingUrls);

		expect(result.toImport).toEqual([]);
		expect(result.alreadyExists).toEqual([feed1, feed2]);
	});

	it("should correctly categorize mixed feeds", () => {
		const feeds = [feed1, feed2, feed3];
		const existingUrls = new Set([feed2.xmlUrl]);

		const result = categorizeFeeds(feeds, existingUrls);

		expect(result.toImport).toEqual([feed1, feed3]);
		expect(result.alreadyExists).toEqual([feed2]);
	});

	it("should handle empty feeds array", () => {
		const feeds: FeedToImport[] = [];
		const existingUrls = new Set(["https://example.com/feed.xml"]);

		const result = categorizeFeeds(feeds, existingUrls);

		expect(result.toImport).toEqual([]);
		expect(result.alreadyExists).toEqual([]);
	});
});
