import { Plugin, TFile, setIcon } from "obsidian";
import {
	RhoReaderSettings,
	DEFAULT_SETTINGS,
} from "./settings/settings";
import {
	VIEW_TYPE_RHO_READER,
	RhoReaderPane,
} from "./views/RhoReaderPane";
import type { FeedPost } from "./types";
import { RhoReaderSettingTab } from "./settings/RhoReaderSettingTab";
import { registerCommands } from "./commands/register";
import {
	findExistingPostFile,
	setPostReadState,
	updateFeedCountsFromFiles,
	createPostFile,
	findFileForFeedUrl,
	getPostKey,
	setFeedSyncStatus,
} from "./commands/utils";

export default class RhoReader extends Plugin {
	settings: RhoReaderSettings;
	private saveSettingsTimeout: number | null = null;
	isProcessing = false;
	private processingText = "";
	private statusBarItem: HTMLElement | null = null;

	setProcessing(processing: boolean, text = "") {
		this.isProcessing = processing;
		this.processingText = text;
		this.updateStatusBar();
	}

	private updateStatusBar() {
		if (!this.statusBarItem) return;
		this.statusBarItem.empty();
		setIcon(this.statusBarItem, "rss");
		if (this.isProcessing) {
			this.statusBarItem.addClass("rho-reader-processing");
			this.statusBarItem.removeClass("rho-reader-idle");
			const label = this.processingText
				? `Rho Reader: ${this.processingText}...`
				: "Rho Reader: Processing...";
			this.statusBarItem.setAttribute("aria-label", label);
		} else {
			this.statusBarItem.removeClass("rho-reader-processing");
			this.statusBarItem.addClass("rho-reader-idle");
			this.statusBarItem.setAttribute("aria-label", "Rho Reader");
		}
	}

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
				if (fileCache?.frontmatter?.rho_feed_url) {
					// Post file opened (e.g. via "Take notes") — keep current feed displayed
					return;
				}
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

		this.statusBarItem = this.addStatusBarItem();
		this.statusBarItem.addClass("rho-reader-status-bar");
		this.statusBarItem.setAttribute("data-tooltip-position", "top");
		this.updateStatusBar();

		registerCommands(this);
		this.clearStaleSyncStatuses();
	}

	private async clearStaleSyncStatuses(): Promise<void> {
		const files = this.app.vault.getMarkdownFiles();
		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);
			const status = cache?.frontmatter?.rho_sync_status;
			if (status === "syncing" || status === "queued") {
				await setFeedSyncStatus(this, file, "error");
			}
		}
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

	isPostRead(feedUrl: string, post: FeedPost): boolean {
		return post.read === true;
	}

	async markPostRead(feedUrl: string, post: FeedPost) {
		post.read = true;
		const postKey = getPostKey(post);
		let file = findExistingPostFile(this, feedUrl, postKey);
		if (!file) {
			const feedFile = findFileForFeedUrl(this, feedUrl);
			if (feedFile) {
				file = await createPostFile(
					this,
					feedUrl,
					feedFile.basename,
					post
				);
			}
		}
		if (file) {
			await setPostReadState(this, file, true);
		}
		await this.updateFeedCounts(feedUrl);
	}

	async persistAllPostsRead(feedUrl: string, posts: FeedPost[]) {
		await Promise.all(
			posts.map(async (post) => {
				const postKey = getPostKey(post);
				let file = findExistingPostFile(this, feedUrl, postKey);
				if (!file) {
					const feedFile = findFileForFeedUrl(this, feedUrl);
					if (feedFile) {
						file = await createPostFile(
							this,
							feedUrl,
							feedFile.basename,
							post
						);
					}
				}
				if (file) {
					await setPostReadState(this, file, true);
				}
			})
		);
		await this.updateFeedCounts(feedUrl);
	}

	async markPostUnread(feedUrl: string, post: FeedPost) {
		post.read = false;
		const postKey = getPostKey(post);
		const file = findExistingPostFile(this, feedUrl, postKey);
		if (file) {
			await setPostReadState(this, file, false);
		}
		await this.updateFeedCounts(feedUrl);
	}

	private async updateFeedCounts(feedUrl: string) {
		await updateFeedCountsFromFiles(this, feedUrl);
	}
}
