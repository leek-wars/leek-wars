import { AI } from '@/model/ai'
import { Constant } from '@/model/constant'
import { LSFunction } from '@/model/function'
import { LeekWars } from "@/model/leekwars"

class Keyword {
	name!: string
	fullName!: string
	type!: string
	details!: any
	argumentCount?: number
	arguments?: string[]
	ai?: AI
	line?: number
	shortcut?: number
	function?: LSFunction
	constant?: Constant
	lstype?: any
	location?: any
	category!: number
	javadoc?: any
}

function generateKeywords() {
	let last = ""
	let overloading = 0
	const keywords: Keyword[] = []

	for (const fun of LeekWars.functions) {
		let functionName = fun.name
		if (last === fun.name) {
			overloading++
			functionName += "_" + (overloading + 1)
		} else {
			overloading = 0
		}
		const text = fun.name
		let name = fun.name
		name += "("

		let i = 0
		for (const a in fun.arguments_names) {
			name += fun.arguments_names[a]
			if (i++ < fun.arguments_names.length - 1) {
				name += ", "
			}
		}
		name += ')'
		if (fun.return_type !== 0) {
			name += " : " + fun.return_name
		}

		(fun as any).real_name = functionName
		keywords.push({name: text, fullName: name, details: '', type: 'function', argumentCount: fun.arguments_names.length, function: fun, category: 2})
		last = fun.name
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
	for (const constant of LeekWars.constants) {
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
	return keywords
}

export { generateKeywords, Keyword }