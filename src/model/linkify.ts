import { SENTINELS, hasSentinel } from './chat-sentinels'

// Transformation des URLs en liens dans les messages de chat. Extrait de
// leekwars.ts (qui ré-exporte via LeekWars.linkify / LeekWars.toChatLink)
// pour être testable sans tirer le store / router / window.

// Caractères qui ne doivent jamais reparaître dans une URL décodée : les
// HTML-spéciaux que protect() avait neutralisés, les blancs, et les SENTINELLES de
// masquage de chat-format, composées depuis leur définition commune.
const DECODED_FORBIDDEN = new RegExp('[<>"\'&\\s' + SENTINELS + ']')

// Une adresse e-mail : points, + et - admis avant le @. L'assertion (?=…) borne cette
// partie à 64 caractères, la limite des adresses : sans elle, chaque position d'une
// longue suite de mots liés par des points retenterait toute la suite.
const EMAIL = /(?=[\w+.-]{1,64}@)\w[\w+-]*(?:\.[\w+-]+)*@[a-z\d-]+(?:\.[a-z\d-]+)*\.[a-z]{2,}/.source
const WEB_URL = /https?:\/\/[\w-]+\.[\w-]+(?:\.\w+)*/.source
const LEEKWARS_DOMAIN = /(?:www\.)?leekwars\.com/.source
// Groupe 1 : un e-mail. Groupe 2 : le domaine leekwars.com écrit sans schéma.
const LINK_SOURCE = '(' + EMAIL + ')|' + WEB_URL + '|(' + LEEKWARS_DOMAIN + ')'

export function toChatLink(url: string, text: string, blank: string, clazz: string = '') {
	blank = blank ? blank : ""
	return '<a ' + blank + ' class="' + clazz + '" href="' + url + '">' + text + '</a>'
}

// L'entrée est du HTML déjà échappé par LeekWars.protect() : les caractères
// & < > " ' du message arrivent sous forme d'entités. Chaque lien posé passe par
// `wrap`, qui permet à l'appelant de le mettre de côté (chat-format le masque).
export function linkify(html: string, wrap = (link: string) => link) {
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
	// Un seul balayage de gauche à droite pour les e-mails et les URLs, et le texte
	// consommé n'est jamais relu. Un e-mail commence avant son domaine : il est donc
	// pris en entier (contact@leekwars.com), et un e-mail écrit dans une URL
	// (?to=a@b.com) reste dans le lien de l'URL au lieu d'y imbriquer un second <a>.
	const link_regex = new RegExp(LINK_SOURCE, 'gi')
	let out = ''
	let done = 0
	// Recopie le texte qui précède le lien, puis le lien, et reprend le balayage
	// après la fin de ce qu'il remplace.
	const emit = (start: number, end: number, link: string) => {
		out += html.substring(done, start) + wrap(link)
		done = end
		link_regex.lastIndex = end
	}
	let match

	// eslint-disable-next-line no-cond-assign
	while (match = link_regex.exec(html)) {
		let i = match.index + match[0].length
		if (match[1]) {
			emit(match.index, i, '<a target="_blank" rel="noopener" href="mailto:' + match[1] + '">' + match[1] + '</a>')
			continue
		}
		// Le domaine nu collé à un mot, à un sous-domaine ou à un @ n'est pas un lien
		// vers le site : rené@leekwars.com, foo.leekwars.com.
		if (match[2] && match.index > 0 && /[\w.@-]/.test(html[match.index - 1])) { continue }
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
				// Un segment masqué par chat-format (code, LaTeX, image) n'appartient pas à l'URL.
				if (hasSentinel(c)) { break }
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
			// Le décodage rend l'URL lisible (accents des slugs...), mais il
			// réintroduit APRÈS protect() des caractères qu'elle avait neutralisés :
			// %22%3E → "> ferme l'attribut href et injecte du HTML brut dans le
			// v-html du chat. On ne garde la forme décodée que si elle ne contient
			// ni HTML-spéciaux, ni blancs, ni les sentinelles de chat-format ;
			// sinon l'URL reste encodée telle que tapée (inoffensive).
			// decodeURIComponent jette sur un % malformé (ex: /100%) : idem.
			try {
				const decoded = decodeURIComponent(real_url)
				if (!DECODED_FORBIDDEN.test(decoded)) { real_url = decoded }
			} catch { /* séquence % malformée : on garde l'URL brute */ }
			real_url = real_url.substring(lw_index.length)
			if (real_url.length === 0) real_url = '/'
			url = real_url
		}
		const clazz = lw_index.index === 0 ? 'lw' : ''

		emit(match.index, i, toChatLink(real_url, url, blank, clazz))
	}
	return out + html.substring(done)
}
