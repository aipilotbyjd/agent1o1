import type {
	TNotificationEventCatalogEntry,
	TResolvedNotificationSetting,
} from '@/types/notification.type';

export type TStoredSetting = { in_app: boolean; email: boolean; email_digest: boolean };

/**
 * What one event resolves to, exactly as the API decides it: the event's own
 * row, else its category's, else the event's defaults. A mandatory event is
 * always its defaults.
 */
export const resolveSetting = (
	entry: TNotificationEventCatalogEntry,
	categoryKey: string,
	stored: Map<string, TStoredSetting>,
): TResolvedNotificationSetting => {
	if (!entry.mandatory) {
		const own = stored.get(entry.key);
		if (own) return { ...own, source: 'event' };
		const category = stored.get(categoryKey);
		if (category) return { ...category, source: 'category' };
	}
	return { ...entry.defaults, email_digest: false, source: 'default' };
};
