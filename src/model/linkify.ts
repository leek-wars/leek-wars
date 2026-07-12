// Transformation des URLs en liens dans les messages de chat. Extrait de
// leekwars.ts (qui ré-exporte via LeekWars.linkify / LeekWars.toChatLink)
// pour être testable sans tirer le store / router / window.

export function toChatLink(url: string, text: string, blank: string, clazz: string = '') {
	blank = blank ? blank : ""
	return '<a ' + blank + ' class="' + clazz + '" href="' + url + '">' + text + '</a>'
}

// L'entrée est du HTML déjà échappé par LeekWars.protect() : les caractères
// & < > " ' du message arrivent sous forme d'entités.
export function linkify(html: string) {
	const indexOf_leekwars = (url: string) => {
		const i1 = url.indexOf("http://leekwars.com")
		if (i1 !== -1) return {index: i1, length: 19}
		const i2 = url.indexOf("http://www.leekwars.com")
		if (i2 !== -1) return {index: i2, length: 23}
		const i3 = url.indexOf("https://leekwars.com")
		if (i3 !== -1) return {index: i3, length: 20}
		const i4 = url.indexOf("https://www.leekwars.com")
		if (i4 !== -1) return {index: i4, length: 24}
		return {index: -1, length: 0}
	}
	const email_pattern = /\w+@[a-zA-Z_]+?(?:\.[a-zA-Z]{2,6})+/gim
	const url_regex = /((?:https?):\/\/[\w-]+\.[\w-]+(?:\.\w+)*)|((?:www\.)?leekwars\.com)/gim
	let match

	// eslint-disable-next-line no-cond-assign
	while (match = url_regex.exec(html)) {
		let i = match.index + match[0].length
		let par = 0, curly = 0, square = 0
		if (html[i] === '/') {
			while (i < html.length) {
				const c = html[i]
				if (c === ' ' || c === ' ' || c === '\n') { break }
				// Les guillemets et chevrons ne sont pas valides dans une URL. L'entrée
				// est du HTML échappé par protect(), donc ils arrivent sous forme
				// d'entités : sans cette coupure, `url">texte` les absorbe dans le lien
				// et affiche un texte de lien trompeur.
				if (c === '"' || c === '<' || c === '>') { break }
				if (c === '&' && (html.startsWith('&quot;', i) || html.startsWith('&lt;', i) || html.startsWith('&gt;', i))) { break }
				if (c === '(') { par++ }
				if (c === '[') { square++ }
				if (c === '{') { curly++ }
				if (c === ')' && --par < 0) { break }
				if (c === ']' && --square < 0) { break }
				if (c === '}' && --curly < 0) { break }
				i++
			}
			let last = html[i - 1]
			while (/[.,!?:]/.test(last)) {
				last = html[--i - 1]
			}
		}
		let url = html.substring(match.index, i).replace(/\$/g, '%24')
		let real_url = url.indexOf('http') === -1 ? 'http://' + url : url
		const lw_index = indexOf_leekwars(real_url)
		const blank = lw_index.index === 0 ? "" : "target='_blank' rel='noopener'"
		if (lw_index.index === 0) {
			real_url = decodeURIComponent(real_url).substring(lw_index.length)
			if (real_url.length === 0) real_url = '/'
			url = real_url
		}
		const clazz = lw_index.index === 0 ? 'lw' : ''

		const link = toChatLink(real_url, url, blank, clazz)
		html = html.substring(0, match.index) + link + html.substring(i)
		url_regex.lastIndex = match.index + link.length
	}
	return html.replace(email_pattern, '<a target="_blank" rel="noopener" href="mailto:$&">$&</a>')
}
