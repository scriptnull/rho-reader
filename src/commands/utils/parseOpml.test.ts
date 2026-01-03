import { describe, it, expect } from "vitest";
import { parseOpml } from "./parseOpml";

describe("parseOpml", () => {
	it("parses feeds from OPML content", () => {
		const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>My Feeds</title></head>
  <body>
    <outline text="Tech" title="Tech">
      <outline type="rss" text="Hacker News" title="Hacker News" xmlUrl="https://news.ycombinator.com/rss" htmlUrl="https://news.ycombinator.com/"/>
      <outline type="rss" text="TechCrunch" title="TechCrunch" xmlUrl="https://techcrunch.com/feed/"/>
    </outline>
    <outline type="rss" text="Daring Fireball" xmlUrl="https://daringfireball.net/feeds/main"/>
  </body>
</opml>`;

		const feeds = parseOpml(opml);

		expect(feeds).toHaveLength(3);
		expect(feeds[0]).toEqual({
			title: "Hacker News",
			xmlUrl: "https://news.ycombinator.com/rss",
			htmlUrl: "https://news.ycombinator.com/",
		});
		expect(feeds[1]).toEqual({
			title: "TechCrunch",
			xmlUrl: "https://techcrunch.com/feed/",
			htmlUrl: undefined,
		});
		expect(feeds[2]).toEqual({
			title: "Daring Fireball",
			xmlUrl: "https://daringfireball.net/feeds/main",
			htmlUrl: undefined,
		});
	});

	it("uses text attribute as title fallback", () => {
		const opml = `<?xml version="1.0"?>
<opml version="1.0">
  <body>
    <outline text="My Feed" xmlUrl="https://example.com/feed"/>
  </body>
</opml>`;

		const feeds = parseOpml(opml);

		expect(feeds).toHaveLength(1);
		expect(feeds[0].title).toBe("My Feed");
	});

	it("uses xmlUrl as title when no text or title", () => {
		const opml = `<?xml version="1.0"?>
<opml version="1.0">
  <body>
    <outline xmlUrl="https://example.com/feed"/>
  </body>
</opml>`;

		const feeds = parseOpml(opml);

		expect(feeds).toHaveLength(1);
		expect(feeds[0].title).toBe("https://example.com/feed");
	});

	it("returns empty array for OPML with no feeds", () => {
		const opml = `<?xml version="1.0"?>
<opml version="1.0">
  <body>
    <outline text="Empty folder"/>
  </body>
</opml>`;

		const feeds = parseOpml(opml);

		expect(feeds).toHaveLength(0);
	});
});
