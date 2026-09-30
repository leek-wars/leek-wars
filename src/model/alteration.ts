/**
 * Altérations de composants.
 *
 * Ce modèle calcule la CHARGE : capacité du puits, charge investie, charge visée par la
 * recette en cours, coût. C'est ce qu'il faut pour afficher la matrice d'efficacité avant
 * toute dépense — personne ne doit griller un alliage sur une pomme par accident — et
 * pour que la jauge réponde à chaque altération posée, sans aller-retour réseau.
 */

enum AlterationFamily {
	VITAMIN = 1,
	ALLOY = 2,
	BOOSTER = 3,
}

enum ComponentFamily {
	FRUIT = 1,
	PHYSICAL = 2,
	ELECTRONIC = 3,
}

interface AlterationTemplate {
	id: number
	name: string
	carac: string
	family: AlterationFamily
	/** Numéro publié, connu de tous, sans rapport avec la puissance. */
	number: number
	/** item_template correspondant. */
	template: number
}

interface AlterationData {
	alterations: { [id: number]: AlterationTemplate }
	/** Famille de chaque composant, par id de component_template. */
	component_families: { [component_template: number]: ComponentFamily }
	efficiency: { [family: number]: { [component_family: number]: number } }
	weights: { [carac: string]: number }
	/** Gain en points par palier : [grande, moyenne, faible]. */
	gains: { [carac: string]: [number, number, number] }
	well_coefficient: number
	max_items: number
}

/** Une altération posée dans la grille, avec sa quantité. */
interface AlterationRecipe { [alteration_id: number]: number }

/**
 * Nom et icône de chaque famille de composant. La famille décide de tout dans
 * l'altération (quelle fiole marche sur quelle pièce), elle doit donc se lire sur la fiche
 * d'un composant comme sur celle d'une altération, et toujours avec les MÊMES mots et la
 * MÊME icône : c'est ce qui permet de rapprocher les deux fiches d'un coup d'œil.
 *
 * La forme porte la famille : pomme pour les fruits, engrenage pour les pièces physiques,
 * puce pour l'électronique.
 */
const COMPONENT_FAMILY_KEYS: { [key: number]: string } = {
	[ComponentFamily.FRUIT]: 'fruits',
	[ComponentFamily.PHYSICAL]: 'physical_components',
	[ComponentFamily.ELECTRONIC]: 'electronic_components',
}

const COMPONENT_FAMILY_ICONS: { [key: number]: string } = {
	[ComponentFamily.FRUIT]: 'mdi-food-apple',
	[ComponentFamily.PHYSICAL]: 'mdi-cog',
	[ComponentFamily.ELECTRONIC]: 'mdi-chip',
}

/** Les trois familles dans l'ordre d'affichage, avec leur libellé et leur icône. */
const COMPONENT_FAMILIES = [ComponentFamily.FRUIT, ComponentFamily.PHYSICAL, ComponentFamily.ELECTRONIC]
	.map(id => ({ id, key: COMPONENT_FAMILY_KEYS[id], icon: COMPONENT_FAMILY_ICONS[id] }))

const ALTERATION_FAMILY_NAMES: { [key: number]: string } = {
	[AlterationFamily.VITAMIN]: 'vitamin',
	[AlterationFamily.ALLOY]: 'alloy',
	[AlterationFamily.BOOSTER]: 'booster',
}

// Pas de couleur par famille : c'est la FORME de l'image qui porte la famille
// (fiole, lingot, puce) et sa COULEUR qui porte la caractéristique visée, reprise du
// code couleur du jeu (rouge = vie, brun = force...). Un joueur reconnaît donc la
// carac d'un coup d'œil, et les trois familles d'une même carac se répondent.

/**
 * Paliers de couleur du remplissage du puits, du plus haut au plus bas.
 */
const ALTERATION_TIERS: { threshold: number, tier: number, color: string }[] = [
	{ threshold: 1, tier: 1, color: '#008800' },
	{ threshold: 0.85, tier: 4, color: '#f8ac00' },
	{ threshold: 0.7, tier: 3, color: '#c21aff' },
	{ threshold: 0.5, tier: 2, color: '#0090ff' },
	{ threshold: 0.01, tier: 1, color: '#008800' },
]

