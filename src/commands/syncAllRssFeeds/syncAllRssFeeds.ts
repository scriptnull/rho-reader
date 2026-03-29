import type RhoReader from "../../main";
import { updateFeedFrontmatter, setFeedSyncStatus } from "../utils";
import { TFile } from "obsidian";

async function syncFeed(
	plugin: RhoReader,
	file: TFile,
	feedUrl: string
): Promise<void> {
	await setFeedSyncStatus(plugin, file, "syncing");
	try {
		await updateFeedFrontmatter(plugin, feedUrl, file);
		await setFeedSyncStatus(plugin, file, "synced");
	} catch (err) {
		console.error(`Failed to sync feed ${feedUrl}:`, err);
		await setFeedSyncStatus(plugin, file, "error");
	}
}

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

		// Sync feeds with concurrency limit
		const concurrency = plugin.settings.syncConcurrency;
		let index = 0;

		async function worker(): Promise<void> {
			while (index < feedFiles.length) {
				const i = index++;
				const { file, feedUrl } = feedFiles[i];
				await syncFeed(plugin, file, feedUrl);
			}
		}

		const workers = Array.from(
			{ length: Math.min(concurrency, feedFiles.length) },
			() => worker()
		);
		await Promise.all(workers);
	} finally {
		plugin.setProcessing(false);
	}
}
