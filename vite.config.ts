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
				const criticalCss = [...collectCriticalCss(bundle)].sort((a, b) => {
					// App main CSS last — ensures it overrides vendor/library styles
					const aMain = a.includes('main-') ? 1 : 0
					const bMain = b.includes('main-') ? 1 : 0
					return aMain - bMain
				})
				const cssLinks = criticalCss.map(css => `<link rel="stylesheet" crossorigin href="/${css}">`).join('\n\t\t')
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

// Plugin to inject __DATA__ in dev mode by fetching from the API
// Uses a middleware to read cookies and diff like the PHP server does
function gameDataPlugin(): Plugin {
	let allData: Record<string, any> | null = null
	let allHashes: Record<string, string> = {}
	let masterVersion = ''
	let allDataJson: Record<string, string> = {} // Pre-serialized per type
	let lastInjection = 'null' // Shared between middleware and transformIndexHtml

	const api = (process.env.LEEKWARS_LOCAL ? 'http://localhost:8500' : 'https://leekwars.com') + '/api/'

	async function loadData() {
		// Check léger : juste la master version
		const versionResponse = await fetch(api + 'data/version')
		const { master_version } = await versionResponse.json()

		if (master_version === masterVersion) return // Rien n'a changé

		// Master version différente → re-fetch tout
		console.log('[game-data] Version changed: ' + masterVersion + ' → ' + master_version)
		const response = await fetch(api + 'data/get-all')
		const json = await response.json()
		allData = json.data
		allHashes = json.hashes
		masterVersion = json.master_version
		allDataJson = {}
		for (const type of Object.keys(allData!)) {
			allDataJson[type] = JSON.stringify(allData![type])
		}
		console.log('[game-data] Loaded ' + Object.keys(allData!).length + ' types, master=' + masterVersion)
	}

	return {
		name: 'game-data-inject',
		apply: 'serve',

		configureServer(server) {
			// Middleware that intercepts HTML page requests and injects __DATA__
			server.middlewares.use(async (req, res, next) => {
				// Only intercept page navigations (not assets, HMR, etc.)
				const accept = req.headers.accept || ''
				if (!accept.includes('text/html')) return next()

				try {
					await loadData()
				} catch (e) {
					console.error('[game-data] Fetch failed:', e)
					return next()
				}

				// Parse cookie
				const cookies: Record<string, string> = {}
				for (const part of (req.headers.cookie || '').split(';')) {
					const [k, ...v] = part.trim().split('=')
					if (k) cookies[k.trim()] = v.join('=')
				}

				// Compare per-type hashes from cookie (ignore master version for comparison)
				const dataCookie = cookies['data_hashes'] || ''
				let clientHashes: Record<string, string> = {}
				if (dataCookie) {
					const idx = dataCookie.indexOf(':')
					if (idx > 0) {
						for (const pair of dataCookie.substring(idx + 1).split(',')) {
							const eq = pair.indexOf('=')
							if (eq > 0) clientHashes[pair.substring(0, eq)] = pair.substring(eq + 1)
						}
					}
				}

				// Diff
				const changedParts: string[] = []
				for (const type of Object.keys(allHashes)) {
					if (clientHashes[type] !== allHashes[type]) {
						changedParts.push(JSON.stringify(type) + ':' + allDataJson[type])
					}
				}

				if (changedParts.length === 0) {
					lastInjection = 'null'
					console.log('[game-data] Cookie matches, __DATA__=null')
				} else {
					const mv = JSON.stringify(masterVersion)
					const hashes = JSON.stringify(allHashes)
					lastInjection = `{"master_version":${mv},"hashes":${hashes},"data":{${changedParts.join(',')}}}`
					console.log('[game-data] Injecting ' + changedParts.length + '/' + Object.keys(allHashes).length + ' changed types')
				}
				next()
			})
		},

		transformIndexHtml(html) {
			return html.replace('var __DATA__=null', 'var __DATA__=' + lastInjection)
		}
	}
}

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		multiLanguagePlugin(),
		i18nPlugin(),
		yamlPlugin(),
		gameDataPlugin(),
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
