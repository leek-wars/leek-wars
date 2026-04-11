export interface LoadoutComponent {
	index: number   // 0..7
	template: number
}

export class Loadout {
	id!: number
	name!: string
	icon!: string   // emoji unicode OU nom de caractéristique ("strength", "agility", ...)
	weapons!: number[]             // template ids
	chips!: number[]               // template ids
	components!: LoadoutComponent[]
	order!: number
}
