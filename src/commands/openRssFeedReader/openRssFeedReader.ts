import type RhoReader from "../../main";
import { defaultBaseContent } from "../../settings/settings";

async function ensureFolderExists(
	plugin: RhoReader,
	folderPath: string
): Promise<void> {
	const folder = plugin.app.vault.getAbstractFileByPath(folderPath);
	if (!folder) {
		await plugin.app.vault.createFolder(folderPath);
	}
}

export async function openRssFeedReader(plugin: RhoReader): Promise<void> {
	const rhoFolder = plugin.settings.rhoFolder;
	const baseFilePath = `${rhoFolder}/${plugin.settings.rssFeedBaseFile}`;

	await ensureFolderExists(plugin, rhoFolder);

	const existingFile = plugin.app.vault.getAbstractFileByPath(baseFilePath);
	if (!existingFile) {
		await plugin.app.vault.create(baseFilePath, defaultBaseContent.trim());
	}

	plugin.app.workspace.openLinkText(baseFilePath, "", false);
}
