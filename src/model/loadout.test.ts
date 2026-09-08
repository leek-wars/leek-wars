import { describe, expect, it } from 'vitest'
import { componentStatsKey, loadoutComponentStat, sameComponentChoice } from './loadout'

describe('composants d\'ensemble avec stats mémorisées (#622)', () => {
	it('la clé des stats ignore l\'ordre et les zéros, et vaut vide pour une pièce de base', () => {
		expect(componentStatsKey(null)).toBe('')
		expect(componentStatsKey({})).toBe('')
		expect(componentStatsKey({ life: 0 })).toBe('')
		expect(componentStatsKey({ tp: 1, life: 10 })).toBe(componentStatsKey({ life: 10, tp: 1 }))
		expect(componentStatsKey({ tp: 1 })).not.toBe(componentStatsKey({ tp: 2 }))
	})

	it('deux choix sont la même pièce si template et stats coïncident', () => {
		expect(sameComponentChoice({ template: 299 }, { template: 299, stats: null })).toBe(true)
		expect(sameComponentChoice({ template: 299, stats: { tp: 1 } }, { template: 299, stats: { tp: 1 } })).toBe(true)
		expect(sameComponentChoice({ template: 299, stats: { tp: 1 } }, { template: 299 })).toBe(false)
		expect(sameComponentChoice({ template: 299 }, { template: 300 })).toBe(false)
	})

	it('l\'apport d\'un composant additionne la base du template et le delta', () => {
		const base: [string, number][] = [['life', 100], ['tp', 1]]
		expect(loadoutComponentStat(base, null, 'life')).toBe(100)
		expect(loadoutComponentStat(base, { life: 50, mp: 1 }, 'life')).toBe(150)
		expect(loadoutComponentStat(base, { life: 50, mp: 1 }, 'mp')).toBe(1)
		expect(loadoutComponentStat(base, { life: -20 }, 'life')).toBe(80)
		expect(loadoutComponentStat(undefined, { tp: 1 }, 'tp')).toBe(1)
	})
})
