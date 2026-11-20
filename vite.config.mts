import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import path from 'path';
import { buildSecurityHeaders, toNetlifyHeaders } from './scripts/security-headers.mjs';

// Error reports carry the commit they were built from (Netlify sets COMMIT_REF).
process.env.VITE_SENTRY_RELEASE ||= process.env.COMMIT_REF ?? '';
const release = process.env.VITE_SENTRY_RELEASE || undefined;

// Source maps are only built when they can be uploaded to GlitchTip, and are
// deleted from the output afterwards so they are never published.
const uploadSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN && release);

/** Writes Netlify's `_headers` file into the build, with a CSP built from this deploy's env. */
const netlifySecurityHeaders = (): Plugin => {
	let env: Record<string, string> = {};
	return {
		name: 'netlify-security-headers',
		apply: 'build',
		configResolved(config) {
			env = loadEnv(config.mode, config.envDir || process.cwd(), '');
		},
		generateBundle() {
			this.emitFile({
				type: 'asset',
				fileName: '_headers',
				source: toNetlifyHeaders(buildSecurityHeaders(env)),
			});
		},
	};
};

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		netlifySecurityHeaders(),
		VitePWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Agent1o1',
				short_name: 'Agent1o1',
				start_url: '/',
				display: 'standalone',
				background_color: '#09090b',
				theme_color: '#09090b',
				icons: [
					{
						src: '/logo192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: '/logo512.png',
						sizes: '512x512',
						type: 'image/png',
					},
				],
			},
			workbox: {
				sourcemap: false,
				maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
				// The full Hugeicons set is a lazy fallback (see components/icon/Icon.tsx);
				// precaching it would download 3 MB in the background for every visitor.
				globIgnores: ['**/huge-*.js'],
			},
		}),
		sentryVitePlugin({
			disable: !uploadSourceMaps,
			url: process.env.SENTRY_URL,
			org: process.env.SENTRY_ORG,
			project: process.env.SENTRY_PROJECT,
			authToken: process.env.SENTRY_AUTH_TOKEN,
			telemetry: false,
			release: { name: release, setCommits: false },
			// A failed upload must not block a deploy; the maps are still deleted.
			errorHandler: (error) => console.warn(error),
			sourcemaps: { filesToDeleteAfterUpload: ['build/**/*.map'] },
		}),
	],
	assetsInclude: ['**/*.md'],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	build: {
		outDir: 'build',
		sourcemap: uploadSourceMaps ? 'hidden' : false,
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('MdViewer')) return 'chunk-mdviewer';
					if (id.includes('react-syntax-highlighter')) return 'chunk-highlighter';
					if (id.includes('/Icon')) return 'chunk-icon';
					// No catch-all `vendor` chunk: libraries are split with the pages
					// that import them, so e.g. the workflow canvas and charts are not
					// downloaded on the login page.
				},
			},
		},
	},
});
