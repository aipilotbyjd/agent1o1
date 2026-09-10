// ============================================================
// Catalog Query Keys
// ------------------------------------------------------------
// Global data — no workspace scope, so these skip createKeys().
// ============================================================
export const catalogKeys = {
	nodeCategories: (includeNodes?: boolean) => ['catalog', 'node-categories', !!includeNodes] as const,
	nodeCategory: (id: string) => ['catalog', 'node-categories', 'detail', id] as const,
	triggerPresets: () => ['catalog', 'trigger-presets'] as const,
	modelCatalog: () => ['catalog', 'model-catalog'] as const,
};
