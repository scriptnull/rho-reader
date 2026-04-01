import { Modal } from "obsidian";
import type RhoReader from "../../main";
import { addFeedByUrl } from "./addFeedByUrl";

export class AddFeedModal extends Modal {
	plugin: RhoReader;

	constructor(plugin: RhoReader) {
		super(plugin.app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h3", { text: "Add Feed" });
		const input = contentEl.createEl("input", {
			type: "url",
			placeholder: "https://example.com/feed.xml",
		});
		input.style.width = "100%";
		input.style.marginBottom = "12px";
		input.addEventListener("keydown", (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				this.close();
				addFeedByUrl(this.plugin, input.value);
			}
		});
		const btn = contentEl.createEl("button", {
			cls: "mod-cta",
			text: "Add Feed",
		});
		btn.addEventListener("click", () => {
			this.close();
			addFeedByUrl(this.plugin, input.value);
		});
	}

	onClose() {
		this.contentEl.empty();
	}
}
