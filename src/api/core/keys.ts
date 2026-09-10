import type { QueryKey } from '@tanstack/react-query';
import type { TListParams } from '@/types/api.type';

// ============================================================
// Query Key Factory
// ------------------------------------------------------------
// One query-key shape for every workspace-scoped resource.
// `lists()`/`details()` are the point: invalidating `lists(ws)`
// refreshes list views and leaves open detail panes untouched,
// instead of nuking the whole resource on every mutation.
//
// Root is always kebab-case — keep it that way as modules are added.
// ============================================================
export const createKeys = (root: string) => ({
	root: [root] as const,
	all: (ws: string) => [root, ws] as const,
	lists: (ws: string) => [root, ws, 'list'] as const,
	list: (ws: string, params?: TListParams) => [root, ws, 'list', params ?? {}] as const,
	details: (ws: string) => [root, ws, 'detail'] as const,
	detail: (ws: string, id: string) => [root, ws, 'detail', id] as const,
});

export type TKeyFactory = ReturnType<typeof createKeys>;
export type { QueryKey };
