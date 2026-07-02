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
		// css: false → on n'exécute pas le CSS/SCSS (styles scoped des .vue).
		// Le scopeId (data-v-*) est quand même posé par le plugin vue ; seul le contenu du style saute.
		css: false,
		// Vuetify importe des .css dans son code ; par défaut vitest externalise node_modules et
		// ces imports plantent sous le loader Node (« Unknown file extension .css »). En inlinant
		// vuetify, Vite le transforme et css:false neutralise alors ses imports .css.
		server: { deps: { inline: ['vuetify'] } },
	},
})
