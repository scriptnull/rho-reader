import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import * as yaml from "js-yaml";

interface RhoReaderSettings {
	rssPostsFolder: string;
	rssFeedBaseFile: string;
}

const DEFAULT_SETTINGS: RhoReaderSettings = {
	rssPostsFolder: "Posts",
	rssFeedBaseFile: "Feeds.base",
};

const defaultBaseContent = `
properties:
  note.rho_unread_posts_count:
    displayName: Unread
views:
  - type: cards
    name: All Feeds
    filters:
      and:
        - file.hasProperty("feed_url")
    order:
      - file.name
      - rho_unread_posts_count
    sort:
      - property: file.name
        direction: ASC
`;

export default class RhoReader extends Plugin {
	settings: RhoReaderSettings;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon("rss", "Rho Reader", (_evt: MouseEvent) => {
			if (this.settings.rssFeedBaseFile) {
				if (
					!this.app.vault.getAbstractFileByPath(
						this.settings.rssFeedBaseFile
					)
				) {
					// File does not exist, create it
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

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new RhoReaderSettingTab(this.app, this));

		// Add Sync RSS feed command
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

					// Parse RSS/Atom feed
					const parser = new DOMParser();
					const xmlDoc = parser.parseFromString(
						text,
						"application/xml"
					);
					let count = 0;
					const items = xmlDoc.querySelectorAll("item");
					const entries = xmlDoc.querySelectorAll("entry");
					if (items.length > 0) {
						count = items.length;
					} else if (entries.length > 0) {
						count = entries.length;
					}
					console.log("Unread posts count:", count);

					// Update frontmatter robustly
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

class RhoReaderSettingTab extends PluginSettingTab {
	plugin: RhoReader;

	constructor(app: App, plugin: RhoReader) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		new Setting(containerEl)
			.setName("RSS Posts Folder")
			.setDesc(
				"Specify the folder where new posts from RSS feeds are created"
			)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.rssPostsFolder)
					.onChange(async (value) => {
						this.plugin.settings.rssPostsFolder = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("RSS Feed Bases")
			.setDesc("Obsidian Bases file used to organise the RSS feeds.")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.rssFeedBaseFile)
					.onChange(async (value) => {
						this.plugin.settings.rssFeedBaseFile = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
