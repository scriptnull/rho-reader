/**
 * Resolves a potentially relative URL against a base URL.
 * Returns the original link unchanged if resolution fails or link is empty.
 */
export function resolveUrl(link: string, baseUrl: string): string {
	if (!link) return link;
	try {
		return new URL(link, baseUrl).href;
	} catch {
		return link;
	}
}
