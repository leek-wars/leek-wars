import { describe, expect, it } from 'vitest'

import { getPreSummonMultipliers, unmultiplyStats } from '@/component/player/game/colossus'
import type { FightLeek, RawAction } from '@/model/fight'

// Extrait du combat 53289203 (mode Colosse) : le colosse (9) et son premier bulbe (10),
// dont le snapshot a été figé après le ×3 → stats déjà multipliées dans data.leeks.
function colossus(): FightLeek {
	return { id: 9, name: 'LeekWareau', team: 2, summon: false, life: 3450, strength: 680, wisdom: 630, agility: 50, resistance: 130, frequency: 150, science: 120, magic: 90, tp: 28, mp: 6 } as unknown as FightLeek
}
function bulb(): FightLeek {
	return { id: 10, name: 'metallic_bulb', team: 2, summon: true, owner: 9, cellPos: 522, skin: 7, life: 3300, strength: 0, wisdom: 0, agility: 300, resistance: 900, frequency: 0, science: 600, magic: 0, tp: 27, mp: 6 } as unknown as FightLeek
}

const COLOSSUS_EFFECT: RawAction = [302, 0, 0, 9, 9, 62, 3, -1, 16] // ADD_CHIP_EFFECT MULTIPLY_STATS ×3 sur le colosse
const BULB_EFFECT: RawAction = [302, 0, 4, 10, 10, 62, 3, -1, 16] // idem sur le bulbe
const BULB_SUMMON: RawAction = [9, 9, 10, 522, 1] // SUMMON du bulbe 10 par le colosse 9

// Combat 53289203 : 21/07/2026, dans la fenêtre des snapshots multipliés
const OLD_FIGHT = 1784600000
// Combat 53484250 : 30/08/2026, après le correctif du snapshot (forum #12080)
const NEW_FIGHT = 1788100000

describe('getPreSummonMultipliers', () => {

	it('détecte une invocation dont le snapshot précède son action d\'invocation', () => {
		const actions = [COLOSSUS_EFFECT, BULB_EFFECT, BULB_SUMMON]
		expect(getPreSummonMultipliers([colossus(), bulb()], actions, OLD_FIGHT)).toEqual({ 10: 3 })
	})

	it('ignore le colosse lui-même, dont le snapshot est émis avant son effet', () => {
		const actions = [COLOSSUS_EFFECT, BULB_SUMMON, BULB_EFFECT]
		expect(getPreSummonMultipliers([colossus(), bulb()], actions, OLD_FIGHT)).toEqual({})
	})

	it('ignore les combats générés après le correctif, effet posé après l\'invocation', () => {
		const actions = [COLOSSUS_EFFECT, BULB_SUMMON, BULB_EFFECT]
		expect(getPreSummonMultipliers([bulb()], actions, NEW_FIGHT)).toEqual({})
	})

	it('ignore un combat d\'après le correctif du snapshot même si l\'effet précède l\'invocation', () => {
		// Fenêtre 15/08 → correctif d'ordre du générateur : snapshot de base mais
		// effet toujours loggé avant l'invocation (forum #12080, combat 53484250)
		const actions = [COLOSSUS_EFFECT, BULB_EFFECT, BULB_SUMMON]
		expect(getPreSummonMultipliers([colossus(), bulb()], actions, NEW_FIGHT)).toEqual({})
	})

	it('ne retient que le premier facteur, les paliers suivants arrivant après l\'invocation', () => {
		const later: RawAction = [302, 0, 182, 10, 10, 62, 4, -1, 16]
		const actions = [BULB_EFFECT, BULB_SUMMON, later]
		expect(getPreSummonMultipliers([bulb()], actions, OLD_FIGHT)).toEqual({ 10: 3 })
	})

	it('ignore les effets qui ne sont pas des multiplicateurs', () => {
		const shield: RawAction = [302, 22, 60, 10, 10, 6, 250, 4]
		expect(getPreSummonMultipliers([bulb()], [shield, BULB_SUMMON], OLD_FIGHT)).toEqual({})
	})
})

describe('unmultiplyStats', () => {

	it('ramène le snapshot du bulbe à ses stats de base', () => {
		const base = unmultiplyStats(bulb(), 3) as unknown as {[key: string]: unknown}
		expect(base.life).toBe(1100)
		expect(base.agility).toBe(100)
		expect(base.resistance).toBe(300)
		expect(base.science).toBe(200)
		expect(base.tp).toBe(9)
		expect(base.mp).toBe(2)
		expect(base.strength).toBe(0)
	})

	it('laisse intacts les champs qui ne sont pas des stats', () => {
		const base = unmultiplyStats(bulb(), 3) as unknown as {[key: string]: unknown}
		expect(base.id).toBe(10)
		expect(base.name).toBe('metallic_bulb')
		expect(base.cellPos).toBe(522)
		expect(base.skin).toBe(7)
		expect(base.summon).toBe(true)
	})

	it('ne modifie pas le snapshot d\'origine', () => {
		const original = bulb()
		unmultiplyStats(original, 3)
		expect(original.life).toBe(3300)
	})
})
