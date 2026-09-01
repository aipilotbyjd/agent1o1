export const authKeys = {
	all: () => ['auth'] as const,
	user: () => ['auth', 'user'] as const,
};
