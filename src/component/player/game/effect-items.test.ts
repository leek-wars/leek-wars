import { describe, expect, it, vi } from 'vitest'

// Gabarits réels : puce 23 = Forteresse (objet 29), arme 10 = Gazeur (objet 48).
vi.mock('@/model/leekwars', () => ({
	LeekWars: {
		chipTemplates: { 23: { item: 29 } },
		weapons: { 10: { item: 48 } },
	},
}))

import { EFFECT_ITEM_IDS_SINCE, withEffectItemIds } from '@/component/player/game/effect-items'
import { ActionType } from '@/model/action'
import type { RawAction } from '@/model/fight'

const BEFORE = EFFECT_ITEM_IDS_SINCE - 1

describe('withEffectItemIds', () => {

	it('ramène le gabarit d\'une puce à son objet dans un combat d\'avant juillet 2015', () => {
		// Combat 5376054 : Forteresse, bouclier relatif de 40 % pendant 3 tours
		const actions = [[ActionType.ADD_CHIP_EFFECT, 23, 0, 5, 5, 5, 40, 3]]
		expect(withEffectItemIds(actions, BEFORE)).toEqual([[ActionType.ADD_CHIP_EFFECT, 29, 0, 5, 5, 5, 40, 3]])
		expect(actions[0][1]).toBe(23)
	})

	it('et celui d\'une arme', () => {
		// Combat 13090000 : poison du Gazeur
		const actions = [[ActionType.ADD_WEAPON_EFFECT, 10, 2, 1, 0, 13, 160, 3]]
		expect(withEffectItemIds(actions, BEFORE)[0][1]).toBe(48)
	})

	it.each([EFFECT_ITEM_IDS_SINCE, 0])('ne touche pas un combat récent ou sans date (%i)', (date) => {
		const actions = [[ActionType.ADD_CHIP_EFFECT, 23, 0, 5, 5, 5, 40, 3]]
		expect(withEffectItemIds(actions, date)).toBe(actions)
	})

	it('ne touche ni aux autres actions ni à un gabarit inconnu', () => {
		// USE_CHIP porte toujours le gabarit, et le lecteur le convertit déjà
		const useChip = [ActionType.USE_CHIP_OLD, 5, 315, 23, 0, [5]] as unknown as RawAction
		const unknown = [ActionType.ADD_CHIP_EFFECT, 999, 0, 5, 5, 5, 40, 3]
		const [a, b] = withEffectItemIds([useChip, unknown], BEFORE)
		expect(a).toBe(useChip)
		expect(b).toBe(unknown)
	})
})
