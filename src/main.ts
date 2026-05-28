import { Plugin, TFile } from "obsidian";
import { RhoReaderSettings, DEFAULT_SETTINGS } from "./settings/settings";
import {
	clampSyncConcurrency,
	normalizeFolderPath,
} from "./settings/validation";
import { VIEW_TYPE_RHO_READER, RhoReaderPane } from "./views/RhoReaderPane";
import { openReaderForFile } from "./views/openReaderForFile";
import { RhoReaderSettingTab } from "./settings/RhoReaderSettingTab";
import { registerCommands } from "./commands/register";
import { drainPendingReads } from "./commands/utils";
import { StatusBar } from "./statusBar";
import {
	migrateLegacyReadState,
	clearStaleSyncStatuses,
} from "./startup";

export default class RhoReader extends Plugin {
	settings: RhoReaderSettings;
	statusBar: StatusBar;

	async onload() {
		await this.loadSettings();

		this.statusBar = new StatusBar(this);
		this.registerView(
			VIEW_TYPE_RHO_READER,
			(leaf) => new RhoReaderPane(leaf, this)
		);
		this.addSettingTab(new RhoReaderSettingTab(this.app, this));
		registerCommands(this);

		this.registerEvent(
			this.app.workspace.on("file-open", (file: TFile | null) => {
				void openReaderForFile(this, file);
			})
		);

		// Resume mark-read writes interrupted when the system browser
		// backgrounded Obsidian mid-write (mobile) or the app was killed.
		this.registerDomEvent(document, "visibilitychange", () => {
			if (document.visibilityState === "visible") {
				void drainPendingReads(this);
			}
		});

		this.app.workspace.onLayoutReady(async () => {
			await migrateLegacyReadState(this);
			await clearStaleSyncStatuses(this);
			void drainPendingReads(this);
			// Re-open the reader pane for the active file after plugin (re)load,
			// since `file-open` won't fire for a file that's already open.
			void openReaderForFile(this, this.app.workspace.getActiveFile());
		});
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_RHO_READER);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
		this.settings.rhoFolder = normalizeFolderPath(
			this.settings.rhoFolder,
			DEFAULT_SETTINGS.rhoFolder
		);
		this.settings.syncConcurrency = clampSyncConcurrency(
			this.settings.syncConcurrency,
			DEFAULT_SETTINGS.syncConcurrency
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
