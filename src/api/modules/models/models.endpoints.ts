export const ModelEndpoints = {
	settings: (ws: string) => `/workspaces/${ws}/model-settings`,
	trial: (ws: string, slug: string) =>
		`/workspaces/${ws}/model-catalog/${encodeURIComponent(slug)}/try`,
} as const;