/** Palier de couleur d'un composant selon son taux de remplissage. */
function alterationTier(ratio: number): { tier: number, color: string } | null {
	// Charge négative : la casse a creusé la pièce sous ses stats de base. Palier
	// à part, gris ardoise : ce n'est pas un degré de réussite, c'est une blessure.
	if (ratio < 0) return { tier: 0, color: '#7d5a5a' }
	if (ratio >= 1) return { tier: 5, color: 'red' }
	if (ratio >= 0.85) return { tier: 4, color: '#f8ac00' }
	if (ratio >= 0.7) return { tier: 3, color: '#c21aff' }
	if (ratio >= 0.5) return { tier: 2, color: '#0090ff' }
	// Le vert passe mal sur les composants déjà verts (RAM 3, kiwi, pomme), d'où le ton foncé.
	if (ratio >= 0.01) return { tier: 1, color: '#008800' }
	return null
}

// --- Charge ---

/** Capacité du puits, en fraction de la puissance des stats de base (valeur par défaut, cf. `well_coefficient` des game data). */
const WELL_COEFFICIENT = 0.25
/** Valeur de niveau de la capacité : de WELL_LEVEL_MIN au niveau 1 à WELL_LEVEL_MAX au niveau WELL_LEVEL_END. */
const WELL_LEVEL_MIN = 80
const WELL_LEVEL_MAX = 150
const WELL_LEVEL_TAU = 80
const WELL_LEVEL_END = 300
/** Part de la charge rendue par une stat que la casse a creusée. */
const DEFICIT_REFUND = 0.25

type Stats = { [carac: string]: number }
/** Format historique des component_template : [["life", 600], ...] */
type StatList = [string, number][]

/** Normalise les deux formats de stats du jeu en map carac => valeur. */
function toMap(stats: Stats | StatList | null | undefined): Stats {
	if (!stats) return {}
	if (!Array.isArray(stats)) return stats
	const map: Stats = {}
	for (const [carac, value] of stats) map[carac] = value
	return map
}

/**
 * Fusionne les altérations d'une instance dans les stats de son template : une altération
 * renforce une carac existante ou en crée une absente, ajoutée en fin de liste.
 */
function mergeStats(base: StatList, added: Stats | null | undefined): StatList {
	if (!added) return base
	const out: StatList = base.map(s => [s[0], s[1]] as [string, number])
	for (const carac in added) {
		if (!added[carac]) continue
		const existing = out.find(s => s[0] === carac)
		if (existing) existing[1] += added[carac]
		else out.push([carac, added[carac]])
	}
	return out
}

/**
 * Capacité du puits, indexée sur la PUISSANCE des stats de base du composant, jamais sur
 * la puissance actuelle : un composant « pèse » ce que valent ses stats natives. Arrondie
 * à l'entier pour atteindre 100 % pile dans les cas propres. Une pièce sans stats a un
 * puits nul et n'est pas altérable.
 *
 * Le puits de chaque composant arrive déjà calculé dans les game data
 * (ComponentTemplate.well) : l'affichage le lit là, seul planAttempt le recalcule ici.
 */
function well(basePower: number, coefficient = WELL_COEFFICIENT): number {
	return Math.round(coefficient * basePower)
}

/** Valeur de niveau de la capacité, de WELL_LEVEL_MIN (niveau 0) à WELL_LEVEL_MAX (niveau WELL_LEVEL_END). */
function levelCapacity(level: number): number {
	const l = Math.max(0, Math.min(WELL_LEVEL_END, level))
	const span = WELL_LEVEL_MAX - WELL_LEVEL_MIN
	const rise = (1 - Math.exp(-l / WELL_LEVEL_TAU)) / (1 - Math.exp(-WELL_LEVEL_END / WELL_LEVEL_TAU))
	return WELL_LEVEL_MIN + span * rise
}

/**
 * Capacité d'altération d'un composant : le plus grand du puits (`coefficient` × la
 * puissance) et de la moyenne entre ce puits et la valeur de niveau, ou la surcharge quand
 * elle est réglée. Passer le `well_coefficient` des game data. `well()` seul ne donne QUE
 * la part des stats, et vaut donc autre chose.
 *
 * Utile partout où la capacité doit suivre des stats en cours d'édition ; ailleurs, elle
 * arrive déjà calculée dans `ComponentTemplate.capacity`.
 */
function capacity(base: Stats | StatList, level: number, weights: { [carac: string]: number },
                  override?: number | null, coefficient = WELL_COEFFICIENT): number {
	if (override) return override
	const basePower = power(base, weights)
	if (basePower <= 0) return 0
	const stats = coefficient * basePower
	return Math.round(Math.max(stats, (stats + levelCapacity(level)) / 2))
}

