import { describe, it, expect } from 'vitest'
import { linkify } from '@/model/linkify'

// linkify reçoit du HTML déjà échappé par LeekWars.protect() : dans les messages
// de chat, les caractères & < > " ' arrivent sous forme d'entités.

describe('linkify - liens externes', () => {
	it('transforme une URL externe en lien target=_blank', () => {
		expect(linkify('voir https://example.com/page ok')).toBe(
			'voir <a target=\'_blank\' rel=\'noopener\' class="" href="https://example.com/page">https://example.com/page</a> ok')
	})
	it('conserve les query strings (& échappé en &amp;)', () => {
		const out = linkify('https://example.com/a?b=1&amp;c=2')
		expect(out).toContain('href="https://example.com/a?b=1&amp;c=2"')
	})
	it('retire la ponctuation finale', () => {
		expect(linkify('https://example.com/page.')).toContain('href="https://example.com/page"')
	})
})

describe('linkify - liens leekwars.com', () => {
	it('transforme une URL leekwars en lien interne', () => {
		const out = linkify('https://leekwars.com/help')
		expect(out).toContain('class="lw"')
		expect(out).toContain('href="/help"')
		expect(out).not.toContain('_blank')
	})
})

describe('linkify - texte de lien trompeur via " et > (bug report)', () => {
	it('coupe l\'URL sur &quot;&gt; échappés : le texte injecté reste hors du lien', () => {
		// Message d'origine : https://leekwars.com/help">malveillant
		const out = linkify('https://leekwars.com/help&quot;&gt;malveillant')
		expect(out).toBe('<a  class="lw" href="/help">/help</a>&quot;&gt;malveillant')
	})
	it('coupe aussi sur les caractères bruts " < >', () => {
		expect(linkify('https://example.com/a"x')).toContain('href="https://example.com/a"')
		expect(linkify('https://example.com/a>x')).toContain('href="https://example.com/a"')
		expect(linkify('https://example.com/a<x')).toContain('href="https://example.com/a"')
	})
	it('coupe sur &lt; échappé', () => {
		const out = linkify('https://example.com/a&lt;b')
		expect(out).toContain('href="https://example.com/a"')
		expect(out.endsWith('</a>&lt;b')).toBe(true)
	})
})

describe('linkify - injection HTML via URL percent-encodée (bug report)', () => {
	it('ne décode pas une URL leekwars dont la forme décodée contient " ou > (%22%3E)', () => {
		// Vecteur réel : leekwars.com/bank/buy/6%22%3E%0A...texte d'arnaque...
		// Le décodage réintroduirait "> APRÈS protect() → sortie de l'attribut
		// href et HTML brut injecté dans le v-html du chat.
		const out = linkify('leekwars.com/bank/buy/6%22%3E%0A%20(crystal)Si%20vous%20voyez')
		expect(out).toBe('<a  class="lw" href="/bank/buy/6%22%3E%0A%20(crystal)Si%20vous%20voyez">' +
			'/bank/buy/6%22%3E%0A%20(crystal)Si%20vous%20voyez</a>')
	})
	it('ne décode pas non plus %3Cimg (balise HTML encodée)', () => {
		const out = linkify('https://leekwars.com/a%3Cimg%20src=x%3E')
		expect(out).not.toContain('<img')
	})
	it('décode toujours les URLs leekwars inoffensives (accents)', () => {
		const out = linkify('https://leekwars.com/forum/cat%C3%A9gorie')
		expect(out).toContain('href="/forum/catégorie"')
	})
	it('ne plante pas sur une séquence % malformée', () => {
		const out = linkify('https://leekwars.com/100%')
		expect(out).toContain('href="/100%"')
	})
})

describe('linkify - emails', () => {
	it('transforme un email en lien mailto', () => {
		expect(linkify('bob@example.com')).toBe(
			'<a target="_blank" rel="noopener" href="mailto:bob@example.com">bob@example.com</a>')
	})
})
