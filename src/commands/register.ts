import type RhoReader from "../main";
import { syncAllRssFeeds, syncRssFeed } from "./syncRssFeed";

export function registerCommands(plugin: RhoReader): void {
	plugin.addCommand({
		id: "sync-rss-feed",
		name: "Sync RSS feed",
		callback: () => syncRssFeed(plugin),
	});

	plugin.addCommand({
		id: "sync-all-rss-feeds",
		name: "Sync all RSS feeds",
		callback: () => syncAllRssFeeds(plugin),
	});
}
