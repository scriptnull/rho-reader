import { Notice, TFile } from "obsidian";
import type RhoReader from "../../main";
import { parseOpml, updateFeedFrontmatter } from "../utils";

function sanitizeFileName(name: string): string {
	return name.replace(/[\\/:*?"<>|#^[\]]/g, "-").trim();
}

async function ensureFolderExists(
	plugin: RhoReader,
	folderPath: string
): Promise<void> {
	const folder = plugin.app.vault.getAbstractFileByPath(folderPath);
	if (!folder) {
		await plugin.app.vault.createFolder(folderPath);
	}
}

export async function importOpml(plugin: RhoReader): Promise<void> {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = ".opml,.xml";

	input.onchange = async () => {
		const file = input.files?.[0];
		if (!file) return;

		plugin.setProcessing(true);
		try {
			const content = await file.text();
			const feeds = parseOpml(content);

			if (feeds.length === 0) {
				new Notice("No feeds found in OPML file.");
				return;
			}

			const feedsFolder = `${plugin.settings.rhoFolder}/Feeds`;
			await ensureFolderExists(plugin, plugin.settings.rhoFolder);
			await ensureFolderExists(plugin, feedsFolder);

			const existingFeedUrls = new Set<string>();
			const files = plugin.app.vault.getMarkdownFiles();
			for (const f of files) {
				const cache = plugin.app.metadataCache.getFileCache(f);
				const feedUrl = cache?.frontmatter?.feed_url;
				if (feedUrl) {
					existingFeedUrls.add(feedUrl);
				}
			}

			let imported = 0;
			let skipped = 0;

			for (const feed of feeds) {
				if (existingFeedUrls.has(feed.xmlUrl)) {
					skipped++;
					continue;
				}

				const fileName = sanitizeFileName(feed.title) + ".md";
				const frontmatter = [
					"---",
					`feed_url: "${feed.xmlUrl}"`,
					`rho_unread_posts: 0`,
					`rho_all_posts: 0`,
				];
				if (feed.htmlUrl) {
					frontmatter.push(`feed_site: "${feed.htmlUrl}"`);
				}
				frontmatter.push("---", "", `# ${feed.title}`);
				const fileContent = frontmatter.join("\n");

				let filePath = `${feedsFolder}/${fileName}`;
				const existingFile =
					plugin.app.vault.getAbstractFileByPath(filePath);
				if (existingFile) {
					const timestamp = Date.now();
					filePath = `${feedsFolder}/${sanitizeFileName(feed.title)}-${timestamp}.md`;
				}

				const createdFile = await plugin.app.vault.create(
					filePath,
					fileContent
				);
				if (createdFile instanceof TFile) {
					await updateFeedFrontmatter(plugin, feed.xmlUrl, createdFile);
				}
				imported++;
			}

			new Notice(
				`Imported ${imported} feed${imported !== 1 ? "s" : ""}` +
					(skipped > 0 ? `, skipped ${skipped} existing` : "") +
					"."
			);
		} catch (err) {
			console.error("Failed to import OPML:", err);
			new Notice("Failed to import OPML file.");
		} finally {
			plugin.setProcessing(false);
		}
	};

	input.click();
}
