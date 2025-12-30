export interface RhoReaderSettings {
	rssPostsFolder: string;
	rssFeedBaseFile: string;
}

export const DEFAULT_SETTINGS: RhoReaderSettings = {
	rssPostsFolder: "Posts",
	rssFeedBaseFile: "Feeds.base",
};

export const defaultBaseContent = `
properties:
  note.rho_unread_posts_count:
    displayName: Unread
views:
  - type: cards
    name: All Feeds
    filters:
      and:
        - file.hasProperty("feed_url")
    order:
      - file.name
      - rho_unread_posts_count
    sort:
      - property: file.name
        direction: ASC
`;
