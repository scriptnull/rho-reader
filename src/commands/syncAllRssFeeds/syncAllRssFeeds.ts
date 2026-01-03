import type RhoReader from "../../main";
import { updateFeedFrontmatter } from "../utils";

export async function syncAllRssFeeds(plugin: RhoReader): Promise<void> {
	plugin.setSyncing(true);
	try {
		const files = plugin.app.vault.getMarkdownFiles();
		for (const file of files) {
			const cache = plugin.app.metadataCache.getFileCache(file);
			const feedUrl = cache?.frontmatter?.feed_url;
			if (feedUrl) {
				await updateFeedFrontmatter(plugin, feedUrl, file);
			}
		}
	} finally {
		plugin.setSyncing(false);
	}
}
