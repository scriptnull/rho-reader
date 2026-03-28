export interface PostReadState {
	read: boolean;
	readAt?: number;
}

export interface ReadStateByFeed {
	[postKey: string]: PostReadState;
}

export interface RhoReaderSettings {
	rhoFolder: string;
	rssFeedBaseFile: string;
	postsFolder: string;
	/** @deprecated Used only during migration to file-based post storage */
	readStateMigrated: boolean;
	/** @deprecated Read state is now stored in post file frontmatter */
	readState: {
		[feedUrl: string]: ReadStateByFeed;
	};
}

export const DEFAULT_SETTINGS: RhoReaderSettings = {
	rhoFolder: "Rho",
	rssFeedBaseFile: "Reader.base",
	postsFolder: "Posts",
	readStateMigrated: false,
	readState: {},
};

export const defaultBaseContent = `
properties:
  note.rho_unread_posts:
    displayName: Unread
views:
  - type: cards
    name: All Feeds
    filters:
      and:
        - file.hasProperty("feed_url")
    order:
      - file.name
      - rho_unread_posts
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
    sort:
      - property: note.rho_unread_posts
        direction: DESC
`;
