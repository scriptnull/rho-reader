import { describe, it, expect, vi } from "vitest";
import { openRssFeedReader } from "./openRssFeedReader";
import type RhoReader from "../../main";

function createMockPlugin(rssFeedBaseFile: string): RhoReader {
	return {
		settings: {
			rssFeedBaseFile,
		},
		app: {
			workspace: {
				openLinkText: vi.fn(),
			},
		},
	} as unknown as RhoReader;
}

describe("openRssFeedReader", () => {
	it("should open the RSS feed base file from settings", () => {
		const baseFilePath = "Feeds.base.md";
		const plugin = createMockPlugin(baseFilePath);

		openRssFeedReader(plugin);

		expect(plugin.app.workspace.openLinkText).toHaveBeenCalledWith(
			baseFilePath,
			"",
			false
		);
	});

	it("should handle empty base file path", () => {
		const plugin = createMockPlugin("");

		openRssFeedReader(plugin);

		expect(plugin.app.workspace.openLinkText).toHaveBeenCalledWith(
			"",
			"",
			false
		);
	});
});
