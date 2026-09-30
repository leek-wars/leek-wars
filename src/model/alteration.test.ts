import { describe, expect, it } from 'vitest'
import { AlterationFamily, ComponentFamily, addedPower, addedPowerWith, alterationTier, alteredClass, capacity, chargePercent, displayRatio, isIndivisibleWrongFamily, planAttempt, power, rawAddedPower, well, wrongFamilyIndivisible } from './alteration'
import type { AlterationData } from './alteration'

/**
 * Projection de la CHARGE : capacité, dosage, gains visés, charge d'arrivée et coût.
 */

// Extrait des game data.
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
		frequency: 2, tp: 80, mp: 100, cores: 40, ram: 60,
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
	it('vaut 0,25 × la puissance des stats de base, arrondi à l\'entier', () => {
		expect(well(840)).toBe(210) // hylocereus (0,25 × 840)
		expect(well(760)).toBe(190) // poire (0,25 × 760)
		expect(well(100)).toBe(25)  // pomme (0,25 × 100)
		expect(well(1)).toBe(0)     // rgb : puits nul, non altérable
	})
})

describe('capacité', () => {
	// Quelques pièces repères.
	const WEIGHTS = { life: 1, strength: 3, agility: 3, wisdom: 3, resistance: 3, science: 3, magic: 3,
		frequency: 2, tp: 180, mp: 240, cores: 90, ram: 120 }
	it('vaut 25 % de la puissance pour une grosse pièce', () => {
		// Carte mère 3 : puissance 1 280, niveau 202.
		const carteMere3: [string, number][] = [['life', 80], ['wisdom', 20], ['science', 20], ['frequency', 30], ['cores', 4], ['ram', 4], ['tp', 1]]
		expect(capacity(carteMere3, 202, WEIGHTS)).toBe(320)
		expect(capacity(HYLOCEREUS, 255, WEIGHTS)).toBe(210)
	})
	it('garde la moyenne avec la valeur de niveau quand elle donne plus', () => {
		expect(capacity([['life', 100]], 5, WEIGHTS)).toBe(55) // pomme : 25 % ne donneraient que 25
	})
	it('prend la surcharge telle quelle, et vaut 0 sans puissance', () => {
		expect(capacity([['life', 1]], 93, WEIGHTS, 420)).toBe(420) // rgb
		expect(capacity([], 1, WEIGHTS)).toBe(0)
	})
})

describe('prévisualisation d\'une tentative', () => {
	it('chiffre le dosage, les gains et le coût d\'un puits presque vide', () => {
		// 1 Vitamine D sur un hylocereus vierge (puits 152 = 0,2 × 760).
		const plan = planAttempt(DATA, HYLOCEREUS, {}, 255, ComponentFamily.FRUIT, { 1: 1 })
		expect(plan.rolls.life.points).toBe(50)
		expect(plan.dose).toBe(20)
		// 255^2 x (1 + 2 x 50/152) : le tarif suit la charge VISÉE.
		expect(plan.habsCost).toBe(107805)
		expect(plan.fits).toBe(true)
	})

	it('additionne les gains d\'une recette mixte', () => {
		const plan = planAttempt(DATA, HYLOCEREUS, { life: 50 }, 255, ComponentFamily.FRUIT, { 1: 1, 4: 1, 13: 1 })
		expect(plan.dose).toBe(63)
		expect(plan.items).toBe(3)
		expect(plan.rolls.life.points).toBe(52)
		expect(plan.rolls.wisdom.points).toBe(12)
	})

	it('propose encore la recette qui remplit le puits pile', () => {
		// 2 Vitamines D (100) sur une pièce déjà chargée de 52 : 152 / 152.
		const plan = planAttempt(DATA, HYLOCEREUS, { life: 52 }, 255, ComponentFamily.FRUIT, { 1: 2 })
		expect(plan.ratioAfter).toBe(1)
		expect(plan.fits).toBe(true)
		expect(plan.overfilled).toBe(false)
	})

	it('ne propose plus un dépassement du puits, même léger, et le signale', () => {
		// 3 Vitamines D (150) sur une pièce déjà chargée de 30 : 180 / 152, soit 118 %.
		const plan = planAttempt(DATA, HYLOCEREUS, { life: 30 }, 255, ComponentFamily.FRUIT, { 1: 3 })
		expect(plan.fits).toBe(false)
		expect(plan.overfilled).toBe(true)
	})

	it('ne propose plus rien bien au-delà du puits', () => {
		// Trois PM montent à 247 % du puits (375 / 152) : refusé.
		const plan = planAttempt(DATA, HYLOCEREUS, {}, 255, ComponentFamily.FRUIT, { 10: 3 })
		expect(plan.fits).toBe(false)
	})

	it('donne moins de points à la mauvaise famille', () => {
		// Sur un fruit, l'alliage Fonte ne rend que 2 points de vie contre 50.
		const vitamin = planAttempt(DATA, HYLOCEREUS, {}, 255, ComponentFamily.FRUIT, { 1: 1 })
		const alloy = planAttempt(DATA, HYLOCEREUS, {}, 255, ComponentFamily.FRUIT, { 13: 1 })
		expect(vitamin.rolls.life.points).toBe(50)
		expect(alloy.rolls.life.points).toBe(2)
	})
})

