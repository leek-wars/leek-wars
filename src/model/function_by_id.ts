import { LSFunction } from "./function";
import { LeekWars } from "@/model/leekwars";

// LeekWars.functions est rempli en asynchrone (loadGameData) : un index figé au
// chargement du module resterait vide pour toujours si ce chunk s'évalue avant
// l'arrivée des données. On indexe donc paresseusement, en reconstruisant quand
// la référence source change (même patron que le Proxy FUNCTIONS).
let source: readonly LSFunction[] | null = null
let index: { [key: number]: LSFunction } = {}

function build() {
	if (source !== LeekWars.functions) {
		source = LeekWars.functions
		index = {}
		for (const f of source) {
			index[f.id] = f
		}
	}
	return index
}

const FUNCTION_BY_ID = new Proxy({} as { [key: number]: LSFunction }, {
	get(_, prop) { return build()[prop as unknown as number] },
	has(_, prop) { return prop in build() },
})

export { FUNCTION_BY_ID }
