import { describe, expect, it } from 'vitest'
import { Component, applyAlteration, componentsBonus } from './component'
import type { StockComponent } from './component'

// Catalogue minimal : la pomme (vie), la puce mémoire (ram) et le RGB (pt).
const CATALOG: { [template: number]: [string, number][] } = {
	1: [['life', 100]],
	2: [['ram', 2]],
	3: [['tp', 1]],
}
const baseStats = (template: number) => CATALOG[template]

const piece = (template: number, stats?: { [carac: string]: number } | null) => ({ id: template, template, quantity: 1, stats }) as Component

describe('apport des composants équipés', () => {
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

// Le serveur détache une pièce de sa pile dès sa première altération : elle repart avec un
// nouvel id, la pile garde l'ancien et reste NEUVE.
describe('applyAlteration : report d\'une tentative sur le stock libre', () => {
	const outcome = { id: 77, time: 200, stats: { life: 30 }, used: 42 }

	it('détache une pièce de la pile sans altérer ce qui reste', () => {
		const stack: StockComponent = { id: 5, template: 1, quantity: 3, time: 100 } as StockComponent
		const components = [stack]
		const piece = applyAlteration(components, { ...stack }, outcome)
		expect(stack.quantity).toBe(2)
		expect(stack.stats).toBeUndefined()
		expect(stack.id).toBe(5)
		expect(components).toHaveLength(2)
		expect(piece).toMatchObject({ id: 77, template: 1, quantity: 1, time: 200, stats: { life: 30 }, altered_power: 42 })
		expect(components[1]).toBe(piece)
	})

	// La forge tient parfois la ligne MÊME du store (« Recommencer », rejeu d'une recette,
	// pièce fabriquée) : c'est ce cas qui peignait la pile entière en altéré et lui donnait
	// l'id de la pièce détachée, d'où des pièces améliorées en double à l'écran.
	it('ne contamine pas la pile quand la forge tient la ligne du store', () => {
		const stack: StockComponent = { id: 5, template: 1, quantity: 3, time: 100 } as StockComponent
		const components = [stack]
		const piece = applyAlteration(components, stack, outcome)
		expect(stack.stats).toBeUndefined()
		expect(stack.altered_power).toBeUndefined()
		expect(stack.id).toBe(5)
		expect(stack.quantity).toBe(2)
		expect(piece).not.toBe(stack)
		expect(components.filter(c => c.id === 77)).toHaveLength(1)
	})

	it('retire la ligne quand la pile tombe à zéro', () => {
		const stack: StockComponent = { id: 5, template: 1, quantity: 1, time: 100 } as StockComponent
		const components = [stack]
		applyAlteration(components, stack, outcome)
		expect(components.map(c => c.id)).toEqual([77])
	})

	it('met à jour la ligne quand la pièce est déjà individuelle', () => {
		const stored: StockComponent = { id: 77, template: 1, quantity: 1, time: 100, stats: { life: 10 } } as StockComponent
		const components = [stored]
		const copy = { ...stored }
		const piece = applyAlteration(components, copy, { ...outcome, id: 77 })
		expect(components).toHaveLength(1)
		expect(stored.stats).toEqual({ life: 30 })
		expect(stored.altered_power).toBe(42)
		expect(stored.time).toBe(200)
		// La copie que tient la forge suit, sinon la fiche affiche les anciennes stats.
		expect(piece).toBe(copy)
		expect(copy.stats).toEqual({ life: 30 })
	})

	it('garde la date d\'avant quand le serveur n\'en renvoie pas', () => {
		const stored: StockComponent = { id: 77, template: 1, quantity: 1, time: 100 } as StockComponent
		applyAlteration([stored], stored, { stats: { life: 30 }, used: 42 })
		expect(stored.time).toBe(100)
	})

	// Métabolisme résolu (#12146) : la pièce doit porter le dosage optimal sans attendre un
	// rechargement.
	it('pose le dosage optimal sur la pièce détachée qui vient de résoudre son métabolisme', () => {
		const stack: StockComponent = { id: 5, template: 1, quantity: 3, time: 100 } as StockComponent
		const components = [stack]
		const piece = applyAlteration(components, { ...stack }, { ...outcome, optimal_dose: 34 })
		expect(piece.optimal_dose).toBe(34)
		// La pile n'en garde rien.
		expect(stack.optimal_dose).toBeUndefined()
	})

	it('écrit le dosage optimal sur la ligne du stock et sur la copie de la forge', () => {
		const stored: StockComponent = { id: 77, template: 1, quantity: 1, time: 100 } as StockComponent
		const copy = { ...stored }
		applyAlteration([stored], copy, { ...outcome, id: 77, optimal_dose: 34 })
		expect(stored.optimal_dose).toBe(34)
		expect(copy.optimal_dose).toBe(34)
	})

	// Une pièce résolue le reste : une tentative qui ne renvoie pas le chiffre (pièce
	// jamais résolue) ne doit pas effacer celui qui est déjà affiché.
	it('n\'efface jamais un dosage optimal déjà connu', () => {
		const stored: StockComponent = { id: 77, template: 1, quantity: 1, time: 100, optimal_dose: 34 } as StockComponent
		applyAlteration([stored], stored, { ...outcome, id: 77, optimal_dose: null })
		expect(stored.optimal_dose).toBe(34)
	})
})