/** Puissance d'un jeu de stats, en valeur absolue (la poire a une puissance nette nulle). */
function power(stats: Stats | StatList, weights: { [carac: string]: number }): number {
	let total = 0
	const map = toMap(stats)
	for (const carac in map) total += Math.abs(map[carac]) * (weights[carac] || 0)
	return total
}

/**
 * Charge portée par les altérations, SIGNÉE : positive quand la pièce a été montée,
 * négative quand la casse l'a creusée sous ses stats de base.
 *
 * Une stat CASSÉE ne rend qu'une part de sa puissance (DEFICIT_REFUND). Sans ce
 * demi-tarif, retirer une stat bon marché libérerait autant de budget qu'en acheter une
 * chère : creuser 152 de vie sur un hylocereus financerait deux PT, la vie valant 1 de
 * charge par point contre 100 pour un PT.
 */
function addedPower(added: Stats, weights: { [carac: string]: number }): number {
	let total = 0
	for (const carac in added) {
		const power = added[carac] * (weights[carac] || 0)
		total += added[carac] >= 0 ? power : power * DEFICIT_REFUND
	}
	return total
}

/**
 * Charge portée une fois `points` de `carac` posés en plus sur ces écarts : les points
 * s'ajoutent aux écarts et la charge est recalculée, comme planAttempt projette la recette.
 * Reboucher un déficit ne coûte donc que DEFICIT_REFUND de sa puissance : un PM natif
 * perdu à la casse se remet pour 25 de charge, et non pour les 100 d'une addition brute,
 * avec laquelle la palette grisait une réparation pourtant possible.
 */
function addedPowerWith(added: Stats, carac: string, points: number, weights: { [carac: string]: number }): number {
	return addedPower({ ...added, [carac]: (added[carac] ?? 0) + points }, weights)
}

/**
 * Puissance ajoutée au tarif PLEIN, déficits compris. C'est l'ÉTAT de la pièce, pas son
 * budget : une fraise dont la casse a mangé 80 de vie est creusée à -100 % de sa
 * capacité, alors qu'il lui reste 1,25 capacité de marge (le déficit ne rend qu'un
 * quart). Le pourcentage affiché montre cet état, la ligne de charge montre le
 * budget.
 */
function rawAddedPower(added: Stats, weights: { [carac: string]: number }): number {
	let total = 0
	for (const carac in added) total += added[carac] * (weights[carac] || 0)
	return total
}

/**
 * Ratio de charge AFFICHÉ, signé. Point unique pour la jauge, le liseré de silhouette, le
 * coin de la forge et le tri de l'inventaire : ces quatre lectures doivent toujours dire le
 * même chiffre, sinon l'une contredit l'autre.
 *
 * Les deux moitiés de l'axe ne mesurent pas la même chose, parce que le déficit n'est
 * remboursé qu'en partie (DEFICIT_REFUND) :
 *
 * - au-dessus de zéro, le BUDGET. C'est le seul chiffre actionnable, celui qui dit s'il
 *   reste de la place. Le brut comptait les déficits au tarif plein et affichait 77 % sur
 *   une carte mère pourtant pleine, qui n'acceptait plus rien ;
 * - en dessous, le BRUT. Il dit l'ampleur réelle des dégâts et atteint -100 % quand la
 *   casse a creusé la pièce à son plancher, là où le budget ne descend qu'à -50 %.
 *
 * La puissance est ARRONDIE à l'entier avant la division, comme la charge stockée sur
 * l'objet (`item.altered_power`), sur laquelle tournent les trophées de palier. Sans cet
 * arrondi, une pièce dont le déficit tombe sur un quart de point se lirait ici un cheveu
 * sous un seuil qu'elle vient pourtant de franchir, ou l'inverse.
 */
function displayRatio(added: Stats | null | undefined, capacity: number,
                      weights: { [carac: string]: number }): number {
	if (!added || !capacity) return 0
	const budget = Math.round(addedPower(added, weights))
	// Jamais borné : une pièce creusée peut descendre bien sous -100 % de sa capacité.
	// L'anneau, lui, se contente d'être plein au-delà d'un tour : c'est le CHIFFRE qui porte
	// l'information, et le vrai chiffre vaut mieux qu'un plafond.
	return (budget >= 0 ? budget : Math.round(rawAddedPower(added, weights))) / capacity
}

