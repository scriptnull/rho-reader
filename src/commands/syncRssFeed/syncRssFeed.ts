import type RhoReader from "../../main";
import { updateFeedFrontmatter } from "../utils";

export async function syncRssFeed(plugin: RhoReader): Promise<void> {
	const file =
		plugin.app.workspace.getActiveFile?.() ||
		plugin.app.workspace.getActiveFile?.call(plugin.app.workspace);
	if (!file) {
		console.log("No active file.");
		return;
	}
	const fileCache = plugin.app.metadataCache.getFileCache(file);
	const feedUrl = fileCache?.frontmatter?.feed_url;
	if (!feedUrl) {
		console.log("No feed_url property found in frontmatter.");
		return;
	}

	await updateFeedFrontmatter(plugin, feedUrl, file);
}
