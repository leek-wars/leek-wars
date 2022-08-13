import { CONSTANTS } from '@/model/constants'
import { FUNCTIONS } from '@/model/functions'
import { Keyword } from '@/model/keyword'
import { LeekWars } from "@/model/leekwars"

const keywords: Keyword[] = []

for (const fun of FUNCTIONS) {

	const text = fun.name
	let name = fun.name
	name += "("

	let i = 0
	for (const a in fun.arguments_names) {
		if (fun.optional[a]) name += "["
		name += fun.arguments_names[a]
		if (fun.optional[a]) name += "]"
		if (i++ < fun.arguments_names.length - 1) {
			name += ", "
		}
	}
	name += ')'
	if (fun.return_type !== 0) {
		name += " : " + fun.return_name
	}

	keywords.push({name: text, fullName: name, details: '', type: 'function', argumentCount: fun.arguments_names.length, function: fun, category: 2})
}

// Constantes
const getWeaponByName = (name: string) => {
	for (const w in LeekWars.weapons) {
		if (LeekWars.weapons[w].name === name) { return LeekWars.weapons[w] }
	}
	return null
}
const getChipByName = (name: string) => {
	for (const c in LeekWars.chips) {
		if (LeekWars.chips[c].name === name) { return LeekWars.chips[c] }
	}
	return null
}
for (const constant of CONSTANTS) {
	let details: any = ""
	if (constant.name.substring(0, 5) === 'CHIP_') {
		details = {type: 'chip', chip: getChipByName(constant.name.substring(5).toLowerCase())}
	} else if (constant.name.substring(0, 7) === 'WEAPON_') {
		details = {type: 'weapon', weapon: getWeaponByName(constant.name.substring(7).toLowerCase())}
	} else {
		details = ''
	}
	keywords.push({name: constant.name, fullName: constant.name, details, type: 'constant', constant, category: 3})
}

export { keywords }