/**
 * Pourcentage de charge AFFICHÉ, tronqué vers zéro et jamais arrondi.
 *
 * Un arrondi affichait « 50 % » à partir de 49,5 %, alors que le palier de couleur et les
 * trophées Ébauche / Soigné / Orfèvre se déclenchent au seuil EXACT : une carte SSD à
 * 61/123 (49,6 %) s'affichait pleine à 50 % sans rien débloquer, et le joueur n'avait
 * aucun moyen de voir qu'il lui manquait un demi-point. Tronquer rend l'équivalence
 * stricte : le chiffre affiché atteint 50 que si le seuil est réellement franchi.
 *
 * Vers zéro et non vers le bas : sous zéro, tronquer reste la lecture prudente, une pièce
 * creusée à -49,6 % n'affiche pas -50 % de dégâts qu'elle n'a pas.
 */
function chargePercent(ratio: number): number {
	return Math.trunc(ratio * 100)
}

/** Palier d'efficacité : 0 = grande (x1), 1 = moyenne (x0,2), 2 = faible (x0,04). */
function efficiencyTier(efficiency: number): number {
	if (efficiency >= 1) return 0
	if (efficiency >= 0.2) return 1
	return 2
}

const INDIVISIBLE = ['tp', 'mp', 'cores', 'ram']

/**
 * Famille d'un composant (fruit, physique, électronique) depuis son id de component_template.
 *
 * À utiliser partout où une efficacité est calculée : lire l'id du composant comme si
 * c'était une famille donne une efficacité de 0, donc les plus petits gains et, pour une
 * indivisible, un refus systématique.
 */
function componentFamily(data: AlterationData, component: number): ComponentFamily {
	return data.component_families[component] ?? 0
}

/**
 * Une altération indivisible (PT, PM, cœurs, mémoire) est-elle posée hors de sa famille ?
 *
 * Une telle altération ne peut rien poser (l'efficacité ne s'applique pas au gain : on ne
 * pose pas +0,2 PM), et la recette qui en contient une est REFUSÉE. La forge doit donc
 * l'interdire avant l'envoi, sinon le joueur découvre la règle par une erreur.
 */
function isIndivisibleWrongFamily(data: AlterationData, alteration: AlterationTemplate, componentFamily: number): boolean {
	if (INDIVISIBLE.indexOf(alteration.carac) === -1) return false
	return ((data.efficiency[alteration.family] || {})[componentFamily] || 0) < 1
}

/** Première altération de la recette refusée par la règle ci-dessus, ou null. */
function wrongFamilyIndivisible(data: AlterationData, recipe: AlterationRecipe, componentFamily: number): number | null {
	for (const id in recipe) {
		if (recipe[id] <= 0) continue
		const alteration = data.alterations[id]
		if (!alteration) continue
		if (isIndivisibleWrongFamily(data, alteration, componentFamily)) return parseInt(id, 10)
	}
	return null
}

/**
 * Projette la tentative en cours : dosage, gains visés, charge d'arrivée et coût.
 */
