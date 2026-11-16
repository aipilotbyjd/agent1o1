// ============================================================
// Changelog Types
// ------------------------------------------------------------
// Release notes written by the operator. The public changelog and
// the signed-in one share this shape; only `is_read` is member-only.
// ============================================================

export type TChangelogCategory =
	| 'feature'
	| 'improvement'
	| 'fix'
	| 'security'
	| 'deprecation'
	| 'breaking';

export type TChangelogEntry = {
	id: string;
	slug: string;
	version: string | null;
	title: string;
	summary: string;
	/** Markdown source. Rendered client-side with raw HTML disabled. */
	body: string;
	cover_image_url: string | null;
	category: TChangelogCategory;
	category_label: string;
	areas: string[];
	is_pinned: boolean;
	is_major: boolean;
	published_at: string;
	/** Only present when signed in. */
	is_read?: boolean;
};

export type TChangelogParams = {
	page?: number;
	per_page?: number;
	category?: TChangelogCategory | '';
	area?: string;
	q?: string;
	pinned?: boolean;
};
