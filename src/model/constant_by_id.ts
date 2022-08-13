import { Constant } from "./constant"
import { CONSTANTS } from "./constants"

const CONSTANT_BY_ID = Object.freeze(constantById(CONSTANTS))

function constantById(constants: readonly Constant[]) {
	const result: { [key: number]: Constant } = {}
	for (const c of constants) {
		result[c.id] = c
	}
	return result
}

export { CONSTANT_BY_ID }