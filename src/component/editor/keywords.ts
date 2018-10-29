import { i18n } from '@/model/i18n'
import { LeekWars } from "@/model/leekwars"

function generateKeywords() {
	let last = ""
	let overloading = 0
	const keywords = []

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
		let details = "<h4>" + i18n.t('editor.function_f', [name]) + "</h4>"

		if (fun.deprecated) {
			details += "<div class='deprecated-message'>Cette fonction est dépréciée.</div>"
		}
		if (fun.operations === -1) {
			details += i18n.t('documentation.variable_operations')
		} else if (fun.operations === 1) {
			details += i18n.t('documentation.1_operation')
		} else {
			details += i18n.t('documentation.n_operations', [fun.operations])
		}
		details += "<br><br>"

		details += i18n.t('documentation.func_' + functionName) + "<br>"

		if (fun.arguments_names.length > 0) {
			details += "<br><b>" + i18n.t('editor.parameters') + "</b>"
			details += "<ul>"
			for (const a in fun.arguments_names) {
				details += "<li>" + fun.arguments_names[a] + " : " + i18n.t("documentation.func_" + functionName + "_arg_" + (parseInt(a, 10) + 1)) + "</span></li>"
			}
			details += "</ul>"
		} else {
			details += "<br>"
		}
		if (fun.return_type !== 0) {
			details += "<b>" + i18n.t('editor', 'return') + "</b><br>"
			details += "<ul><li>" + fun.return_name + " : " + i18n.t('documentation.func_' + functionName + '_return') + "</li></ul>"
		}
		keywords.push([text, name, details, 'function', fun.arguments_names.length])
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
			details = "<h4>" + i18n.t('editor.constant', [constant.name]) + "</h4><br>"
			details += i18n.t('documentation.const_' + constant.name)
		}
		keywords.push([constant.name, constant.name, details, 'constant'])
	}
	return keywords
}

export { generateKeywords }