import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	findExistingPostFile,
	getPostsForFeed,
	countPostsForFeed,
	getPostKey,
	createPostFile,
	setPostReadState,
	updateFeedCountsFromFiles,
} from "./postFiles";
import type RhoReader from "../../main";
import type { TFile } from "obsidian";
import type { FeedPost } from "../../types";

function createMockPlugin(options: {
	files?: Array<{
		path: string;
		frontmatter?: Record<string, unknown>;
	}>;
	settings?: Partial<RhoReader["settings"]>;
}): RhoReader {
	const files = (options.files ?? []).map((f) => ({
		path: f.path,
		basename: f.path.split("/").pop()?.replace(/\.md$/, "") ?? "",
	})) as TFile[];

	return {
		settings: {
			rhoFolder: "Rho",
			postsFolder: "Posts",
			rssFeedBaseFile: "Reader.base",
			readStateMigrated: false,
			readState: {},
			...(options.settings ?? {}),
		},
		app: {
			vault: {
				getMarkdownFiles: vi.fn(() => files),
				getAbstractFileByPath: vi.fn(() => null),
				createFolder: vi.fn().mockResolvedValue(undefined),
				create: vi.fn().mockResolvedValue(files[0] ?? null),
				read: vi.fn().mockResolvedValue(
					"---\nread: false\nread_at: 0\n---\nbody"
				),
				modify: vi.fn().mockResolvedValue(undefined),
			},
			metadataCache: {
				getFileCache: vi.fn((file: TFile) => {
					const match = options.files?.find(
						(f) => f.path === file.path
					);
					return match?.frontmatter
						? { frontmatter: match.frontmatter }
						: null;
				}),
			},
		},
	} as unknown as RhoReader;
}

describe("getPostKey", () => {
	it("should prefer guid", () => {
		const post: FeedPost = {
			title: "T",
			link: "https://example.com",
			pubDate: "2025-01-01",
			guid: "my-guid",
		};
		expect(getPostKey(post)).toBe("my-guid");
	});

	it("should fall back to link when no guid", () => {
		const post: FeedPost = {
			title: "T",
			link: "https://example.com/post",
			pubDate: "2025-01-01",
			guid: "",
		};
		expect(getPostKey(post)).toBe("https://example.com/post");
	});

	it("should fall back to title::pubDate when no guid or link", () => {
		const post: FeedPost = {
			title: "My Title",
			link: "",
			pubDate: "2025-01-01",
			guid: "",
		};
		expect(getPostKey(post)).toBe("My Title::2025-01-01");
	});
});

describe("findExistingPostFile", () => {
	it("should return matching file when found", () => {
		const plugin = createMockPlugin({
			files: [
				{
					path: "Rho/Posts/Blog/Post 1.md",
					frontmatter: {
						rho_feed_url: "https://blog.com/feed.xml",
						rho_post_key: "https://blog.com/post-1",
					},
				},
			],
		});

		const result = findExistingPostFile(
			plugin,
			"https://blog.com/feed.xml",
			"https://blog.com/post-1"
		);
		expect(result).not.toBeNull();
		expect(result?.path).toBe("Rho/Posts/Blog/Post 1.md");
	});

	it("should return null when not found", () => {
		const plugin = createMockPlugin({
			files: [
				{
					path: "Rho/Feeds/Blog.md",
					frontmatter: { feed_url: "https://blog.com/feed.xml" },
				},
			],
		});

		const result = findExistingPostFile(
			plugin,
			"https://blog.com/feed.xml",
			"https://blog.com/non-existent"
		);
		expect(result).toBeNull();
	});

	it("should not match different feed URLs", () => {
		const plugin = createMockPlugin({
			files: [
				{
					path: "Rho/Posts/Blog/Post.md",
					frontmatter: {
						rho_feed_url: "https://other.com/feed.xml",
						rho_post_key: "https://other.com/post",
					},
				},
			],
		});

		const result = findExistingPostFile(
			plugin,
			"https://blog.com/feed.xml",
			"https://other.com/post"
		);
		expect(result).toBeNull();
	});
});

