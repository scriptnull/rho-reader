import { moment, TFile } from "obsidian";
import type RhoReader from "../../main";
import { modifyFrontmatter } from "./frontmatter";

export type SyncStatus = "queued" | "syncing" | "synced" | "error";

export async function setFeedSyncStatus(
	plugin: RhoReader,
	file: TFile,
	status: SyncStatus
): Promise<void> {
	await modifyFrontmatter(plugin, file, (fm) => {
		if (status === "synced") {
			const time = moment().format("MMM D, h:mm A");
			fm.rho_sync_status = `synced @ ${time}`;
			fm.rho_last_synced_at = new Date().toISOString();
		} else {
			fm.rho_sync_status = status;
		}
	});
}
