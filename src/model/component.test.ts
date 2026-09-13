import { describe, expect, it } from 'vitest'
import { Component, componentsBonus } from './component'

// Catalogue minimal : la pomme (vie), la puce mémoire (ram) et le RGB (pt).
const CATALOG: { [template: number]: [string, number][] } = {
	1: [['life', 100]],
	2: [['ram', 2]],
	3: [['tp', 1]],
}
const baseStats = (template: number) => CATALOG[template]

const piece = (template: number, stats?: { [carac: string]: number } | null) => ({ id: template, template, quantity: 1, stats }) as Component

describe('apport des composants équipés (#622)', () => {
	it('additionne les stats de base des pièces', () => {
		expect(componentsBonus([piece(1), piece(2)], 8, baseStats)).toEqual({ life: 100, ram: 2 })
	})

	it('compte les altérations de la pièce, pas seulement celles du template', () => {
		expect(componentsBonus([piece(1, { life: 50, tp: 1 })], 8, baseStats)).toEqual({ life: 150, tp: 1 })
	})

	it('creuse une carac quand la casse a rendu le delta négatif', () => {
		expect(componentsBonus([piece(1, { life: -20 })], 8, baseStats)).toEqual({ life: 80 })
	})

	it('cumule deux pièces du même template altérées différemment', () => {
		expect(componentsBonus([piece(1, { tp: 1 }), piece(1, { life: 10 })], 8, baseStats)).toEqual({ life: 210, tp: 1 })
	})

	it('ignore les slots au-delà de la limite, les trous et les templates inconnus', () => {
		expect(componentsBonus([piece(1), null, piece(2)], 2, baseStats)).toEqual({ life: 100 })
		expect(componentsBonus([piece(404, { life: 50 })], 8, baseStats)).toEqual({})
	})
})
