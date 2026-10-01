import { beforeEach, describe, expect, it, vi } from 'vitest'

// Le module charge le localStorage à l'import (état module-level) : chaque test
// réimporte une copie fraîche après avoir préparé le stockage.
const KEY = 'chat/emoji-usage'

async function freshModule() {
	vi.resetModules()
	return await import('@/model/emoji-usage')
}

beforeEach(() => {
	localStorage.clear()
})

describe('emoji-usage - normalisation', () => {
	it('forme brute → canonique et retour', async () => {
		const m = await freshModule()
		expect(m.normalizeEmoji('<3')).toBe('&lt;3')
		expect(m.normalizeEmoji('😂')).toBe('😂')
		expect(m.unescapeEmoji('&lt;3')).toBe('<3')
		expect(m.unescapeEmoji('😂')).toBe('😂')
		expect(m.unescapeEmoji(m.normalizeEmoji('<3'))).toBe('<3')
	})
})

describe('emoji-usage - favoris', () => {
	it('sans historique, aucun favori', async () => {
		const m = await freshModule()
		expect(m.favoriteEmojis.value).toEqual([])
	})

	it('tri du plus utilisé au moins utilisé', async () => {
		const m = await freshModule()
		m.trackEmojiUsage('👍')
		m.trackEmojiUsage('😂')
		m.trackEmojiUsage('😂')
		m.trackEmojiUsage('❤️')
		m.trackEmojiUsage('😂')
		m.trackEmojiUsage('❤️')
		expect(m.favoriteEmojis.value).toEqual(['😂', '❤️', '👍'])
	})

	it('les smileys custom sont stockés en forme canonique', async () => {
		const m = await freshModule()
		m.trackEmojiUsage('<3') // forme brute, telle que postée en réaction
		expect(m.favoriteEmojis.value).toEqual(['&lt;3'])
		expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ '&lt;3': 1 })
	})

	it('persiste et se recharge depuis le localStorage', async () => {
		const m1 = await freshModule()
		m1.trackEmojiUsage('👍')
		m1.trackEmojiUsage('👍')
		const m2 = await freshModule()
		expect(m2.favoriteEmojis.value).toEqual(['👍'])
		m2.trackEmojiUsage('👍')
		expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ '👍': 3 })
	})
})

describe('emoji-usage - robustesse', () => {
	it('stockage corrompu → repart de zéro sans jeter', async () => {
		localStorage.setItem(KEY, '{pas du json')
		const m = await freshModule()
		expect(m.favoriteEmojis.value).toEqual([])
		m.trackEmojiUsage('👍')
		expect(m.favoriteEmojis.value).toEqual(['👍'])
	})

	it('entrées invalides filtrées au chargement', async () => {
		localStorage.setItem(KEY, JSON.stringify({ '👍': 2, '😂': 'nan', '': 5, '💩': -1, ['x'.repeat(50)]: 9 }))
		const m = await freshModule()
		expect(m.favoriteEmojis.value).toEqual(['👍'])
	})

	it('le compteur est borné : les moins utilisés sont abandonnés', async () => {
		const big: { [k: string]: number } = {}
		for (let i = 0; i < 250; i++) { big['e' + i] = i + 2 }
		localStorage.setItem(KEY, JSON.stringify(big))
		const m = await freshModule()
		m.trackEmojiUsage('👍')
		const saved = JSON.parse(localStorage.getItem(KEY)!)
		expect(Object.keys(saved).length).toBeLessThanOrEqual(200)
		// Les plus utilisés survivent, le moins utilisé est abandonné
		expect(saved['e249']).toBe(251)
		expect(saved['e0']).toBeUndefined()
	})
})
