import type RhoReader from "../../main";
import { updateFeedFrontmatter, setFeedSyncStatus } from "../utils";
import { Notice, TFile } from "obsidian";

async function syncFeed(
	plugin: RhoReader,
	file: TFile,
	feedUrl: string
): Promise<boolean> {
	await setFeedSyncStatus(plugin, file, "syncing");
	try {
		await updateFeedFrontmatter(plugin, feedUrl, file);
		await setFeedSyncStatus(plugin, file, "synced");
		return true;
	} catch (err) {
		console.error(`Failed to sync feed ${feedUrl}:`, err);
		await setFeedSyncStatus(plugin, file, "error");
		return false;
	}
}

export async function syncAllRssFeeds(plugin: RhoReader): Promise<void> {
	plugin.statusBar.setProcessing(true, "Syncing feeds");
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
		const failures: string[] = [];
		let index = 0;

		async function worker(): Promise<void> {
			while (index < feedFiles.length) {
				const i = index++;
				const { file, feedUrl } = feedFiles[i];
				const ok = await syncFeed(plugin, file, feedUrl);
				if (!ok) {
					failures.push(file.basename);
				}
			}
		}

		const workers = Array.from(
			{ length: Math.min(concurrency, feedFiles.length) },
			() => worker()
		);
		await Promise.all(workers);

		if (feedFiles.length === 0) return;
		if (failures.length === 0) {
			new Notice(
				`Synced ${feedFiles.length} feed${feedFiles.length === 1 ? "" : "s"}.`
			);
		} else {
			const synced = feedFiles.length - failures.length;
			const preview = failures.slice(0, 3).join(", ");
			const overflow =
				failures.length > 3 ? ` and ${failures.length - 3} more` : "";
			new Notice(
				`Synced ${synced} feed${synced === 1 ? "" : "s"}, ${failures.length} failed: ${preview}${overflow}.`
			);
		}
	} finally {
		plugin.statusBar.setProcessing(false);
	}
}
