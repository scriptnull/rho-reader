import { ItemView, WorkspaceLeaf } from "obsidian";
import { VIEW_TYPE_RHO_READER } from "../constants";
import type RhoReader from "../main";

export class RhoReaderPane extends ItemView {
	plugin: RhoReader;
	currentFeedUrl: string | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: RhoReader) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_RHO_READER;
	}

	getDisplayText() {
		return "Feed URL";
	}

	getIcon() {
		return "rss";
	}

	async onOpen() {
		this.render();
	}

	async setFeedUrl(url: string | null) {
		this.currentFeedUrl = url;
		this.render();
	}

	render() {
		const container = this.containerEl.children[1];
		container.empty();
		if (this.currentFeedUrl) {
			container.createEl("div", { text: this.currentFeedUrl });
		} else {
			container.createEl("div", { text: "No feed" });
		}
	}
}
