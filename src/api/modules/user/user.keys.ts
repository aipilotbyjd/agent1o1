// ============================================================
// User Query Keys
// ------------------------------------------------------------
// `current()` is a singleton — one current user per session, not a
// workspace-scoped collection, so this skips createKeys(). API keys
// are workspace-scoped, so they use the standard factory shape.
// ============================================================
export const userKeys = {
	current: () => ['user', 'me'] as const,
};

export const apiKeyKeys = {
	all: (ws: string) => ['api-keys', ws] as const,
	lists: (ws: string) => ['api-keys', ws, 'list'] as const,
	list: (ws: string) => ['api-keys', ws, 'list'] as const,
};
