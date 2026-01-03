export interface OpmlFeed {
	title: string;
	xmlUrl: string;
	htmlUrl?: string;
}

export function parseOpml(opmlContent: string): OpmlFeed[] {
	const feeds: OpmlFeed[] = [];

	const parser = new DOMParser();
	const doc = parser.parseFromString(opmlContent, "text/xml");

	const outlines = doc.querySelectorAll("outline[xmlUrl]");
	outlines.forEach((outline) => {
		const xmlUrl = outline.getAttribute("xmlUrl");
		if (xmlUrl) {
			feeds.push({
				title:
					outline.getAttribute("title") ||
					outline.getAttribute("text") ||
					xmlUrl,
				xmlUrl,
				htmlUrl: outline.getAttribute("htmlUrl") || undefined,
			});
		}
	});

	return feeds;
}
