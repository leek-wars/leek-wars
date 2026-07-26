import { describe, expect, it } from 'vitest'
import { AlterationFamily, ComponentFamily, addedPower, alterationTier, alteredClass, displayRatio, planAttempt, power, rawAddedPower, well } from './alteration'
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
		life: 1, strength: 2, agility: 2, wisdom: 2, resistance: 2, science: 2, magic: 2,
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
		expect(well(760)).toBe(152) // hylocereus (0,2 × 760)
		expect(well(600)).toBe(120) // poire (0,2 × 600)
		expect(well(100)).toBe(20)  // pomme (0,2 × 100)
		expect(well(1)).toBe(0)     // rgb : puits nul, non altérable
	})
})

describe('prévisualisation d\'une tentative', () => {
	it('reproduit la probabilité pour un puits presque vide', () => {
		// 1 Vitamine D sur un hylocereus vierge (puits 152 = 0,2 × 760).
		const plan = planAttempt(DATA, HYLOCEREUS, {}, 255, ComponentFamily.FRUIT, { 1: 1 })
		expect(plan.rolls.life.probability).toBeCloseTo(0.8291814, 6)
		expect(plan.rolls.life.points).toBe(50)
		expect(plan.dose).toBe(20)
		// 255^2 x (1 + 2 x 50/152) : le tarif suit la charge VISÉE.
		expect(plan.habsCost).toBe(107805)
		expect(plan.fits).toBe(true)
	})

	it('reproduit la recette mixte du dosage 63', () => {
		const plan = planAttempt(DATA, HYLOCEREUS, { life: 50 }, 255, ComponentFamily.FRUIT, { 1: 1, 4: 1, 13: 1 })
		expect(plan.dose).toBe(63)
		expect(plan.items).toBe(3)
		expect(plan.rolls.life.points).toBe(52)
		expect(plan.rolls.wisdom.points).toBe(12)
		expect(plan.rolls.life.probability).toBeCloseTo(0.0219028, 6)
		expect(plan.rolls.wisdom.probability).toBeCloseTo(0.0115435, 6)
		// Une recette = un seul jet : la proba de tentative est le min (ici la sagesse).
		expect(plan.probability).toBeCloseTo(0.0115435, 6)
	})

	it('autorise un léger dépassement du puits mais le rend suicidaire', () => {
		// 3 Vitamines D = 150 de puissance sur un puits de 152... juste en dessous : on en
		// met 3 sur une pièce déjà chargée pour viser 118 %, sous le plafond de 130 %.
		const plan = planAttempt(DATA, HYLOCEREUS, { life: 30 }, 255, ComponentFamily.FRUIT, { 1: 3 })
		expect(plan.fits).toBe(true)
		expect(plan.overfilled).toBe(true)
		expect(plan.rolls.life.probability).toBeLessThan(0.002)
		expect(plan.breakProbability).toBeGreaterThan(0.3)
	})

	it('refuse un dépassement au-delà du plafond souple', () => {
		// Trois PM montent à 247 % du puits (375 / 152), au-delà du plafond de 130 % : refusé.
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
		const high = planAttempt(DATA, HYLOCEREUS, { life: 100 }, 255, ComponentFamily.FRUIT, { 1: 1 })
		// Seuil à 2 % : le coefficient de casse suit DIFFICULTY_K et vaut désormais 0,01,
		// donc une pièce presque vide risque un peu plus d'un centième (#622).
		expect(low.breakProbability).toBeLessThan(0.02)
		expect(high.breakProbability).toBeGreaterThan(low.breakProbability)
	})

	it('le risque affiché tient compte du fait que la casse ne suit qu\'un échec', () => {
		// Le serveur ne tire la casse qu'après un échec : le risque de la fusion entière
		// vaut donc (1 - réussite) × P(casse), et non P(casse) seule (#622).
		const plan = planAttempt(DATA, HYLOCEREUS, {}, 255, ComponentFamily.FRUIT, { 1: 1 })
		expect(plan.breakRisk).toBeCloseTo((1 - plan.probability) * plan.breakProbability, 12)
		expect(plan.breakRisk).toBeLessThan(plan.breakProbability)
	})
})

