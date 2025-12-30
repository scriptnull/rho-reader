import * as yaml from "js-yaml";
import type RhoReader from "../main";

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
	try {
		const response = await fetch(feedUrl);
		const text = await response.text();
		console.log("RSS feed response:", text);

		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(text, "application/xml");
		let count = 0;
		const items = xmlDoc.querySelectorAll("item");
		const entries = xmlDoc.querySelectorAll("entry");
		const posts: Element[] =
			items.length > 0 ? Array.from(items) : Array.from(entries);
		count = posts.length;
		console.log("Unread posts count:", count);

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
				frontmatterObj.rho_unread_posts_count = count;
				const updatedFrontmatter = `---\n${yaml.dump(
					frontmatterObj
				)}---\n`;
				newContent = updatedFrontmatter + body;
			}
		} else {
			newContent =
				`---\nrho_unread_posts_count: ${count}\n---\n` + fileContent;
		}
		await plugin.app.vault.modify(file, newContent);
	} catch (err) {
		console.error("Failed to fetch or update RSS feed:", err);
	}
}