describe("getPostsForFeed", () => {
	it("should return only files matching the feed URL", () => {
		const plugin = createMockPlugin({
			files: [
				{
					path: "Rho/Posts/Blog/Post1.md",
					frontmatter: { rho_feed_url: "https://blog.com/feed.xml" },
				},
				{
					path: "Rho/Feeds/Blog.md",
					frontmatter: { feed_url: "https://blog.com/feed.xml" },
				},
				{
					path: "Rho/Posts/Other/Post.md",
					frontmatter: {
						rho_feed_url: "https://other.com/feed.xml",
					},
				},
			],
		});

		const result = getPostsForFeed(plugin, "https://blog.com/feed.xml");
		expect(result).toHaveLength(1);
		expect(result[0].path).toBe("Rho/Posts/Blog/Post1.md");
	});

	it("should return empty array when no posts found", () => {
		const plugin = createMockPlugin({ files: [] });
		const result = getPostsForFeed(plugin, "https://blog.com/feed.xml");
		expect(result).toHaveLength(0);
	});
});

describe("countPostsForFeed", () => {
	it("should count total and unread posts correctly", () => {
		const plugin = createMockPlugin({
			files: [
				{
					path: "Rho/Posts/Blog/Post1.md",
					frontmatter: {
						rho_feed_url: "https://blog.com/feed.xml",
						read: true,
					},
				},
				{
					path: "Rho/Posts/Blog/Post2.md",
					frontmatter: {
						rho_feed_url: "https://blog.com/feed.xml",
						read: false,
					},
				},
				{
					path: "Rho/Posts/Blog/Post3.md",
					frontmatter: {
						rho_feed_url: "https://blog.com/feed.xml",
						read: false,
					},
				},
			],
		});

		const { total, unread } = countPostsForFeed(
			plugin,
			"https://blog.com/feed.xml"
		);
		expect(total).toBe(3);
		expect(unread).toBe(2);
	});

	it("should return zeros when no posts exist", () => {
		const plugin = createMockPlugin({ files: [] });
		const { total, unread } = countPostsForFeed(
			plugin,
			"https://blog.com/feed.xml"
		);
		expect(total).toBe(0);
		expect(unread).toBe(0);
	});

	it("should not count posts from other feeds", () => {
		const plugin = createMockPlugin({
			files: [
				{
					path: "Rho/Posts/Other/Post.md",
					frontmatter: {
						rho_feed_url: "https://other.com/feed.xml",
						read: false,
					},
				},
			],
		});

		const { total } = countPostsForFeed(
			plugin,
			"https://blog.com/feed.xml"
		);
		expect(total).toBe(0);
	});
});

describe("setPostReadState", () => {
	it("should set read: true and update read_at", async () => {
		const mockFile = { path: "Rho/Posts/Blog/Post.md" } as TFile;
		const plugin = createMockPlugin({ files: [] });
		const readContent =
			"---\nrho_title: Test\nread: false\nread_at: 0\n---\nbody text";
		vi.mocked(plugin.app.vault.read).mockResolvedValue(readContent);

		await setPostReadState(plugin, mockFile, true);

		expect(plugin.app.vault.modify).toHaveBeenCalled();
		const modifiedContent = vi.mocked(plugin.app.vault.modify).mock
			.calls[0][1] as string;
		expect(modifiedContent).toContain("read: true");
		expect(modifiedContent).not.toContain("read_at: 0\n");
	});

	it("should set read: false and reset read_at to 0", async () => {
		const mockFile = { path: "Rho/Posts/Blog/Post.md" } as TFile;
		const plugin = createMockPlugin({ files: [] });
		const readContent =
			"---\nrho_title: Test\nread: true\nread_at: 1234567890\n---\nbody text";
		vi.mocked(plugin.app.vault.read).mockResolvedValue(readContent);

		await setPostReadState(plugin, mockFile, false);

		expect(plugin.app.vault.modify).toHaveBeenCalled();
		const modifiedContent = vi.mocked(plugin.app.vault.modify).mock
			.calls[0][1] as string;
		expect(modifiedContent).toContain("read: false");
		expect(modifiedContent).toContain("read_at: 0");
	});
});

