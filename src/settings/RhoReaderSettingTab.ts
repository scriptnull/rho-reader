import { App, PluginSettingTab, Setting } from "obsidian";
import type RhoReader from "../main";
import { DEFAULT_SETTINGS } from "./settings";
import {
	MAX_SYNC_CONCURRENCY,
	MIN_SYNC_CONCURRENCY,
	clampSyncConcurrency,
	normalizeFolderPath,
} from "./validation";

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
			.addText((text) => {
				text
					.setValue(this.plugin.settings.rhoFolder)
					.onChange(async (value) => {
						this.plugin.settings.rhoFolder = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.addEventListener("blur", async () => {
					const normalized = normalizeFolderPath(
						text.getValue(),
						DEFAULT_SETTINGS.rhoFolder
					);
					if (normalized !== this.plugin.settings.rhoFolder) {
						this.plugin.settings.rhoFolder = normalized;
						await this.plugin.saveSettings();
					}
					if (normalized !== text.getValue()) {
						text.setValue(normalized);
					}
				});
			});

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

		new Setting(containerEl)
			.setName("Sync concurrency")
			.setDesc(
				`Number of feeds to sync in parallel (${MIN_SYNC_CONCURRENCY}–${MAX_SYNC_CONCURRENCY}).`
			)
			.addText((text) => {
				text.inputEl.type = "number";
				text.inputEl.min = String(MIN_SYNC_CONCURRENCY);
				text.inputEl.max = String(MAX_SYNC_CONCURRENCY);
				text
					.setValue(String(this.plugin.settings.syncConcurrency))
					.onChange(async (value) => {
						// Allow the box to be empty while the user is editing;
						// commit the clamped value on blur.
						if (value.trim() === "") return;
						const clamped = clampSyncConcurrency(
							value,
							this.plugin.settings.syncConcurrency
						);
						this.plugin.settings.syncConcurrency = clamped;
						await this.plugin.saveSettings();
					});
				text.inputEl.addEventListener("blur", async () => {
					const clamped = clampSyncConcurrency(
						text.getValue(),
						DEFAULT_SETTINGS.syncConcurrency
					);
					if (clamped !== this.plugin.settings.syncConcurrency) {
						this.plugin.settings.syncConcurrency = clamped;
						await this.plugin.saveSettings();
					}
					if (String(clamped) !== text.getValue()) {
						text.setValue(String(clamped));
					}
				});
			});
	}
}
