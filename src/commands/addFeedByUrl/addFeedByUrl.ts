import { Notice, TFile } from "obsidian";
import type RhoReader from "../../main";
import {
	updateFeedFrontmatter,
	setFeedSyncStatus,
	sanitizeFileName,
} from "../utils";
import { getPostsFolderPath } from "../utils/postFiles";
import { openRssFeedReader } from "../openRssFeedReader/openRssFeedReader";
import { getExistingFeedUrls } from "../importOpml/importOpml";

async function ensureFolderExists(
	plugin: RhoReader,
	folderPath: string
): Promise<void> {
	const folder = plugin.app.vault.getAbstractFileByPath(folderPath);
	if (!folder) {
		await plugin.app.vault.createFolder(folderPath);
	}
}

export async function addFeedByUrl(
	plugin: RhoReader,
	feedUrl: string
): Promise<void> {
	const url = feedUrl.trim();
	if (!url) {
		new Notice("Please enter a feed URL.");
		return;
	}

	const existingUrls = getExistingFeedUrls(plugin);
	if (existingUrls.has(url)) {
		new Notice("This feed has already been added.");
		return;
	}

	await openRssFeedReader(plugin);
	plugin.setProcessing(true, "Adding feed");

	try {
		const feedsFolder = `${plugin.settings.rhoFolder}/Feeds`;
		const postsFolder = `${plugin.settings.rhoFolder}/${plugin.settings.postsFolder}`;
		await ensureFolderExists(plugin, plugin.settings.rhoFolder);
		await ensureFolderExists(plugin, feedsFolder);
		await ensureFolderExists(plugin, postsFolder);

		// Derive a title from the URL hostname
		let title: string;
		try {
			title = new URL(url).hostname.replace(/^www\./, "");
		} catch {
			title = sanitizeFileName(url).slice(0, 50);
		}

		const fileName = sanitizeFileName(title) + ".md";
		const frontmatter = [
			"---",
			`feed_url: "${url}"`,
			`rho_unread_posts: 0`,
			`rho_all_posts: 0`,
			"---",
		].join("\n");

		let filePath = `${feedsFolder}/${fileName}`;
		const existingFile = plugin.app.vault.getAbstractFileByPath(filePath);
		if (existingFile) {
			const timestamp = Date.now();
			filePath = `${feedsFolder}/${sanitizeFileName(title)}-${timestamp}.md`;
		}

		const createdFile = await plugin.app.vault.create(filePath, frontmatter);
		if (createdFile instanceof TFile) {
			await setFeedSyncStatus(plugin, createdFile, "syncing");
			try {
				await updateFeedFrontmatter(plugin, url, createdFile);
				await setFeedSyncStatus(plugin, createdFile, "synced");
			} catch (err) {
				console.error(`Failed to sync feed ${url}:`, err);
				await setFeedSyncStatus(plugin, createdFile, "error");
			}

			const feedPostsFolder = getPostsFolderPath(plugin, title);
			if (!plugin.app.vault.getAbstractFileByPath(feedPostsFolder)) {
				await plugin.app.vault.createFolder(feedPostsFolder);
			}
		}

		new Notice(`Added feed: ${title}`);
	} catch (err) {
		console.error("Failed to add feed:", err);
		new Notice("Failed to add feed. Check the URL and try again.");
	} finally {
		plugin.setProcessing(false);
	}
}
