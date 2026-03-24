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
});
