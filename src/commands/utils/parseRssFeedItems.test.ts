import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseRssFeedItems } from "./parseRssFeedItems";

describe("parseRssFeedItems", () => {
	beforeEach(() => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "debug").mockImplementation(() => {});
	});

	it("should parse RSS 2.0 items correctly", () => {
		const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
			<rss version="2.0">
				<channel>
					<title>Test Feed</title>
					<item><title>Post 1</title><link>https://example.com/1</link><guid>guid-1</guid></item>
					<item><title>Post 2</title><link>https://example.com/2</link><guid>guid-2</guid></item>
				</channel>
			</rss>`;

		const posts = parseRssFeedItems(rssXml, "https://example.com/feed.xml");
		expect(posts).toHaveLength(2);
		expect(posts[0].title).toBe("Post 1");
		expect(posts[0].link).toBe("https://example.com/1");
		expect(posts[0].guid).toBe("guid-1");
		expect(posts[1].title).toBe("Post 2");
	});

	it("should parse Atom feed entries correctly", () => {
		const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
			<feed xmlns="http://www.w3.org/2005/Atom">
				<title>Atom Feed</title>
				<entry><title>Entry 1</title><id>id-1</id><link href="https://example.com/entry-1"/><published>2025-01-01</published></entry>
				<entry><title>Entry 2</title><id>id-2</id></entry>
				<entry><title>Entry 3</title><id>id-3</id></entry>
			</feed>`;

		const posts = parseRssFeedItems(atomXml, "https://example.com/atom.xml");
		expect(posts).toHaveLength(3);
		expect(posts[0].title).toBe("Entry 1");
		expect(posts[0].guid).toBe("id-1");
		expect(posts[0].pubDate).toBe("2025-01-01");
	});

	it("should return empty array when no items or entries found", () => {
		const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
			<rss version="2.0">
				<channel>
					<title>Empty Feed</title>
				</channel>
			</rss>`;

		const posts = parseRssFeedItems(emptyXml, "https://example.com/empty.xml");
		expect(posts).toHaveLength(0);
		expect(console.warn).toHaveBeenCalled();
	});

	it("should prefer RSS items over Atom entries when both exist", () => {
		const mixedXml = `<?xml version="1.0" encoding="UTF-8"?>
			<rss version="2.0">
				<channel>
					<item><title>RSS Item</title><link>https://example.com/rss</link></item>
					<entry><title>Atom Entry</title></entry>
				</channel>
			</rss>`;

		const posts = parseRssFeedItems(mixedXml, "https://example.com/mixed.xml");
		expect(posts).toHaveLength(1);
		expect(posts[0].title).toBe("RSS Item");
	});

	it("should use 'Untitled' for items with no title", () => {
		const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
			<rss version="2.0">
				<channel>
					<item><link>https://example.com/no-title</link></item>
				</channel>
			</rss>`;

		const posts = parseRssFeedItems(rssXml, "https://example.com/feed.xml");
		expect(posts[0].title).toBe("Untitled");
	});

	it("should parse JSON Feed format", () => {
		const jsonFeed = JSON.stringify({
			version: "https://jsonfeed.org/version/1.1",
			title: "JSON Feed",
			items: [
				{
					id: "json-1",
					url: "https://example.com/json-post",
					title: "JSON Post",
					content_text: "Hello from JSON Feed",
					date_published: "2025-06-01T00:00:00Z",
				},
			],
		});

		const posts = parseRssFeedItems(jsonFeed, "https://example.com/feed.json");
		expect(posts).toHaveLength(1);
		expect(posts[0].title).toBe("JSON Post");
		expect(posts[0].link).toBe("https://example.com/json-post");
		expect(posts[0].guid).toBe("json-1");
		expect(posts[0].description).toBe("Hello from JSON Feed");
	});

	it("should handle JSON Feed version 1.0", () => {
		const jsonFeed = JSON.stringify({
			version: "https://jsonfeed.org/version/1",
			items: [{ id: "v1", title: "Version 1 Post" }],
		});

		const posts = parseRssFeedItems(jsonFeed, "https://example.com/feed.json");
		expect(posts).toHaveLength(1);
		expect(posts[0].title).toBe("Version 1 Post");
	});

	it("should fall through to XML for JSON without jsonfeed version", () => {
		const notAFeed = JSON.stringify({ foo: "bar" });
		const posts = parseRssFeedItems(notAFeed, "https://example.com/api");
		expect(posts).toHaveLength(0);
	});

	it("should resolve relative links in RSS items", () => {
		const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
			<rss version="2.0">
				<channel>
					<item><title>Relative</title><link>/blog/post-1</link><guid>r-1</guid></item>
				</channel>
			</rss>`;

		const posts = parseRssFeedItems(rssXml, "https://example.com/feed.xml");
		expect(posts[0].link).toBe("https://example.com/blog/post-1");
	});

	it("should resolve relative href in Atom entries", () => {
		const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
			<feed xmlns="http://www.w3.org/2005/Atom">
				<entry>
					<title>Relative Atom</title>
					<link href="/atom/post-1"/>
					<id>ra-1</id>
				</entry>
			</feed>`;

		const posts = parseRssFeedItems(atomXml, "https://example.com/atom.xml");
		expect(posts[0].link).toBe("https://example.com/atom/post-1");
	});

	it("should resolve relative links in JSON Feed via parseRssFeedItems", () => {
		const jsonFeed = JSON.stringify({
			version: "https://jsonfeed.org/version/1.1",
			items: [{ id: "j-1", url: "/json/post-1", title: "Relative JSON" }],
		});

		const posts = parseRssFeedItems(jsonFeed, "https://example.com/feed.json");
		expect(posts[0].link).toBe("https://example.com/json/post-1");
	});

	it("should extract link from href attribute for Atom entries", () => {
		const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
			<feed xmlns="http://www.w3.org/2005/Atom">
				<entry>
					<title>Test</title>
					<link href="https://example.com/atom-link"/>
					<id>test-id</id>
				</entry>
			</feed>`;

		const posts = parseRssFeedItems(atomXml, "https://example.com/atom.xml");
		expect(posts[0].link).toBe("https://example.com/atom-link");
	});
});
