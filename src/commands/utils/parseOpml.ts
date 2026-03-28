export interface OpmlFeed {
	title: string;
	xmlUrl: string;
	htmlUrl?: string;
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export function serializeOpml(feeds: OpmlFeed[]): string {
	const outlines = feeds
		.map((f) => {
			const htmlUrlAttr = f.htmlUrl
				? ` htmlUrl="${escapeXml(f.htmlUrl)}"`
				: "";
			return `    <outline type="rss" text="${escapeXml(f.title)}" title="${escapeXml(f.title)}" xmlUrl="${escapeXml(f.xmlUrl)}"${htmlUrlAttr}/>`;
		})
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>\n<opml version="2.0">\n  <head><title>Rho Reader Feeds</title></head>\n  <body>\n${outlines}\n  </body>\n</opml>`;
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