describe('pièce creusée par la casse', () => {
	// La casse peut faire descendre une carac SOUS sa valeur de base, jusqu'à -100 % de
	// la capacité (#622). Le miroir doit prévisualiser la réparation comme le serveur.
	it('affiche une charge négative, au demi-tarif du déficit', () => {
		// -76 de vie creusée ne rend que 38 de charge : la moitié, sinon creuser la carac
		// la moins chère financerait l'achat de la plus chère (#622).
		const plan = planAttempt(DATA, HYLOCEREUS, { life: -76 }, 255, ComponentFamily.FRUIT, {})
		expect(plan.capacity).toBe(152)
		expect(plan.ratioBefore).toBeCloseTo(-0.25, 6)
		// Le ratio BRUT, lui, dit l'état des stats : la pièce a bien perdu la moitié de sa
		// capacité en points, et c'est ce chiffre que l'anneau et la jauge affichent.
		expect(plan.rawRatioBefore).toBeCloseTo(-0.5, 6)
	})

	it('le pourcentage affiché atteint -100 % quand les stats sont au plancher', () => {
		// Fraise : vie 300 + sagesse 50 (poids 2) => puissance 400, capacité 80. La casse
		// peut lui manger 80 points de vie, soit -100 % en état pour -50 % en budget (#622).
		const strawberry: [string, number][] = [['life', 300], ['wisdom', 50]]
		const plan = planAttempt(DATA, strawberry, { life: -80 }, 157, ComponentFamily.FRUIT, {})
		expect(plan.capacity).toBe(80)
		expect(plan.rawRatioBefore).toBeCloseTo(-1, 6)
		expect(plan.ratioBefore).toBeCloseTo(-0.5, 6)
	})

	it('une pièce creusée puis remplie à ras bord affiche 100 %, pas 77 %', () => {
		// Le cas signalé sur la carte mère avancée : science et fréquence creusées à leur
		// plancher (-20 chacune, poids 2) puis 216 de vie posés dessus. Le budget est
		// exactement plein, donc la jauge doit dire 100 % ; la puissance BRUTE, elle, ne vaut
		// que 136 sur 176 parce qu'elle compte les déficits au tarif plein, et afficher ce
		// 77 % laissait croire qu'il restait 23 % de marge alors que plus rien ne rentre.
		const motherboard: [string, number][] = [['life', 100], ['science', 20], ['frequency', 20],
			['cores', 3], ['ram', 3], ['tp', 1]]
		const full = { life: 216, science: -20, frequency: -20 }
		const weights = DATA.weights
		expect(well(power(motherboard, weights))).toBe(176)
		expect(addedPower(full, weights)).toBe(176)
		expect(rawAddedPower(full, weights)).toBe(136)
		// La jauge, le liseré et le tri de l'inventaire lisent tous cette même valeur.
		expect(displayRatio(full, 176, weights)).toBeCloseTo(1, 6)
		expect(alteredClass({ stats: full, template: 381 }, 176, weights)).toBe('altered-5')
	})

	it('un échec à charge pleine casse à coup sûr, même sur une pièce creusée', () => {
		// Le miroir doit annoncer le même risque que le serveur : une carte mère pleine dont
		// la casse a creusé science et fréquence garde 216 points de vie à perdre. Le plancher
		// se lit sur la charge NETTE (136), pas sur la somme des déficits (-80), sinon la
		// pièce passe pour increvable et l'acharnement devient gratuit (#622).
		const motherboard: [string, number][] = [['life', 100], ['science', 20], ['frequency', 20],
			['cores', 3], ['ram', 3], ['tp', 1]]
		const full = { life: 216, science: -20, frequency: -20 }
		const plan = planAttempt(DATA, motherboard, full, 106, ComponentFamily.ELECTRONIC, { 13: 1 })
		expect(plan.capacity).toBe(176)
		expect(plan.breakProbability).toBeCloseTo(1, 6)
	})

	it('mais une pièce creusée continue d\'afficher -100 % au plancher', () => {
		// L'autre bout de l'axe ne mesure pas la même chose : sous zéro, c'est le BRUT qui
		// parle, sinon la fraise vidée de 80 de vie n'afficherait que -50 % et l'ampleur des
		// dégâts serait sous-estimée de moitié (demandé le 23/07, #622).
		const strawberry = { life: -80 }
		const weights = DATA.weights
		expect(addedPower(strawberry, weights)).toBe(-40)
		expect(rawAddedPower(strawberry, weights)).toBe(-80)
		expect(displayRatio(strawberry, 80, weights)).toBeCloseTo(-1, 6)
	})

	it('rend la réparation facile : la difficulté se lit sur le remplissage', () => {
		// Remonter de -50 % vers 0 est au plafond, alors que le même pas depuis 0 est dur.
		const repair = planAttempt(DATA, HYLOCEREUS, { life: -76 }, 255, ComponentFamily.FRUIT, { 1: 1 })
		const climb = planAttempt(DATA, HYLOCEREUS, {}, 255, ComponentFamily.FRUIT, { 1: 1 })
		expect(repair.probability).toBeCloseTo(0.95, 6)
		expect(repair.probability).toBeGreaterThan(climb.probability)
		// Et réparer n'est pas plus dangereux que charger à vide.
		expect(repair.breakProbability).toBeLessThanOrEqual(climb.breakProbability)
	})

	it('annonce la charge qui sera reellement livree', () => {
		// Remplir un déficit coûte la puissance pleine mais ne rend que la moitié de la
		// charge : additionner « avant + puissance » promettait une destination qui
		// n'arrivait jamais. Bug trouvé par le bot d'optimisation sur beta (#622).
		const dug = { life: -152 }   // hylocereus creusé au plancher, capacité 152
		const plan = planAttempt(DATA, HYLOCEREUS, dug, 255, ComponentFamily.FRUIT, { 1: 5 })
		// 5 Vitamines D = 250 de puissance appliquées à une vie de -152 : la vie finit à +98,
		// donc 98 de charge, soit 64 % et non les 114 % de l'addition linéaire.
		expect(plan.ratioAfter).toBeCloseTo(98 / 152, 6)
	})

	it('facture la charge VISÉE, donc une pièce creusée qui vise bas paie moins', () => {
		// Le tarif suit ce qu'on tente d'atteindre, pas d'où l'on part. Réparer une pièce
		// creusée vise bas, donc coûte le tarif plancher : c'est voulu, la casse est déjà
		// la punition. Ce qui n'est plus possible, c'est de viser le plafond au tarif
		// plancher en gardant la pièce en négatif (#622).
		const repair = planAttempt(DATA, HYLOCEREUS, { life: -76 }, 255, ComponentFamily.FRUIT, { 1: 1 })
		const fresh = planAttempt(DATA, HYLOCEREUS, {}, 255, ComponentFamily.FRUIT, { 1: 1 })
		expect(repair.ratioAfter).toBeLessThan(0)
		expect(repair.habsCost).toBeLessThan(fresh.habsCost)

		// Depuis la même pièce creusée, viser le plafond coûte le prix du plafond.
		const allIn = planAttempt(DATA, HYLOCEREUS, { life: -76 }, 255, ComponentFamily.FRUIT, { 1: 4 })
		expect(allIn.ratioAfter).toBeGreaterThan(0.8)
		expect(allIn.habsCost).toBeGreaterThan(repair.habsCost * 2)
	})
})

