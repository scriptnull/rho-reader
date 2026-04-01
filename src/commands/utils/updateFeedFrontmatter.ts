import { TFile, requestUrl } from "obsidian";
import type RhoReader from "../../main";
import { parseRssFeedItems } from "./parseRssFeedItems";
import {
	createPostFilesForFeed,
	updateFeedCountsFromFiles,
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

	// Update feed file frontmatter with counts read from disk
	// (avoids stale metadata cache after creating new post files)
	await updateFeedCountsFromFiles(plugin, feedUrl);
}
