import { defineConfig, Plugin, Rollup } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import { baseCompile } from '@intlify/message-compiler'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'
import { execSync } from 'child_process'

// Resolved once per Vite process — prevents spawning git on every HMR config reload.
const BUILD_COMMIT = (() => {
	try {
		return execSync('git rev-parse --short HEAD', { cwd: __dirname }).toString().trim()
	} catch {
		return 'unknown'
	}
})()
const BUILD_DATE = new Date().toISOString()

// Recursively compile a message object: leaf strings → pre-compiled functions
// so the runtime-only vue-i18n build needs no JIT compiler (no new Function()).
function compileMessageObject(obj: unknown): string {
	if (typeof obj === 'string') {
		const { code } = baseCompile(obj, { sourceMap: false })
		return code
	}
	if (Array.isArray(obj)) {
		return `[${(obj as unknown[]).map(compileMessageObject).join(', ')}]`
	}
	if (obj !== null && typeof obj === 'object') {
		const entries = Object.entries(obj as Record<string, unknown>)
			.map(([k, v]) => `${JSON.stringify(k)}: ${compileMessageObject(v)}`)
		return `{\n${entries.join(',\n')}\n}`
	}
	return JSON.stringify(obj)
}

function compileJsonFile(filePath: string): string {
	const messages = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
	return `export default ${compileMessageObject(messages)}`
}

const stripQuery = (id: string) => id.split('?')[0]

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

// Plugin to handle .i18n and .lang files.
// .i18n files serve two purposes:
//   - default export = Vue component (for lazy router imports)
//   - messages named export = pre-compiled message functions (for import.meta.glob in i18n.ts)
function i18nPlugin(): Plugin {
	return {
		name: 'i18n-json',
		enforce: 'pre',
		load(id) {
			const cleanId = stripQuery(id)
			if (cleanId.endsWith('.i18n')) {
				const basePath = cleanId.replace(/\.\w+\.i18n$/, '')
				const vuePath = basePath + '.vue'
				const localeMatch = cleanId.match(/\.(\w+)\.i18n$/)
				const locale = localeMatch ? localeMatch[1] : 'fr'
				const messagesCode = compileMessageObject(JSON.parse(fs.readFileSync(cleanId, 'utf-8')))
				return `
import ComponentModule from '${vuePath}'
const Component = ComponentModule.default || ComponentModule
export const messages = ${messagesCode}
if (Component && typeof Component === 'object') {
  Component.i18n = { messages: { '${locale}': messages } }
}
export default Component
`
			}
			if (cleanId.endsWith('.lang')) {
				return compileJsonFile(cleanId)
			}
		}
	}
}

// enforce:'post' runs after @intlify/unplugin-vue-i18n, overwriting its named
// string exports with pre-compiled functions (avoids JSON.parse conflict).
function i18nJsonPlugin(): Plugin {
	return {
		name: 'i18n-json-compiler',
		enforce: 'post',
		transform(_code, id) {
			const cleanId = stripQuery(id)
			if (!cleanId.match(/\/src\/lang\/[a-z-]+\/[a-z0-9-]+\.json$/)) return
			return { code: compileJsonFile(cleanId), map: null }
		}
	}
}

