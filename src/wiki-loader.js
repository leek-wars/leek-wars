const fs = require('fs')
const path = require('path')

module.exports = function(source, file) {
	const language = source.trim()
	const data = {}
	const files = fs.readdirSync("./src/wiki/src/")
	for (const file of files) {
		const versions = fs.readdirSync("./src/wiki/src/" + file)
		const version = versions.find(f => f.indexOf('.' + language + '.md') !== -1)
		if (version) {
			const title = version.replace('.' + language + '.md', '')
			const filePath = './src/wiki/src/' + file + '/' + version
			const otherVersions = {}
			versions.forEach(f => {
				const lang = f.match(/\.(.*)\./)
				if (lang) otherVersions[lang[1]] = f.replace('.' + lang[1] + '.md', '')
			})
			data[title] = {title, content: fs.readFileSync(filePath).toString(), versions: otherVersions}
			this.addDependency(path.resolve(filePath))
		}
	}
	const d = JSON.stringify(data)
	return `export default ${d};`
}