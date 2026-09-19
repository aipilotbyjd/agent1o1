import type { TListParams } from '@/api/core';

export const creditKeys = {
	all: (ws: string) => ['credits', ws] as const,
	balance: (ws: string) => ['credits', ws, 'balance'] as const,
	transactions: (ws: string, params?: TListParams) =>
		['credits', ws, 'transactions', params] as const,
	packs: (ws: string) => ['credits', ws, 'packs'] as const,
};
