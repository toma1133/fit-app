import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';

// https://vite.dev/config/
export default defineConfig({
	base: process.env.NODE_ENV === 'production' ? '/fit-app/' : '/',
	envPrefix: ['VITE_'],
	resolve: {
		alias: {
			'~': path.resolve(__dirname, 'src'),
		},
	},
	plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
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
	}
});
