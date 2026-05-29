import type RhoReader from "../../main";
import { updateFeedFrontmatter, setFeedSyncStatus } from "../utils";
import { logError } from "../../log";

export async function syncRssFeed(plugin: RhoReader): Promise<void> {
	const file =
		plugin.app.workspace.getActiveFile?.() ||
		plugin.app.workspace.getActiveFile?.call(plugin.app.workspace);
	if (!file) {
		return;
	}
	const fileCache = plugin.app.metadataCache.getFileCache(file);
	const feedUrl = fileCache?.frontmatter?.feed_url;
	if (!feedUrl) {
		return;
	}

	await setFeedSyncStatus(plugin, file, "syncing");
	try {
		await updateFeedFrontmatter(plugin, feedUrl, file);
		await setFeedSyncStatus(plugin, file, "synced");
	} catch (err) {
		logError(`Failed to sync feed ${feedUrl}:`, err);
		await setFeedSyncStatus(plugin, file, "error");
	}
}
