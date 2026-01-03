import type RhoReader from "../main";
import { syncAllRssFeeds } from "./syncAllRssFeeds";
import { openRssFeedReader } from "./openRssFeedReader";
import { importOpml } from "./importOpml";

export function registerCommands(plugin: RhoReader): void {
	plugin.addCommand({
		id: "sync-rss-feeds",
		name: "Sync RSS feeds",
		callback: () => syncAllRssFeeds(plugin),
	});

	plugin.addCommand({
		id: "open-rss-feed-reader",
		name: "Open RSS Feed Reader",
		callback: () => openRssFeedReader(plugin),
	});

	plugin.addCommand({
		id: "import-opml",
		name: "Import OPML",
		callback: () => importOpml(plugin),
	});
}
