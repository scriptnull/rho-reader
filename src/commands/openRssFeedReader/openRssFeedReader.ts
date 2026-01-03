import type RhoReader from "../../main";

export function openRssFeedReader(plugin: RhoReader): void {
	const baseFilePath = plugin.settings.rssFeedBaseFile;
	plugin.app.workspace.openLinkText(baseFilePath, "", false);
}
