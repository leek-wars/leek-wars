export type ComponentStats = { [carac: string]: number }

export interface LoadoutComponent {
	index: number   // 0..7
	template: number
	/**
	 * Stats (delta d'altération) de la PIÈCE choisie par le joueur, null pour une pièce de
	 * base (#622). L'ensemble ne mémorise jamais une instance : à l'application, le serveur
	 * sert l'instance possédée la plus proche de ces stats.
	 */
	stats?: ComponentStats | null
}

export type LoadoutStats = { [stat: string]: number }   // capital dépensé par stat

export class Loadout {
	id!: number
	name!: string
	icon!: string   // emoji unicode OU nom de caractéristique ("strength", "agility", ...)
	weapons!: number[]                  // template ids — armes non-oubliées, équipées telles quelles
	forgotten_weapons!: number[]        // template ids — candidates ordonnées, première dispo gagne
	chips!: number[]                    // template ids
	components!: LoadoutComponent[]
	stats!: LoadoutStats
	order!: number
}

/** Clé canonique d'un delta d'altération : '' pour une pièce de base, sinon les caracs triées. */
export function componentStatsKey(stats?: ComponentStats | null): string {
	if (!stats) return ''
	const entries = Object.entries(stats).filter(([, v]) => v).sort(([a], [b]) => a.localeCompare(b))
	return entries.length ? entries.map(([k, v]) => k + ':' + v).join(',') : ''
}

/** Deux choix de composant désignent la même pièce : même template, mêmes stats. */
export function sameComponentChoice(a: { template: number, stats?: ComponentStats | null }, b: { template: number, stats?: ComponentStats | null }): boolean {
	return a.template === b.template && componentStatsKey(a.stats) === componentStatsKey(b.stats)
}

/** Apport d'un composant d'ensemble sur une carac : stats de base du template plus le delta mémorisé. */
export function loadoutComponentStat(baseStats: [string, number][] | undefined, delta: ComponentStats | null | undefined, stat: string): number {
	let total = 0
	if (baseStats) for (const [s, v] of baseStats) if (s === stat) total += v
	if (delta && delta[stat]) total += delta[stat]
	return total
}
