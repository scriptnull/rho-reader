import { ItemView, Menu, WorkspaceLeaf, setIcon, requestUrl } from "obsidian";
import { VIEW_TYPE_RHO_READER } from "../constants";
import type RhoReader from "../main";
import { defaultBaseContent } from "../settings/settings";
import { updateFeedFrontmatter } from "../commands/syncRssFeed";

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

		if (this.isLoading) {
			container.createEl("div", { text: "Loading..." });
			return;
		}

		if (this.posts.length === 0) {
			container.createEl("div", { text: "No posts found" });
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

		const baseFilePath = this.plugin.settings.rssFeedBaseFile;
		const baseFileExists =
			!!this.plugin.app.vault.getAbstractFileByPath(baseFilePath);

		if (!baseFileExists) {
			const getStartedBtn = actions.createEl("button", {
				cls: "rho-reader-landing-btn rho-reader-landing-btn--primary",
			});
			setIcon(getStartedBtn.createSpan(), "rocket");
			getStartedBtn.createSpan({ text: "Get started" });
			getStartedBtn.addEventListener("click", async () => {
				await this.plugin.app.vault.adapter.write(
					baseFilePath,
					defaultBaseContent.trim()
				);
				this.plugin.app.workspace.openLinkText(baseFilePath, "", false);
			});
		} else {
			const openFeedsBtn = actions.createEl("button", {
				cls: "rho-reader-landing-btn rho-reader-landing-btn--primary",
			});
			setIcon(openFeedsBtn.createSpan(), "list");
			openFeedsBtn.createSpan({ text: "Open feeds" });
			openFeedsBtn.addEventListener("click", () => {
				this.plugin.app.workspace.openLinkText(baseFilePath, "", false);
			});
		}

		const syncBtn = actions.createEl("button", {
			cls: "rho-reader-landing-btn",
		});
		setIcon(syncBtn.createSpan(), "refresh-cw");
		syncBtn.createSpan({ text: "Sync feeds" });
		syncBtn.addEventListener("click", async () => {
			await this.syncAllFeeds();
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
		const files = this.plugin.app.vault.getMarkdownFiles();
		for (const file of files) {
			const cache = this.plugin.app.metadataCache.getFileCache(file);
			const feedUrl = cache?.frontmatter?.feed_url;
			if (feedUrl) {
				await updateFeedFrontmatter(this.plugin, feedUrl, file);
			}
		}
	}
}
