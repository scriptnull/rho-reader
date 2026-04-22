import type RhoReader from "../../main";
import type { FeedPost } from "../../types";
import { getPostKey } from "./postFiles";

type PendingReadEntry = {
	feedUrl: string;
	post: FeedPost;
};

function storageKey(plugin: RhoReader): string {
	return `rho-reader:pending-reads:${plugin.app.vault.getName()}`;
}

function entryKey(entry: PendingReadEntry): string {
	return `${entry.feedUrl}::${getPostKey(entry.post)}`;
}

function readQueue(plugin: RhoReader): PendingReadEntry[] {
	try {
		const raw = localStorage.getItem(storageKey(plugin));
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(
			(e): e is PendingReadEntry =>
				e && typeof e.feedUrl === "string" && e.post && typeof e.post === "object"
		);
	} catch {
		return [];
	}
}

function writeQueue(plugin: RhoReader, queue: PendingReadEntry[]): void {
	try {
		localStorage.setItem(storageKey(plugin), JSON.stringify(queue));
	} catch (err) {
		console.error("[Rho Reader] Failed to persist pending reads:", err);
	}
}

// Synchronously record a "mark read" intent. Called from the click handler
// before window.open so the intent survives the WebView being suspended when
// the system browser takes over on mobile.
export function enqueuePendingRead(
	plugin: RhoReader,
	feedUrl: string,
	post: FeedPost
): void {
	const queue = readQueue(plugin);
	const key = entryKey({ feedUrl, post });
	if (queue.some((e) => entryKey(e) === key)) return;
	queue.push({ feedUrl, post });
	writeQueue(plugin, queue);
}

let drainInFlight: Promise<void> | null = null;

// Run queued markPostRead calls and remove each entry once the vault writes
// complete. Safe to call repeatedly — overlapping calls share a single pass.
export function drainPendingReads(plugin: RhoReader): Promise<void> {
	if (drainInFlight) return drainInFlight;
	drainInFlight = runDrain(plugin).finally(() => {
		drainInFlight = null;
	});
	return drainInFlight;
}

async function runDrain(plugin: RhoReader): Promise<void> {
	while (true) {
		const queue = readQueue(plugin);
		if (queue.length === 0) return;
		const entry = queue[0];
		const key = entryKey(entry);
		try {
			await plugin.markPostRead(entry.feedUrl, entry.post);
		} catch (err) {
			console.error("[Rho Reader] pending read drain failed:", err);
		}
		const current = readQueue(plugin);
		writeQueue(
			plugin,
			current.filter((e) => entryKey(e) !== key)
		);
	}
}
