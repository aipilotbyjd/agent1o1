// Account-level, not workspace-scoped.
export const AnnouncementEndpoints = {
	list: '/announcements',
	dismiss: (id: string) => `/announcements/${id}/dismiss`,
} as const;
