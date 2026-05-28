import type RhoReader from "../../main";
import type { FeedPost } from "../../types";
import {
	findExistingPostFile,
	createPostFile,
	setPostReadState,
	updateFeedCountsFromFiles,
	getFeedCounts,
	setFeedCounts,
	getPostKey,
} from "./postFiles";
import { findFileForFeedUrl } from "./findFileForFeedUrl";

async function ensurePostFile(
	plugin: RhoReader,
	feedUrl: string,
	post: FeedPost
) {
	const postKey = getPostKey(post);
	const existing = findExistingPostFile(plugin, feedUrl, postKey);
	if (existing) return existing;
	const feedFile = findFileForFeedUrl(plugin, feedUrl);
	if (!feedFile) return null;
	return createPostFile(plugin, feedUrl, feedFile.basename, post);
}

export async function markPostRead(
	plugin: RhoReader,
	feedUrl: string,
	post: FeedPost
): Promise<void> {
	post.read = true;
	const counts = getFeedCounts(plugin, feedUrl);
	if (counts) {
		const hasFile = !!findExistingPostFile(
			plugin,
			feedUrl,
			getPostKey(post)
		);
		const total = hasFile ? counts.total : counts.total + 1;
		const unread = Math.max(0, counts.unread - 1);
		await setFeedCounts(plugin, feedUrl, total, unread);
	}
	const file = await ensurePostFile(plugin, feedUrl, post);
	if (file) await setPostReadState(plugin, file, true);
	await updateFeedCountsFromFiles(plugin, feedUrl);
}

export async function markPostUnread(
	plugin: RhoReader,
	feedUrl: string,
	post: FeedPost
): Promise<void> {
	post.read = false;
	const counts = getFeedCounts(plugin, feedUrl);
	if (counts) {
		await setFeedCounts(plugin, feedUrl, counts.total, counts.unread + 1);
	}
	const file = findExistingPostFile(plugin, feedUrl, getPostKey(post));
	if (file) await setPostReadState(plugin, file, false);
	await updateFeedCountsFromFiles(plugin, feedUrl);
}

export async function markAllPostsRead(
	plugin: RhoReader,
	feedUrl: string,
	posts: FeedPost[]
): Promise<void> {
	await Promise.all(
		posts.map(async (post) => {
			const file = await ensurePostFile(plugin, feedUrl, post);
			if (file) await setPostReadState(plugin, file, true);
		})
	);
	await updateFeedCountsFromFiles(plugin, feedUrl);
}
