import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

// Config de test dédiée : on ne réutilise PAS vite.config.ts (il embarque le patch
// Monaco/dompurify, l'i18n pré-compilé et toute la machinerie de l'app → lent et
// inutile pour des tests de logique pure).
export default defineConfig({
	// plugin vue présent pour les futurs tests de composants ; inoffensif pour la logique.
	plugins: [vue()],
	resolve: {
		alias: { '@': path.resolve(__dirname, 'src') },
	},
	test: {
		environment: 'happy-dom',
		include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
		// globals: false → on importe describe/it/expect explicitement (comme le server e2e).
	},
})
