import { Modal, setIcon } from "obsidian";
import type RhoReader from "../../main";

export interface FeedToImport {
	title: string;
	xmlUrl: string;
	htmlUrl?: string;
}

export interface ImportPreview {
	toImport: FeedToImport[];
	alreadyExists: FeedToImport[];
}

export class ImportOpmlModal extends Modal {
	private preview: ImportPreview;
	private onConfirm: () => void;

	constructor(plugin: RhoReader, preview: ImportPreview, onConfirm: () => void) {
		super(plugin.app);
		this.preview = preview;
		this.onConfirm = onConfirm;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("rho-import-modal");

		contentEl.createEl("h2", { text: "Import OPML" });

		const summary = contentEl.createDiv({ cls: "rho-import-summary" });
		summary.createSpan({ 
			text: `${this.preview.toImport.length} new feed${this.preview.toImport.length !== 1 ? "s" : ""} to import`,
			cls: "rho-import-summary-new"
		});
		summary.createSpan({ text: " • " });
		summary.createSpan({ 
			text: `${this.preview.alreadyExists.length} already exist${this.preview.alreadyExists.length !== 1 ? "" : "s"}`,
			cls: "rho-import-summary-existing"
		});

		const tabsContainer = contentEl.createDiv({ cls: "rho-import-tabs" });
		const newTab = tabsContainer.createEl("button", { 
			text: `New (${this.preview.toImport.length})`,
			cls: "rho-import-tab rho-import-tab--active"
		});
		const existingTab = tabsContainer.createEl("button", { 
			text: `Already imported (${this.preview.alreadyExists.length})`,
			cls: "rho-import-tab"
		});

		const listContainer = contentEl.createDiv({ cls: "rho-import-list-container" });
		
		const newList = this.createFeedList(this.preview.toImport, "new");
		const existingList = this.createFeedList(this.preview.alreadyExists, "existing");
		existingList.style.display = "none";
		
		listContainer.appendChild(newList);
		listContainer.appendChild(existingList);

		newTab.onclick = () => {
			newTab.addClass("rho-import-tab--active");
			existingTab.removeClass("rho-import-tab--active");
			newList.style.display = "block";
			existingList.style.display = "none";
		};

		existingTab.onclick = () => {
			existingTab.addClass("rho-import-tab--active");
			newTab.removeClass("rho-import-tab--active");
			existingList.style.display = "block";
			newList.style.display = "none";
		};

		const buttonsContainer = contentEl.createDiv({ cls: "rho-import-buttons" });
		
		const cancelBtn = buttonsContainer.createEl("button", { 
			text: "Cancel",
			cls: "rho-import-btn"
		});
		cancelBtn.onclick = () => this.close();

		const importBtn = buttonsContainer.createEl("button", { 
			text: `Import ${this.preview.toImport.length} feed${this.preview.toImport.length !== 1 ? "s" : ""}`,
			cls: "rho-import-btn rho-import-btn--primary"
		});
		importBtn.disabled = this.preview.toImport.length === 0;
		importBtn.onclick = () => {
			this.close();
			this.onConfirm();
		};
	}

	private createFeedList(feeds: FeedToImport[], type: "new" | "existing"): HTMLElement {
		const list = createDiv({ cls: "rho-import-feed-list" });
		
		if (feeds.length === 0) {
			const empty = list.createDiv({ cls: "rho-import-empty" });
			empty.setText(type === "new" ? "No new feeds to import" : "No existing feeds found");
			return list;
		}

		for (const feed of feeds) {
			const item = list.createDiv({ cls: "rho-import-feed-item" });
			
			const iconEl = item.createSpan({ cls: "rho-import-feed-icon" });
			setIcon(iconEl, type === "new" ? "plus-circle" : "check-circle");
			
			const info = item.createDiv({ cls: "rho-import-feed-info" });
			info.createDiv({ text: feed.title, cls: "rho-import-feed-title" });
			info.createDiv({ text: feed.xmlUrl, cls: "rho-import-feed-url" });
		}
		
		return list;
	}

	onClose() {
		this.contentEl.empty();
	}
}
