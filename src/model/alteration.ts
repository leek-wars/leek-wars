/**
 * Altérations de composants (issue #622).
 *
 * Miroir client du moteur serveur (api/class/Alteration.class.php). Il sert uniquement
 * à PRÉVISUALISER : la matrice d'efficacité doit être affichée avant toute dépense,
 * personne ne doit griller un alliage sur une pomme par accident. Le serveur reste
 * seul juge du résultat réel, et le métabolisme n'est jamais connu du client.
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
 * Paliers de couleur du remplissage du puits, calibrés pour qu'il y ait environ un
 * facteur 6 entre chaque, en coût réel d'altérations. Les seuils naïfs (20/60/80/100)
 * écrasaient les deux premiers : 1 % et 20 % coûtent tous deux une seule altération.
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
	// Charge négative : la casse a creusé la pièce sous ses stats de base (#622). Palier
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

// --- Miroir du moteur serveur, pour la prévisualisation ---
//
// Ces constantes DOIVENT rester alignées sur api/class/Alteration.class.php. Le client
// n'en fait qu'un affichage : il ne décide de rien, et un écart se voit immédiatement
// puisque le serveur renvoie la probabilité qu'il a réellement utilisée.

const WELL_COEFFICIENT = 0.2
const DIFFICULTY_K = 5.0
const PROGRESS_BONUS = 2
const PROGRESS_CAP = 0.2
const MAX_PROBABILITY = 0.95
const BREAK_COEFFICIENT = 0.01
// Surcoût du SOMMET, en puissance sixième du remplissage visé : il divise par 10 la chance
// d'une tentative à pleine charge et ne touche presque rien en dessous (-0,2 % à 30 %, -4 %
// à 50 %, -24 % à 70 %). Monter DIFFICULTY_K aurait durci toute la courbe, y compris les
// premières altérations d'un joueur ordinaire, alors que le prix à corriger était celui du
// sans-faute : une pièce exacte revenait à 1 258 altérations, on en veut dix fois plus (#622).
const TOP_PENALTY = Math.log(10)
// Le puits n'est plus un mur : on autorise a tenter jusqu'a ce plafond, ou la reussite
// devient infime et la casse quasi certaine. Au-dela, la tentative est refusee (#622).
const OVERFILL_CAP = 1.3
// Plancher de charge : la casse creuse la pièce sous ses stats de base jusqu'à -100 %
// de sa capacité, pas au-delà (à un point indivisible près, qui ne se coupe pas).
const CHARGE_FLOOR = -1
// Part de la charge rendue par une stat cassée : à taux plein, creuser la carac la moins
// chère finançait l'achat de la plus chère, c'était la stratégie dominante (#622).
const DEFICIT_REFUND = 0.5

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
 * Fusionne les altérations d'une instance dans les stats de son template.
 * Miroir de Alteration::mergeStats côté serveur : une altération renforce une carac
 * existante ou en crée une absente, ajoutée en fin de liste.
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
 * Capacité du puits, indexée sur la PUISSANCE des stats de base du composant
 * (0,2 × power), jamais sur la puissance actuelle : un composant « pèse » ce que
 * valent ses stats natives. Arrondie à l'entier pour atteindre 100 % pile dans les
 * cas propres. Une pièce sans stats a un puits nul et n'est pas altérable (#622).
 *
 * Le serveur pré-calcule ce même puits par composant et l'expose dans les game data
 * (ComponentTemplate.well) : l'affichage le lit là, seul planAttempt le recalcule ici.
 */
