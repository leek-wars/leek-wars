const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const CopyWebpackPlugin = require('copy-webpack-plugin')
const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin')
const path = require('path')

const dotenv = require('dotenv')
const match = process.env.npm_lifecycle_script.match(/--mode\ (.*)/)
if (match) {
	dotenv.config({ path: path.resolve(process.cwd(), 'src', 'env', '.env.' + match[1]) })
}
dotenv.config({ path: path.resolve(process.cwd(), 'src', 'env', '.env') })

module.exports = {
	configureWebpack: {
		plugins: [
			// new CopyWebpackPlugin([{ from: 'src/wiki/image/', to: 'wiki' }])
		],
		performance: {
			hints: false
		}
	},
	pages: {
		index: {entry: 'src/main-fr'},
		'app-fr': {entry: 'src/main-fr'},
		'app-en': {entry: 'src/main-en'}
	},
    chainWebpack: config => {
		config.module
			.rule('wiki')
			.test(/\.wiki$/)
			.use('wiki')
				.loader(path.resolve('./src/wiki-loader.js'))
				.end()
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
		config.module
			.rule('images')
			.use('url-loader')
			.loader('url-loader')
			.tap(options => Object.assign(options, { limit: -1 }))
		if (process.env.VUE_MODE === 'build') {
			config.entryPoints.delete('index')
			config.plugins.delete('html-index')
		}
	},
    pwa: {
		name: 'Leek Wars',
		themeColor: '#4b9e06',
		workboxPluginMode: 'InjectManifest',
		workboxOptions: {
			swSrc: 'public/service-worker.js'
		},
		iconPaths: {
			favicon32: 'image/favicon.png',
			favicon16: 'image/favicon.png'
		}
	}
}

if (process.env.VUE_MODE === 'build') {
	// module.exports.configureWebpack.plugins.push(
	// 	new BundleAnalyzerPlugin()
	// )
}
