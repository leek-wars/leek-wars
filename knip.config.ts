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
		'src/router.ts',
		'src/lang/locale/*.ts',
		'src/component/**/*.vue',
		'public/service-worker.js',
		// Loaded via the `^monaco-editor$` Vite alias in vite.config.ts; knip can't
		// follow the alias so it sees these as orphans.
		'src/component/editor/monaco-stripped.ts',
	],
	project: [
		'src/**/*.{ts,tsx,js,vue}',
		'!src/component/editor/codemirror/**',
	],
	ignoreDependencies: [
		// Types-only ou implicit (PostCSS, plugin Vite, glob SCSS)
		'@types/dompurify',
		'@types/google.analytics',
		'autoprefixer',
		'xp.css',
		// Utilisé via la CLI npx, pas d'import programmatique
		'prettier',
	],
	ignoreBinaries: ['bundlesize', 'xdg-open'],
	// Respect `@public` JSDoc tag — used on KeywordKind to keep the full
	// CompletionItemKind contract even if some members aren't consumed today.
	tags: ['-public'],
}

export default config
