import * as yaml from "js-yaml";
import { TFile, requestUrl } from "obsidian";
import type RhoReader from "../../main";
import { parseRssFeedItems } from "./parseRssFeedItems";
import {
	createPostFilesForFeed,
	countPostsForFeed,
	findExistingPostFile,
	setPostReadState,
} from "./postFiles";

export async function updateFeedFrontmatter(
	plugin: RhoReader,
	feedUrl: string,
	file: TFile
): Promise<void> {
	const response = await requestUrl({ url: feedUrl });
	const text = response.text;
	const posts = parseRssFeedItems(text, feedUrl);

	if (posts.length === 0) {
		return;
	}

	// Create post files for new posts
	const feedTitle = file.basename;
	await createPostFilesForFeed(plugin, feedUrl, feedTitle, posts);

	// Migrate existing readState entries for this feed
	if (
		!plugin.settings.readStateMigrated &&
		plugin.settings.readState?.[feedUrl]
	) {
		const readStateForFeed = plugin.settings.readState[feedUrl];
		for (const [postKey, state] of Object.entries(readStateForFeed)) {
			if (!state.read) continue;
			const postFile = findExistingPostFile(plugin, feedUrl, postKey);
			if (postFile) {
				await setPostReadState(
					plugin,
					postFile,
					true,
					state.readAt
				);
			}
		}
		delete plugin.settings.readState[feedUrl];
		if (Object.keys(plugin.settings.readState).length === 0) {
			plugin.settings.readStateMigrated = true;
		}
		await plugin.saveSettings();
	}

	// Count from post files
	const { total, unread } = countPostsForFeed(plugin, feedUrl);

	// Update feed file frontmatter with new counts
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
			frontmatterObj.rho_unread_posts = unread;
			frontmatterObj.rho_all_posts = total;
			const updatedFrontmatter = `---\n${yaml.dump(
				frontmatterObj
			)}---\n`;
			newContent = updatedFrontmatter + body;
		}
	} else {
		newContent =
			`---\nrho_unread_posts: ${unread}\nrho_all_posts: ${total}\n---\n` +
			fileContent;
	}
	await plugin.app.vault.modify(file, newContent);
}
