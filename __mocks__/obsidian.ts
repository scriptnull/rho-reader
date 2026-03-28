export class Notice {
	constructor(_message: string) {}
}

export class TFile {
	path: string = "";
}

export class TFolder {}

export class Modal {
	app: unknown;
	contentEl: HTMLElement;

	constructor(app: unknown) {
		this.app = app;
		this.contentEl = document.createElement("div");
	}

	open() {}
	close() {}
	onOpen() {}
	onClose() {}
}

export class ItemView {
	app: unknown;
	containerEl: HTMLElement;
	contentEl: HTMLElement;

	constructor() {
		this.containerEl = document.createElement("div");
		this.contentEl = document.createElement("div");
	}

	getViewType() {
		return "";
	}
	getDisplayText() {
		return "";
	}
	onOpen() {
		return Promise.resolve();
	}
	onClose() {
		return Promise.resolve();
	}
}

export class Plugin {
	app: unknown;
	manifest: unknown;

	constructor(app: unknown, manifest: unknown) {
		this.app = app;
		this.manifest = manifest;
	}

	loadData() {
		return Promise.resolve({});
	}
	saveData(_data: unknown) {
		return Promise.resolve();
	}
	addCommand(_command: unknown) {}
	addSettingTab(_tab: unknown) {}
	registerView(_type: string, _viewCreator: unknown) {}
}

export class PluginSettingTab {
	app: unknown;
	plugin: unknown;
	containerEl: HTMLElement;

	constructor(app: unknown, plugin: unknown) {
		this.app = app;
		this.plugin = plugin;
		this.containerEl = document.createElement("div");
	}

	display() {}
	hide() {}
}

export class Setting {
	constructor(_containerEl: HTMLElement) {}
	setName(_name: string) {
		return this;
	}
	setDesc(_desc: string) {
		return this;
	}
	addText(_cb: unknown) {
		return this;
	}
	addToggle(_cb: unknown) {
		return this;
	}
	addDropdown(_cb: unknown) {
		return this;
	}
	addButton(_cb: unknown) {
		return this;
	}
}

export class WorkspaceLeaf {}

export class Menu {
	addItem(_cb: (item: MenuItem) => void) { _cb(new MenuItem()); return this; }
	showAtMouseEvent(_evt: MouseEvent) {}
}

export class MenuItem {
	setTitle(_title: string) { return this; }
	setIcon(_icon: string) { return this; }
	onClick(_cb: () => void) { return this; }
}

export class SuggestModal<T> {
	app: unknown;
	constructor(app: unknown) { this.app = app; }
	setPlaceholder(_placeholder: string) {}
	getSuggestions(_query: string): T[] { return []; }
	renderSuggestion(_item: T, _el: HTMLElement) {}
	onChooseSuggestion(_item: T) {}
	open() {}
	close() {}
}

export function setIcon(_el: HTMLElement, _icon: string) {}
