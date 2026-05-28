import { setIcon } from "obsidian";
import type RhoReader from "./main";

export class StatusBar {
	private el: HTMLElement;

	constructor(plugin: RhoReader) {
		this.el = plugin.addStatusBarItem();
		this.el.addClass("rho-reader-status-bar");
		this.el.setAttribute("data-tooltip-position", "top");
		this.setProcessing(false);
	}

	setProcessing(processing: boolean, text = ""): void {
		this.el.empty();
		setIcon(this.el, "rss");
		if (processing) {
			this.el.addClass("rho-reader-processing");
			this.el.removeClass("rho-reader-idle");
			const label = text
				? `Rho Reader: ${text}...`
				: "Rho Reader: Processing...";
			this.el.setAttribute("aria-label", label);
		} else {
			this.el.removeClass("rho-reader-processing");
			this.el.addClass("rho-reader-idle");
			this.el.setAttribute("aria-label", "Rho Reader");
		}
	}
}
