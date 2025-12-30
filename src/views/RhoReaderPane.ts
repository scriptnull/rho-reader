import { ItemView, WorkspaceLeaf } from "obsidian";
import { VIEW_TYPE_RHO_READER } from "../constants";
import type RhoReader from "../main";

interface FeedPost {
	title: string;
	link: string;
	pubDate: string;
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
			const response = await fetch(url);
			const text = await response.text();
			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(text, "application/xml");
			const items = xmlDoc.querySelectorAll("item");
			const entries = xmlDoc.querySelectorAll("entry");
			const rawPosts: Element[] =
				items.length > 0 ? Array.from(items) : Array.from(entries);

			this.posts = rawPosts.map((post) => {
				const title =
					post.querySelector("title")?.textContent?.trim() ||
					"Untitled";
				let link = post.querySelector("link")?.textContent?.trim();
				if (!link && post.querySelector("link")) {
					link =
						post.querySelector("link")?.getAttribute("href") || "";
				}
				const pubDate =
					post.querySelector("pubDate")?.textContent?.trim() ||
					post.querySelector("published")?.textContent?.trim() ||
					"";
				return { title, link: link || "", pubDate };
			});
		} catch (err) {
			console.error("Failed to fetch RSS feed:", err);
			this.posts = [];
		}
		this.isLoading = false;
		this.render();
	}

	render() {
		const container = this.containerEl.children[1];
		container.empty();

		if (!this.currentFeedUrl) {
			container.createEl("div", { text: "No feed" });
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
			const card = list.createEl("div", { cls: "rho-reader-card" });

			const title = card.createEl("div", { cls: "rho-reader-card-title" });
			if (post.link) {
				const link = title.createEl("a", {
					text: post.title,
					href: post.link,
				});
				link.setAttr("target", "_blank");
			} else {
				title.createEl("span", { text: post.title });
			}

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
				linkContainer.createEl("a", {
					text: new URL(post.link).hostname,
					href: post.link,
					attr: { target: "_blank" },
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
}