describe('pièce creusée par la casse', () => {
	// La casse peut faire descendre une carac SOUS sa valeur de base, jusqu'à -100 % de
	// la capacité. Le miroir doit prévisualiser la réparation comme le serveur.
	it('affiche une charge négative, au quart du tarif du déficit', () => {
		// -76 de vie creusée ne rend que 19 de charge : le quart, sinon creuser la carac la
		// moins chère financerait l'achat de la plus chère, et il deviendrait rentable
		// d'acheter une pièce juste pour la vider.
		const plan = planAttempt(DATA, HYLOCEREUS, { life: -76 }, 255, ComponentFamily.FRUIT, {})
		expect(plan.capacity).toBe(152)
		expect(plan.ratioBefore).toBeCloseTo(-0.125, 6)
		// Le ratio BRUT, lui, dit l'état des stats : la pièce a bien perdu la moitié de sa
		// capacité en points, et c'est ce chiffre que l'anneau et la jauge affichent.
		expect(plan.rawRatioBefore).toBeCloseTo(-0.5, 6)
	})

	it('le pourcentage affiché atteint -100 % quand les stats sont au plancher', () => {
		// Fraise : vie 300 + sagesse 50 (poids 2) => puissance 400, capacité 80. La casse
		// peut lui manger 80 points de vie, soit -100 % en état pour -50 % en budget.
		const strawberry: [string, number][] = [['life', 300], ['wisdom', 50]]
		const plan = planAttempt(DATA, strawberry, { life: -80 }, 157, ComponentFamily.FRUIT, {})
		expect(plan.capacity).toBe(80)
		expect(plan.rawRatioBefore).toBeCloseTo(-1, 6)
		expect(plan.ratioBefore).toBeCloseTo(-0.25, 6)
	})

	it('une pièce creusée puis remplie à ras bord affiche 100 %, pas 77 %', () => {
		// Le cas signalé sur la carte mère avancée : science et fréquence creusées à leur
		// plancher (-20 chacune, poids 2) puis toute la vie que le budget permet. Le budget
		// est exactement plein, donc la jauge doit dire 100 % ; la puissance BRUTE, elle, ne
		// vaut que 52 sur 112 parce qu'elle compte les déficits au tarif plein, et afficher ce
		// 46 % laisserait croire qu'il reste de la marge alors que plus rien ne rentre.
		const motherboard: [string, number][] = [['life', 100], ['science', 20], ['frequency', 20],
			['cores', 3], ['ram', 3], ['tp', 1]]
		const full = { life: 132, science: -20, frequency: -20 }
		const weights = DATA.weights
		expect(well(power(motherboard, weights), DATA.well_coefficient)).toBe(112)
		expect(addedPower(full, weights)).toBe(112)
		expect(rawAddedPower(full, weights)).toBe(52)
		// La jauge, le liseré et le tri de l'inventaire lisent tous cette même valeur.
		expect(displayRatio(full, 112, weights)).toBeCloseTo(1, 6)
		expect(alteredClass({ stats: full, template: 381 }, 112, weights)).toBe('altered-5')
	})

	it('la jauge descend sous -100 %, sans borne', () => {
		// Une pièce vidée de toutes ses stats natives descend bien sous -100 % de sa capacité,
		// et la jauge affiche ce vrai chiffre : l'anneau est simplement plein.
		// Fraise : vie 300 + sagesse 50 (poids 2) => puissance 400, capacité 80. Vidée de
		// toutes ses stats natives, elle porte -400 de puissance brute.
		const ruinée = { life: -300, wisdom: -50 }
		const weights = DATA.weights
		// -500 % exactement : la capacité vaut ici un cinquième de la puissance de base, et la
		// pièce a perdu toute cette puissance.
		expect(displayRatio(ruinée, 80, weights)).toBeCloseTo(-5, 6)
	})

	it('mais une pièce creusée continue d\'afficher -100 % au plancher', () => {
		// L'autre bout de l'axe ne mesure pas la même chose : sous zéro, c'est le BRUT qui
		// parle, sinon la fraise vidée de 80 de vie n'afficherait que -50 % et l'ampleur des
		// dégâts serait sous-estimée de moitié.
		const strawberry = { life: -80 }
		const weights = DATA.weights
		expect(addedPower(strawberry, weights)).toBe(-20)
		expect(rawAddedPower(strawberry, weights)).toBe(-80)
		expect(displayRatio(strawberry, 80, weights)).toBeCloseTo(-1, 6)
	})

	it('annonce la charge qui sera reellement livree', () => {
		// Remplir un déficit coûte la puissance pleine mais ne rend que la moitié de la
		// charge : additionner « avant + puissance » promettait une destination qui
		// n'arrivait jamais.
		const dug = { life: -152 }   // hylocereus creusé au plancher, capacité 152
		const plan = planAttempt(DATA, HYLOCEREUS, dug, 255, ComponentFamily.FRUIT, { 1: 5 })
		// 5 Vitamines D = 250 de puissance appliquées à une vie de -152 : la vie finit à +98,
		// donc 98 de charge, soit 64 % et non les 114 % de l'addition linéaire.
		expect(plan.ratioAfter).toBeCloseTo(98 / 152, 6)
	})

	it('facture la charge VISÉE, donc une pièce creusée qui vise bas paie moins', () => {
		// Le tarif suit ce qu'on tente d'atteindre, pas d'où l'on part. Réparer une pièce
		// creusée vise bas, donc coûte le tarif plancher ; viser haut depuis la même pièce
		// coûte le prix fort.
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

describe('palette : ce qui rentre encore', () => {
	// La palette pose l'altération candidate sur les écarts que planAttempt projette, puis
	// recalcule la charge. Le cas du forum : un ressort en élinvar (1 PM natif, capacité 129)
	// ramené à 34 de charge par une casse qui a emporté son PM.
	const elinvar = { life: 59, mp: -1 }

	it('remet une stat native perdue au quart de sa puissance', () => {
		expect(addedPower(elinvar, DATA.weights)).toBe(34)
		// 59/129 et non 134/129 : le PM perdu n'avait rendu que 25, il se remet pour 25.
		expect(addedPowerWith(elinvar, 'mp', 1, DATA.weights)).toBe(59)
	})

	it('compte à plein tarif ce qui dépasse la valeur native', () => {
		expect(addedPowerWith({ life: 34 }, 'mp', 1, DATA.weights)).toBe(134)
		// 20 de vie creusée (-5 de charge) et 50 de vie posée : la vie finit à +30.
		expect(addedPowerWith({ life: -20 }, 'life', 50, DATA.weights)).toBe(30)
	})

	it('part des écarts de la recette déjà posée', () => {
		// Hylocereus creusé de 76 de vie, une Vitamine D posée : la vie projetée remonte à -26.
		const plan = planAttempt(DATA, HYLOCEREUS, { life: -76 }, 255, ComponentFamily.FRUIT, { 1: 1 })
		expect(plan.projected).toEqual({ life: -26 })
	})
})

describe('silhouette d\'un composant', () => {
	// La silhouette doit porter le MEME palier que la jauge : sur la puissance brute, donc.
	// Avec altered_power (charge budgetaire, deficits a tarif reduit), une piece a 42 % de
	// brut affichait le liseré violet des 70 %.
	it('suit la charge budgetaire, comme la jauge', () => {
		// +120 de vie et -40 de sagesse sur une capacite de 152 : budget 80/152 = 53 %
		// (palier 2), brut 40/152 = 26 % (palier 1). Le liseré doit suivre le budget, sinon
		// il annonce un palier que le pourcentage de la jauge contredit.
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
	it('suit les seuils calibrés', () => {
		// Palier 0 : charge négative, la pièce a été creusée sous ses stats de base.
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

describe('pourcentage de charge affiché', () => {
	it('n\'affiche jamais un palier qui n\'est pas atteint', () => {
		// Le cas signalé : une carte SSD niveau 218 (capacité 123) portant +1 PT et
		// trois caracs creusées par la casse pèse exactement 61 de budget, soit 49,6 %.
		// Arrondi, le chiffre disait « 50 % » alors que ni le palier bleu ni le trophée
		// Ébauche ne se déclenchaient : le joueur voyait le seuil franchi et n'avait rien.
		const ssd = { tp: 1, ram: 0, life: -22, wisdom: -4, science: -23 }
		const weights = DATA.weights
		expect(addedPower(ssd, weights)).toBe(61)
		const ratio = displayRatio(ssd, 123, weights)
		expect(chargePercent(ratio)).toBe(49)
		expect(alterationTier(ratio)?.tier).toBe(1)
	})

	it('affiche le palier dès qu\'il est réellement atteint', () => {
		// Un point de budget de plus sur la même pièce (62/123 = 50,4 %) : le chiffre passe à
		// 50 en même temps que le palier bleu et le trophée. L'équivalence est stricte dans
		// les deux sens — c'est tout l'intérêt de la troncature.
		const weights = DATA.weights
		const ratio = displayRatio({ life: 62 }, 123, weights)
		expect(chargePercent(ratio)).toBe(50)
		expect(alterationTier(ratio)?.tier).toBe(2)
	})

	it('ne surestime pas les dégâts d\'une pièce creusée', () => {
		// Sous zéro, tronquer vers zéro reste la lecture prudente : -49,6 % s'affiche -49 %
		// et non -50 %, la pièce ne passe pas pour plus abîmée qu'elle n'est.
		expect(chargePercent(-0.496)).toBe(-49)
		expect(chargePercent(-1)).toBe(-100)
	})

	it('lit le même entier que le serveur, quart de point compris', () => {
		// `item.altered_power` est un ENTIER, et les trophées de palier se lisent dessus. Un
		// déficit qui tombe sur un quart de point (le demi-remboursement) doit donc s'arrondir
		// ici aussi : 61,25 vaut 61 des deux côtés.
		const weights = DATA.weights
		// +1 PT (80) et 75 de vie creusée : 80 - 18,75 = 61,25 de budget.
		const piece = { tp: 1, life: -75 }
		expect(addedPower(piece, weights)).toBeCloseTo(61.25, 6)
		expect(displayRatio(piece, 123, weights)).toBeCloseTo(61 / 123, 6)
		expect(chargePercent(displayRatio(piece, 123, weights))).toBe(49)
	})
})

describe('indivisible hors de sa famille', () => {
	// La forge doit refuser AVANT l'envoi : l'API rejette la recette entière, et le joueur
	// ne doit pas découvrir la règle par une erreur.
	const vitamineVie = DATA.alterations[1]     // vie, vitamine
	const vitaminePM = DATA.alterations[10]     // PM, vitamine — indivisible

	it('refuse une indivisible posée hors de sa famille', () => {
		expect(isIndivisibleWrongFamily(DATA, vitaminePM, ComponentFamily.ELECTRONIC)).toBe(true)
		expect(isIndivisibleWrongFamily(DATA, vitaminePM, ComponentFamily.PHYSICAL)).toBe(true)
	})

	it('laisse passer la même altération sur sa famille', () => {
		expect(isIndivisibleWrongFamily(DATA, vitaminePM, ComponentFamily.FRUIT)).toBe(false)
	})

	it('ne vise QUE les indivisibles : une divisible hors famille reste jouable', () => {
		// C'est elle qui fait les petits gains, donc le réglage fin du dosage reste possible.
		expect(isIndivisibleWrongFamily(DATA, vitamineVie, ComponentFamily.ELECTRONIC)).toBe(false)
	})

	it('trouve la fautive dans une recette mélangée, et ignore les quantités nulles', () => {
		expect(wrongFamilyIndivisible(DATA, { 1: 3 }, ComponentFamily.ELECTRONIC)).toBeNull()
		expect(wrongFamilyIndivisible(DATA, { 1: 3, 10: 1 }, ComponentFamily.ELECTRONIC)).toBe(10)
		expect(wrongFamilyIndivisible(DATA, { 10: 0 }, ComponentFamily.ELECTRONIC)).toBeNull()
	})
})
