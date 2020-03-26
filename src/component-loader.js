module.exports = function(source) {

	// console.log("start loader", this.context, this.resource, this.resourceQuery)

	const match = this.resource.match(/([\w\-]+)\.(\w+)\.i18n/)
	const name = match[1]
	const locale = match[2]
	let nameUpper = (name.charAt(0).toUpperCase() + name.slice(1)).replace(/-([a-z])/g, (g) => g[1].toUpperCase())
	let folder = name
	if (name.endsWith('notifications')) { folder = 'notification' }
	if (name.startsWith('forum')) { folder = 'forum' }
	if (name.startsWith('moderation')) { folder = 'moderation' }
	if (name.startsWith('chat')) { folder = 'chat' }
	if (name.startsWith('bank')) { folder = 'bank' }
	// let locale = this.resourceQuery.substring(1) || 'fr'
	// if (locale.indexOf('=') !== -1) {
	// 	locale = locale.split('=')[1]
	// }

	// console.log(name, nameUpper, locale)

	// this.addDependency(`@/component/${name}/${name}.vue`)
	// this.addDependency(`@/lang/${locale}/${name}.json`)

	const data = `
	import ${nameUpper} from '@/component/${folder}/${name}.vue'
	import { i18n } from '@/model/i18n'
	const messages = ${source}
	${nameUpper}.options.i18n = { messages: {${locale}: messages }}
	i18n.mergeLocaleMessage("${locale}", { "${name}": messages })
	export default ${nameUpper}`

	// console.log(data)
	return data
}