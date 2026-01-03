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
					<item><title>Post 1</title></item>
					<item><title>Post 2</title></item>
				</channel>
			</rss>`;

		const items = parseRssFeedItems(rssXml, "https://example.com/feed.xml");
		expect(items).toHaveLength(2);
		expect(items[0].querySelector("title")?.textContent).toBe("Post 1");
		expect(items[1].querySelector("title")?.textContent).toBe("Post 2");
	});

	it("should parse Atom feed entries correctly", () => {
		const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
			<feed xmlns="http://www.w3.org/2005/Atom">
				<title>Atom Feed</title>
				<entry><title>Entry 1</title></entry>
				<entry><title>Entry 2</title></entry>
				<entry><title>Entry 3</title></entry>
			</feed>`;

		const items = parseRssFeedItems(atomXml, "https://example.com/atom.xml");
		expect(items).toHaveLength(3);
		expect(items[0].querySelector("title")?.textContent).toBe("Entry 1");
	});

	it("should return empty array when no items or entries found", () => {
		const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
			<rss version="2.0">
				<channel>
					<title>Empty Feed</title>
				</channel>
			</rss>`;

		const items = parseRssFeedItems(emptyXml, "https://example.com/empty.xml");
		expect(items).toHaveLength(0);
		expect(console.warn).toHaveBeenCalled();
	});

	it("should prefer RSS items over Atom entries when both exist", () => {
		const mixedXml = `<?xml version="1.0" encoding="UTF-8"?>
			<rss version="2.0">
				<channel>
					<item><title>RSS Item</title></item>
					<entry><title>Atom Entry</title></entry>
				</channel>
			</rss>`;

		const items = parseRssFeedItems(mixedXml, "https://example.com/mixed.xml");
		expect(items).toHaveLength(1);
		expect(items[0].querySelector("title")?.textContent).toBe("RSS Item");
	});
});
