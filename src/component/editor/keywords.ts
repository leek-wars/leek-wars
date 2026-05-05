import { CHIPS } from '@/model/chips'
import { FUNCTIONS } from '@/model/functions'
import { Keyword, KeywordKind } from '@/model/keyword'
import { LeekWars } from '@/model/leekwars'

const keywords: Keyword[] = []
let initialized = false

function initializeKeywords() {
	if (initialized) return
	initialized = true
}

for (const fun of FUNCTIONS) {

	const text = fun.name
	let name = fun.name + "("
	let insertText = fun.name + "("

	let i = 0
	let j = 0
	const args = []
	for (const a in fun.arguments_names) {
		if (fun.optional[a]) name += "["
		name += fun.arguments_names[a]
		if (fun.optional[a]) name += "]"
		if (!fun.optional[a]) {
			args.push("${" + (++j) + ":" + fun.arguments_names[a] + "}")
		}
		if (i++ < fun.arguments_names.length - 1) {
			name += ", "
		}
	}
	name += ')'
	insertText += args.join(', ') +  ')'
	if (fun.return_type !== 0) {
		name += " : " + fun.return_name
	}

	const keyword = {
		label: text,
		fullName: name,
		insertText: insertText,
		details: '',
		kind: KeywordKind.Function,
		argumentCount: fun.arguments_names.length,
		function: fun,
		category: 2,
		tags: fun.deprecated ? [ 1 ] : [],
	}
	keywords.push(keyword)
}

// Constantes
const getWeaponByName = (name: string) => {
	for (const w in LeekWars.weapons) {
		if (LeekWars.weapons[w].name === name) { return LeekWars.weapons[w] }
	}
	return null
}

const getChipByName = (name: string) => {
	for (const c in CHIPS) {
		if (CHIPS[c].name === name) { return CHIPS[c] }
	}
	return null
}

for (const constant of LeekWars.constants) {
	let details: unknown
	if (constant.name.substring(0, 5) === 'CHIP_') {
		details = {type: 'chip', chip: getChipByName(constant.name.substring(5).toLowerCase())}
	} else if (constant.name.substring(0, 7) === 'WEAPON_') {
		details = {type: 'weapon', weapon: getWeaponByName(constant.name.substring(7).toLowerCase())}
	} else {
		details = ''
	}
	const keyword = {
		label: constant.name,
		fullName: constant.name,
		insertText: constant.name,
		details,
		kind: KeywordKind.Constant,
		constant,
		category: 3,
		tags: constant.deprecated ? [ 1 ] : [],
	}
	keywords.push(keyword)
}

function getKeywords() {
	initializeKeywords()
	return keywords
}

export { getKeywords }