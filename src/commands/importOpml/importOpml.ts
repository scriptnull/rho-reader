import { Notice, TFile } from "obsidian";
import type RhoReader from "../../main";
import { parseOpml, updateFeedFrontmatter } from "../utils";
import {
	ImportOpmlModal,
	FeedToImport,
	ImportPreview,
} from "./ImportOpmlModal";
import { VIEW_TYPE_RHO_READER } from "../../views/RhoReaderPane";
import { openRssFeedReader } from "../openRssFeedReader/openRssFeedReader";

export function sanitizeFileName(name: string): string {
	return name.replace(/[\\/:*?"<>|#^[\]]/g, "-").trim();
}

async function ensureFolderExists(
	plugin: RhoReader,
	folderPath: string,
): Promise<void> {
	const folder = plugin.app.vault.getAbstractFileByPath(folderPath);
	if (!folder) {
		await plugin.app.vault.createFolder(folderPath);
	}
}

export function getExistingFeedUrls(plugin: RhoReader): Set<string> {
	const existingFeedUrls = new Set<string>();
	const files = plugin.app.vault.getMarkdownFiles();
	for (const f of files) {
		const cache = plugin.app.metadataCache.getFileCache(f);
		const feedUrl = cache?.frontmatter?.feed_url;
		if (feedUrl) {
			existingFeedUrls.add(feedUrl);
		}
	}
	return existingFeedUrls;
}

export function categorizeFeeds(
	feeds: FeedToImport[],
	existingUrls: Set<string>,
): ImportPreview {
	const toImport: FeedToImport[] = [];
	const alreadyExists: FeedToImport[] = [];

	for (const feed of feeds) {
		if (existingUrls.has(feed.xmlUrl)) {
			alreadyExists.push(feed);
		} else {
			toImport.push(feed);
		}
	}

	return { toImport, alreadyExists };
}

async function openReaderPane(plugin: RhoReader): Promise<void> {
	let leaf = plugin.app.workspace.getLeavesOfType(VIEW_TYPE_RHO_READER)[0];
	if (!leaf) {
		const rightLeaf = plugin.app.workspace.getRightLeaf(false);
		if (rightLeaf) {
			await rightLeaf.setViewState({ type: VIEW_TYPE_RHO_READER });
			leaf = rightLeaf;
		}
	}
	if (leaf) {
		plugin.app.workspace.revealLeaf(leaf);
	}
}

async function performImport(
	plugin: RhoReader,
	feeds: FeedToImport[],
): Promise<void> {
	await openRssFeedReader(plugin);
	await openReaderPane(plugin);
	plugin.setProcessing(true, "Importing OPML");
	try {
		const feedsFolder = `${plugin.settings.rhoFolder}/Feeds`;
		await ensureFolderExists(plugin, plugin.settings.rhoFolder);
		await ensureFolderExists(plugin, feedsFolder);

		let imported = 0;

		for (const feed of feeds) {
			const fileName = sanitizeFileName(feed.title) + ".md";
			const frontmatter = [
				"---",
				`feed_url: "${feed.xmlUrl}"`,
				`rho_unread_posts: 0`,
				`rho_all_posts: 0`,
			];
			if (feed.htmlUrl) {
				frontmatter.push(`feed_site: "${feed.htmlUrl}"`);
			}
			frontmatter.push("---");
			const fileContent = frontmatter.join("\n");

			let filePath = `${feedsFolder}/${fileName}`;
			const existingFile =
				plugin.app.vault.getAbstractFileByPath(filePath);
			if (existingFile) {
				const timestamp = Date.now();
				filePath = `${feedsFolder}/${sanitizeFileName(feed.title)}-${timestamp}.md`;
			}

			const createdFile = await plugin.app.vault.create(
				filePath,
				fileContent,
			);
			if (createdFile instanceof TFile) {
				await updateFeedFrontmatter(plugin, feed.xmlUrl, createdFile);
			}
			imported++;
		}

		new Notice(`Imported ${imported} feed${imported !== 1 ? "s" : ""}.`);
	} catch (err) {
		console.error("Failed to import OPML:", err);
		new Notice("Failed to import OPML file.");
	} finally {
		plugin.setProcessing(false);
	}
}

export async function importOpml(plugin: RhoReader): Promise<void> {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = ".opml,.xml";

	input.onchange = async () => {
		const file = input.files?.[0];
		if (!file) return;

		try {
			const content = await file.text();
			const feeds = parseOpml(content);

			if (feeds.length === 0) {
				new Notice("No feeds found in OPML file.");
				return;
			}

			const existingUrls = getExistingFeedUrls(plugin);
			const preview = categorizeFeeds(feeds, existingUrls);

			new ImportOpmlModal(plugin, preview, () => {
				performImport(plugin, preview.toImport);
			}).open();
		} catch (err) {
			console.error("Failed to parse OPML:", err);
			new Notice("Failed to parse OPML file.");
		}
	};

	input.click();
}
