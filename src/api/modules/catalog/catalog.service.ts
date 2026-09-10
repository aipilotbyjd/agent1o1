import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type { TNodeCategory, TTriggerPreset, TModelCatalogEntry } from '@/types/catalog.type';
import type { TBuiltinNode } from '@/types/node.type';
import { CatalogEndpoints as E } from './catalog.endpoints';

export type TNodeCategoryWithCount = TNodeCategory & { nodes_count: number; nodes?: TBuiltinNode[] };

export const CatalogService = {
	nodeCategories: (includeNodes = false, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ categories: TNodeCategoryWithCount[] }>>(E.nodeCategories, {
				params: includeNodes ? { include_nodes: 1 } : undefined,
				signal,
			})
			.then(unwrapKey<TNodeCategoryWithCount[]>('categories')),

	nodeCategory: (id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ category: TNodeCategory; nodes: TBuiltinNode[]; nodes_count: number }>>(
				E.nodeCategory(id),
				{ signal },
			)
			.then((r) => r.data.data),

	/** Grouped by preset category, e.g. `{ github: [...], stripe: [...] }`. */
	triggerPresets: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ presets: Record<string, TTriggerPreset[]> }>>(E.triggerPresets, {
				signal,
			})
			.then(unwrapKey<Record<string, TTriggerPreset[]>>('presets')),

	modelCatalog: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ model_catalog: TModelCatalogEntry[] }>>(E.modelCatalog, { signal })
			.then(unwrapKey<TModelCatalogEntry[]>('model_catalog')),
};
