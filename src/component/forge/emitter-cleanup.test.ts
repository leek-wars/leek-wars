import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/**
 * `emitter.off(type)` sans reference de gestionnaire VIDE la liste du type (mitt fait
 * `set(type, [])`), donc retire aussi les gestionnaires des autres composants.
 *
 * La forge est demontee des que l'atelier est replie : elle emportait ainsi ceux de la
 * page d'inventaire, et cliquer un composant n'ouvrait plus rien tant qu'on n'avait pas
 * recharge la page. Le bug est invisible a la relecture d'un seul fichier, d'ou ce
 * garde-fou sur les fichiers de l'atelier, qui partagent tous les memes evenements (#622).
 */
const FILES = [
	'src/component/forge/forge.vue',
	'src/component/forge/alteration-palette.vue',
	'src/component/inventory/inventory-page.vue',
	'src/component/inventory/inventory.vue',
	'src/component/inventory/item-history.vue',
]

describe('nettoyage des ecouteurs de l\'atelier', () => {
	it('passe toujours la reference du gestionnaire a emitter.off', () => {
		const offending: string[] = []
		for (const file of FILES) {
			const source = readFileSync(resolve(process.cwd(), file), 'utf8')
			// emitter.off('type') ferme sur le premier argument : pas de virgule avant ')'.
			const matches = source.match(/emitter\.off\(\s*'[^']+'\s*\)/g)
			if (matches) offending.push(file + ' : ' + matches.join(', '))
		}
		expect(offending).toEqual([])
	})
})
