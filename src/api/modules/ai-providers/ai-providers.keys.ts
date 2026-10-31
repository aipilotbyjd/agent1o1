export const aiProviderKeys = {
	all: (ws: string) => ['ai-providers', ws] as const,
	providers: (ws: string) => ['ai-providers', ws, 'providers'] as const,
	credentials: (ws: string) => ['ai-providers', ws, 'credentials'] as const,
	policy: (ws: string) => ['ai-providers', ws, 'policy'] as const,
};
