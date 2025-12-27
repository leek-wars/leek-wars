const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const path = require('path')
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const dotenv = require('dotenv')
const match = process.env.npm_lifecycle_script.match(/--mode\ (.*)/)
if (match) {
	dotenv.config({ path: path.resolve(process.cwd(), 'src', 'env', '.env.' + match[1]) })
}
dotenv.config({ path: path.resolve(process.cwd(), 'src', 'env', '.env') })

module.exports = {
	// Generate source maps in production for error decoding
	// Files are NOT exposed to users (hidden-source-map)
	productionSourceMap: true,

	devServer: {
		static: {
			directory: path.resolve(__dirname, 'static'),
			publicPath: '/static',
			watch: false,
		},
	},
	configureWebpack: {
		// Use hidden-source-map: generates .map files but doesn't reference them in JS
		// This prevents users from downloading source maps while allowing server-side decoding
		devtool: process.env.NODE_ENV === 'production' ? 'hidden-source-map' : 'eval-source-map',
		plugins: [
			new MonacoWebpackPlugin()
		]
	},
	pages: {
		index: {entry: 'src/main-fr'},
		'app-fr': {entry: 'src/main-fr'},
		'app-en': {entry: 'src/main-en'},
		'app-es': {entry: 'src/main-es'},
		'app-de': {entry: 'src/main-de'},
		'app-it': {entry: 'src/main-it'},
		'app-pt': {entry: 'src/main-pt'},
		'app-da': {entry: 'src/main-da'},
		'app-fi': {entry: 'src/main-fi'},
		'app-nl': {entry: 'src/main-nl'},
		'app-no': {entry: 'src/main-no'},
		'app-pl': {entry: 'src/main-pl'},
		'app-sv': {entry: 'src/main-sv'},
		'app-ru': {entry: 'src/main-ru'},
		'app-hi': {entry: 'src/main-hi'},
		'app-zh': {entry: 'src/main-zh'},
		'app-id': {entry: 'src/main-id'},
		'app-ja': {entry: 'src/main-ja'},
		'app-ko': {entry: 'src/main-ko'},
	},
    chainWebpack: config => {
		config.watchOptions({
			ignored: '/static/'
		})
		config.module
			.rule('i18n')
			.test(/\.\w\w\.i18n/)
			.use('i18n')
				.loader(path.resolve('./src/component-loader.js'))
				.end()
		config.module
			.rule('lang')
			.test(/\.\w\w\.lang/)
			.use('lang')
				.loader(path.resolve('./src/translation-loader.js'))
				.end()

		if (process.env.VUE_MODE === 'build') {
			config.entryPoints.delete('index')
			config.plugins.delete('html-index')

			if (process.env.VUE_CLI_MODERN_BUILD) {
				// Uncomment to analyze bundles
				// config
				// 	.plugin("webpack-bundle-analyzer")
				// 	.use(BundleAnalyzerPlugin)
				// 	.init(Plugin => new Plugin({}))
			}
		}
	},
    pwa: {
		name: 'Leek Wars',
		themeColor: '#4b9e06',
		workboxPluginMode: 'InjectManifest',
		workboxOptions: {
			swSrc: './public/service-worker.js'
		},
		iconPaths: {
			favicon32: 'image/favicon.png',
			favicon16: 'image/favicon.png'
		}
	}
}
