import { useQuery } from '@tanstack/react-query';
import { CatalogService } from './catalog.service';
import { catalogKeys } from './catalog.keys';

// ============================================================
// Catalog Hooks
// ------------------------------------------------------------
// All reads, all cached long — this is reference data that changes
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

export const useModelCatalog = () =>
	useQuery({
		queryKey: catalogKeys.modelCatalog(),
		queryFn: ({ signal }) => CatalogService.modelCatalog(signal),
		staleTime: STALE_TIME,
	});
