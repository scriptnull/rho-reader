import { Modal, setIcon } from "obsidian";
import type RhoReader from "../main";
import { importOpml } from "../commands/importOpml";

export class WelcomeModal extends Modal {
	plugin: RhoReader;

	constructor(plugin: RhoReader) {
		super(plugin.app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass("rho-welcome-modal");

		const header = contentEl.createEl("div", {
			cls: "rho-welcome-header",
		});
		const iconEl = header.createEl("span", {
			cls: "rho-welcome-icon",
		});
		setIcon(iconEl, "rss");
		header.createEl("div", {
			cls: "rho-welcome-title",
			text: "Welcome to Rho Reader",
		});
		header.createEl("div", {
			cls: "rho-welcome-subtitle",
			text: "A reading companion for Obsidian. Follow your favorite blogs, news sites, and podcasts — all inside your vault.",
		});

		const steps = contentEl.createEl("div", {
			cls: "rho-welcome-steps",
		});

		this.createStep(
			steps,
			"1",
			"Add feeds",
			"Paste an RSS or Atom feed URL in the sidebar, or import feeds from another reader using OPML."
		);
		this.createStep(
			steps,
			"2",
			"Read & organize",
			"Posts appear in the sidebar when you select a feed. Right-click posts to tag them or take notes."
		);
		this.createStep(
			steps,
			"3",
			"Stay in sync",
			"Use the Sync command to fetch the latest posts from all your feeds at once."
		);

		const actions = contentEl.createEl("div", {
			cls: "rho-welcome-actions",
		});

		const getStartedBtn = actions.createEl("button", {
			cls: "rho-welcome-btn rho-welcome-btn--primary",
			text: "Get Started",
		});
		getStartedBtn.addEventListener("click", () => {
			this.close();
		});

		const importBtn = actions.createEl("button", {
			cls: "rho-welcome-btn",
		});
		setIcon(importBtn.createSpan(), "file-up");
		importBtn.createSpan({ text: "Import OPML" });
		importBtn.addEventListener("click", () => {
			this.close();
			importOpml(this.plugin);
		});
	}

	private createStep(
		container: HTMLElement,
		number: string,
		title: string,
		description: string
	) {
		const step = container.createEl("div", { cls: "rho-welcome-step" });
		step.createEl("div", {
			cls: "rho-welcome-step-number",
			text: number,
		});
		const content = step.createEl("div", {
			cls: "rho-welcome-step-content",
		});
		content.createEl("div", {
			cls: "rho-welcome-step-title",
			text: title,
		});
		content.createEl("div", {
			cls: "rho-welcome-step-desc",
			text: description,
		});
	}

	async onClose() {
		this.plugin.settings.hasSeenWelcome = true;
		await this.plugin.saveSettings();
		this.contentEl.empty();
	}
}
