// ============================================================
// Catalog Query Keys
// ------------------------------------------------------------
// Global data — no workspace scope, so these skip createKeys(). The model
// catalog is the one exception: its availability folds in a workspace's own
// AI provider keys, so it's keyed by the workspace it was asked for.
// ============================================================
export const catalogKeys = {
	nodeCategories: (includeNodes?: boolean) =>
		['catalog', 'node-categories', !!includeNodes] as const,
	nodeCategory: (id: string) => ['catalog', 'node-categories', 'detail', id] as const,
	triggerPresets: () => ['catalog', 'trigger-presets'] as const,
	modelCatalogs: () => ['catalog', 'model-catalog'] as const,
	modelCatalog: (ws?: string) => ['catalog', 'model-catalog', ws ?? null] as const,
};
