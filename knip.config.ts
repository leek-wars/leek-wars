import type { KnipConfig } from 'knip'

// Le router charge les composants via `@/component/X/X.${locale}.i18n` (template
// literal résolu au runtime). knip ne peut pas suivre ces imports dynamiques, ce
// qui cause ~240 faux positifs sur "Unused files". On laisse donc le check "files"
// désactivé via `includeEntryExports` + entries larges, et on garde les checks
// utiles : unused exports, enum members, dependencies.

const config: KnipConfig = {
	// Tous les fichiers du projet sont considérés comme accessibles via le router
	// dynamique. On les liste comme entries pour neutraliser le faux positif.
	entry: [
		'src/main.ts',
		'src/router.ts',
		'src/lang/locale/*.ts',
		'src/component/**/*.vue',
		'public/service-worker.js',
	],
	project: [
		'src/**/*.{ts,tsx,js,vue}',
		'!src/component/editor/codemirror/**',
	],
	ignore: [
		'vite.config.d.ts',
		'vite.config.js',
	],
	ignoreDependencies: [
		// Types-only ou implicit (PostCSS, plugin Vite, glob SCSS)
		'@types/dompurify',
		'@types/sortablejs',
		'@types/google.analytics',
		'autoprefixer',
		'vite-plugin-node-polyfills',
		'xp.css',
		// Utilisés via shim ou @ts-ignore que knip ne suit pas
		'vue-facing-decorator',
		'vue-json-viewer',
		// Utilisés mais knip ne voit pas l'import (template-only ou indirect)
		'sortablejs',
		'swiper',
		// Utilisé via la CLI npx, pas d'import programmatique
		'prettier',
	],
	ignoreBinaries: ['bundlesize', 'xdg-open'],
}

export default config
