import { TFile } from "obsidian";
import type RhoReader from "../main";
import { VIEW_TYPE_RHO_READER, RhoReaderPane } from "./RhoReaderPane";

// Show the given feed's posts in the reader pane, creating the pane in the
// right sidebar if it doesn't exist yet. Pass `reveal` to bring the pane to
// the foreground (e.g. when the user explicitly selects a feed).
export async function openReaderForFeedUrl(
	plugin: RhoReader,
	feedUrl: string | null,
	reveal = false
): Promise<void> {
	let leaf = plugin.app.workspace.getLeavesOfType(VIEW_TYPE_RHO_READER)[0];
	if (!leaf) {
		const rightLeaf = plugin.app.workspace.getRightLeaf(false);
		if (!rightLeaf) return;
		await rightLeaf.setViewState({ type: VIEW_TYPE_RHO_READER });
		leaf = rightLeaf;
	}
	const view = leaf.view as RhoReaderPane;
	view.setFeedUrl(feedUrl);
	if (reveal) {
		await plugin.app.workspace.revealLeaf(leaf);
	}
}

export async function openReaderForFile(
	plugin: RhoReader,
	file: TFile | null
): Promise<void> {
	let feedUrl: string | null = null;
	if (file) {
		const fileCache = plugin.app.metadataCache.getFileCache(file);
		if (fileCache?.frontmatter?.rho_feed_url) {
			// Post file opened (e.g. via "Take notes") — keep current feed displayed
			return;
		}
		feedUrl = fileCache?.frontmatter?.feed_url || null;
	}
	await openReaderForFeedUrl(plugin, feedUrl);
}
