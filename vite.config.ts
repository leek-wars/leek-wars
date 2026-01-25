import { defineConfig, Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'

// List of supported languages
const languages = ['fr', 'en', 'de', 'es', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh', 'hi', 'id', 'da', 'fi', 'no', 'sv']

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

		// Load virtual HTML files with the correct entry point
		load(id) {
			const match = id.match(/^index-(\w+)\.html$/)
			if (match) {
				const lang = match[1]
				const template = fs.readFileSync(templatePath, 'utf-8')
				return template.replace(
					'<script type="module" src="/src/main-fr.ts"></script>',
					`<script type="module" src="/src/main-${lang}.ts"></script>`
				)
			}
		},

		// Generate all language HTML files in the output
		generateBundle(_options, bundle) {
			const template = fs.readFileSync(templatePath, 'utf-8')

			for (const lang of languages) {
				const htmlContent = template.replace(
					'<script type="module" src="/src/main-fr.ts"></script>',
					`<script type="module" src="/src/main-${lang}.ts"></script>`
				)

				// Find the JS entry for this language and update the script src
				const jsEntry = Object.keys(bundle).find(name =>
					name.startsWith(`assets/main-${lang}`) && name.endsWith('.js')
				)

				let finalHtml = htmlContent
				if (jsEntry) {
					finalHtml = finalHtml.replace(
						`<script type="module" src="/src/main-${lang}.ts"></script>`,
						`<script type="module" crossorigin src="/${jsEntry}"></script>`
					)
				}

				// Add CSS links
				const cssFiles = Object.keys(bundle).filter(name => name.endsWith('.css'))
				const cssLinks = cssFiles.map(css => `<link rel="stylesheet" crossorigin href="/${css}">`).join('\n\t\t')
				finalHtml = finalHtml.replace('</head>', `\t${cssLinks}\n\t</head>`)

				this.emitFile({
					type: 'asset',
					fileName: `index-${lang}.html`,
					source: finalHtml
				})
			}
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
			// Build all language entry points (no shared index.html to preserve execution order)
			input: Object.fromEntries(
				languages.map(lang => [`main-${lang}`, path.resolve(__dirname, `src/main-${lang}.ts`)])
			),
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
		exclude: ['vue-property-decorator', 'vue-class-component']
	}
})
