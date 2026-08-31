import { Constant } from "./constant"
import { LeekWars } from "@/model/leekwars"

// LeekWars.constants est rempli en asynchrone (loadGameData) : un index figé au
// chargement du module resterait vide pour toujours si ce chunk s'évalue avant
// l'arrivée des données. On indexe donc paresseusement, en reconstruisant quand
// la référence source change (même patron que le Proxy FUNCTIONS).
let source: readonly Constant[] | null = null
let index: { [key: number]: Constant } = {}

function build() {
	if (source !== LeekWars.constants) {
		source = LeekWars.constants
		index = {}
		for (const c of source) {
			index[c.id] = c
		}
	}
	return index
}

const CONSTANT_BY_ID = new Proxy({} as { [key: number]: Constant }, {
	get(_, prop) { return build()[prop as unknown as number] },
	has(_, prop) { return prop in build() },
})

export { CONSTANT_BY_ID }
