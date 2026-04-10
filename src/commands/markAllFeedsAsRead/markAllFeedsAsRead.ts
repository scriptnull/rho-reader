import type RhoReader from "../../main";
import {
	setPostReadState,
	updateFeedCountsFromFiles,
} from "../utils";
import { Notice } from "obsidian";

export async function markAllFeedsAsRead(plugin: RhoReader): Promise<void> {
	plugin.setProcessing(true, "Marking all as read");
	try {
		const files = plugin.app.vault.getMarkdownFiles();

		// Collect all feed URLs and their post files
		const feedUrls = new Set<string>();
		const postFiles = [];
		for (const file of files) {
			const cache = plugin.app.metadataCache.getFileCache(file);
			const fm = cache?.frontmatter;
			if (fm?.rho_feed_url && fm?.read !== true) {
				feedUrls.add(fm.rho_feed_url);
				postFiles.push(file);
			}
		}

		// Mark all unread posts as read
		for (const file of postFiles) {
			await setPostReadState(plugin, file, true);
		}

		// Update counts for all affected feeds
		for (const feedUrl of feedUrls) {
			await updateFeedCountsFromFiles(plugin, feedUrl);
		}

		new Notice(`Marked ${postFiles.length} post(s) as read across ${feedUrls.size} feed(s)`);
	} finally {
		plugin.setProcessing(false);
	}
}
