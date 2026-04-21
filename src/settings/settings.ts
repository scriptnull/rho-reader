export interface RhoReaderSettings {
	rhoFolder: string;
	rssFeedBaseFile: string;
	postsFolder: string;
	syncConcurrency: number;
	/** @deprecated Flag retained so the one-shot migration in onload runs at most once */
	readStateMigrated: boolean;
}

export const DEFAULT_SETTINGS: RhoReaderSettings = {
	rhoFolder: "Rho",
	rssFeedBaseFile: "Reader.base",
	postsFolder: "Posts",
	syncConcurrency: 5,
	readStateMigrated: false,
};

export const defaultBaseContent = `
properties:
  note.rho_unread_posts:
    displayName: Unread
  note.rho_sync_status:
    displayName: Status
  note.rho_last_synced_at:
    displayName: Last Synced
views:
  - type: cards
    name: All Feeds
    filters:
      and:
        - file.hasProperty("feed_url")
    order:
      - file.name
      - rho_unread_posts
      - rho_sync_status
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
      - rho_sync_status
    sort:
      - property: note.rho_unread_posts
        direction: DESC
`;