function well(basePower: number): number {
	return Math.round(WELL_COEFFICIENT * basePower)
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
 * Une stat CASSÉE ne rend que la MOITIÉ de sa puissance (DEFICIT_REFUND). Sans ce
 * demi-tarif, retirer une stat bon marché libérait autant de budget qu'en acheter une
 * chère : creuser 152 de vie sur un hylocereus finançait deux PT, la vie valant 1 de
 * charge par point contre 100 pour un PT (#622).
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
 * Puissance ajoutée au tarif PLEIN, déficits compris. C'est l'ÉTAT de la pièce, pas son
 * budget : une fraise dont la casse a mangé 80 de vie est creusée à -100 % de sa
 * capacité, alors qu'il lui reste 1,5 capacité de marge (le déficit ne rend que la
 * moitié). Le pourcentage affiché montre cet état, la ligne de charge montre le
 * budget (#622).
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
 * remboursé qu'à moitié (DEFICIT_REFUND) :
 *
 * - au-dessus de zéro, le BUDGET. C'est le seul chiffre actionnable, celui qui dit s'il
 *   reste de la place. Le brut comptait les déficits au tarif plein et affichait 77 % sur
 *   une carte mère pourtant pleine, qui n'acceptait plus rien ;
 * - en dessous, le BRUT. Il dit l'ampleur réelle des dégâts et atteint -100 % quand la
 *   casse a creusé la pièce à son plancher, là où le budget ne descend qu'à -50 %.
 */
function displayRatio(added: Stats | null | undefined, capacity: number,
                      weights: { [carac: string]: number }): number {
	if (!added || !capacity) return 0
	const budget = addedPower(added, weights)
	return (budget >= 0 ? budget : rawAddedPower(added, weights)) / capacity
}

/** Part de la carac visée dans la puissance du composant : x1 si seule, x3 si absente. */
function part(base: Stats | StatList, added: Stats, carac: string, weights: { [carac: string]: number }): number {
	const total = toMap(base)
	for (const c in added) total[c] = (total[c] || 0) + added[c]
	const p = power(total, weights)
	if (p <= 0) return 0
	return Math.abs(total[carac] || 0) * (weights[carac] || 0) / p
}

function difficulty(partValue: number): number {
	// Créer une carac absente (part 0) coûte au plus 2× plus cher, jamais 3× (#622).
	return 1 + Math.pow(1 - partValue, 2)
}

/** Palier d'efficacité : 0 = grande (x1), 1 = moyenne (x0,2), 2 = faible (x0,04). */
function efficiencyTier(efficiency: number): number {
	if (efficiency >= 1) return 0
	if (efficiency >= 0.2) return 1
	return 2
}

const INDIVISIBLE = ['tp', 'mp', 'cores', 'ram']

/**
 * Prévisualise une tentative : un jet par caractéristique visée, tous vers la même
 * destination (celle où la recette atterrit si tout passe).
 */
function planAttempt(data: AlterationData, base: Stats | StatList, added: Stats, level: number,
                     componentFamily: ComponentFamily, recipe: AlterationRecipe,
                     capacityOverride?: number) {

	// Capacité forcée du composant (colonne component_template.capacity, ex. le RGB) si
	// fournie, sinon la formule par défaut 0,2 × puissance des stats de base (#622).
	const capacity = capacityOverride ?? well(power(base, data.weights))
	const before = addedPower(added, data.weights)
	// Etat brut de la piece, pour l'affichage du pourcentage (cf. rawAddedPower).
	const rawBefore = rawAddedPower(added, data.weights)

	let dose = 0
	let items = 0
	let recipePower = 0
	const groups: { [carac: string]: { points: number, power: number, weight: number } } = {}

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

		// Une altération indivisible posée sur la mauvaise famille est INERTE : aucune
		// chance de réussir, donc elle ne consomme pas de capacité et n'entre pas dans les
		// jets. Elle ne sert plus qu'à ajuster le dosage (#622).
		if (INDIVISIBLE.indexOf(carac) !== -1 && efficiency < 1) continue

		recipePower += gainPower * quantity

		if (!groups[carac]) groups[carac] = { points: 0, power: 0, weight: 0 }
		groups[carac].points += points * quantity
		groups[carac].power += gainPower * quantity
		groups[carac].weight += efficiency * points * quantity
	}

	// Charge d'arrivée PROJETÉE : on applique les points de la recette aux deltas et on
	// recalcule la charge, au lieu d'additionner la puissance. Remplir un déficit coûte la
	// puissance pleine mais ne rend que la moitié de la charge (DEFICIT_REFUND), donc
	// l'addition linéaire promettait une destination qui n'arrivait jamais : sur une pièce
	// creusée au plancher, l'aperçu annonçait 114 % pour 64 % réellement livrés (#622).
	const projected: Stats = { ...added }
	for (const carac in groups) projected[carac] = (projected[carac] ?? 0) + groups[carac].points
	const after = addedPower(projected, data.weights)
	const rAfter = capacity > 0 ? after / capacity : 0
	// La difficulté se lit sur le REMPLISSAGE, jamais sur le déficit : une pièce creusée
	// par la casse se répare sans peine (il faut re-dépenser des altérations, c'est déjà
	// la punition), et la courbe ne reprend qu'à partir de 0 (#622).
	const rEff = Math.max(0, rAfter)
	// La tentative est autorisee tant qu'on reste sous le plafond souple : au-dela de
	// 100 % du puits la reussite devient infime et la casse quasi certaine, mais ce
	// n'est plus un mur binaire. `overfilled` sert a prevenir visuellement (#622).
	const allowed = capacity > 0 && rAfter <= OVERFILL_CAP
	const overfilled = after > capacity

	const rolls: { [carac: string]: { points: number, probability: number } } = {}
	const totals = toMap(base)
	for (const c in added) totals[c] = (totals[c] || 0) + added[c]

	for (const carac in groups) {
		const group = groups[carac]
		let probability = 0
		if (allowed) {
			const efficiency = group.points > 0 ? group.weight / group.points : 0
			const delta = group.power / capacity
			probability = Math.exp(-DIFFICULTY_K * rEff * rEff
				- TOP_PENALTY * Math.pow(rEff, 6)
				+ PROGRESS_BONUS * Math.min(delta, PROGRESS_CAP))
			probability /= difficulty(part(base, added, carac, data.weights))
			// Une carac strictement négative est deux fois plus facile à remonter.
			if ((totals[carac] || 0) < 0) probability *= 2
			// Une carac indivisible ne prend QUE sur sa famille de prédilection : ailleurs
			// la tentative est impossible (les inertes sont déjà écartées plus haut, cette
			// garde couvre les appels directs).
			if (INDIVISIBLE.indexOf(carac) !== -1 && efficiency < 1) probability = 0
			// Pas de gate du métabolisme côté client : l'aperçu ne connaît pas M (caché
			// serveur) et montre la proba de base, jamais la vraie proba gatée. Le serveur
			// plafonne la charge selon la mesure, du quart de base au tout (#622).
			probability = Math.min(MAX_PROBABILITY, probability)
		}
		rolls[carac] = { points: group.points, probability }
	}

	// Une recette = un pari UNIQUE : un seul jet, au taux de la carac la plus dure (le
	// goulot). Tout passe ou rien, jamais de succès partiel (#622).
	const probabilities = Object.keys(rolls).map(c => rolls[c].probability)
	const probability = allowed && probabilities.length ? Math.min(...probabilities) : 0

	// Une seule casse par tentative, indexée sur le remplissage visé. Elle grimpe avec
	// le remplissage et devient quasi certaine au-delà de 100 % : c'est elle qui punit
	// l'acharnement plutôt qu'un mur.
	let breakProbability = 0
	// Une pièce déjà au plancher n'a plus rien à perdre : annoncer un risque qui ne peut
	// pas se produire serait un mensonge d'affichage (#622).
	//
	// Le plancher se lit sur la charge NETTE au tarif plein, exactement celle que la jauge
	// affiche en négatif : la casse s'arrête donc pile quand la pièce atteint les -100 %
	// affichés. Le serveur testait la seule somme des déficits, en ignorant les gains, et
	// rendait increvable une pièce pourtant pleine (#622).
	const diggable = rawBefore > CHARGE_FLOOR * capacity
	if (allowed && capacity > 0 && diggable) {
		// Comme pour la réussite, le risque se lit sur le remplissage visé et non sur le
		// déficit : réparer une pièce creusée n'est pas dangereux.
		const reference = Math.exp(-DIFFICULTY_K * rEff * rEff
			- TOP_PENALTY * Math.pow(rEff, 6)
			+ PROGRESS_BONUS * Math.min(recipePower / capacity, PROGRESS_CAP))
		breakProbability = reference > 0 ? Math.min(1, BREAK_COEFFICIENT / reference) : 0
	}

	return {
		// `fits` = tentative autorisée (le bouton s'appuie dessus) ; `overfilled` = on
		// dépasse le puits, à afficher comme un avertissement.
		dose, items, power: recipePower, fits: allowed, overfilled, rolls, probability,
		capacity,
		ratioBefore: capacity > 0 ? before / capacity : 0,
		ratioAfter: rAfter,
		// Ratios BRUTS : ce que l'anneau et le pourcentage affichent, pour qu'une piece
		// creusee au plancher se lise -100 % et non -50 % (#622).
		rawRatioBefore: capacity > 0 ? rawBefore / capacity : 0,
		rawRatioAfter: capacity > 0 ? rawAddedPower(projected, data.weights) / capacity : 0,
		// `breakProbability` est CONDITIONNELLE : le serveur ne tire la casse qu'après un
		// échec, jamais après une réussite. `breakRisk` est ce que le joueur affronte
		// vraiment sur cette fusion, et c'est lui que la forge affiche (#622).
		breakProbability,
		breakRisk: (1 - probability) * breakProbability,
		// Charge négative ramenée à 0 : une pièce creusée coûte le tarif de base, jamais moins.
		// Tarif sur la charge VISÉE et non sur celle du départ : indexé sur le point de
		// départ, il suffisait de garder la pièce creusée pour payer le tarif d'une pièce
		// vide sur chaque tentative, y compris celle qui vise 100 % (#622).
		habsCost: Math.round(level * level * (1 + 2 * Math.max(0, rAfter))),
	}
}

/**
 * Classe CSS du palier d'alteration d'un composant, ou '' s'il n'est pas altere.
 * Point unique pour l'inventaire, la page poireau et le dialogue de composants.
 * `capacity` = puits du composant, lu dans ComponentTemplate.well (#622).
 */
function alteredClass(item: { stats?: Stats | null, altered_power?: number, template: number },
                      capacity: number, weights?: { [carac: string]: number }): string {
	if (!item.stats || !capacity) return ''
	// Exactement le ratio de la jauge (cf. displayRatio), sinon le liseré annonce un palier
	// que le pourcentage affiche juste a cote contredit (#622). Sans les poids on retombe sur
	// altered_power, qui porte deja la charge budgetaire calculee par le serveur.
	const ratio = weights ? displayRatio(item.stats, capacity, weights) : (item.altered_power ?? 0) / capacity
	if (!ratio) return ''
	const tier = alterationTier(ratio)
	return tier ? 'altered-' + tier.tier : ''
}

export {
	AlterationFamily, ComponentFamily, ALTERATION_FAMILY_NAMES, ALTERATION_TIERS, alterationTier,
	well, power, addedPower, rawAddedPower, displayRatio, part, difficulty, efficiencyTier, planAttempt, toMap, mergeStats, alteredClass,
}
export type { AlterationTemplate, AlterationData, AlterationRecipe, Stats, StatList }
