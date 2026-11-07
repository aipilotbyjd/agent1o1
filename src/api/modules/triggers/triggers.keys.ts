import { createKeys } from '@/api/core';

export const triggerKeys = createKeys('triggers');

export const triggerEventKeys = {
	list: (ws: string, id: string) => ['triggers', ws, 'detail', id, 'events'] as const,
	feed: (ws: string, id: string, status?: string[]) =>
		['triggers', ws, 'detail', id, 'events', 'feed', status ?? []] as const,
};
