import { describe, it, expect, beforeEach, vi } from 'vitest'

// emojis.ts importe LeekWars (graphe lourd) uniquement pour le flag `nativeEmojis`
// (et `protect` pour formatEmojisText). On mocke ces deux points pour un test hermétique.
// On utilise vi.hoisted pour pouvoir basculer nativeEmojis par test.
const h = vi.hoisted(() => ({ nativeEmojis: false }))

vi.mock('@/model/leekwars', () => ({
	LeekWars: {
		get nativeEmojis() { return h.nativeEmojis },
		protect: (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
	},
}))

import { formatEmojis, formatEmojisText } from '@/model/emojis'

beforeEach(() => { h.nativeEmojis = false })

describe('formatEmojis - entrées non-textuelles', () => {
	it('chaîne vide → vide', () => expect(formatEmojis('')).toBe(''))
	it('null/undefined → vide', () => {
		expect(formatEmojis(null)).toBe('')
		expect(formatEmojis(undefined)).toBe('')
	})
	it('nombre → sa représentation texte', () => expect(formatEmojis(42)).toBe('42'))
})

describe('formatEmojis - smileys custom', () => {
	it('remplace un smiley en début de chaîne', () => {
		const out = formatEmojis(':)')
		expect(out).toContain('image="smile"')
		expect(out).toContain('alt=":)"')
		expect(out).toContain('src="/image/emoji/smile.png"')
	})
	it('ne remplace pas un smiley collé à un mot (règle de frontière)', () => {
		expect(formatEmojis('hi:)')).toBe('hi:)')
	})
	it('remplace un smiley précédé d\'un espace', () => {
		const out = formatEmojis('hi :)')
		expect(out.startsWith('hi ')).toBe(true)
		expect(out).toContain('image="smile"')
	})
	it('remplace un smiley "mot" comme (lama)', () => {
		expect(formatEmojis('(lama)')).toContain('image="lama"')
	})
	it('le coeur attend la forme HTML-échappée &lt;3', () => {
		expect(formatEmojis('&lt;3')).toContain('image="heart"')
	})
})

describe('formatEmojis - emojis unicode', () => {
	it('entoure un emoji unicode quand nativeEmojis=false', () => {
		expect(formatEmojis('😀')).toBe("<span class='emoji emoji-font'>😀</span>")
	})
	it('laisse l\'emoji intact quand nativeEmojis=true', () => {
		h.nativeEmojis = true
		expect(formatEmojis('😀')).toBe('😀')
	})
})

describe('formatEmojisText', () => {
	it('null/undefined → vide', () => {
		expect(formatEmojisText(null)).toBe('')
		expect(formatEmojisText(undefined)).toBe('')
	})
	it('échappe le HTML avant emojis : <3 → &lt;3 → coeur', () => {
		expect(formatEmojisText('<3')).toContain('image="heart"')
	})
})
