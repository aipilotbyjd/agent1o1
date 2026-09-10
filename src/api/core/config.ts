// ============================================================
// API Config
// ------------------------------------------------------------
// Single source of truth for every VITE_* env var the API layer
// reads. Fails loudly at boot instead of silently falling back to
// a dev host in a misconfigured production build.
// ============================================================

const required = (key: string, value: string | undefined): string => {
	if (!value) throw new Error(`Missing required env var: ${key}`);
	return value;
};

export const apiConfig = {
	baseUrl: required('VITE_API_URL', import.meta.env.VITE_API_URL),
	timeout: Number(import.meta.env.VITE_API_TIMEOUT ?? 30_000),
	debug: import.meta.env.DEV,
} as const;
