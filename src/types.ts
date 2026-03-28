export interface FeedPost {
	title: string;
	link: string;
	pubDate: string;
	guid: string;
	description?: string;
	read?: boolean;
	tags?: string[];
}
