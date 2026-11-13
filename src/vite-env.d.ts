/// <reference types="vite/client" />
declare module '*.tsx?raw' {
	const content: string;
	export default content;
}

interface ImportMetaEnv {
	readonly VITE_POSTHOG_PROJECT_TOKEN?: string;
	readonly VITE_POSTHOG_HOST?: string;
}
