import { Plugin, TFile } from "obsidian";
import {
	RhoReaderSettings,
	DEFAULT_SETTINGS,
	ReadStateByFeed,
} from "./settings/settings";
import {
	VIEW_TYPE_RHO_READER,
	RhoReaderPane,
	FeedPost,
} from "./views/RhoReaderPane";
import { RhoReaderSettingTab } from "./settings/RhoReaderSettingTab";
import { registerCommands } from "./commands/register";
import {
	findFileForFeedUrl,
	updateFeedFrontmatter,
} from "./commands/utils";

export default class RhoReader extends Plugin {
	settings: RhoReaderSettings;
	private saveSettingsTimeout: number | null = null;

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

		this.addSettingTab(new RhoReaderSettingTab(this.app, this));

		registerCommands(this);
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

	saveSettingsDebounced(delay = 500) {
		if (this.saveSettingsTimeout !== null) {
			window.clearTimeout(this.saveSettingsTimeout);
		}
		this.saveSettingsTimeout = window.setTimeout(() => {
			this.saveSettings();
			this.saveSettingsTimeout = null;
		}, delay);
	}

	getPostKey(post: FeedPost): string {
		return post.guid || post.link || `${post.title}::${post.pubDate}`;
	}

	isPostRead(feedUrl: string, post: FeedPost): boolean {
		const postKey = this.getPostKey(post);
		return !!this.settings.readState?.[feedUrl]?.[postKey]?.read;
	}

	markPostRead(feedUrl: string, post: FeedPost) {
		const postKey = this.getPostKey(post);
		if (!this.settings.readState[feedUrl]) {
			this.settings.readState[feedUrl] = {} as ReadStateByFeed;
		}
		const byFeed = this.settings.readState[feedUrl];
		byFeed[postKey] = { read: true, readAt: Date.now() };
		this.saveSettingsDebounced();
		this.updateFeedCounts(feedUrl);
	}

	markPostUnread(feedUrl: string, post: FeedPost) {
		const postKey = this.getPostKey(post);
		if (this.settings.readState[feedUrl]?.[postKey]) {
			delete this.settings.readState[feedUrl][postKey];
			this.saveSettingsDebounced();
			this.updateFeedCounts(feedUrl);
		}
	}

	private async updateFeedCounts(feedUrl: string) {
		const file = findFileForFeedUrl(this, feedUrl);
		if (file) {
			await updateFeedFrontmatter(this, feedUrl, file);
		}
	}
}
