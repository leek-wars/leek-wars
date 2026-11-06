import { describe, expect, it } from 'vitest'
import { type Fight, FightContext, FightType } from '@/model/fight'
import {
	type FightFilters, fightMatchesFilters, isDefaultFilters, sanitizeFilters,
} from '@/component/history/history-filters'

/** Un combat de potager solo gagné, modifié par `overrides`, passe-t-il les filtres ? */
function matches(overrides: Partial<Fight>, filters: FightFilters, ignoreTypes = false): boolean {
	const fight = {
		id: 1, date: 0, status: 2, result: 'win', chests: 0, rareloot: 0,
		context: FightContext.GARDEN, type: FightType.SOLO,
		...overrides,
	} as Fight
	return fightMatchesFilters(fight, filters, ignoreTypes)
}

describe('history-filters', () => {

	it('complète un réglage incomplet avec les valeurs par défaut', () => {
		const filters = sanitizeFilters({ results: { win: false }, types: { boss: 'non' } })
		expect(filters.results).toEqual({ win: false, draw: true, defeat: true, generating: true })
		expect(filters.types.boss).toBe(true)
		expect(filters.loot).toEqual({ chests: false, rareloot: false })
		expect(isDefaultFilters(sanitizeFilters(undefined))).toBe(true)
		expect(isDefaultFilters(filters)).toBe(false)
	})

	it('laisse tout passer avec les filtres par défaut', () => {
		const filters = sanitizeFilters(null)
		expect(matches({}, filters)).toBe(true)
		const teamDefeat = { context: FightContext.TOURNAMENT, type: FightType.TEAM }
		expect(matches({ ...teamDefeat, result: 'defeat' }, filters)).toBe(true)
		expect(matches({ status: 0, result: '' }, filters)).toBe(true)
	})

	it('filtre par contexte, type et résultat', () => {
		const filters = sanitizeFilters({ contexts: { garden: false }, results: { defeat: false } })
		expect(matches({ context: FightContext.GARDEN }, filters)).toBe(false)
		expect(matches({ context: FightContext.CHALLENGE }, filters)).toBe(true)
		expect(matches({ context: FightContext.CHALLENGE, result: 'defeat' }, filters)).toBe(false)
		const noBoss = sanitizeFilters({ types: { boss: false } })
		expect(matches({ type: FightType.BOSS }, noBoss)).toBe(false)
		// L'historique d'une équipe ignore la ligne « types ».
		expect(matches({ type: FightType.BOSS }, noBoss, true)).toBe(true)
	})

	it('traite le butin comme une restriction, sans masquer les combats en génération', () => {
		const filters = sanitizeFilters({ loot: { chests: true } })
		expect(matches({ chests: 0 }, filters)).toBe(false)
		expect(matches({ chests: 2 }, filters)).toBe(true)
		expect(matches({ status: 0, result: '' }, filters)).toBe(true)
	})
})
