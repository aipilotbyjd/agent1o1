import { createKeys } from '@/api/core';

export const triggerKeys = createKeys('triggers');

export const triggerEventKeys = {
	list: (ws: string, id: string) => ['triggers', ws, 'detail', id, 'events'] as const,
};
