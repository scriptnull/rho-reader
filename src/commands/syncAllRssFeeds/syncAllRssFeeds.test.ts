import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncAllRssFeeds } from "./syncAllRssFeeds";
import type RhoReader from "../../main";
import type { TFile } from "obsidian";

vi.mock("../utils", () => ({
	updateFeedFrontmatter: vi.fn().mockResolvedValue(undefined),
}));

import { updateFeedFrontmatter } from "../utils";

function createMockPlugin(
	files: Array<{ path: string; feedUrl?: string }>
): RhoReader {
	const mockFiles = files.map((f) => ({
		path: f.path,
		basename: f.path.split("/").pop(),
	})) as TFile[];

	return {
		app: {
			vault: {
				getMarkdownFiles: vi.fn(() => mockFiles),
			},
			metadataCache: {
				getFileCache: vi.fn((file: TFile) => {
					const match = files.find((f) => f.path === file.path);
					if (match?.feedUrl) {
						return { frontmatter: { feed_url: match.feedUrl } };
					}
					return { frontmatter: {} };
				}),
			},
		},
		setProcessing: vi.fn(),
	} as unknown as RhoReader;
}

describe("syncAllRssFeeds", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should not call updateFeedFrontmatter when no files have feed_url", async () => {
		const plugin = createMockPlugin([
			{ path: "notes/regular.md" },
			{ path: "notes/other.md" },
		]);

		await syncAllRssFeeds(plugin);

		expect(updateFeedFrontmatter).not.toHaveBeenCalled();
	});

	it("should call updateFeedFrontmatter for each file with feed_url", async () => {
		const plugin = createMockPlugin([
			{ path: "feeds/blog1.md", feedUrl: "https://blog1.com/feed.xml" },
			{ path: "notes/regular.md" },
			{ path: "feeds/blog2.md", feedUrl: "https://blog2.com/feed.xml" },
		]);

		await syncAllRssFeeds(plugin);

		expect(updateFeedFrontmatter).toHaveBeenCalledTimes(2);
		expect(updateFeedFrontmatter).toHaveBeenNthCalledWith(
			1,
			plugin,
			"https://blog1.com/feed.xml",
			expect.objectContaining({ path: "feeds/blog1.md" })
		);
		expect(updateFeedFrontmatter).toHaveBeenNthCalledWith(
			2,
			plugin,
			"https://blog2.com/feed.xml",
			expect.objectContaining({ path: "feeds/blog2.md" })
		);
	});

	it("should handle empty vault gracefully", async () => {
		const plugin = createMockPlugin([]);

		await syncAllRssFeeds(plugin);

		expect(updateFeedFrontmatter).not.toHaveBeenCalled();
	});
});
