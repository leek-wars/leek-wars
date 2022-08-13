import { LSFunction } from "./function";
import { FUNCTIONS } from "./functions";

const FUNCTION_BY_ID = Object.freeze(functionById(FUNCTIONS))

function functionById(functions: readonly LSFunction[]) {
	const result: { [key: number]: LSFunction } = {}
	for (const f of functions) {
		result[f.id] = f
	}
	return result
}

export { FUNCTION_BY_ID }