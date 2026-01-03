import { ItemView, Menu, WorkspaceLeaf, setIcon, requestUrl } from "obsidian";
import type RhoReader from "../main";
import { defaultBaseContent } from "../settings/settings";
import { syncAllRssFeeds } from "../commands/syncAllRssFeeds";
import { importOpml } from "../commands/importOpml";
import { updateFeedFrontmatter, findFileForFeedUrl } from "../commands/utils";

export const VIEW_TYPE_RHO_READER = "rho-reader-pane";

export interface FeedPost {
	title: string;
	link: string;
	pubDate: string;
	guid: string;
}

export class RhoReaderPane extends ItemView {
	plugin: RhoReader;
	currentFeedUrl: string | null = null;
	posts: FeedPost[] = [];
	isLoading = false;

	constructor(leaf: WorkspaceLeaf, plugin: RhoReader) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_RHO_READER;
	}

	getDisplayText() {
		return "Rho Reader";
	}

	getIcon() {
		return "rss";
	}

	async onOpen() {
		this.render();
	}

	async setFeedUrl(url: string | null) {
		this.currentFeedUrl = url;
		this.posts = [];
		if (url) {
			await this.fetchFeed(url);
		} else {
			this.render();
		}
	}

	async fetchFeed(url: string) {
		this.isLoading = true;
		this.render();
		try {
			const response = await requestUrl({ url });
			const text = response.text;
			const posts = this.parseRssFeed(text, url);
			this.posts = posts;
		} catch (err) {
			console.error("[Rho Reader] Failed to fetch RSS feed:", err);
			this.posts = [];
		}
		this.isLoading = false;
		this.render();
	}

	parseRssFeed(text: string, url: string): FeedPost[] {
		const parser = new DOMParser();

		let xmlDoc = parser.parseFromString(text, "application/xml");
		let parserError = xmlDoc.querySelector("parsererror");

		if (parserError) {
			console.warn(
				"[Rho Reader] XML parse failed, attempting text/html fallback:",
				url
			);
			xmlDoc = parser.parseFromString(text, "text/html");
			parserError = xmlDoc.querySelector("parsererror");
			if (parserError) {
				console.error(
					"[Rho Reader] RSS XML parse error:",
					url,
					parserError.textContent
				);
				console.debug(
					"[Rho Reader] Response snippet:",
					text.slice(0, 500)
				);
				return [];
			}
		}

		const items = xmlDoc.querySelectorAll("item");
		const entries = xmlDoc.querySelectorAll("entry");

		if (items.length === 0 && entries.length === 0) {
			console.warn(
				"[Rho Reader] No <item> or <entry> elements found in feed:",
				url
			);
			console.debug("[Rho Reader] Response snippet:", text.slice(0, 500));
			return [];
		}

		const rawPosts: Element[] =
			items.length > 0 ? Array.from(items) : Array.from(entries);

		return rawPosts.map((post) => {
			const title =
				post.querySelector("title")?.textContent?.trim() || "Untitled";

			let link = "";
			const linkEl = post.querySelector("link");
			if (linkEl) {
				link =
					linkEl.textContent?.trim() ||
					linkEl.getAttribute("href") ||
					"";
			}

			const pubDate =
				post.querySelector("pubDate")?.textContent?.trim() ||
				post.querySelector("published")?.textContent?.trim() ||
				"";

			const guid =
				post.querySelector("guid")?.textContent?.trim() ||
				post.querySelector("id")?.textContent?.trim() ||
				"";

			return { title, link, pubDate, guid };
		});
	}

	render() {
		const container = this.containerEl.children[1];
		container.empty();

		if (!this.currentFeedUrl) {
			this.renderLanding(container as HTMLElement);
			return;
		}

		this.renderFeedHeader(container as HTMLElement);

		if (this.isLoading) {
			this.renderStatusMessage(container as HTMLElement, "Loading posts...", "rss");
			return;
		}

		if (this.posts.length === 0) {
			this.renderEmptyState(container as HTMLElement);
			return;
		}

		const list = container.createEl("div", { cls: "rho-reader-posts" });
		for (const post of this.posts) {
			const isRead =
				this.currentFeedUrl &&
				this.plugin.isPostRead(this.currentFeedUrl, post);

			const card = list.createEl("div", {
				cls: `rho-reader-card${isRead ? " rho-reader-card--read" : ""}`,
			});

			if (post.link) {
				card.style.cursor = "pointer";
				card.addEventListener("click", () => {
					if (
						this.currentFeedUrl &&
						!this.plugin.isPostRead(this.currentFeedUrl, post)
					) {
						this.plugin.markPostRead(this.currentFeedUrl, post);
						card.addClass("rho-reader-card--read");
					}
					window.open(post.link, "_blank");
				});
			}

			card.addEventListener("contextmenu", (evt) => {
				evt.preventDefault();
				if (!this.currentFeedUrl) return;

				const menu = new Menu();
				const currentlyRead = this.plugin.isPostRead(
					this.currentFeedUrl,
					post
				);

				if (currentlyRead) {
					menu.addItem((item) =>
						item
							.setTitle("Mark as unread")
							.setIcon("eye-off")
							.onClick(() => {
								this.plugin.markPostUnread(
									this.currentFeedUrl!,
									post
								);
								card.removeClass("rho-reader-card--read");
							})
					);
				} else {
					menu.addItem((item) =>
						item
							.setTitle("Mark as read")
							.setIcon("eye")
							.onClick(() => {
								this.plugin.markPostRead(
									this.currentFeedUrl!,
									post
								);
								card.addClass("rho-reader-card--read");
							})
					);
				}

				if (post.link) {
					menu.addItem((item) =>
						item
							.setTitle("Copy link")
							.setIcon("link")
							.onClick(async () => {
								await navigator.clipboard.writeText(post.link!);
							})
					);
				}

				menu.showAtMouseEvent(evt);
				});

			const title = card.createEl("div", {
				cls: "rho-reader-card-title",
			});
			title.createEl("span", { text: post.title });

			const meta = card.createEl("div", { cls: "rho-reader-card-meta" });
			if (post.pubDate) {
				const dateContainer = meta.createEl("span", {
					cls: "rho-reader-card-date",
				});
				dateContainer.createEl("span", {
					text: this.formatDate(post.pubDate),
				});
			}
			if (post.link) {
				const linkContainer = meta.createEl("span", {
					cls: "rho-reader-card-link",
				});
				linkContainer.createEl("span", {
					text: new URL(post.link).hostname,
				});
			}
		}
	}

	formatDate(dateString: string): string {
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
		} catch {
			return dateString;
		}
	}

	renderStatusMessage(container: HTMLElement, message: string, icon: string) {
		const wrapper = container.createEl("div", {
			cls: "rho-reader-status",
		});
		const iconEl = wrapper.createSpan({ cls: "rho-reader-status-icon" });
		setIcon(iconEl, icon);
		wrapper.createEl("div", {
			cls: "rho-reader-status-text",
			text: message,
		});
	}

	renderFeedHeader(container: HTMLElement) {
		const header = container.createEl("div", {
			cls: "rho-reader-feed-header",
		});
		const syncBtn = header.createEl("div", {
			cls: "clickable-icon",
			attr: { "aria-label": "Sync feed" },
		});
		setIcon(syncBtn, "refresh-cw");
		syncBtn.addEventListener("click", () => {
			this.syncCurrentFeed();
		});

		const markAllReadBtn = header.createEl("div", {
			cls: "clickable-icon",
			attr: { "aria-label": "Mark all as read" },
		});
		setIcon(markAllReadBtn, "check-check");
		markAllReadBtn.addEventListener("click", () => {
			this.markAllAsRead();
		});
	}

	markAllAsRead() {
		if (!this.currentFeedUrl || this.posts.length === 0) {
			return;
		}
		for (const post of this.posts) {
			this.plugin.markPostRead(this.currentFeedUrl, post);
		}
		this.render();
	}

	renderEmptyState(container: HTMLElement) {
		const wrapper = container.createEl("div", {
			cls: "rho-reader-empty-state",
		});
		const iconEl = wrapper.createSpan({ cls: "rho-reader-status-icon" });
		setIcon(iconEl, "inbox");
		wrapper.createEl("div", {
			cls: "rho-reader-status-text",
			text: "No posts found",
		});
		const syncBtn = wrapper.createEl("button", {
			cls: "rho-reader-sync-btn rho-reader-sync-btn--cta",
		});
		setIcon(syncBtn, "refresh-cw");
		syncBtn.createSpan({ text: "Sync feed" });
		syncBtn.addEventListener("click", () => {
			this.syncCurrentFeed();
		});
	}

	renderLanding(container: HTMLElement) {
		const landing = container.createEl("div", {
			cls: "rho-reader-landing",
		});

		landing.createEl("div", {
			cls: "rho-reader-landing-title",
			text: "Rho Reader",
		});
		landing.createEl("div", {
			cls: "rho-reader-landing-subtitle",
			text: "Reading companion for Obsidian",
		});

		const actions = landing.createEl("div", {
			cls: "rho-reader-landing-actions",
		});

		const rssFeedReaderBtn = actions.createEl("button", {
			cls: "rho-reader-landing-btn rho-reader-landing-btn--primary",
		});
		setIcon(rssFeedReaderBtn.createSpan(), "rss");
		rssFeedReaderBtn.createSpan({ text: "RSS Feed Reader" });
		rssFeedReaderBtn.addEventListener("click", () => {
			(this.plugin.app as any).commands.executeCommandById("rho-reader:open-rss-feed-reader");
		});

		const syncBtn = actions.createEl("button", {
			cls: "rho-reader-landing-btn",
		});
		setIcon(syncBtn.createSpan(), "refresh-cw");
		syncBtn.createSpan({ text: "Sync RSS Feeds" });
		syncBtn.addEventListener("click", async () => {
			await this.syncAllFeeds();
		});

		const importBtn = actions.createEl("button", {
			cls: "rho-reader-landing-btn",
		});
		setIcon(importBtn.createSpan(), "file-up");
		importBtn.createSpan({ text: "Import OPML" });
		importBtn.addEventListener("click", () => {
			importOpml(this.plugin);
		});

		const footer = landing.createEl("div", {
			cls: "rho-reader-landing-footer",
		});
		const starLink = footer.createEl("a", {
			cls: "rho-reader-landing-star",
			href: "https://github.com/scriptnull/rho-reader",
		});
		setIcon(starLink.createSpan(), "star");
		starLink.createSpan({ text: "Star on GitHub" });
		starLink.addEventListener("click", (e) => {
			e.preventDefault();
			window.open("https://github.com/scriptnull/rho-reader", "_blank");
		});
	}

	async syncAllFeeds() {
		await syncAllRssFeeds(this.plugin);
	}

	async syncCurrentFeed() {
		if (!this.currentFeedUrl) return;
		const file = findFileForFeedUrl(this.plugin, this.currentFeedUrl);
		if (file) {
			await updateFeedFrontmatter(this.plugin, this.currentFeedUrl, file);
		}
		await this.fetchFeed(this.currentFeedUrl);
	}
}
