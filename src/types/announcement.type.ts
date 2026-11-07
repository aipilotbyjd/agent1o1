// ============================================================
// Announcement Types
// ------------------------------------------------------------
// Platform-wide banners and maintenance notices from the operator.
// Account-level, not workspace-scoped. The backend already filters
// by audience and by this member's dismissals, so whatever
// comes back is meant to be shown.
// ============================================================

export type TAnnouncementType = 'banner' | 'maintenance';
export type TAnnouncementSeverity = 'info' | 'warning' | 'critical';

export type TAnnouncement = {
	id: string;
	type: TAnnouncementType;
	severity: TAnnouncementSeverity;
	title: string;
	body: string | null;
	cta_label: string | null;
	cta_url: string | null;
	dismissible: boolean;
	/** The notice stops writes while its window is open. */
	blocks_writes: boolean;
	/** `now` is inside the notice's own window (maintenance can be shown ahead of it). */
	window_open: boolean;
	starts_at: string | null;
	ends_at: string | null;
	published_at: string;
};

export type TAnnouncementsPayload = {
	announcements: TAnnouncement[];
	maintenance_blocking_writes: boolean;
};

export type TCommunicationPreferences = {
	marketing_emails: boolean;
};
