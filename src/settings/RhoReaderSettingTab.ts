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
			.setName("Rho folder")
			.setDesc("Folder where Rho Reader stores all its data.")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.rhoFolder)
					.onChange(async (value) => {
						this.plugin.settings.rhoFolder = value;
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
