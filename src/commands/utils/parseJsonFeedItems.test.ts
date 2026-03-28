import { describe, it, expect } from "vitest";
import { parseJsonFeedItems, type JsonFeed } from "./parseJsonFeedItems";

describe("parseJsonFeedItems", () => {
	it("should parse a JSON Feed with all fields", () => {
		const feed: JsonFeed = {
			version: "https://jsonfeed.org/version/1.1",
			title: "Test Feed",
			items: [
				{
					id: "1",
					url: "https://example.com/post-1",
					title: "First Post",
					content_text: "Hello world",
					date_published: "2025-01-15T00:00:00Z",
					tags: ["tech", "news"],
				},
				{
					id: "2",
					url: "https://example.com/post-2",
					title: "Second Post",
					summary: "A summary",
					date_published: "2025-01-16T00:00:00Z",
				},
			],
		};

		const posts = parseJsonFeedItems(feed);
		expect(posts).toHaveLength(2);
		expect(posts[0]).toEqual({
			title: "First Post",
			link: "https://example.com/post-1",
			pubDate: "2025-01-15T00:00:00Z",
			guid: "1",
			description: "Hello world",
			tags: ["tech", "news"],
		});
		expect(posts[1]).toEqual({
			title: "Second Post",
			link: "https://example.com/post-2",
			pubDate: "2025-01-16T00:00:00Z",
			guid: "2",
			description: "A summary",
		});
	});

	it("should use 'Untitled' and empty strings for missing fields", () => {
		const feed: JsonFeed = {
			version: "https://jsonfeed.org/version/1.1",
			items: [{ id: "1" }],
		};

		const posts = parseJsonFeedItems(feed);
		expect(posts[0].title).toBe("Untitled");
		expect(posts[0].link).toBe("");
		expect(posts[0].pubDate).toBe("");
		expect(posts[0].description).toBe("");
	});

	it("should prefer content_text over content_html and summary", () => {
		const feed: JsonFeed = {
			version: "https://jsonfeed.org/version/1.1",
			items: [
				{
					id: "1",
					content_text: "Plain text",
					content_html: "<p>HTML</p>",
					summary: "Summary",
				},
			],
		};

		expect(parseJsonFeedItems(feed)[0].description).toBe("Plain text");
	});

	it("should fall back to content_html when content_text is absent", () => {
		const feed: JsonFeed = {
			version: "https://jsonfeed.org/version/1.1",
			items: [{ id: "1", content_html: "<p>HTML</p>", summary: "Summary" }],
		};

		expect(parseJsonFeedItems(feed)[0].description).toBe("<p>HTML</p>");
	});

	it("should fall back to summary when content fields are absent", () => {
		const feed: JsonFeed = {
			version: "https://jsonfeed.org/version/1.1",
			items: [{ id: "1", summary: "Just a summary" }],
		};

		expect(parseJsonFeedItems(feed)[0].description).toBe("Just a summary");
	});

	it("should return empty array for missing items", () => {
		const feed = { version: "https://jsonfeed.org/version/1.1" } as JsonFeed;
		expect(parseJsonFeedItems(feed)).toEqual([]);
	});

	it("should return empty array for empty items", () => {
		const feed: JsonFeed = {
			version: "https://jsonfeed.org/version/1.1",
			items: [],
		};
		expect(parseJsonFeedItems(feed)).toEqual([]);
	});

	it("should pass through tags", () => {
		const feed: JsonFeed = {
			version: "https://jsonfeed.org/version/1.1",
			items: [{ id: "1", title: "Tagged", tags: ["a", "b", "c"] }],
		};

		expect(parseJsonFeedItems(feed)[0].tags).toEqual(["a", "b", "c"]);
	});
});
