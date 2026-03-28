import type { FeedPost } from "../../types";

interface JsonFeedItem {
	id?: string;
	url?: string;
	title?: string;
	content_html?: string;
	content_text?: string;
	summary?: string;
	date_published?: string;
	date_modified?: string;
	tags?: string[];
}

export interface JsonFeed {
	version: string;
	title?: string;
	items?: JsonFeedItem[];
}

export function parseJsonFeedItems(feed: JsonFeed): FeedPost[] {
	if (!feed.items || !Array.isArray(feed.items)) {
		return [];
	}

	return feed.items.map((item) => {
		const title = item.title?.trim() || "Untitled";
		const link = item.url?.trim() || "";
		const pubDate = item.date_published?.trim() || "";
		const guid = item.id?.trim() || "";
		const description =
			item.content_text?.trim() ||
			item.content_html?.trim() ||
			item.summary?.trim() ||
			"";
		const tags = item.tags;

		return { title, link, pubDate, guid, description, ...(tags ? { tags } : {}) };
	});
}