// Monaco 0.55 doesn't read MonacoEnvironment.nonce for <style> elements (only for workers),
// so we patch createStyleSheet at build time to inject it.
function monacoNoncePlugin(): Plugin {
	return {
		name: 'monaco-csp-nonce',
		transform(code, id) {
			if (!id.endsWith('domStylesheets.js') || !id.includes('monaco-editor')) return
			const patched = code.replace(
				"const style = document.createElement('style');",
				"const style = document.createElement('style');\n    const __nonce = self.MonacoEnvironment?.nonce;\n    if (__nonce) style.nonce = __nonce;"
			)
			if (patched === code) {
				console.warn('[monaco-csp-nonce] Pattern not found in domStylesheets.js — nonce patch skipped')
				return null
			}
			return { code: patched, map: null }
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
	interface ApiCache {
		allData: Record<string, any> | null
		allHashes: Record<string, string>
		masterVersion: string
		allDataJson: Record<string, string>
	}
	const caches: Record<string, ApiCache> = {}
	let lastInjection = 'null' // Shared between middleware and transformIndexHtml

	function getCache(api: string): ApiCache {
		if (!caches[api]) {
			caches[api] = { allData: null, allHashes: {}, masterVersion: '', allDataJson: {} }
		}
		return caches[api]
	}

	async function loadData(api: string) {
		const cache = getCache(api)

		// Check léger : juste la master version
		const versionResponse = await fetch(api + 'data/version')
		const { master_version } = await versionResponse.json()

		if (master_version === cache.masterVersion) return cache // Rien n'a changé

		// Master version différente → re-fetch tout
		console.log('[game-data] Version changed: ' + cache.masterVersion + ' → ' + master_version + ' (' + api + ')')
		const response = await fetch(api + 'data/get-all')
		const json = await response.json()
		cache.allData = json.data
		cache.allHashes = json.hashes
		cache.masterVersion = json.master_version
		cache.allDataJson = {}
		for (const type of Object.keys(cache.allData!)) {
			cache.allDataJson[type] = JSON.stringify(cache.allData![type])
		}
		console.log('[game-data] Loaded ' + Object.keys(cache.allData!).length + ' types, master=' + cache.masterVersion)
		return cache
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

				// Utiliser la même source API que le client selon le port d'accès
				const host = req.headers['x-forwarded-host'] as string || req.headers.host || ''
				const port = host.split(':')[1] || ''
				console.log('[game-data] Request host=' + req.headers.host + ' x-forwarded-host=' + req.headers['x-forwarded-host'] + ' → port=' + port + ' → api=' + ((port === '8500' || port === '5100') ? 'local' : 'prod'))
				const api = (port === '8500' || port === '5100')
					? 'http://localhost:' + port + '/api/'
					: 'https://leekwars.com/api/'

				let cache: ApiCache
				try {
					cache = await loadData(api) || getCache(api)
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
				for (const type of Object.keys(cache.allHashes)) {
					if (clientHashes[type] !== cache.allHashes[type]) {
						changedParts.push(JSON.stringify(type) + ':' + cache.allDataJson[type])
					}
				}

				if (changedParts.length === 0) {
					lastInjection = 'null'
					console.log('[game-data] Cookie matches, __DATA__=null')
				} else {
					const mv = JSON.stringify(cache.masterVersion)
					const hashes = JSON.stringify(cache.allHashes)
					lastInjection = `{"master_version":${mv},"hashes":${hashes},"data":{${changedParts.join(',')}}}`
					console.log('[game-data] Injecting ' + changedParts.length + '/' + Object.keys(cache.allHashes).length + ' changed types')
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
	define: {
		__BUILD_DATE__: JSON.stringify(BUILD_DATE),
		__BUILD_COMMIT__: JSON.stringify(BUILD_COMMIT),
		// Tree-shake vue-i18n JIT compiler — messages pre-compiled, no new Function() needed.
		__INTLIFY_JIT_COMPILATION__: 'false',
		__INTLIFY_DROP_MESSAGE_COMPILER__: 'true',
	},
	plugins: [
		multiLanguagePlugin(),
		i18nPlugin(),
		i18nJsonPlugin(),
		yamlPlugin(),
		monacoNoncePlugin(),
		gameDataPlugin(),
		vue(),
		vueI18n({
			runtimeOnly: true,
			compositionOnly: true,
			dropMessageCompiler: true,
		}),
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
		}
	},
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler'
			} as object
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
					'vue-vendor': ['vue', 'vue-router', 'vuex', 'vue-i18n'],
					// Vuetify (large UI framework)
					'vuetify': ['vuetify'],
					// Utilities
					'utils': ['chart.js', 'markdown-it', 'dompurify', 'js-beautify']
				}
			}
		}
	},
	optimizeDeps: {
		include: ['vue', 'vue-router', 'vuetify'],
	}
})
