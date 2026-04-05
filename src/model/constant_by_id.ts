import { Constant } from "./constant"
import { LeekWars } from "@/model/leekwars"

const CONSTANT_BY_ID = Object.freeze(constantById(LeekWars.constants))

function constantById(constants: readonly Constant[]) {
	const result: { [key: number]: Constant } = {}
	for (const c of constants) {
		result[c.id] = c
	}
	return result
}

export { CONSTANT_BY_ID }