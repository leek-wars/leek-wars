import { describe, it, expect } from 'vitest'
import { IMAGE_MARK, CODE_MARK, LATEX_MARK, LINK_MARK, SENTINELS, hasSentinel, stripSentinels } from '@/model/chat-sentinels'
import { linkify } from '@/model/linkify'

// Les sentinelles de masquage saisies par l'utilisateur sont neutralisées.

describe('stripSentinels', () => {
	it('retire toutes les sentinelles d\'un contenu joueur', () => {
		expect(stripSentinels('a' + CODE_MARK + 'b' + LATEX_MARK + 'c' + IMAGE_MARK + 'd' + LINK_MARK + 'e')).toBe('abcde')
		expect(stripSentinels(SENTINELS)).toBe('')
	})
	it('ne touche à rien d\'autre', () => {
		expect(stripSentinels('texte normal 🖼️ éàü')).toBe('texte normal 🖼️ éàü')
	})
})

describe('hasSentinel', () => {
	it('repère un segment masqué, et rien d\'autre', () => {
		expect(hasSentinel('a' + LINK_MARK + '0' + LINK_MARK)).toBe(true)
		expect(hasSentinel('texte normal 🖼️ éàü')).toBe(false)
	})
})

describe('linkify ne laisse passer aucune sentinelle', () => {
	for (const encode of [...SENTINELS].map(encodeURIComponent)) {
		it('neutralise ' + encode, () => {
			const html = linkify('https://leekwars.com/' + encode + '0' + encode)
			expect(hasSentinel(html)).toBe(false)
			// L'URL reste sous sa forme encodée.
			expect(html).toContain(encode)
		})
	}
})
