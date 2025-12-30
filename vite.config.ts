import { defineConfig, Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'

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
		nodePolyfills({
			// Include polyfills for Node.js modules used by sanitize-html
			include: ['path', 'url', 'util', 'stream', 'buffer'],
			globals: {
				Buffer: true,
				global: true,
				process: true,
			},
		}),
		i18nPlugin(),
		yamlPlugin(),
		vue({
			template: {
				compilerOptions: {
					// Enable Vue 2 compat mode
					compatConfig: {
						MODE: 2
					}
				}
			}
		}),
		vuetify({
			autoImport: true
		})
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
			// Use @vue/compat for Vue 2 compatibility
			'vue': '@vue/compat',
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
		sourcemap: true
		// TODO: Add multi-entry points for production build later
		// For now, use single entry point (main-fr.ts)
	},
	optimizeDeps: {
		include: ['vue', '@vue/compat', 'vue-router', 'pinia', 'vuetify'],
		// Exclude from pre-bundling to avoid circular dependency with our shim
		exclude: ['vue-property-decorator', 'vue-class-component']
	}
})
