import { describe, it, expect, beforeAll } from 'vitest'
import { vi } from 'vitest'

// Comme emojis.test.ts : emojis.ts tire LeekWars (graphe lourd) pour un seul
// drapeau, on le remplace par le strict nécessaire.
vi.mock('@/model/leekwars', () => ({
	LeekWars: { nativeEmojis: true, protect: (s: unknown) => String(s) },
}))

import { setTranslations } from '@/locale'
import { EmojiGroups } from '@/model/emoji-list'
import { loadEmojiKeywords, searchEmojis } from '@/model/emoji-search'

const catalogue = EmojiGroups.flatMap(group => group.emojis)

describe('recherche d\'emoji - avant chargement des mots-clés', () => {
	it('trouve déjà les smileys maison, qui ne dépendent d\'aucun fichier', () => {
		expect(searchEmojis('lama')).toContain('(lama)')
		expect(searchEmojis('crystal')).toContain('(crystal)')
	})
	it('ne renvoie rien sur une requête vide', () => {
		expect(searchEmojis('')).toEqual([])
		expect(searchEmojis('   ')).toEqual([])
	})
})

describe('recherche d\'emoji - en français', () => {
	beforeAll(async () => {
		setTranslations('fr', {})
		await loadEmojiKeywords()
	})

	it('charge un fichier de mots-clés aligné sur le catalogue', async () => {
		// Le fichier est un tableau parallèle : un décalage d'un cran donnerait
		// des résultats absurdes. Ce test attrape une régénération oubliée.
		const keywords = (await import('@/model/emoji-keywords/fr.json')).default
		expect(keywords).toHaveLength(catalogue.length)
	})

	it('met le nom exact en premier', () => {
		expect(searchEmojis('chat')[0]).toBe('🐈')
		expect(searchEmojis('pizza')[0]).toBe('🍕')
	})

	it('trouve par mot-clé, pas seulement par nom', () => {
		expect(searchEmojis('miaou')).toContain('🐱')
		expect(searchEmojis('pepperoni')).toContain('🍕')
	})

	it('ignore les accents et la casse', () => {
		expect(searchEmojis('etoile')).toContain('⭐')
		expect(searchEmojis('ÉTOILE')).toContain('⭐')
		expect(searchEmojis('étoile')[0]).toBe('⭐')
	})

	it('accepte un préfixe', () => {
		expect(searchEmojis('pizz')).toContain('🍕')
		expect(searchEmojis('licor')).toContain('🦄')
	})

	it('trouve un mot au milieu du nom', () => {
		// « visage rieur » : le mot cherché n'ouvre pas le nom.
		expect(searchEmojis('rieur')).toContain('😀')
	})

	it('trouve les drapeaux par le nom du pays', () => {
		expect(searchEmojis('france')).toContain('🇫🇷')
	})

	it('ne renvoie rien sur une requête sans correspondance', () => {
		expect(searchEmojis('zzzzzzz')).toEqual([])
	})

	it('plafonne le nombre de résultats', () => {
		expect(searchEmojis('a', 20)).toHaveLength(20)
		expect(searchEmojis('visage').length).toBeLessThanOrEqual(120)
	})

	it('ne renvoie que des emojis du catalogue', () => {
		const connus = new Set([...catalogue, '(lama)', '(hab)'])
		for (const emoji of searchEmojis('drapeau')) { expect(connus.has(emoji) || emoji.startsWith('(')).toBe(true) }
	})
})
