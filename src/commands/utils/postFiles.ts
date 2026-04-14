import * as yaml from "js-yaml";
import { TFile } from "obsidian";
import type RhoReader from "../../main";
import type { FeedPost } from "../../types";
import { sanitizeFileName } from "./sanitizeFileName";
import { findFileForFeedUrl } from "./findFileForFeedUrl";
import { modifyFrontmatter } from "./frontmatter";

function simpleHash(str: string): string {
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
		hash = hash >>> 0;
	}
	return hash.toString(16).padStart(8, "0").slice(0, 8);
}

export function getPostKey(post: FeedPost): string {
	return post.guid || post.link || `${post.title}::${post.pubDate}`;
}

export function getPostsFolderPath(
	plugin: RhoReader,
	feedTitle: string
): string {
	return `${plugin.settings.rhoFolder}/${plugin.settings.postsFolder}/${sanitizeFileName(feedTitle)}`;
}


export function findExistingPostFile(
	plugin: RhoReader,
	feedUrl: string,
	postKey: string
): TFile | null {
	const files = plugin.app.vault.getMarkdownFiles();
	for (const file of files) {
		const cache = plugin.app.metadataCache.getFileCache(file);
		const fm = cache?.frontmatter;
		if (fm?.rho_feed_url === feedUrl && fm?.rho_post_key === postKey) {
			return file;
		}
	}
	return null;
}

export async function createPostFile(
	plugin: RhoReader,
	feedUrl: string,
	feedTitle: string,
	post: FeedPost
): Promise<TFile | null> {
	const postKey = getPostKey(post);

	const existing = findExistingPostFile(plugin, feedUrl, postKey);
	if (existing) {
		return existing;
	}

	const folderPath = getPostsFolderPath(plugin, feedTitle);
	if (!plugin.app.vault.getAbstractFileByPath(folderPath)) {
		await plugin.app.vault.createFolder(folderPath);
	}

	const base =
		sanitizeFileName(post.title).slice(0, 100).trim() || "untitled";
	const fileName = plugin.app.vault.getAbstractFileByPath(
		`${folderPath}/${base}.md`
	)
		? `${base} - ${simpleHash(postKey)}`
		: base;
	const filePath = `${folderPath}/${fileName}.md`;

	const fm: Record<string, unknown> = {
		rho_feed_url: feedUrl,
		rho_post_key: postKey,
		rho_title: post.title,
		rho_link: post.link,
		rho_pub_date: post.pubDate,
		rho_guid: post.guid,
		rho_description: post.description ?? "",
		read: false,
		read_at: 0,
		rho_tags: post.tags ?? [],
	};

	const content = `---\n${yaml.dump(fm)}---\n`;

	try {
		return await plugin.app.vault.create(filePath, content);
	} catch (err) {
		console.error("[Rho Reader] Failed to create post file:", filePath, err);
		return null;
	}
}

export async function createPostFilesForFeed(
	plugin: RhoReader,
	feedUrl: string,
	feedTitle: string,
	posts: FeedPost[]
): Promise<number> {
	let created = 0;
	for (const post of posts) {
		const postKey = getPostKey(post);
		const existing = findExistingPostFile(plugin, feedUrl, postKey);
		if (existing) continue;

		const file = await createPostFile(plugin, feedUrl, feedTitle, post);
		if (file) created++;
	}
	return created;
}

export async function setPostReadState(
	plugin: RhoReader,
	file: TFile,
	read: boolean,
	readAt?: number
): Promise<void> {
	try {
		await modifyFrontmatter(plugin, file, (fm) => {
			fm.read = read;
			fm.read_at = read ? (readAt ?? Date.now()) : 0;
		});
	} catch (err) {
		console.error("[Rho Reader] Failed to set post read state:", err);
	}
}

export function getPostsForFeed(plugin: RhoReader, feedUrl: string): TFile[] {
	return plugin.app.vault.getMarkdownFiles().filter((file) => {
		const cache = plugin.app.metadataCache.getFileCache(file);
		return cache?.frontmatter?.rho_feed_url === feedUrl;
	});
}

export function countPostsForFeed(
	plugin: RhoReader,
	feedUrl: string
): { total: number; unread: number } {
	const files = plugin.app.vault.getMarkdownFiles();
	let total = 0;
	let unread = 0;
	for (const file of files) {
		const cache = plugin.app.metadataCache.getFileCache(file);
		const fm = cache?.frontmatter;
		if (fm?.rho_feed_url === feedUrl) {
			total++;
			if (fm.read !== true) unread++;
		}
	}
	return { total, unread };
}

export async function setPostTags(
	plugin: RhoReader,
	file: TFile,
	tags: string[]
): Promise<void> {
	try {
		await modifyFrontmatter(plugin, file, (fm) => {
			fm.rho_tags = tags;
		});
	} catch (err) {
		console.error("[Rho Reader] Failed to set post tags:", err);
	}
}

export function getAllTagsForFeed(
	plugin: RhoReader,
	feedUrl: string
): string[] {
	const tagSet = new Set<string>();
	const files = plugin.app.vault.getMarkdownFiles();
	for (const file of files) {
		const cache = plugin.app.metadataCache.getFileCache(file);
		const fm = cache?.frontmatter;
		if (fm?.rho_feed_url === feedUrl && Array.isArray(fm?.rho_tags)) {
			for (const tag of fm.rho_tags) {
				if (typeof tag === "string" && tag.length > 0) {
					tagSet.add(tag);
				}
			}
		}
	}
	return Array.from(tagSet).sort();
}

export async function updateFeedCountsFromFiles(
	plugin: RhoReader,
	feedUrl: string
): Promise<void> {
	const feedFile = findFileForFeedUrl(plugin, feedUrl);
	if (!feedFile) return;

	// Read actual file contents instead of relying on the metadata cache,
	// which may be stale immediately after creating or modifying post files.
	const allFiles = plugin.app.vault.getMarkdownFiles();
	let total = 0;
	let unread = 0;
	for (const pf of allFiles) {
		const content = await plugin.app.vault.read(pf);
		if (!content.startsWith("---")) continue;
		const endFm = content.indexOf("---", 3);
		if (endFm === -1) continue;
		const fmRaw = content.substring(3, endFm).trim();
		try {
			const fm = yaml.load(fmRaw) as Record<string, unknown>;
			if (fm?.rho_feed_url !== feedUrl) continue;
			total++;
			if (fm?.read !== true) unread++;
		} catch {
			continue;
		}
	}

	try {
		const updated = await modifyFrontmatter(plugin, feedFile, (fm) => {
			fm.rho_all_posts = total;
			fm.rho_unread_posts = unread;
		});
		if (!updated) {
			// Feed file has no frontmatter yet (or it failed to parse);
			// prepend a minimal block so the counts are recorded.
			const content = await plugin.app.vault.read(feedFile);
			if (!content.startsWith("---")) {
				await plugin.app.vault.modify(
					feedFile,
					`---\nrho_unread_posts: ${unread}\nrho_all_posts: ${total}\n---\n${content}`
				);
			}
		}
	} catch (err) {
		console.error("[Rho Reader] Failed to update feed counts:", err);
	}
}
