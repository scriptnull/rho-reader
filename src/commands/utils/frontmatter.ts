import * as yaml from "js-yaml";
import { TFile } from "obsidian";
import type RhoReader from "../../main";

/**
 * Reads a markdown file's YAML frontmatter, lets the mutator modify it,
 * and writes the file back with a consistent format.
 *
 * Single source of truth for the read → parse → mutate → dump → write cycle
 * so every caller produces the same on-disk format (no accumulating blank
 * lines, no inconsistent frontmatter delimiters).
 *
 * Returns false (without writing) if the file has no frontmatter or the
 * frontmatter fails to parse.
 */
export async function modifyFrontmatter(
	plugin: RhoReader,
	file: TFile,
	mutator: (fm: Record<string, unknown>) => void | Promise<void>
): Promise<boolean> {
	const content = await plugin.app.vault.read(file);
	if (!content.startsWith("---")) return false;

	const endFm = content.indexOf("---", 3);
	if (endFm === -1) return false;

	const fmRaw = content.substring(3, endFm).trim();
	const afterClosing = content.substring(endFm + 3);
	const body = afterClosing.startsWith("\n")
		? afterClosing.substring(1)
		: afterClosing;

	let fm: Record<string, unknown>;
	try {
		fm = (yaml.load(fmRaw) as Record<string, unknown>) || {};
	} catch (e) {
		console.error(
			"[Rho Reader] Failed to parse frontmatter:",
			file.path,
			e
		);
		return false;
	}

	await mutator(fm);

	await plugin.app.vault.modify(
		file,
		`---\n${yaml.dump(fm)}---\n${body}`
	);
	return true;
}
