import { ItemView, TFile, WorkspaceLeaf, debounce, setIcon } from "obsidian";
import type RhoReader from "../main";
import { syncAllRssFeeds } from "../commands/syncAllRssFeeds";

export const VIEW_TYPE_RHO_FEEDS = "rho-reader-feeds";

interface FeedListItem {
	file: TFile;
	title: string;
	total: number;
	unread: number;
}

export class RhoFeedsView extends ItemView {
	plugin: RhoReader;
	private scheduleRender: () => void;

	constructor(leaf: WorkspaceLeaf, plugin: RhoReader) {
		super(leaf);
		this.plugin = plugin;
		// Metadata changes fire in bursts while feeds sync; coalesce them so
		// the list re-renders once the counts have settled.
		this.scheduleRender = debounce(() => this.render(), 300, false);
	}

	getViewType() {
		return VIEW_TYPE_RHO_FEEDS;
	}

	getDisplayText() {
		return "RSS feeds";
	}

	getIcon() {
		return "rss";
	}

	async onOpen() {
		this.render();
		this.registerEvent(
			this.plugin.app.metadataCache.on("changed", () =>
				this.scheduleRender()
			)
		);
		this.registerEvent(
			this.plugin.app.vault.on("delete", () => this.scheduleRender())
		);
		this.registerEvent(
			this.plugin.app.vault.on("rename", () => this.scheduleRender())
		);
	}

	// Single pass over the vault: collect every feed note (has `feed_url`) and
	// tally the read/unread post files (tagged with `rho_feed_url`) per feed.
	loadFeeds(): FeedListItem[] {
		const feedFiles = new Map<string, TFile>();
		const counts = new Map<string, { total: number; unread: number }>();

		for (const file of this.plugin.app.vault.getMarkdownFiles()) {
			const fm =
				this.plugin.app.metadataCache.getFileCache(file)?.frontmatter;
			if (!fm) continue;
			if (typeof fm.feed_url === "string") {
				feedFiles.set(fm.feed_url, file);
			}
			if (typeof fm.rho_feed_url === "string") {
				const c = counts.get(fm.rho_feed_url) ?? { total: 0, unread: 0 };
				c.total++;
				if (fm.read !== true) c.unread++;
				counts.set(fm.rho_feed_url, c);
			}
		}

		const feeds: FeedListItem[] = [];
		for (const [feedUrl, file] of feedFiles) {
			const c = counts.get(feedUrl) ?? { total: 0, unread: 0 };
			feeds.push({
				file,
				title: file.basename,
				total: c.total,
				unread: c.unread,
			});
		}
		feeds.sort((a, b) => a.title.localeCompare(b.title));
		return feeds;
	}

	render() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass("rho-feeds-view");

		const feeds = this.loadFeeds();

		this.renderHeader(container, feeds);

		if (feeds.length === 0) {
			this.renderEmptyState(container);
			return;
		}

		const list = container.createEl("div", { cls: "rho-feeds-list" });
		for (const feed of feeds) {
			const item = list.createEl("div", { cls: "rho-feeds-item" });
			if (feed.unread === 0) {
				item.addClass("rho-feeds-item--read");
			}

			const iconEl = item.createSpan({ cls: "rho-feeds-item-icon" });
			setIcon(iconEl, "rss");

			item.createEl("span", {
				cls: "rho-feeds-item-title",
				text: feed.title,
				attr: { title: feed.title },
			});

			if (feed.unread > 0) {
				item.createEl("span", {
					cls: "rho-feeds-item-count",
					text: String(feed.unread),
					attr: { "aria-label": `${feed.unread} unread` },
				});
			}

			item.addEventListener("click", () => {
				void this.openFeed(feed.file);
			});
		}
	}

	renderHeader(container: HTMLElement, feeds: FeedListItem[]) {
		const header = container.createEl("div", { cls: "rho-feeds-header" });

		const totalUnread = feeds.reduce((sum, f) => sum + f.unread, 0);
		const titleText =
			feeds.length === 0
				? "Feeds"
				: `Feeds · ${totalUnread} unread`;
		header.createEl("span", {
			cls: "rho-feeds-header-title",
			text: titleText,
		});

		const syncBtn = header.createEl("div", {
			cls: "clickable-icon rho-feeds-header-action",
			attr: { "aria-label": "Sync all feeds" },
		});
		setIcon(syncBtn, "refresh-cw");
		syncBtn.addEventListener("click", () => {
			void syncAllRssFeeds(this.plugin);
		});
	}

	renderEmptyState(container: HTMLElement) {
		const wrapper = container.createEl("div", {
			cls: "rho-reader-status",
		});
		const iconEl = wrapper.createSpan({ cls: "rho-reader-status-icon" });
		setIcon(iconEl, "rss");
		wrapper.createEl("div", {
			cls: "rho-reader-status-text",
			text: "No feeds yet",
		});
	}

	// Open the feed note; the workspace `file-open` event then drives the
	// reader pane to show that feed's posts.
	async openFeed(file: TFile) {
		const leaf = this.plugin.app.workspace.getLeaf(false);
		await leaf.openFile(file);
	}
}
