import { describe, it, expect, vi } from "vitest";
import type { TFile } from "obsidian";
import type RhoReader from "../../main";
import { modifyFrontmatter } from "./frontmatter";

function createMockPlugin(initialContent: string): {
	plugin: RhoReader;
	file: TFile;
} {
	const file = { path: "test.md" } as TFile;
	let current = initialContent;
	const plugin = {
		app: {
			vault: {
				read: vi.fn(async () => current),
				modify: vi.fn(async (_f: TFile, next: string) => {
					current = next;
				}),
			},
		},
	} as unknown as RhoReader;
	return { plugin, file };
}

describe("modifyFrontmatter", () => {
	it("returns false when the file has no frontmatter", async () => {
		const { plugin, file } = createMockPlugin("no frontmatter here");
		const mutator = vi.fn();

		const result = await modifyFrontmatter(plugin, file, mutator);

		expect(result).toBe(false);
		expect(mutator).not.toHaveBeenCalled();
		expect(plugin.app.vault.modify).not.toHaveBeenCalled();
	});

	it("returns false when the closing --- is missing", async () => {
		const { plugin, file } = createMockPlugin("---\nfoo: bar\nno close");
		const result = await modifyFrontmatter(plugin, file, () => {});

		expect(result).toBe(false);
		expect(plugin.app.vault.modify).not.toHaveBeenCalled();
	});

	it("returns false and does not write when YAML fails to parse", async () => {
		const { plugin, file } = createMockPlugin(
			"---\n: : :\n---\nbody"
		);
		vi.spyOn(console, "error").mockImplementation(() => {});

		const result = await modifyFrontmatter(plugin, file, () => {});

		expect(result).toBe(false);
		expect(plugin.app.vault.modify).not.toHaveBeenCalled();
	});

	it("applies the mutator and writes the file back", async () => {
		const { plugin, file } = createMockPlugin(
			"---\nfoo: bar\n---\nbody text"
		);

		const result = await modifyFrontmatter(plugin, file, (fm) => {
			fm.foo = "baz";
			fm.added = 1;
		});

		expect(result).toBe(true);
		const written = vi.mocked(plugin.app.vault.modify).mock.calls[0][1];
		expect(written).toContain("foo: baz");
		expect(written).toContain("added: 1");
		expect(written).toMatch(/---\nfoo: baz\nadded: 1\n---\nbody text$/);
	});

	it("supports async mutators", async () => {
		const { plugin, file } = createMockPlugin(
			"---\nfoo: bar\n---\nbody"
		);

		await modifyFrontmatter(plugin, file, async (fm) => {
			await Promise.resolve();
			fm.foo = "async-baz";
		});

		const written = vi.mocked(plugin.app.vault.modify).mock.calls[0][1];
		expect(written).toContain("foo: async-baz");
	});

	it("does not accumulate leading blank lines across repeated edits", async () => {
		// Regression: setFeedSyncStatus used to leave a leading \n in the body,
		// which grew by one newline on every sync. Running the helper three
		// times in a row must produce the same format each time.
		const { plugin, file } = createMockPlugin(
			"---\nstatus: initial\n---\nbody"
		);

		await modifyFrontmatter(plugin, file, (fm) => {
			fm.status = "a";
		});
		await modifyFrontmatter(plugin, file, (fm) => {
			fm.status = "b";
		});
		await modifyFrontmatter(plugin, file, (fm) => {
			fm.status = "c";
		});

		const final = vi.mocked(plugin.app.vault.modify).mock.calls.at(-1)![1];
		expect(final).toBe("---\nstatus: c\n---\nbody");
	});

	it("preserves the body verbatim (including its own leading newline)", async () => {
		const { plugin, file } = createMockPlugin(
			"---\nfoo: bar\n---\n\n\nfirst paragraph"
		);

		await modifyFrontmatter(plugin, file, (fm) => {
			fm.foo = "baz";
		});

		const written = vi.mocked(plugin.app.vault.modify).mock.calls[0][1];
		// Only the single separator newline immediately after the closing ---
		// is consumed; any blank lines that were part of the body remain.
		expect(written).toBe("---\nfoo: baz\n---\n\n\nfirst paragraph");
	});
});
