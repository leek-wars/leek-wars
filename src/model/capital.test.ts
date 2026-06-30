import { describe, it, expect, vi } from 'vitest'

// capital.ts importe COSTS depuis @/model/costs (module feuille sans dépendance).
// On le mocke avec des paliers réalistes (life + strength) pour exercer l'ALGORITHME de
// stepping indépendamment des valeurs d'équilibrage (config jeu, qui peut bouger) : le mock
// reproduit la forme des vrais paliers, pas une dépendance à leurs chiffres.
vi.mock('@/model/costs', () => ({
	COSTS: {
		// strength : 1 capital → +2 stat sous 200, puis 1 capital → +1 stat de 200 à 400,
		// puis 2 capital → +1 de 400 à 600, puis 3 capital → +1 au-delà.
		strength: [
			{ step: 0, capital: 1, sup: 2 },
			{ step: 200, capital: 1, sup: 1 },
			{ step: 400, capital: 2, sup: 1 },
			{ step: 600, capital: 3, sup: 1 },
		],
		life: [
			{ step: 0, capital: 1, sup: 4 },
			{ step: 1000, capital: 1, sup: 3 },
			{ step: 2000, capital: 1, sup: 2 },
		],
	},
}))

import { totalCapitalForLevel, baseStatFor, capitalToStatBonus, statBonusToCapital } from '@/model/capital'

describe('totalCapitalForLevel', () => {
	it('niveau 1 = 50', () => expect(totalCapitalForLevel(1)).toBe(50))
	it('niveau 2 = 55 (+5 par niveau)', () => expect(totalCapitalForLevel(2)).toBe(55))
	it('niveau 50 = 295', () => expect(totalCapitalForLevel(50)).toBe(295))
	it('palier centaine : 99 = 540, 100 = 590 (+5 niveau +45 palier)', () => {
		expect(totalCapitalForLevel(99)).toBe(540)
		expect(totalCapitalForLevel(100)).toBe(590)
	})
	it('niveau 200 = 1135 (deux paliers)', () => expect(totalCapitalForLevel(200)).toBe(1135))
	it('niveau 300 = 1680', () => expect(totalCapitalForLevel(300)).toBe(1680))
	it('niveau 301 = 1780 (bonus spécial max level +95)', () => expect(totalCapitalForLevel(301)).toBe(1780))
})

describe('baseStatFor', () => {
	it('la vie croît de 3/niveau', () => {
		expect(baseStatFor(1, 'life')).toBe(100)
		expect(baseStatFor(11, 'life')).toBe(130)
		expect(baseStatFor(301, 'life')).toBe(1000)
	})
	it('stats de base fixes', () => {
		expect(baseStatFor(50, 'frequency')).toBe(100)
		expect(baseStatFor(50, 'tp')).toBe(10)
		expect(baseStatFor(50, 'mp')).toBe(3)
		expect(baseStatFor(50, 'ram')).toBe(6)
		expect(baseStatFor(50, 'cores')).toBe(1)
	})
	it('les stats fixes ne dépendent pas du niveau', () => {
		expect(baseStatFor(1, 'tp')).toBe(baseStatFor(301, 'tp'))
	})
	it('stat inconnue = 0', () => expect(baseStatFor(50, 'inconnue')).toBe(0))
})

describe('capitalToStatBonus', () => {
	it('capital nul ou négatif = 0', () => {
		expect(capitalToStatBonus('strength', 0)).toBe(0)
		expect(capitalToStatBonus('strength', -10)).toBe(0)
	})
	it('caractéristique inconnue = 0', () => expect(capitalToStatBonus('inconnue', 1000)).toBe(0))
	it('premier palier : 1 capital → +2 stat', () => {
		expect(capitalToStatBonus('strength', 1)).toBe(2)
		expect(capitalToStatBonus('strength', 100)).toBe(200)
	})
	it('franchit un palier : 250 capital → 350 stat (100→+200 puis 150→+150)', () => {
		expect(capitalToStatBonus('strength', 250)).toBe(350)
	})
})

describe('statBonusToCapital', () => {
	it('bonus nul ou négatif = 0', () => {
		expect(statBonusToCapital('strength', 0)).toBe(0)
		expect(statBonusToCapital('strength', -5)).toBe(0)
	})
	it('caractéristique inconnue = 0', () => expect(statBonusToCapital('inconnue', 200)).toBe(0))
	it('inverse de capitalToStatBonus aux bornes de palier', () => {
		expect(statBonusToCapital('strength', 200)).toBe(100)
		expect(statBonusToCapital('strength', 350)).toBe(250)
	})
})

describe('capitalToStatBonus ↔ statBonusToCapital (aller-retour)', () => {
	it('un capital aligné sur un palier fait un aller-retour exact', () => {
		for (const capital of [100, 250]) {
			const bonus = capitalToStatBonus('strength', capital)
			expect(statBonusToCapital('strength', bonus)).toBe(capital)
		}
	})
})
