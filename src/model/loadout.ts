export interface LoadoutComponent {
	index: number   // 0..7
	template: number
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
