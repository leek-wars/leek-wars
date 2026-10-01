import { ActionType } from '@/model/action'
import type { RawAction } from '@/model/fight'
import { LeekWars } from '@/model/leekwars'

/**
 * Jusqu'au 18/07/2015 vers 14 h 04, les actions d'effet désignaient la puce ou l'arme par
 * son gabarit ; depuis, par l'identifiant de l'objet, celui qu'attend tout le lecteur
 * (icône, nom dans le panneau de détails, flammes et gaz). Combat 13104086 : dernier en
 * gabarits, combat 13104088 : premier en objets. Lu comme un objet, un gabarit affichait
 * une autre puce : la Forteresse (gabarit 23) montrée comme le Mur (objet 23), combat
 * 5376054.
 */
const EFFECT_ITEM_IDS_SINCE = 1437221062

/**
 * Actions du combat, avec l'objet des effets d'avant EFFECT_ITEM_IDS_SINCE ramené du gabarit
 * à l'identifiant d'objet. Les actions d'origine ne sont pas modifiées. Un combat sans date
 * (0 : combat local, animations de l'admin) est un combat récent.
 */
function withEffectItemIds(actions: RawAction[], fightDate: number): RawAction[] {
	if (!fightDate || fightDate >= EFFECT_ITEM_IDS_SINCE) { return actions }
	const { chipTemplates, weapons } = LeekWars
	return actions.map(action => {
		let item: number | undefined
		if (action[0] === ActionType.ADD_CHIP_EFFECT) {
			item = chipTemplates[action[1]]?.item
		} else if (action[0] === ActionType.ADD_WEAPON_EFFECT) {
			item = weapons[action[1]]?.item
		}
		if (!item) { return action }
		const copy = action.slice()
		copy[1] = item
		return copy
	})
}

export { EFFECT_ITEM_IDS_SINCE, withEffectItemIds }
