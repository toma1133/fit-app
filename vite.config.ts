import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
	base: process.env.NODE_ENV === 'production' ? '/fit-app/' : '/',
	envPrefix: ['VITE_'],
	resolve: {
		alias: {
			'~': path.resolve(__dirname, 'src'),
		},
	},
	plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss(), VitePWA({
		registerType: 'autoUpdate',
		includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
		manifest: {
			name: 'FitPro 體態追蹤器',
			short_name: 'FitPro',
			description: '您的個人體態與飲食追蹤器',
			theme_color: '#ffffff',
			background_color: '#ffffff',
			display: 'standalone',
			icons: [
				{
					src: 'pwa-192x192.png',
					sizes: '192x192',
					type: 'image/png'
				},
				{
					src: 'pwa-512x512.png',
					sizes: '512x512',
					type: 'image/png',
					purpose: 'any maskable'
				}
			]
		}
	})],
	server: {
		host: `0.0.0.0`,
		watch: {
			usePolling: true,
		},
	},
	build: {
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('node_modules')) {
						if (id.includes('firebase')) {
							return 'firebase';
						}
						if (id.includes('recharts')) {
							return 'charts';
						}
						if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
							return 'vendor';
						}
					}
				}
			}
		}
	},
});