function planAttempt(data: AlterationData, base: Stats | StatList, added: Stats, level: number,
                     componentFamily: ComponentFamily, recipe: AlterationRecipe,
                     capacityOverride?: number) {

	// Capacité forcée du composant (ex. le RGB) si fournie, sinon le puits par défaut,
	// au prorata de la puissance des stats de base.
	const capacity = capacityOverride ?? well(power(base, data.weights), data.well_coefficient)
	const before = addedPower(added, data.weights)
	// Etat brut de la piece, pour l'affichage du pourcentage (cf. rawAddedPower).
	const rawBefore = rawAddedPower(added, data.weights)

	let dose = 0
	let items = 0
	let recipePower = 0
	const groups: { [carac: string]: { points: number, power: number } } = {}

	for (const id in recipe) {
		const quantity = recipe[id]
		if (quantity <= 0) continue
		const alteration = data.alterations[id]
		if (!alteration) continue

		const carac = alteration.carac
		const efficiency = (data.efficiency[alteration.family] || {})[componentFamily] || 0
		const points = (data.gains[carac] || [0, 0, 0])[efficiencyTier(efficiency)]
		const gainPower = points * (data.weights[carac] || 0)

		// Le DOSAGE compte toujours, quelle que soit la famille : c'est le levier du
		// métabolisme, et une altération mal ciblée garde ce rôle.
		dose += alteration.number * quantity
		items += quantity

		// Une altération indivisible posée sur la mauvaise famille est INERTE : elle ne
		// peut rien poser, donc elle ne consomme pas de capacité. La recette qui en
		// contient une est refusée en amont (cf. wrongFamilyIndivisible) ; ce cas ne
		// subsiste que pour que la fonction reste définie sur n'importe quelle recette.
		if (INDIVISIBLE.indexOf(carac) !== -1 && efficiency < 1) continue

		recipePower += gainPower * quantity

		if (!groups[carac]) groups[carac] = { points: 0, power: 0 }
		groups[carac].points += points * quantity
		groups[carac].power += gainPower * quantity
	}

	// Charge d'arrivée PROJETÉE : on applique les points de la recette aux deltas et on
	// recalcule la charge, au lieu d'additionner la puissance. Remplir un déficit coûte la
	// puissance pleine mais ne rend qu'une part de la charge (DEFICIT_REFUND), donc
	// l'addition linéaire promettait une destination qui n'arrivait jamais : sur une pièce
	// creusée au plancher, l'aperçu annonçait 114 % pour 64 % réellement livrés.
	const projected: Stats = { ...added }
	for (const carac in groups) projected[carac] = (projected[carac] ?? 0) + groups[carac].points
	const after = addedPower(projected, data.weights)
	const rAfter = capacity > 0 ? after / capacity : 0
	// La capacité est un mur : au-delà de 100 %, la tentative n'est plus proposée, quel que
	// soit le chemin qui a posé la recette (palette, historique, « Recommencer »).
	const allowed = capacity > 0 && after <= capacity
	const overfilled = after > capacity

	const rolls: { [carac: string]: { points: number } } = {}
	for (const carac in groups) rolls[carac] = { points: groups[carac].points }

	return {
		// `fits` = tentative proposable (le bouton s'appuie dessus, en attendant la réponse
		// du serveur qui tranche) ; `overfilled` = on dépasse le puits, à afficher comme un
		// avertissement.
		dose, items, power: recipePower, fits: allowed, overfilled, rolls,
		// Écarts de la pièce recette appliquée : la palette y pose chaque altération candidate
		// pour savoir si elle rentre encore (cf. addedPowerWith).
		projected,
		capacity,
		ratioBefore: capacity > 0 ? before / capacity : 0,
		ratioAfter: rAfter,
		// Ratios BRUTS : ce que l'anneau et le pourcentage affichent, pour qu'une piece
		// creusee au plancher se lise -100 % et non -50 %.
		rawRatioBefore: capacity > 0 ? rawBefore / capacity : 0,
		rawRatioAfter: capacity > 0 ? rawAddedPower(projected, data.weights) / capacity : 0,
		// Charge négative ramenée à 0 : une pièce creusée coûte le tarif de base, jamais moins.
		// Tarif indexé sur la charge VISÉE, et non sur celle du départ.
		habsCost: Math.round(level * level * (1 + 2 * Math.max(0, rAfter))),
	}
}

/**
 * Classe CSS du palier d'alteration d'un composant, ou '' s'il n'est pas altere.
 * Point unique pour l'inventaire, la page poireau et le dialogue de composants.
 * `capacity` = puits du composant, lu dans ComponentTemplate.well.
 */
function alteredClass(item: { stats?: Stats | null, altered_power?: number, template: number },
                      capacity: number, weights?: { [carac: string]: number }): string {
	if (!item.stats || !capacity) return ''
	// Exactement le ratio de la jauge (cf. displayRatio), sinon le liseré annonce un palier
	// que le pourcentage affiche juste a cote contredit. Sans les poids on retombe sur
	// altered_power, qui porte deja la charge budgetaire de la piece.
	const ratio = weights ? displayRatio(item.stats, capacity, weights) : (item.altered_power ?? 0) / capacity
	if (!ratio) return ''
	const tier = alterationTier(ratio)
	return tier ? 'altered-' + tier.tier : ''
}

export {
	AlterationFamily, ComponentFamily, ALTERATION_FAMILY_NAMES, ALTERATION_TIERS, alterationTier,
	COMPONENT_FAMILY_KEYS, COMPONENT_FAMILY_ICONS, COMPONENT_FAMILIES,
	well, levelCapacity, capacity, power, addedPower, addedPowerWith, rawAddedPower, displayRatio, chargePercent, efficiencyTier, planAttempt, toMap, mergeStats, alteredClass,
	componentFamily, isIndivisibleWrongFamily, wrongFamilyIndivisible,
}
export type { AlterationTemplate, AlterationData, AlterationRecipe, Stats, StatList }
