import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncRssFeed } from "./syncRssFeed";
import type RhoReader from "../../main";
import type { TFile } from "obsidian";

vi.mock("../utils", () => ({
	updateFeedFrontmatter: vi.fn().mockResolvedValue(undefined),
}));

import { updateFeedFrontmatter } from "../utils";

function createMockPlugin(options: {
	activeFile?: TFile | null;
	feedUrl?: string;
}): RhoReader {
	return {
		app: {
			workspace: {
				getActiveFile: vi.fn(() => options.activeFile ?? null),
			},
			metadataCache: {
				getFileCache: vi.fn(() => {
					if (options.feedUrl) {
						return { frontmatter: { feed_url: options.feedUrl } };
					}
					return { frontmatter: {} };
				}),
			},
		},
	} as unknown as RhoReader;
}

describe("syncRssFeed", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("should log and return when no active file", async () => {
		const plugin = createMockPlugin({ activeFile: null });

		await syncRssFeed(plugin);

		expect(console.log).toHaveBeenCalledWith("No active file.");
		expect(updateFeedFrontmatter).not.toHaveBeenCalled();
	});

	it("should log and return when active file has no feed_url", async () => {
		const mockFile = { path: "test.md" } as TFile;
		const plugin = createMockPlugin({ activeFile: mockFile });

		await syncRssFeed(plugin);

		expect(console.log).toHaveBeenCalledWith(
			"No feed_url property found in frontmatter."
		);
		expect(updateFeedFrontmatter).not.toHaveBeenCalled();
	});

	it("should call updateFeedFrontmatter when active file has feed_url", async () => {
		const mockFile = { path: "test.md" } as TFile;
		const feedUrl = "https://example.com/feed.xml";
		const plugin = createMockPlugin({ activeFile: mockFile, feedUrl });

		await syncRssFeed(plugin);

		expect(updateFeedFrontmatter).toHaveBeenCalledWith(
			plugin,
			feedUrl,
			mockFile
		);
	});
});
