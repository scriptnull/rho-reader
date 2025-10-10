import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

interface RhoReaderSettings {
	rssPostsFolder: string;
	rssFeedBaseFile: string;
}

const DEFAULT_SETTINGS: RhoReaderSettings = {
	rssPostsFolder: "Posts",
	rssFeedBaseFile: "Feeds.base",
};

const defaultBaseContent = `
views:
  - type: cards
    name: All Feeds
    filters:
      and:
        - file.hasProperty("feed_url")
    order:
      - file.name
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
