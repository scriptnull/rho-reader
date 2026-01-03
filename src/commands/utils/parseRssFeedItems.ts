export function parseRssFeedItems(text: string, feedUrl: string): Element[] {
	const parser = new DOMParser();

	let xmlDoc = parser.parseFromString(text, "application/xml");
	let parserError = xmlDoc.querySelector("parsererror");

	if (parserError) {
		console.warn(
			"[Rho Reader] XML parse failed, attempting text/html fallback:",
			feedUrl
		);
		xmlDoc = parser.parseFromString(text, "text/html");
		parserError = xmlDoc.querySelector("parsererror");
		if (parserError) {
			console.error(
				"[Rho Reader] RSS XML parse error:",
				feedUrl,
				parserError.textContent
			);
			console.debug("[Rho Reader] Response snippet:", text.slice(0, 500));
			return [];
		}
	}

	const items = xmlDoc.querySelectorAll("item");
	const entries = xmlDoc.querySelectorAll("entry");

	if (items.length === 0 && entries.length === 0) {
		console.warn(
			"[Rho Reader] No <item> or <entry> elements found in feed:",
			feedUrl
		);
		console.debug("[Rho Reader] Response snippet:", text.slice(0, 500));
		return [];
	}

	return items.length > 0 ? Array.from(items) : Array.from(entries);
}
