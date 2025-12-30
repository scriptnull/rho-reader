import { App, PluginSettingTab, Setting } from "obsidian";
import type RhoReader from "../main";

export class RhoReaderSettingTab extends PluginSettingTab {
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
