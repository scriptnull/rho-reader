import type RhoReader from "../../main";
import { updateFeedFrontmatter, setFeedSyncStatus } from "../utils";

export async function syncRssFeed(plugin: RhoReader): Promise<void> {
	const file =
		plugin.app.workspace.getActiveFile?.() ||
		plugin.app.workspace.getActiveFile?.call(plugin.app.workspace);
	if (!file) {
		console.error("[Rho Reader] No active file.");
		return;
	}
	const fileCache = plugin.app.metadataCache.getFileCache(file);
	const feedUrl = fileCache?.frontmatter?.feed_url;
	if (!feedUrl) {
		console.error("[Rho Reader] No feed_url property found in frontmatter.");
		return;
	}

	await setFeedSyncStatus(plugin, file, "syncing");
	try {
		await updateFeedFrontmatter(plugin, feedUrl, file);
		await setFeedSyncStatus(plugin, file, "synced");
	} catch (err) {
		console.error(`Failed to sync feed ${feedUrl}:`, err);
		await setFeedSyncStatus(plugin, file, "error");
	}
}
