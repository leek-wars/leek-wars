module.exports = function(source) {

	const match = this.resource.match(/([\w\-]+)\.(\w+)\.lang/)
	const name = match[1]
	const locale = match[2]

	const data = `
	import { i18n } from '@/model/i18n'
	const messages = ${source}
	i18n.mergeLocaleMessage("${locale}", { "${name}": messages })
	`

	return data
}