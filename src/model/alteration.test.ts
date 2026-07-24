import { describe, expect, it } from 'vitest'
import { AlterationFamily, ComponentFamily, alterationTier, planAttempt, well } from './alteration'
import type { AlterationData } from './alteration'

/**
 * Le client ne fait que prévisualiser, mais s'il affiche une probabilité différente de
 * celle que le serveur applique, le joueur le voit immédiatement. Ces tests comparent
 * donc aux valeurs que le serveur a RÉELLEMENT renvoyées en beta, pas à des attentes
 * recalculées de mon côté.
 */

// Extrait des game data, aligné sur AlterationRegistry.
const DATA: AlterationData = {
	alterations: {
		1: { id: 1, name: 'vitamin_d', carac: 'life', family: AlterationFamily.VITAMIN, number: 20, template: 530 },
		4: { id: 4, name: 'vitamin_c', carac: 'wisdom', family: AlterationFamily.VITAMIN, number: 35, template: 533 },
		10: { id: 10, name: 'vitamin_b5', carac: 'mp', family: AlterationFamily.VITAMIN, number: 46, template: 539 },
		13: { id: 13, name: 'cast_iron', carac: 'life', family: AlterationFamily.ALLOY, number: 8, template: 542 },
	},
	component_families: { 31: ComponentFamily.FRUIT },
	efficiency: {
		[AlterationFamily.VITAMIN]: { 1: 1, 2: 0.2, 3: 0.04 },
		[AlterationFamily.ALLOY]: { 1: 0.04, 2: 1, 3: 0.2 },
		[AlterationFamily.BOOSTER]: { 1: 0.2, 2: 0.04, 3: 1 },
	},
	weights: {
		life: 1, strength: 4, agility: 4, wisdom: 4, resistance: 4, science: 4, magic: 4,
		frequency: 2, tp: 100, mp: 125, cores: 100, ram: 100,
	},
	gains: {
		life: [50, 10, 2], strength: [12, 3, 1], agility: [12, 3, 1], wisdom: [12, 3, 1],
		resistance: [12, 3, 1], science: [12, 3, 1], magic: [12, 3, 1], frequency: [25, 5, 1],
		tp: [1, 1, 1], mp: [1, 1, 1], cores: [1, 1, 1], ram: [1, 1, 1],
	},
	well_coefficient: 0.2,
	max_items: 8,
}

// L'hylocereus, au format historique des component_template.
const HYLOCEREUS: [string, number][] = [['life', 600], ['wisdom', 40], ['magic', 40]]

describe('puits', () => {
	it('vaut 0,2 × la puissance des stats de base, arrondi à l\'entier', () => {
		expect(well(920)).toBe(184) // hylocereus (0,2 × 920)
		expect(well(600)).toBe(120) // poire (0,2 × 600)
		expect(well(100)).toBe(20)  // pomme (0,2 × 100)
		expect(well(1)).toBe(0)     // rgb : puits nul, non altérable
	})
})

describe('prévisualisation d\'une tentative', () => {
	it('reproduit la probabilité pour un puits presque vide', () => {
		// 1 Vitamine D sur un hylocereus vierge (puits 184 = 0,2 × 920).
		const plan = planAttempt(DATA, HYLOCEREUS, {}, 255, ComponentFamily.FRUIT, { 1: 1 })
		expect(plan.rolls.life.probability).toBeCloseTo(0.70065, 4)
		expect(plan.rolls.life.points).toBe(50)
		expect(plan.dose).toBe(20)
		expect(plan.habsCost).toBe(65025)
		expect(plan.fits).toBe(true)
	})

	it('reproduit la recette mixte du dosage 63', () => {
		const plan = planAttempt(DATA, HYLOCEREUS, { life: 50 }, 255, ComponentFamily.FRUIT, { 1: 1, 4: 1, 13: 1 })
		expect(plan.dose).toBe(63)
		expect(plan.items).toBe(3)
		expect(plan.rolls.life.points).toBe(52)
		expect(plan.rolls.wisdom.points).toBe(12)
		expect(plan.rolls.life.probability).toBeCloseTo(0.0095773, 5)
		expect(plan.rolls.wisdom.probability).toBeCloseTo(0.0048700, 6)
	})

	it('autorise un léger dépassement du puits mais le rend suicidaire', () => {
		// 4 Vitamines D = 200 de puissance sur un puits de 184 (109 %) : la tentative est
		// autorisée (sous le plafond de 130 %) mais quasi impossible, et la casse quasi certaine.
		const plan = planAttempt(DATA, HYLOCEREUS, {}, 255, ComponentFamily.FRUIT, { 1: 4 })
		expect(plan.fits).toBe(true)
		expect(plan.overfilled).toBe(true)
		expect(plan.rolls.life.probability).toBeLessThan(0.0005)
		expect(plan.breakProbability).toBeGreaterThan(0.3)
	})

	it('refuse un dépassement au-delà du plafond souple', () => {
		// Trois PM montent à 204 % du puits (375 / 184), au-delà du plafond de 130 % : refusé.
		const plan = planAttempt(DATA, HYLOCEREUS, {}, 255, ComponentFamily.FRUIT, { 10: 3 })
		expect(plan.fits).toBe(false)
		expect(plan.rolls.mp.probability).toBe(0)
		expect(plan.breakProbability).toBe(0)
	})

	it('donne moins de points à la mauvaise famille', () => {
		// Sur un fruit, l'alliage Fonte ne rend que 2 points de vie contre 50.
		const vitamin = planAttempt(DATA, HYLOCEREUS, {}, 255, ComponentFamily.FRUIT, { 1: 1 })
		const alloy = planAttempt(DATA, HYLOCEREUS, {}, 255, ComponentFamily.FRUIT, { 13: 1 })
		expect(vitamin.rolls.life.points).toBe(50)
		expect(alloy.rolls.life.points).toBe(2)
	})

	it('plafonne la probabilité à 0,95', () => {
		// Base très puissante (puits 3000) : le pas devient négligeable, la proba plafonne.
		const plan = planAttempt(DATA, [['life', 15000]], {}, 3000, ComponentFamily.FRUIT, { 1: 1 })
		expect(plan.rolls.life.probability).toBeCloseTo(0.95, 6)
	})

	it('le danger de casse n\'apparaît que près du plafond', () => {
		const low = planAttempt(DATA, HYLOCEREUS, {}, 255, ComponentFamily.FRUIT, { 1: 1 })
		const high = planAttempt(DATA, HYLOCEREUS, { life: 160 }, 255, ComponentFamily.FRUIT, { 1: 1 })
		expect(low.breakProbability).toBeLessThan(0.001)
		expect(high.breakProbability).toBeGreaterThan(low.breakProbability)
	})
})

describe('paliers de couleur', () => {
	it('suit les seuils calibrés de la spec', () => {
		expect(alterationTier(0)).toBeNull()
		expect(alterationTier(0.01)?.tier).toBe(1)
		expect(alterationTier(0.5)?.tier).toBe(2)
		expect(alterationTier(0.7)?.tier).toBe(3)
		expect(alterationTier(0.85)?.tier).toBe(4)
		expect(alterationTier(1)?.tier).toBe(5)
	})

	it('évite le vert clair, illisible sur les composants déjà verts', () => {
		expect(alterationTier(0.2)?.color).toBe('#008800')
	})
})
