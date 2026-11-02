export const publicPageKeys = {
	root: ['public-pages'] as const,
	detail: (token: string) => ['public-pages', token] as const,
	submission: (token: string, id: string) => ['public-pages', token, 'submission', id] as const,
};
