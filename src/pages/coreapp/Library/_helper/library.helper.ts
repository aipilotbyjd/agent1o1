import type { TLibraryItem } from '@/types/library.type';

/** Newest-first items, bucketed the way ChatGPT's library reads: Today, Yesterday, … */
export const groupByDate = (items: TLibraryItem[]) => {
	const startOfToday = new Date();
	startOfToday.setHours(0, 0, 0, 0);
	const day = 24 * 60 * 60 * 1000;

	const label = (createdAt: string) => {
		const time = new Date(createdAt).getTime();
		if (time >= startOfToday.getTime()) return 'Today';
		if (time >= startOfToday.getTime() - day) return 'Yesterday';
		if (time >= startOfToday.getTime() - 6 * day) return 'Earlier this week';
		if (time >= startOfToday.getTime() - 29 * day) return 'Earlier this month';
		return new Date(createdAt).toLocaleDateString([], { month: 'long', year: 'numeric' });
	};

	const groups: { label: string; items: TLibraryItem[] }[] = [];
	for (const item of items) {
		const group = label(item.created_at);
		const last = groups[groups.length - 1];
		if (last?.label === group) last.items.push(item);
		else groups.push({ label: group, items: [item] });
	}
	return groups;
};
