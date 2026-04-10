import { App, ItemView, Menu, SuggestModal, WorkspaceLeaf, setIcon } from "obsidian";
import type RhoReader from "../main";
import type { FeedPost } from "../types";
import { syncAllRssFeeds } from "../commands/syncAllRssFeeds";
import { importOpml } from "../commands/importOpml";
import { updateFeedFrontmatter, findFileForFeedUrl, getPostsForFeed, findExistingPostFile, getPostKey, setPostTags, getAllTagsForFeed, setFeedSyncStatus } from "../commands/utils";

export const VIEW_TYPE_RHO_READER = "rho-reader-pane";

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

	setFeedUrl(url: string | null) {
		this.currentFeedUrl = url;
		this.posts = [];
		if (url) {
			this.loadPostsFromFiles(url);
		}
		this.render();
	}

	loadPostsFromFiles(url: string) {
		const postFiles = getPostsForFeed(this.plugin, url);
		const posts: FeedPost[] = postFiles.map((file) => {
			const fm =
				this.plugin.app.metadataCache.getFileCache(file)?.frontmatter;
			return {
				title: fm?.rho_title || "",
				link: fm?.rho_link || "",
				pubDate: fm?.rho_pub_date || "",
				guid: fm?.rho_guid || "",
				read: fm?.read === true,
				tags: Array.isArray(fm?.rho_tags) ? (fm!.rho_tags as string[]) : [],
			};
		});
		posts.sort((a, b) => {
			const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
			const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
			return dateB - dateA;
		});
		this.posts = posts;
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
			this.renderStatusMessage(
				container as HTMLElement,
				"Loading posts...",
				"rss"
			);
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

				menu.addItem((item) =>
					item
						.setTitle("Take notes")
						.setIcon("pencil")
						.onClick(async () => {
							const postKey = getPostKey(post);
							const file = findExistingPostFile(
								this.plugin,
								this.currentFeedUrl!,
								postKey
							);
							if (file) {
								const leaf = this.app.workspace.getLeaf(false);
								await leaf.openFile(file);
							}
						})
				);

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

				menu.addItem((item) =>
					item
						.setTitle("Add tag")
						.setIcon("tag")
						.onClick(() => {
							const existingTags = getAllTagsForFeed(
								this.plugin,
								this.currentFeedUrl!
							);
							new AddTagModal(
								this.app,
								existingTags,
								post.tags || [],
								async (tag) => {
									const currentTags = post.tags || [];
									if (currentTags.includes(tag)) return;
									const newTags = [...currentTags, tag];
									const postKey = getPostKey(post);
									const file = findExistingPostFile(
										this.plugin,
										this.currentFeedUrl!,
										postKey
									);
									if (file) {
										await setPostTags(this.plugin, file, newTags);
									}
									post.tags = newTags;
									this.render();
								}
							).open();
						})
				);

				if (post.tags && post.tags.length > 0) {
					menu.addItem((item) =>
						item
							.setTitle("Remove tag")
							.setIcon("x-circle")
							.onClick(() => {
								new RemoveTagModal(
									this.app,
									post.tags!,
									async (tag) => {
										const newTags = (post.tags || []).filter(
											(t) => t !== tag
										);
										const postKey = getPostKey(post);
										const file = findExistingPostFile(
											this.plugin,
											this.currentFeedUrl!,
											postKey
										);
										if (file) {
											await setPostTags(
												this.plugin,
												file,
												newTags
											);
										}
										post.tags = newTags;
										this.render();
									}
								).open();
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
				try {
					const linkContainer = meta.createEl("span", {
						cls: "rho-reader-card-link",
					});
					linkContainer.createEl("span", {
						text: new URL(post.link).hostname,
					});
				} catch {
					// invalid URL, skip hostname display
				}
			}

			if (post.tags && post.tags.length > 0) {
				const tagsRow = card.createEl("div", {
					cls: "rho-reader-card-tags",
				});
				for (const tag of post.tags) {
					tagsRow.createEl("span", {
						cls: "rho-reader-tag",
						text: tag,
					});
				}
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
		const unreadCount = this.posts.filter((p) => !p.read).length;
		for (const post of this.posts) {
			post.read = true;
		}
		this.render();
		if (unreadCount > 0) {
			this.plugin.setFeedCountsDirect(
				this.currentFeedUrl,
				this.posts.length,
				0
			);
		}
		this.plugin.persistAllPostsRead(this.currentFeedUrl, this.posts);
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
		rssFeedReaderBtn.createSpan({ text: "Feed Reader" });
		rssFeedReaderBtn.addEventListener("click", () => {
			(this.plugin.app as any).commands.executeCommandById(
				"rho-reader:open-rss-feed-reader"
			);
		});

		const syncBtn = actions.createEl("button", {
			cls: "rho-reader-landing-btn",
		});
		setIcon(syncBtn.createSpan(), "refresh-cw");
		syncBtn.createSpan({ text: "Sync Feeds" });
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
		this.isLoading = true;
		this.render();
		const file = findFileForFeedUrl(this.plugin, this.currentFeedUrl);
		if (file) {
			await setFeedSyncStatus(this.plugin, file, "syncing");
			try {
				await updateFeedFrontmatter(
					this.plugin,
					this.currentFeedUrl,
					file
				);
				await setFeedSyncStatus(this.plugin, file, "synced");
			} catch (err) {
				console.error("Failed to sync feed:", err);
				await setFeedSyncStatus(this.plugin, file, "error");
			}
		}
		this.isLoading = false;
		this.loadPostsFromFiles(this.currentFeedUrl);
		this.render();
	}
}

class AddTagModal extends SuggestModal<string> {
	private allTags: string[];
	private currentTags: string[];
	private onChoose: (tag: string) => void;

	constructor(
		app: App,
		allTags: string[],
		currentTags: string[],
		onChoose: (tag: string) => void
	) {
		super(app);
		this.allTags = allTags;
		this.currentTags = currentTags;
		this.onChoose = onChoose;
		this.setPlaceholder("Type a tag name…");
	}

	getSuggestions(query: string): string[] {
		const q = query.trim().toLowerCase();
		const filtered = this.allTags.filter(
			(t) => !this.currentTags.includes(t) && t.toLowerCase().includes(q)
		);
		if (q && !this.allTags.includes(query.trim())) {
			filtered.unshift(query.trim());
		}
		return filtered;
	}

	renderSuggestion(tag: string, el: HTMLElement) {
		el.setText(tag);
	}

	onChooseSuggestion(tag: string) {
		this.onChoose(tag);
	}
}

class RemoveTagModal extends SuggestModal<string> {
	private tags: string[];
	private onChoose: (tag: string) => void;

	constructor(app: App, tags: string[], onChoose: (tag: string) => void) {
		super(app);
		this.tags = tags;
		this.onChoose = onChoose;
		this.setPlaceholder("Select a tag to remove…");
	}

	getSuggestions(query: string): string[] {
		const q = query.trim().toLowerCase();
		return this.tags.filter((t) => t.toLowerCase().includes(q));
	}

	renderSuggestion(tag: string, el: HTMLElement) {
		el.setText(tag);
	}

	onChooseSuggestion(tag: string) {
		this.onChoose(tag);
	}
}
