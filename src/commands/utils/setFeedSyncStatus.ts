import * as yaml from "js-yaml";
import { moment, TFile } from "obsidian";
import type RhoReader from "../../main";

export type SyncStatus = "queued" | "syncing" | "synced" | "error";

export async function setFeedSyncStatus(
	plugin: RhoReader,
	file: TFile,
	status: SyncStatus
): Promise<void> {
	const content = await plugin.app.vault.read(file);
	if (!content.startsWith("---")) return;
	const endFm = content.indexOf("---", 3);
	if (endFm === -1) return;

	const fmRaw = content.substring(3, endFm).trim();
	const body = content.substring(endFm + 3);

	let fm: Record<string, unknown> = {};
	try {
		fm = (yaml.load(fmRaw) as Record<string, unknown>) || {};
	} catch (e) {
		console.error("[Rho Reader] Failed to parse feed frontmatter:", e);
		return;
	}

	if (status === "synced") {
		const time = moment().format("MMM D, h:mm A");
		fm.rho_sync_status = `synced @ ${time}`;
		fm.rho_last_synced_at = new Date().toISOString();
	} else {
		fm.rho_sync_status = status;
	}

	await plugin.app.vault.modify(file, `---\n${yaml.dump(fm)}---${body}`);
}
