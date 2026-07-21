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

const WELL_COEFFICIENT = 0.85
const DIFFICULTY_K = 8
const PROGRESS_BONUS = 2
const PROGRESS_CAP = 0.2
const MAX_PROBABILITY = 0.95
const BREAK_COEFFICIENT = 0.0001

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

/** Capacité du puits. Indexée sur le niveau, jamais sur la puissance actuelle. */
function well(level: number): number {
	return WELL_COEFFICIENT * level
}

/** Puissance d'un jeu de stats, en valeur absolue (la poire a une puissance nette nulle). */
function power(stats: Stats | StatList, weights: { [carac: string]: number }): number {
	let total = 0
	const map = toMap(stats)
	for (const carac in map) total += Math.abs(map[carac]) * (weights[carac] || 0)
	return total
}

/** Puissance ajoutée par les altérations. Les ajouts sont toujours positifs. */
function addedPower(added: Stats, weights: { [carac: string]: number }): number {
	let total = 0
	for (const carac in added) total += added[carac] * (weights[carac] || 0)
	return total
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
	return 1 + 2 * Math.pow(1 - partValue, 2)
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
                     componentFamily: ComponentFamily, recipe: AlterationRecipe, synergy = 1) {

	const capacity = well(level)
	const before = addedPower(added, data.weights)

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

		dose += alteration.number * quantity
		items += quantity
		recipePower += gainPower * quantity

		if (!groups[carac]) groups[carac] = { points: 0, power: 0, weight: 0 }
		groups[carac].points += points * quantity
		groups[carac].power += gainPower * quantity
		groups[carac].weight += efficiency * points * quantity
	}

	const after = before + recipePower
	const fits = capacity > 0 && after <= capacity
	const rAfter = capacity > 0 ? after / capacity : 0

	const rolls: { [carac: string]: { points: number, probability: number } } = {}
	const totals = toMap(base)
	for (const c in added) totals[c] = (totals[c] || 0) + added[c]

	for (const carac in groups) {
		const group = groups[carac]
		let probability = 0
		if (fits) {
			const efficiency = group.points > 0 ? group.weight / group.points : 0
			const delta = group.power / capacity
			probability = Math.exp(-DIFFICULTY_K * rAfter * rAfter + PROGRESS_BONUS * Math.min(delta, PROGRESS_CAP))
			probability /= difficulty(part(base, added, carac, data.weights))
			// Une carac strictement négative est deux fois plus facile à remonter.
			if ((totals[carac] || 0) < 0) probability *= 2
			// Les caracs indivisibles encaissent l'efficacité sur la probabilité.
			if (INDIVISIBLE.indexOf(carac) !== -1) probability *= efficiency
			probability *= synergy
			probability = Math.min(MAX_PROBABILITY, probability)
		}
		rolls[carac] = { points: group.points, probability }
	}

	// Une seule casse par tentative, indexée sur le remplissage visé.
	let breakProbability = 0
	if (fits && capacity > 0) {
		const reference = Math.exp(-DIFFICULTY_K * rAfter * rAfter
			+ PROGRESS_BONUS * Math.min(recipePower / capacity, PROGRESS_CAP))
		breakProbability = reference > 0 ? Math.min(1, BREAK_COEFFICIENT / reference) : 0
	}

	return {
		dose, items, power: recipePower, fits, rolls,
		capacity,
		ratioBefore: capacity > 0 ? before / capacity : 0,
		ratioAfter: rAfter,
		breakProbability,
		habsCost: Math.round(level * level * (1 + 2 * (capacity > 0 ? before / capacity : 0))),
	}
}

export {
	AlterationFamily, ComponentFamily, ALTERATION_FAMILY_NAMES, ALTERATION_TIERS, alterationTier,
	well, power, addedPower, part, difficulty, efficiencyTier, planAttempt, toMap, mergeStats,
}
export type { AlterationTemplate, AlterationData, AlterationRecipe, Stats, StatList }
