import type RhoReader from "../main";
import { syncRssFeed } from "./syncRssFeed";

export function registerCommands(plugin: RhoReader): void {
	plugin.addCommand({
		id: "sync-rss-feed",
		name: "Sync RSS feed",
		callback: () => syncRssFeed(plugin),
	});
}
