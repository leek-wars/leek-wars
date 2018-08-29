const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
    configureWebpack: {
		plugins: [
			// new BundleAnalyzerPlugin()
		]
	},
    chainWebpack: config => {
		config.module
			.rule('images')
			.use('url-loader')
			.loader('url-loader')
			.tap(options => Object.assign(options, { limit: -1 }))
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