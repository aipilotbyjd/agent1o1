import { formatDistanceToNow } from 'date-fns';

/** "3 hours ago". Returns null when the value is empty or not a valid date. */
const relativeTime = (iso?: string | null): string | null => {
	if (!iso) return null;
	try {
		return formatDistanceToNow(new Date(iso), { addSuffix: true });
	} catch {
		return null;
	}
};

export default relativeTime;
