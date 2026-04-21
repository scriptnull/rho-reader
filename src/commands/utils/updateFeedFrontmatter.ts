import { TFile, requestUrl } from "obsidian";
import type RhoReader from "../../main";
import { parseRssFeedItems } from "./parseRssFeedItems";
import {
	createPostFilesForFeed,
	updateFeedCountsFromFiles,
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

	// Update feed file frontmatter with counts read from disk
	// (avoids stale metadata cache after creating new post files)
	await updateFeedCountsFromFiles(plugin, feedUrl);
}
