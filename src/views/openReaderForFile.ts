import { TFile } from "obsidian";
import type RhoReader from "../main";
import { VIEW_TYPE_RHO_READER, RhoReaderPane } from "./RhoReaderPane";

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
	let leaf = plugin.app.workspace.getLeavesOfType(VIEW_TYPE_RHO_READER)[0];
	if (!leaf) {
		const rightLeaf = plugin.app.workspace.getRightLeaf(false);
		if (!rightLeaf) return;
		await rightLeaf.setViewState({ type: VIEW_TYPE_RHO_READER });
		leaf = rightLeaf;
	}
	const view = leaf.view as RhoReaderPane;
	view.setFeedUrl(feedUrl);
}
