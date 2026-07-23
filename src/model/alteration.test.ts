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
	well_coefficient: 0.85,
	max_items: 8,
}

// L'hylocereus, au format historique des component_template.
const HYLOCEREUS: [string, number][] = [['life', 600], ['wisdom', 40], ['magic', 40]]

describe('puits', () => {
	it('est indexé sur le niveau, arrondi à l\'entier', () => {
		expect(well(295)).toBe(251) // round(0,85 × 295 = 250,75)
		expect(well(255)).toBe(217) // round(0,85 × 255 = 216,75)
	})
})

describe('prévisualisation d\'une tentative', () => {
	it('reproduit la probabilité pour un puits presque vide', () => {
		// 1 Vitamine D sur un hylocereus vierge (puits arrondi à 217).
		const plan = planAttempt(DATA, HYLOCEREUS, {}, 255, ComponentFamily.FRUIT, { 1: 1 })
		expect(plan.rolls.life.probability).toBeCloseTo(0.78551, 4)
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
		expect(plan.rolls.life.probability).toBeCloseTo(0.02680, 4)
		expect(plan.rolls.wisdom.probability).toBeCloseTo(0.013626, 5)
	})

	it('autorise un léger dépassement du puits mais le rend suicidaire', () => {
		// Deux PM coûtent 250, l'hylocereus n'a qu'un puits de 217 (115 %) : la tentative
		// est autorisée mais quasi impossible, et la casse est certaine.
		const plan = planAttempt(DATA, HYLOCEREUS, {}, 255, ComponentFamily.FRUIT, { 10: 2 })
		expect(plan.fits).toBe(true)
		expect(plan.overfilled).toBe(true)
		expect(plan.rolls.mp.probability).toBeLessThan(0.0001)
		expect(plan.breakProbability).toBe(1)
	})

	it('refuse un dépassement au-delà du plafond souple', () => {
		// Trois PM montent à 173 % du puits, au-delà du plafond de 130 % : refusé.
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
		const plan = planAttempt(DATA, [['life', 600]], {}, 3000, ComponentFamily.FRUIT, { 1: 1 })
		expect(plan.rolls.life.probability).toBeCloseTo(0.95, 6)
	})

	it('la synergie multiplie la probabilité', () => {
		const none = planAttempt(DATA, HYLOCEREUS, { life: 110 }, 255, ComponentFamily.FRUIT, { 1: 1 }, 1)
		const perfect = planAttempt(DATA, HYLOCEREUS, { life: 110 }, 255, ComponentFamily.FRUIT, { 1: 1 }, 3)
		expect(perfect.rolls.life.probability / none.rolls.life.probability).toBeCloseTo(3, 6)
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
