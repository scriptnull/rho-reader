import type { FeedPost } from "../../types";
import { parseJsonFeedItems } from "./parseJsonFeedItems";
import { resolveUrl } from "./resolveUrl";

export function parseRssFeedItems(text: string, feedUrl: string): FeedPost[] {
	// Detect JSON Feed format before attempting XML parsing
	try {
		const json = JSON.parse(text);
		if (
			json &&
			typeof json.version === "string" &&
			json.version.startsWith("https://jsonfeed.org/")
		) {
			return parseJsonFeedItems(json, feedUrl);
		}
	} catch {
		// Not JSON, fall through to XML parsing
	}

	const parser = new DOMParser();

	let xmlDoc = parser.parseFromString(text, "application/xml");
	let parserError = xmlDoc.querySelector("parsererror");

	if (parserError) {
		xmlDoc = parser.parseFromString(text, "text/html");
		parserError = xmlDoc.querySelector("parsererror");
		if (parserError) {
			console.error(
				"[Rho Reader] RSS XML parse error:",
				feedUrl,
				parserError.textContent
			);
			return [];
		}
	}

	const items = xmlDoc.querySelectorAll("item");
	const entries = xmlDoc.querySelectorAll("entry");

	if (items.length === 0 && entries.length === 0) {
		console.error(
			"[Rho Reader] No <item> or <entry> elements found in feed:",
			feedUrl
		);
		return [];
	}

	const rawPosts: Element[] =
		items.length > 0 ? Array.from(items) : Array.from(entries);

	return rawPosts.map((post) => {
		const title =
			post.querySelector("title")?.textContent?.trim() || "Untitled";

		let link = "";
		const linkEl = post.querySelector("link");
		if (linkEl) {
			link =
				linkEl.textContent?.trim() ||
				linkEl.getAttribute("href") ||
				"";
		}
		link = resolveUrl(link, feedUrl);

		const pubDate =
			post.querySelector("pubDate")?.textContent?.trim() ||
			post.querySelector("published")?.textContent?.trim() ||
			"";

		const guid =
			post.querySelector("guid")?.textContent?.trim() ||
			post.querySelector("id")?.textContent?.trim() ||
			"";

		const description =
			post.querySelector("description")?.textContent?.trim() ||
			post.querySelector("summary")?.textContent?.trim() ||
			post.querySelector("content")?.textContent?.trim() ||
			"";

		const categoryEls = post.querySelectorAll("category");
		const tags: string[] = [];
		for (const el of Array.from(categoryEls)) {
			const val =
				el.textContent?.trim() || el.getAttribute("term")?.trim() || "";
			if (val) tags.push(val);
		}

		return { title, link, pubDate, guid, description, ...(tags.length > 0 ? { tags } : {}) };
	});
}
