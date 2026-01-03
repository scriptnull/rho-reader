import { TFile } from "obsidian";
import type RhoReader from "../../main";

export function findFileForFeedUrl(
	plugin: RhoReader,
	feedUrl: string
): TFile | null {
	const files = plugin.app.vault.getMarkdownFiles();
	for (const file of files) {
		const cache = plugin.app.metadataCache.getFileCache(file);
		if (cache?.frontmatter?.feed_url === feedUrl) {
			return file;
		}
	}
	return null;
}
