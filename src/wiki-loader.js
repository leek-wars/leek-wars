const fs = require('fs')
const path = require('path')

module.exports = function(source) {
	const data = {}
	const files = fs.readdirSync("./src/wiki/src/")
	for (const file of files) {
		const filePath = './src/wiki/src/' + file + '/' + file + '.fr.md'
		data[file] = fs.readFileSync(filePath).toString()
		this.addDependency(path.resolve(filePath))
	}
	const d = JSON.stringify(data)
	return `export default ${d};`
}