describe("createPostFile", () => {
	it("should return existing file without creating a new one", async () => {
		const existingFile = {
			path: "Rho/Posts/Blog/Existing Post - abc12345.md",
		} as TFile;
		const plugin = createMockPlugin({
			files: [
				{
					path: existingFile.path,
					frontmatter: {
						rho_feed_url: "https://blog.com/feed.xml",
						rho_post_key: "https://blog.com/existing",
					},
				},
			],
		});

		const post: FeedPost = {
			title: "Existing Post",
			link: "https://blog.com/existing",
			pubDate: "",
			guid: "https://blog.com/existing",
		};

		const result = await createPostFile(
			plugin,
			"https://blog.com/feed.xml",
			"Blog",
			post
		);

		expect(plugin.app.vault.create).not.toHaveBeenCalled();
		expect(result?.path).toBe(existingFile.path);
	});

	it("should create a new file when no existing post matches", async () => {
		const createdFile = {
			path: "Rho/Posts/Blog/New Post - abc12345.md",
		} as TFile;
		const plugin = createMockPlugin({ files: [] });
		vi.mocked(plugin.app.vault.create).mockResolvedValue(
			createdFile as any
		);

		const post: FeedPost = {
			title: "New Post",
			link: "https://blog.com/new",
			pubDate: "2025-01-01",
			guid: "https://blog.com/new",
		};

		const result = await createPostFile(
			plugin,
			"https://blog.com/feed.xml",
			"Blog",
			post
		);

		expect(plugin.app.vault.create).toHaveBeenCalled();
		const createCall = vi.mocked(plugin.app.vault.create).mock.calls[0];
		const content = createCall[1] as string;
		expect(content).toContain("rho_feed_url:");
		expect(content).toContain("rho_post_key:");
		expect(content).toContain("read: false");
		expect(content).toContain("read_at: 0");
		expect(result?.path).toBe(createdFile.path);
	});
});

