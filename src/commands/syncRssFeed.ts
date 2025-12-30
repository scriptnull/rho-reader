import * as yaml from "js-yaml";
import { TFile, requestUrl } from "obsidian";
import type RhoReader from "../main";

function parseRssFeedItems(text: string, feedUrl: string): Element[] {
	const parser = new DOMParser();

	let xmlDoc = parser.parseFromString(text, "application/xml");
	let parserError = xmlDoc.querySelector("parsererror");

	if (parserError) {
		console.warn(
			"[Rho Reader] XML parse failed, attempting text/html fallback:",
			feedUrl
		);
		xmlDoc = parser.parseFromString(text, "text/html");
		parserError = xmlDoc.querySelector("parsererror");
		if (parserError) {
			console.error(
				"[Rho Reader] RSS XML parse error:",
				feedUrl,
				parserError.textContent
			);
			console.debug("[Rho Reader] Response snippet:", text.slice(0, 500));
			return [];
		}
	}

	const items = xmlDoc.querySelectorAll("item");
	const entries = xmlDoc.querySelectorAll("entry");

	if (items.length === 0 && entries.length === 0) {
		console.warn(
			"[Rho Reader] No <item> or <entry> elements found in feed:",
			feedUrl
		);
		console.debug("[Rho Reader] Response snippet:", text.slice(0, 500));
		return [];
	}

	return items.length > 0 ? Array.from(items) : Array.from(entries);
}

export async function updateFeedFrontmatter(
	plugin: RhoReader,
	feedUrl: string,
	file: TFile
): Promise<void> {
	try {
		const response = await requestUrl({ url: feedUrl });
		const text = response.text;
		const posts = parseRssFeedItems(text, feedUrl);
		const allPosts = posts.length;

		const readStateForFeed = plugin.settings.readState[feedUrl] || {};
		const readPosts = Object.values(readStateForFeed).filter(
			(s) => s.read
		).length;
		const unreadPosts = allPosts - readPosts;

		const fileContent = await plugin.app.vault.read(file);
		let newContent = fileContent;
		if (fileContent.startsWith("---")) {
			const endFrontmatter = fileContent.indexOf("---", 3);
			if (endFrontmatter !== -1) {
				const frontmatterRaw = fileContent
					.substring(3, endFrontmatter)
					.trim();
				const body = fileContent.substring(endFrontmatter + 3);
				let frontmatterObj: Record<string, unknown> = {};
				try {
					frontmatterObj =
						(yaml.load(frontmatterRaw) as Record<
							string,
							unknown
						>) || {};
				} catch (e) {
					console.error("Failed to parse frontmatter YAML:", e);
				}
				frontmatterObj.rho_unread_posts = unreadPosts;
				frontmatterObj.rho_all_posts = allPosts;
				const updatedFrontmatter = `---\n${yaml.dump(
					frontmatterObj
				)}---\n`;
				newContent = updatedFrontmatter + body;
			}
		} else {
			newContent =
				`---\nrho_unread_posts: ${unreadPosts}\nrho_all_posts: ${allPosts}\n---\n` +
				fileContent;
		}
		await plugin.app.vault.modify(file, newContent);
	} catch (err) {
		console.error("Failed to update feed frontmatter:", err);
	}
}

export function findFileForFeedUrl(
	plugin: RhoReader,
	feedUrl: string
): TFile | null {
	const files = plugin.app.vault.getMarkdownFiles();
	for (const file of files) {
		const cache = plugin.app.metadataCache.getFileCache(file);
		if (cache?.frontmatter?.feed_url === feedUrl) {
			return file;
		}
	}
	return null;
}

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
