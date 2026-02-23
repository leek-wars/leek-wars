import { defineConfig, Plugin, Rollup } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'

// List of supported languages
const languages = ['fr', 'en', 'de', 'es', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh', 'hi', 'id', 'da', 'fi', 'no', 'sv']

// Collect CSS files that are needed for the initial render (entry chunks + static deps).
// CSS from lazy-loaded routes will be injected by Vite's __vite_preload at import time.
function collectCriticalCss(bundle: Rollup.OutputBundle): Set<string> {
	const visited = new Set<string>()
	const criticalCss = new Set<string>()

	function walk(fileName: string) {
		if (visited.has(fileName)) return
		visited.add(fileName)
		const chunk = bundle[fileName]
		if (!chunk || chunk.type !== 'chunk') return
		// Collect CSS imported by this chunk
		const meta = chunk.viteMetadata as { importedCss?: Set<string> } | undefined
		if (meta?.importedCss) {
			for (const css of meta.importedCss) {
				criticalCss.add(css)
			}
		}
		// Follow static imports only (not dynamicImports)
		for (const imp of chunk.imports) {
			walk(imp)
		}
	}

	// Start from entry chunks
	for (const [fileName, chunk] of Object.entries(bundle)) {
		if (chunk.type === 'chunk' && chunk.isEntry) {
			walk(fileName)
		}
	}
	return criticalCss
}

// Plugin to generate multiple HTML outputs for each language
function multiLanguagePlugin(): Plugin {
	const templatePath = path.resolve(__dirname, 'index.html')

	return {
		name: 'multi-language-html',
		enforce: 'pre',

		// Resolve virtual HTML files for each language
		resolveId(id) {
			if (id.match(/^index-\w+\.html$/)) {
				return id
			}
		},

		// Load virtual HTML files with the correct entry point (dev mode)
		load(id) {
			const match = id.match(/^index-(\w+)\.html$/)
			if (match) {
				const lang = match[1]
				const template = fs.readFileSync(templatePath, 'utf-8')
				// Replace fr locale with requested language
				return template.replace(
					'src="/src/lang/locale/fr.ts"',
					`src="/src/lang/locale/${lang}.ts"`
				)
			}
		},

		// Generate all language HTML files in the output
		generateBundle(_options, bundle) {
			const template = fs.readFileSync(templatePath, 'utf-8')
			let defaultHtml = ''

			for (const lang of languages) {
				// Find the JS entries for locale and main
				const localeEntry = Object.keys(bundle).find(name =>
					name.startsWith(`assets/locale-${lang}`) && name.endsWith('.js')
				)
				const mainEntry = Object.keys(bundle).find(name =>
					name.match(/^assets\/main-[A-Za-z0-9_-]+\.js$/) && !name.includes('locale')
				)

				// Build script tags: locale first (sets translations), then main (uses them)
				const scripts = [
					localeEntry ? `<script type="module" crossorigin src="/${localeEntry}"></script>` : '',
					mainEntry ? `<script type="module" crossorigin src="/${mainEntry}"></script>` : ''
				].filter(Boolean).join('\n\t\t')

				// Replace the dev script tags with built versions
				let finalHtml = template.replace(
					/<script type="module" src="\/src\/lang\/locale\/fr\.ts"><\/script>\s*<script type="module" src="\/src\/main\.ts"><\/script>/,
					scripts
				)

				// Only include CSS from entry chunks and their static dependencies.
				// Lazy-loaded route CSS will be injected by Vite's runtime on demand.
				const criticalCss = collectCriticalCss(bundle)
				const cssLinks = [...criticalCss].map(css => `<link rel="stylesheet" crossorigin href="/${css}">`).join('\n\t\t')
				finalHtml = finalHtml.replace('</head>', `\t${cssLinks}\n\t</head>`)

				this.emitFile({
					type: 'asset',
					fileName: `index-${lang}.html`,
					source: finalHtml
				})

				// Keep French as default
				if (lang === 'fr') {
					defaultHtml = finalHtml
				}
			}

			// Emit index.html as default (French)
			this.emitFile({
				type: 'asset',
				fileName: 'index.html',
				source: defaultHtml
			})
		}
	}
}

// Plugin to handle .i18n and .lang files
// .i18n files load the corresponding .vue component and inject i18n translations
function i18nPlugin(): Plugin {
	return {
		name: 'i18n-json',
		enforce: 'pre',
		load(id) {
			if (id.endsWith('.i18n')) {
				// Extract the base path and locale (e.g., /path/to/signup.fr.i18n -> signup, fr)
				const basePath = id.replace(/\.\w+\.i18n$/, '')
				const vuePath = basePath + '.vue'

				// Extract locale from filename (e.g., signup.fr.i18n -> fr)
				const localeMatch = id.match(/\.(\w+)\.i18n$/)
				const locale = localeMatch ? localeMatch[1] : 'fr'

				// Read the i18n JSON content
				const i18nContent = fs.readFileSync(id, 'utf-8')

				// Generate code that imports the Vue component and adds i18n with proper structure
				// vue-i18n expects: { messages: { [locale]: {...translations...} } }
				return `
					import ComponentModule from '${vuePath}'
					const Component = ComponentModule.default || ComponentModule
					if (Component && typeof Component === 'object') {
						Component.i18n = {
							messages: {
								'${locale}': ${i18nContent}
							}
						}
					}
					export default Component
				`
			}
			if (id.endsWith('.lang')) {
				const content = fs.readFileSync(id, 'utf-8')
				return `export default ${content}`
			}
		}
	}
}

// Plugin to handle YAML files (for changelog)
function yamlPlugin(): Plugin {
	return {
		name: 'yaml-loader',
		enforce: 'pre',
		load(id) {
			if (id.endsWith('.yaml') || id.endsWith('.yml')) {
				const content = fs.readFileSync(id, 'utf-8')
				const parsed = yaml.load(content)
				return `export default ${JSON.stringify(parsed)}`
			}
		}
	}
}

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		multiLanguagePlugin(),
		i18nPlugin(),
		yamlPlugin(),
		vue(),
		vuetify({
			autoImport: true
		}),
		monacoEditorPlugin({
			languageWorkers: ['editorWorkerService'],
			customWorkers: []
		}),
		visualizer({
			filename: 'dist/stats.html',
			open: false,
			gzipSize: true,
			brotliSize: true
		})
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
			// Shim for vue-property-decorator to export Component as alias for Options
			'vue-property-decorator': path.resolve(__dirname, 'src/vue-property-decorator.ts')
		}
	},
	css: {
		preprocessorOptions: {
			scss: {
				// Vuetify 3 SCSS compatibility
				api: 'modern-compiler'
			}
		}
	},
	server: {
		port: 8080,
		host: true,
		// Static files from public/ are served automatically by Vite
		watch: {
			// Use polling to avoid ENOSPC error on systems with low file watcher limit
			usePolling: true,
			interval: 1000
		}
	},
	build: {
		// Generate source maps for production (like hidden-source-map in webpack)
		sourcemap: true,
		rollupOptions: {
			// Two entry points per language: locale (translations) and main (app)
			// HTML loads locale first, then main, to ensure translations are set before app init
			input: {
				// Main app entry point (shared)
				'main': path.resolve(__dirname, 'src/main.ts'),
				// Locale entry points (one per language)
				...Object.fromEntries(
					languages.map(lang => [`locale-${lang}`, path.resolve(__dirname, `src/lang/locale/${lang}.ts`)])
				)
			},
			output: {
				manualChunks: {
					// Vue ecosystem
					'vue-vendor': ['vue', 'vue-router', 'pinia', 'vuex', 'vue-i18n'],
					// Vuetify (large UI framework)
					'vuetify': ['vuetify'],
					// Monaco editor core
					'monaco': ['monaco-editor'],
					// Utilities
					'utils': ['chart.js', 'markdown-it', 'dompurify', 'js-beautify']
				}
			}
		}
	},
	optimizeDeps: {
		include: ['vue', 'vue-router', 'pinia', 'vuetify'],
		// Exclude from pre-bundling to avoid circular dependency with our shim
		exclude: ['vue-property-decorator', 'vue-class-component', 'vue-facing-decorator']
	}
})
