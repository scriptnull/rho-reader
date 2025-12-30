import { Plugin, TFile } from "obsidian";
import * as yaml from "js-yaml";
import {
	RhoReaderSettings,
	DEFAULT_SETTINGS,
	defaultBaseContent,
} from "./settings/settings";
import { VIEW_TYPE_RHO_READER } from "./constants";
import { RhoReaderPane } from "./views/RhoReaderPane";
import { RhoReaderSettingTab } from "./settings/RhoReaderSettingTab";

export default class RhoReader extends Plugin {
	settings: RhoReaderSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_RHO_READER,
			(leaf) => new RhoReaderPane(leaf, this)
		);

		this.app.workspace.on("file-open", async (file: TFile | null) => {
			let feedUrl: string | null = null;
			if (file) {
				const fileCache = this.app.metadataCache.getFileCache(file);
				feedUrl = fileCache?.frontmatter?.feed_url || null;
			}
			let leaf =
				this.app.workspace.getLeavesOfType(VIEW_TYPE_RHO_READER)[0];
			if (!leaf) {
				const rightLeaf = this.app.workspace.getRightLeaf(false);
				if (!rightLeaf) return;
				await rightLeaf.setViewState({ type: VIEW_TYPE_RHO_READER });
				leaf = rightLeaf;
			}
			const view = leaf.view as RhoReaderPane;
			view.setFeedUrl(feedUrl);
		});

		this.addRibbonIcon("rss", "Rho Reader", (_evt: MouseEvent) => {
			if (this.settings.rssFeedBaseFile) {
				if (
					!this.app.vault.getAbstractFileByPath(
						this.settings.rssFeedBaseFile
					)
				) {
					const vault = this.app.vault;
					const baseFilePath = this.settings.rssFeedBaseFile;
					vault.adapter.write(
						baseFilePath,
						defaultBaseContent.trim()
					);
				}

				this.app.workspace.openLinkText(
					this.settings.rssFeedBaseFile,
					"",
					false
				);
			}
		});

		this.addSettingTab(new RhoReaderSettingTab(this.app, this));

		this.addCommand({
			id: "sync-rss-feed",
			name: "Sync RSS feed",
			callback: async () => {
				const file =
					this.app.workspace.getActiveFile?.() ||
					this.app.workspace.getActiveFile?.call(this.app.workspace);
				if (!file) {
					console.log("No active file.");
					return;
				}
				const fileCache = this.app.metadataCache.getFileCache(file);
				const feedUrl = fileCache?.frontmatter?.feed_url;
				if (!feedUrl) {
					console.log("No feed_url property found in frontmatter.");
					return;
				}
				try {
					const response = await fetch(feedUrl);
					const text = await response.text();
					console.log("RSS feed response:", text);

					const parser = new DOMParser();
					const xmlDoc = parser.parseFromString(
						text,
						"application/xml"
					);
					let count = 0;
					const items = xmlDoc.querySelectorAll("item");
					const entries = xmlDoc.querySelectorAll("entry");
					const posts: Element[] =
						items.length > 0
							? Array.from(items)
							: Array.from(entries);
					count = posts.length;
					console.log("Unread posts count:", count);

					const folderPath = this.settings.rssPostsFolder;

					const folderAbstract =
						this.app.vault.getAbstractFileByPath(folderPath);
					if (!folderAbstract) {
						await this.app.vault.createFolder(folderPath);
					}
					for (const post of posts) {
						const title =
							post.querySelector("title")?.textContent?.trim() ||
							"Untitled";
						let link = post
							.querySelector("link")
							?.textContent?.trim();
						if (!link && post.querySelector("link")) {
							link =
								post
									.querySelector("link")
									?.getAttribute("href") || "";
						}
						const pubDate =
							post
								.querySelector("pubDate")
								?.textContent?.trim() ||
							post
								.querySelector("published")
								?.textContent?.trim() ||
							"";
						const fileName =
							title
								.replace(/[^a-zA-Z0-9-_ ]/g, "_")
								.replace(/\s+/g, "_") + ".md";
						const filePath = `${folderPath}/${fileName}`;
						if (!this.app.vault.getAbstractFileByPath(filePath)) {
							const frontmatter = `---\ntitle: ${title}\nlink: ${link}\npubDate: ${pubDate}\n---\n`;
							await this.app.vault.create(
								filePath,
								frontmatter + `\n`
							);
						}
					}

					const fileContent = await this.app.vault.read(file);
					let newContent = fileContent;
					if (fileContent.startsWith("---")) {
						const endFrontmatter = fileContent.indexOf("---", 3);
						if (endFrontmatter !== -1) {
							const frontmatterRaw = fileContent
								.substring(3, endFrontmatter)
								.trim();
							const body = fileContent.substring(
								endFrontmatter + 3
							);
							let frontmatterObj: Record<string, unknown> = {};
							try {
								frontmatterObj =
									(yaml.load(frontmatterRaw) as Record<
										string,
										unknown
									>) || {};
							} catch (e) {
								console.error(
									"Failed to parse frontmatter YAML:",
									e
								);
							}
							frontmatterObj.rho_unread_posts_count = count;
							const updatedFrontmatter = `---\n${yaml.dump(
								frontmatterObj
							)}---\n`;
							newContent = updatedFrontmatter + body;
						}
					} else {
						newContent =
							`---\nrho_unread_posts_count: ${count}\n---\n` +
							fileContent;
					}
					await this.app.vault.modify(file, newContent);
				} catch (err) {
					console.error("Failed to fetch or update RSS feed:", err);
				}
			},
		});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
