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
  note.rho_unread_posts:
    displayName: Unread
  note.rho_all_posts:
    displayName: All
views:
  - type: cards
    name: All Feeds
    filters:
      and:
        - file.hasProperty("feed_url")
    order:
      - file.name
      - rho_unread_posts
      - rho_all_posts
    sort:
      - property: file.name
        direction: ASC
  - type: cards
    name: Unread
    filters:
      and:
        - file.hasProperty("feed_url")
        - note.rho_unread_posts > 0
    order:
      - file.name
      - rho_unread_posts
      - rho_all_posts
    sort:
      - property: note.rho_unread_posts
        direction: DESC
`;
