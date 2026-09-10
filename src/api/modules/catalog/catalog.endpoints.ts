// ============================================================
// Catalog Endpoints
// ------------------------------------------------------------
// Global reference data — not workspace-scoped, and not gated
// behind `workspace.context`. Template catalogs are workspace-
// scoped resources on the real backend and live in the `templates`
// module, not here.
// ============================================================
export const CatalogEndpoints = {
	nodeCategories: '/node-categories',
	nodeCategory: (id: string) => `/node-categories/${id}`,
	triggerPresets: '/catalog/trigger-presets',
	modelCatalog: '/model-catalog',
} as const;
