import { Notice, TFile } from "obsidian";
import type RhoReader from "../../main";
import { serializeOpml, OpmlFeed } from "../utils/parseOpml";

export async function exportOpml(plugin: RhoReader): Promise<void> {
	plugin.setProcessing(true, "Exporting OPML");
	try {
		const feeds: OpmlFeed[] = [];
		const files = plugin.app.vault.getMarkdownFiles();

		for (const file of files) {
			const cache = plugin.app.metadataCache.getFileCache(file);
			const feedUrl = cache?.frontmatter?.feed_url;
			if (!feedUrl) continue;

			feeds.push({
				title: file.basename,
				xmlUrl: feedUrl,
				htmlUrl: cache?.frontmatter?.feed_site || undefined,
			});
		}

		if (feeds.length === 0) {
			new Notice("No feeds found to export.");
			return;
		}

		const opmlContent = serializeOpml(feeds);
		const exportPath = `${plugin.settings.rhoFolder}/feeds-export.opml`;

		const existing = plugin.app.vault.getAbstractFileByPath(exportPath);
		if (existing instanceof TFile) {
			await plugin.app.vault.modify(existing, opmlContent);
		} else {
			await plugin.app.vault.create(exportPath, opmlContent);
		}

		new Notice(
			`Exported ${feeds.length} feed${feeds.length !== 1 ? "s" : ""} to ${exportPath}.`,
		);
	} catch (err) {
		console.error("Failed to export OPML:", err);
		new Notice("Failed to export OPML file.");
	} finally {
		plugin.setProcessing(false);
	}
}