describe('silhouette d\'un composant', () => {
	// La silhouette doit porter le MEME palier que la jauge : sur la puissance brute, donc.
	// Avec altered_power (charge budgetaire, deficits a demi-tarif), une piece a 42 % de
	// brut affichait le liseré violet des 70 % (#622).
	it('suit la charge budgetaire, comme la jauge', () => {
		// +120 de vie et -40 de sagesse sur une capacite de 152 : budget 80/152 = 53 %
		// (palier 2), brut 40/152 = 26 % (palier 1). Le liseré doit suivre le budget, sinon
		// il annonce un palier que le pourcentage de la jauge contredit (#622).
		const item = { stats: { life: 120, wisdom: -40 }, altered_power: 80, template: 320 }
		expect(alteredClass(item, 152, DATA.weights)).toBe('altered-2')
		// Sans les poids on lit altered_power, qui porte deja cette meme charge budgetaire.
		expect(alteredClass(item, 152)).toBe('altered-2')
	})

	it('ne marque rien sur un composant neuf', () => {
		expect(alteredClass({ stats: null, template: 320 }, 152, DATA.weights)).toBe('')
	})
})

describe('paliers de couleur', () => {
	it('suit les seuils calibrés de la spec', () => {
		// Palier 0 : charge négative, la pièce a été creusée sous ses stats de base (#622).
		expect(alterationTier(-0.01)?.tier).toBe(0)
		expect(alterationTier(-1)?.tier).toBe(0)
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
