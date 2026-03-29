import type RhoReader from "../../main";
import { updateFeedFrontmatter, setFeedSyncStatus } from "../utils";
import { TFile } from "obsidian";

export async function syncAllRssFeeds(plugin: RhoReader): Promise<void> {
	plugin.setProcessing(true, "Syncing feeds");
	try {
		const files = plugin.app.vault.getMarkdownFiles();
		const feedFiles: { file: TFile; feedUrl: string }[] = [];
		for (const file of files) {
			const cache = plugin.app.metadataCache.getFileCache(file);
			const feedUrl = cache?.frontmatter?.feed_url;
			if (feedUrl) {
				feedFiles.push({ file, feedUrl });
			}
		}

		// Mark all feeds as queued
		for (const { file } of feedFiles) {
			await setFeedSyncStatus(plugin, file, "queued");
		}

		// Sync each feed sequentially
		for (const { file, feedUrl } of feedFiles) {
			await setFeedSyncStatus(plugin, file, "syncing");
			try {
				await updateFeedFrontmatter(plugin, feedUrl, file);
				await setFeedSyncStatus(plugin, file, "synced");
			} catch (err) {
				console.error(`Failed to sync feed ${feedUrl}:`, err);
				await setFeedSyncStatus(plugin, file, "error");
			}
		}
	} finally {
		plugin.setProcessing(false);
	}
}
