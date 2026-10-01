import { describe, expect, it, vi } from 'vitest'

vi.mock('@/model/leekwars', () => ({ LeekWars: { STATIC: '/' } }))
vi.hoisted(() => {
	if (typeof globalThis.Path2D === 'undefined') {
		globalThis.Path2D = class { } as unknown as typeof Path2D
	}
})

import { Game } from '@/component/player/game/game'
import { Action, ActionType } from '@/model/action'
import { EffectType, EntityEffect } from '@/model/effect'

// L'entité 0 pose ses effets sur l'entité 1. Le prototype est greffé sans constructeur :
// un Game complet demanderait textures et canvas, inutiles pour le décompte des durées.
function fight(version?: number) {
	const leeks = [{ effects: {} }, { effects: {} }] as { effects: {[key: number]: EntityEffect} }[]
	const effects: EntityEffect[] = []
	const game = Object.assign(Object.create(Game.prototype), { leeks, effects, logging: false, data: { version } }) as Game
	const add = (id: number, type: EffectType, turns: number) => {
		const effect = { id, type, turns, caster: 0, target: 1, value: 10, item: 0, modifiers: 0 } as EntityEffect
		effects[id] = effect
		leeks[1].effects[id] = effect
		return effect
	}
	const turn = (entity: number) => game.doAction(new Action([ActionType.LEEK_TURN, entity]))
	const remove = (id: number) => game.doAction(new Action([ActionType.REMOVE_EFFECT, id]))
	return { leeks, add, turn, remove }
}

describe('Game : décompte des durées d\'effets', () => {

	it('un poison se décompte au tour de sa cible, plus de son lanceur', () => {
		const { leeks, add, turn, remove } = fight(1)
		const poison = add(1, EffectType.POISON, 2)
		turn(0)
		expect(poison.turns).toBe(2)
		turn(1)
		expect(poison.turns).toBe(1)
		// Dernier coup : le moteur retire le poison juste après
		turn(1)
		expect(poison.turns).toBe(1)
		remove(1)
		expect(leeks[1].effects[1]).toBeUndefined()
	})

	it('la séquelle et le soin sur la durée aussi', () => {
		const { add, turn } = fight(1)
		const aftereffect = add(1, EffectType.AFTEREFFECT, 3)
		const heal = add(2, EffectType.HEAL, 3)
		turn(0)
		turn(1)
		expect(aftereffect.turns).toBe(2)
		expect(heal.turns).toBe(2)
	})

	it('un bouclier se décompte toujours au tour de son lanceur', () => {
		const { add, turn } = fight(1)
		const shield = add(1, EffectType.RELATIVE_SHIELD, 2)
		turn(1)
		expect(shield.turns).toBe(2)
		turn(0)
		expect(shield.turns).toBe(1)
	})

	it('un ancien combat garde l\'ancienne règle : le poison se décompte au tour du lanceur', () => {
		const { add, turn } = fight()
		const poison = add(1, EffectType.POISON, 2)
		turn(1)
		expect(poison.turns).toBe(2)
		turn(0)
		expect(poison.turns).toBe(1)
		turn(0)
		expect(poison.turns).toBe(1)
	})
})
