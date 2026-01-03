import { describe, it, expect, vi } from "vitest";
import { openRssFeedReader } from "./openRssFeedReader";
import type RhoReader from "../../main";

function createMockPlugin(
	rssFeedBaseFile: string,
	rhoFolder: string,
	baseFileExists: boolean
): RhoReader {
	return {
		settings: {
			rssFeedBaseFile,
			rhoFolder,
		},
		app: {
			workspace: {
				openLinkText: vi.fn(),
			},
			vault: {
				getAbstractFileByPath: vi.fn((path: string) => {
					if (path === rhoFolder) return null;
					if (path === `${rhoFolder}/${rssFeedBaseFile}`)
						return baseFileExists ? {} : null;
					return null;
				}),
				createFolder: vi.fn().mockResolvedValue(undefined),
				create: vi.fn().mockResolvedValue(undefined),
			},
		},
	} as unknown as RhoReader;
}

describe("openRssFeedReader", () => {
	it("should open the RSS feed base file from settings", async () => {
		const plugin = createMockPlugin("Reader.base", "Rho", true);

		await openRssFeedReader(plugin);

		expect(plugin.app.vault.createFolder).toHaveBeenCalledWith("Rho");
		expect(plugin.app.workspace.openLinkText).toHaveBeenCalledWith(
			"Rho/Reader.base",
			"",
			false
		);
	});

	it("should create folder and base file if they don't exist", async () => {
		const plugin = createMockPlugin("Reader.base", "Rho", false);

		await openRssFeedReader(plugin);

		expect(plugin.app.vault.createFolder).toHaveBeenCalledWith("Rho");
		expect(plugin.app.vault.create).toHaveBeenCalled();
		expect(plugin.app.workspace.openLinkText).toHaveBeenCalledWith(
			"Rho/Reader.base",
			"",
			false
		);
	});
});
