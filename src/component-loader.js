module.exports = function(source) {

	const match = this.resource.match(/([\w\-]+)\.(\w+)\.i18n/)
	const name = match[1]
	const locale = match[2]
	let nameUpper = (name.charAt(0).toUpperCase() + name.slice(1)).replace(/-([a-z])/g, (g) => g[1].toUpperCase())
	let folder = name
	if (name.startsWith('forum')) { folder = 'forum' }
	if (name.startsWith('moderation')) { folder = 'moderation' }
	if (name.startsWith('chat')) { folder = 'chat' }
	if (name.startsWith('bank')) { folder = 'bank' }
	if (name.startsWith('fight')) { folder = 'fight' }
	if (name.startsWith('report')) { folder = 'report' }
	if (name.startsWith('editor')) { folder = 'editor' }
	if (name.startsWith('level-dialog')) { folder = 'leek' }
	if (name.startsWith('signup')) { folder = 'signup' }
	if (name.startsWith('success')) { folder = 'app' }
	if (name.startsWith('garden')) { folder = 'garden' }

	const data = `
	import ${nameUpper} from '@/component/${folder}/${name}.vue'
	import { loadInstanceTranslations, i18n } from '@/model/i18n'
	const messages = ${source}
	${nameUpper}.options.i18n = { messages: {${locale}: messages }}
	export default ${nameUpper}`

	return data
}