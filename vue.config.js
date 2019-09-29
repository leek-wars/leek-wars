const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')

const match = process.env.npm_lifecycle_script.match(/--mode\ (.*)/)
const mode = match ? '.' + match[1] : ''
require('dotenv').config({ path: path.resolve(process.cwd(), 'src', 'env', '.env' + mode) })

module.exports = {
	configureWebpack: {
		plugins: [
			// new BundleAnalyzerPlugin(),
			new CopyWebpackPlugin([{ from: 'src/wiki/image/', to: 'wiki' }])
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
	devServer: {
		proxy: {
			'/api': {
				target: 'http://localhost:5000'
			}
		}
	},
    chainWebpack: config => {
		config.module
			.rule('wiki')
			.test(/\.wiki$/)
			.use('wiki')
				.loader(path.resolve('./src/wiki-loader.js'))
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
		}
	}
}