describe("updateFeedCountsFromFiles", () => {
	it("should read file contents instead of metadata cache for accurate counts", async () => {
		// Simulate stale cache: cache says read=false, but file says read=true
		const plugin = createMockPlugin({
			files: [
				{
					path: "Rho/Feeds/Blog.md",
					frontmatter: { feed_url: "https://blog.com/feed.xml" },
				},
				{
					path: "Rho/Posts/Blog/Post1.md",
					frontmatter: {
						rho_feed_url: "https://blog.com/feed.xml",
						read: false, // stale cache says unread
					},
				},
			],
		});

		const feedContent =
			"---\nfeed_url: 'https://blog.com/feed.xml'\nrho_all_posts: 1\nrho_unread_posts: 1\n---\n";
		const post1Content =
			"---\nrho_feed_url: 'https://blog.com/feed.xml'\nread: true\n---\n"; // actual file says read
		vi.mocked(plugin.app.vault.read).mockImplementation(async (file: TFile) => {
			if (file.path === "Rho/Posts/Blog/Post1.md") return post1Content;
			return feedContent;
		});

		await updateFeedCountsFromFiles(plugin, "https://blog.com/feed.xml");

		const modifiedContent = vi.mocked(plugin.app.vault.modify).mock
			.calls[0][1] as string;
		expect(modifiedContent).toContain("rho_all_posts: 1");
		expect(modifiedContent).toContain("rho_unread_posts: 0");
	});

	it("should count posts without frontmatter as unread", async () => {
		const plugin = createMockPlugin({
			files: [
				{
					path: "Rho/Feeds/Blog.md",
					frontmatter: { feed_url: "https://blog.com/feed.xml" },
				},
				{
					path: "Rho/Posts/Blog/Post1.md",
					frontmatter: {
						rho_feed_url: "https://blog.com/feed.xml",
					},
				},
			],
		});

		const feedContent =
			"---\nfeed_url: 'https://blog.com/feed.xml'\nrho_all_posts: 0\nrho_unread_posts: 0\n---\n";
		const post1Content = "Just body, no frontmatter";
		vi.mocked(plugin.app.vault.read).mockImplementation(async (file: TFile) => {
			if (file.path === "Rho/Posts/Blog/Post1.md") return post1Content;
			return feedContent;
		});

		await updateFeedCountsFromFiles(plugin, "https://blog.com/feed.xml");

		const modifiedContent = vi.mocked(plugin.app.vault.modify).mock
			.calls[0][1] as string;
		expect(modifiedContent).toContain("rho_all_posts: 1");
		expect(modifiedContent).toContain("rho_unread_posts: 1");
	});

	it("should count all posts as read when all are marked read on disk", async () => {
		const plugin = createMockPlugin({
			files: [
				{
					path: "Rho/Feeds/Blog.md",
					frontmatter: { feed_url: "https://blog.com/feed.xml" },
				},
				{
					path: "Rho/Posts/Blog/Post1.md",
					frontmatter: {
						rho_feed_url: "https://blog.com/feed.xml",
						read: true,
					},
				},
				{
					path: "Rho/Posts/Blog/Post2.md",
					frontmatter: {
						rho_feed_url: "https://blog.com/feed.xml",
						read: true,
					},
				},
			],
		});

		const feedContent =
			"---\nfeed_url: 'https://blog.com/feed.xml'\nrho_all_posts: 0\nrho_unread_posts: 2\n---\n";
		const postContent =
			"---\nrho_feed_url: 'https://blog.com/feed.xml'\nread: true\n---\n";
		vi.mocked(plugin.app.vault.read).mockImplementation(async (file: TFile) => {
			if (file.path.startsWith("Rho/Posts/")) return postContent;
			return feedContent;
		});

		await updateFeedCountsFromFiles(plugin, "https://blog.com/feed.xml");

		const modifiedContent = vi.mocked(plugin.app.vault.modify).mock
			.calls[0][1] as string;
		expect(modifiedContent).toContain("rho_all_posts: 2");
		expect(modifiedContent).toContain("rho_unread_posts: 0");
	});

	it("should not modify anything when no feed file is found", async () => {
		const plugin = createMockPlugin({
			files: [
				{
					path: "Rho/Posts/Blog/Post1.md",
					frontmatter: {
						rho_feed_url: "https://blog.com/feed.xml",
						read: false,
					},
				},
			],
		});

		await updateFeedCountsFromFiles(plugin, "https://blog.com/feed.xml");

		expect(plugin.app.vault.modify).not.toHaveBeenCalled();
	});

	it("should update feed file frontmatter with counts from post files", async () => {
		const feedFile = { path: "Rho/Feeds/Blog.md" } as TFile;
		const plugin = createMockPlugin({
			files: [
				{
					path: feedFile.path,
					frontmatter: { feed_url: "https://blog.com/feed.xml" },
				},
				{
					path: "Rho/Posts/Blog/Post1.md",
					frontmatter: {
						rho_feed_url: "https://blog.com/feed.xml",
						read: true,
					},
				},
				{
					path: "Rho/Posts/Blog/Post2.md",
					frontmatter: {
						rho_feed_url: "https://blog.com/feed.xml",
						read: false,
					},
				},
			],
		});

		const feedContent =
			"---\nfeed_url: 'https://blog.com/feed.xml'\nrho_all_posts: 0\nrho_unread_posts: 0\n---\n";
		const post1Content =
			"---\nrho_feed_url: 'https://blog.com/feed.xml'\nread: true\n---\n";
		const post2Content =
			"---\nrho_feed_url: 'https://blog.com/feed.xml'\nread: false\n---\n";
		vi.mocked(plugin.app.vault.read).mockImplementation(async (file: TFile) => {
			if (file.path === "Rho/Posts/Blog/Post1.md") return post1Content;
			if (file.path === "Rho/Posts/Blog/Post2.md") return post2Content;
			return feedContent;
		});

		await updateFeedCountsFromFiles(plugin, "https://blog.com/feed.xml");

		expect(plugin.app.vault.modify).toHaveBeenCalled();
		const modifiedContent = vi.mocked(plugin.app.vault.modify).mock
			.calls[0][1] as string;
		expect(modifiedContent).toContain("rho_all_posts: 2");
		expect(modifiedContent).toContain("rho_unread_posts: 1");
	});
});
