import * as yaml from "js-yaml";
import { TFile, requestUrl } from "obsidian";
import type RhoReader from "../../main";
import { parseRssFeedItems } from "./parseRssFeedItems";

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
