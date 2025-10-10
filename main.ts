import { App, Editor, MarkdownView, Modal, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface RhoReaderSettings {
	rssPostsFolder: string;
	rssFeedBaseFile: string;
}

const DEFAULT_SETTINGS: RhoReaderSettings = {
	rssPostsFolder: 'Rho Reader/Posts',
	rssFeedBaseFile: 'Rho Reader/Feeds.base'
}

export default class RhoReader extends Plugin {
	settings: RhoReaderSettings;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('rss', 'Rho Reader', (_evt: MouseEvent) => {
			if (this.settings.rssFeedBaseFile) {
				this.app.workspace.openLinkText(
					this.settings.rssFeedBaseFile,
					'', // empty string for current path
					false // open in same pane
				);
			}
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new RhoReaderSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class RhoReaderSettingTab extends PluginSettingTab {
	plugin: RhoReader;

	constructor(app: App, plugin: RhoReader) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		new Setting(containerEl)
			.setName('RSS Posts Folder')
			.setDesc('Specify the folder where new posts from RSS feeds are created')
			.addText(text => text
				.setValue(this.plugin.settings.rssPostsFolder)
				.onChange(async (value) => {
					this.plugin.settings.rssPostsFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('RSS Feed Bases')
			.setDesc('Obsidian Bases file used to organise the RSS feeds.')
			.addText(text => text
				.setValue(this.plugin.settings.rssFeedBaseFile)
				.onChange(async (value) => {
					this.plugin.settings.rssFeedBaseFile = value;
					await this.plugin.saveSettings();
				}));
	}
}
