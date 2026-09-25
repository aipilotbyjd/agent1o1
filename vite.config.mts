import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		VitePWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Boltify | React Tailwind',
				short_name: 'Boltify',
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
				maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
				// The full Hugeicons set is a lazy fallback (see components/icon/Icon.tsx);
				// precaching it would download 3 MB in the background for every visitor.
				globIgnores: ['**/huge-*.js'],
			},
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
		sourcemap: false,
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
