import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TNodeCategory } from '@/types/catalog.type';
import { CatalogService } from './catalog.service';
import { catalogKeys } from './catalog.keys';

// ============================================================
// Catalog Hooks
// ------------------------------------------------------------
// All reads, all cached long: this is reference data that changes
// rarely, not per-workspace state.
// ============================================================

const STALE_TIME = 30 * 60_000; // 30 minutes

export const useNodeCategories = (includeNodes = false) =>
	useQuery({
		queryKey: catalogKeys.nodeCategories(includeNodes),
		queryFn: ({ signal }) => CatalogService.nodeCategories(includeNodes, signal),
		staleTime: STALE_TIME,
	});

export const useNodeCategory = (id: string) =>
	useQuery({
		queryKey: catalogKeys.nodeCategory(id),
		queryFn: ({ signal }) => CatalogService.nodeCategory(id, signal),
		enabled: !!id,
		staleTime: STALE_TIME,
	});

export const useTriggerPresets = () =>
	useQuery({
		queryKey: catalogKeys.triggerPresets(),
		queryFn: ({ signal }) => CatalogService.triggerPresets(signal),
		staleTime: STALE_TIME,
	});

/**
 * Per workspace it reflects that workspace's keys, policy and model settings,
 * which can change in another tab, so it goes stale after a minute and is
 * refetched when the window regains focus.
 */
export const useModelCatalog = (ws?: string) =>
	useQuery({
		queryKey: catalogKeys.modelCatalog(ws),
		queryFn: ({ signal }) => CatalogService.modelCatalog(ws, signal),
		staleTime: ws ? 60_000 : STALE_TIME,
	});

type TCachedCategories = TNodeCategory[] | { category: TNodeCategory } | undefined;

const withPin = (cached: TCachedCategories, id: string, isPinned: boolean): TCachedCategories => {
	if (Array.isArray(cached)) {
		return cached.map((category) =>
			category.id === id ? { ...category, is_pinned: isPinned } : category,
		);
	}
	if (cached && 'category' in cached && cached.category.id === id) {
		return { ...cached, category: { ...cached.category, is_pinned: isPinned } };
	}
	return cached;
};

/**
 * Pins or unpins an app on the user's account. The cached lists change at once,
 * since they are kept for half an hour, and are put back if the server refuses.
 */
export const usePinNodeCategory = () => {
	const qc = useQueryClient();
	const scope = ['catalog', 'node-categories'] as const;

	return useMutation({
		mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
			CatalogService.pinNodeCategory(id, isPinned),
		onMutate: async ({ id, isPinned }) => {
			await qc.cancelQueries({ queryKey: scope });
			const previous = qc.getQueriesData<TCachedCategories>({ queryKey: scope });
			qc.setQueriesData<TCachedCategories>({ queryKey: scope }, (cached) =>
				withPin(cached, id, isPinned),
			);
			return { previous };
		},
		onError: (_error, _variables, context) => {
			context?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
		},
		meta: { errorMessage: 'Couldn’t update your pinned apps' },
	});
};
