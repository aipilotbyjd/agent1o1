// Two doors onto the same notes. The public one needs no sign-in and only
// carries entries marked public; the member one also carries members-only and
// audience entries, and what this member has read.
export const ChangelogEndpoints = {
	public: {
		list: '/public/changelog',
		detail: (slug: string) => `/public/changelog/${slug}`,
		rss: '/public/changelog/feed.rss',
	},
	member: {
		list: '/changelog',
		detail: (slug: string) => `/changelog/${slug}`,
		unreadCount: '/changelog/unread-count',
		latestMajor: '/changelog/latest-major',
		read: (slug: string) => `/changelog/${slug}/read`,
		readAll: '/changelog/read-all',
	},
} as const;
