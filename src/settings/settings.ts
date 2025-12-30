export interface PostReadState {
	read: boolean;
	readAt?: number;
}

export interface ReadStateByFeed {
	[postKey: string]: PostReadState;
}

export interface RhoReaderSettings {
	rssFeedBaseFile: string;
	readState: {
		[feedUrl: string]: ReadStateByFeed;
	};
}

export const DEFAULT_SETTINGS: RhoReaderSettings = {
	rssFeedBaseFile: "Feeds.base",
	readState: {},
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
