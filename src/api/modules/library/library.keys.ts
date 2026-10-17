import type { TLibraryListParams } from '@/types/library.type';

export const libraryKeys = {
	all: (ws: string) => ['library', ws] as const,
	list: (ws: string, params?: TLibraryListParams) =>
		['library', ws, 'list', params ?? {}] as const,
};
