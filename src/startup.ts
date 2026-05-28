import type RhoReader from "./main";
import {
	findExistingPostFile,
	setPostReadState,
	setFeedSyncStatus,
} from "./commands/utils";

type LegacyPostReadState = { read: boolean; readAt?: number };
type LegacyReadState = Record<string, Record<string, LegacyPostReadState>>;

// One-shot migration from the data.json read state (legacy shape) to per-post
// file frontmatter. Runs at most once per vault.
export async function migrateLegacyReadState(plugin: RhoReader): Promise<void> {
	if (plugin.settings.readStateMigrated) return;

	const legacy = plugin.settings as { readState?: LegacyReadState };
	const readState = legacy.readState;

	if (readState) {
		for (const [feedUrl, readStateForFeed] of Object.entries(readState)) {
			for (const [postKey, state] of Object.entries(readStateForFeed)) {
				if (!state.read) continue;
				const postFile = findExistingPostFile(plugin, feedUrl, postKey);
				if (postFile) {
					await setPostReadState(plugin, postFile, true, state.readAt);
				}
			}
		}
	}

	plugin.settings.readStateMigrated = true;
	delete legacy.readState;
	await plugin.saveSettings();
}

// Reset sync statuses that were left in-progress when the app last shut down.
export async function clearStaleSyncStatuses(plugin: RhoReader): Promise<void> {
	const files = plugin.app.vault.getMarkdownFiles();
	for (const file of files) {
		const cache = plugin.app.metadataCache.getFileCache(file);
		const status = cache?.frontmatter?.rho_sync_status;
		if (status === "syncing" || status === "queued") {
			await setFeedSyncStatus(plugin, file, "error");
		}
	}
}
