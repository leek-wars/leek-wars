const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const path = require('path')

module.exports = {
	configureWebpack: {
		plugins: [
			// new BundleAnalyzerPlugin()
		]
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
			.rule('images')
			.use('url-loader')
			.loader('url-loader')
			.tap(options => Object.assign(options, { limit: -1 }))
		if (process.env.VUE_MODE === 'build') {
			config.entryPoints.delete('index')
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