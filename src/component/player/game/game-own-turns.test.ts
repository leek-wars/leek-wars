import { describe, expect, it, vi } from 'vitest'

vi.mock('@/model/leekwars', () => ({ LeekWars: { STATIC: '/' } }))
vi.hoisted(() => {
	// Path2D est absent de happy-dom.
	if (typeof globalThis.Path2D === 'undefined') {
		globalThis.Path2D = class { } as unknown as typeof Path2D
	}
})

import { Game, ownEntityIds } from '@/component/player/game/game'
import { EntityType } from '@/component/player/game/entity'
import { Action, ActionType } from '@/model/action'
import type { FightLeek } from '@/model/fight'

const ME = 10

function entity(id: number, team: number, farmer?: number, type = EntityType.LEEK) {
	return { id, team, farmer, type } as FightLeek
}

describe('ownEntityIds', () => {
	const entities = [
		entity(0, 1, ME),
		entity(1, 1, 11), // allié
		entity(2, 2, 20),
		entity(3, 1, undefined, EntityType.TURRET),
		entity(4, 2, undefined, EntityType.TURRET),
		entity(5, 1, ME, EntityType.BULB), // invocation : porte l'éleveur de son invocateur
	]

	it('les poireaux du joueur et leurs invocations, pas ceux des alliés', () => {
		expect([...ownEntityIds(entities, ME)]).toEqual([0, 5])
	})

	it('la tourelle de son camp si c\'est son IA qui la joue', () => {
		expect([...ownEntityIds(entities, ME, { 77: ME })].sort()).toEqual([0, 3, 5])
		expect([...ownEntityIds(entities, ME, { 77: 11 })]).toEqual([0, 5])
	})

	it('rien pour un spectateur ou un visiteur', () => {
		expect(ownEntityIds(entities, 99, { 77: 99 }).size).toBe(0)
		expect(ownEntityIds(entities, undefined).size).toBe(0)
	})
})

// Prototype greffé sans constructeur, comme dans game-jump.test.ts : un Game complet
// demanderait textures et canvas. Chaque entité joue un tour : LEEK_TURN puis END_TURN.
function game(order: number[], own: number[], debugOnlyMine = true) {
	const actions = [new Action([ActionType.START_FIGHT])]
	for (const e of order) {
		actions.push(new Action([ActionType.LEEK_TURN, e]), new Action([ActionType.END_TURN, e, 10, 3]))
	}
	const doAction = vi.fn()
	const jump = vi.fn()
	const requestJump = vi.fn()
	const g = Object.assign(Object.create(Game.prototype), {
		actions, ownEntities: new Set(own), debugOnlyMine,
		currentAction: 0, actionToDo: true, actionDelay: 0, paused: false, speed: 1,
		currentPlayer: null, awakeningPlayer: null,
		leeks: [], chips: [], particles: { update() {} }, focus: false, showCellTime: 0, drawArea: 0,
		readLogs: () => false, readTrophies() {}, doAction, jump, requestJump,
	}) as Game
	return { g, doAction, jump, requestJump }
}

describe('Game : mode « mes actions »', () => {
	it('le tour d\'un autre est sauté jusqu\'au prochain tour du joueur', () => {
		// 1 : LEEK_TURN 2, 3 : LEEK_TURN 4, 5 : LEEK_TURN 0
		const { g, doAction, jump } = game([2, 4, 0], [0])
		g.update()
		expect(jump).toHaveBeenCalledWith(5)
		expect(doAction).not.toHaveBeenCalled()
	})

	it('le tour du joueur est joué', () => {
		const { g, doAction, jump } = game([0, 2], [0])
		g.update()
		expect(doAction).toHaveBeenCalledWith(g.actions[1])
		expect(jump).not.toHaveBeenCalled()
	})

	it('plus aucun tour du joueur (poireau mort) : saut à la fin du combat', () => {
		const { g, jump } = game([0, 2, 2], [0])
		g.currentAction = 2
		g.update()
		expect(jump).toHaveBeenCalledWith(g.actions.length)
	})

	it('sans entité au joueur (spectateur), ou option coupée, tout est joué', () => {
		for (const { g, doAction, jump } of [game([2, 0], []), game([2, 0], [0], false)]) {
			g.update()
			expect(doAction).toHaveBeenCalledWith(g.actions[1])
			expect(jump).not.toHaveBeenCalled()
		}
	})

	it('activé pendant le tour d\'un autre, saute tout de suite', () => {
		const { g, requestJump } = game([2, 0], [0])
		g.currentAction = 1
		g.currentPlayer = 2
		g.skipOthersTurn()
		expect(requestJump).toHaveBeenCalledWith(3)
	})

	it('activé pendant son propre tour ou en fin de combat, ne saute pas', () => {
		const mine = game([0, 2], [0])
		mine.g.currentAction = 1
		mine.g.currentPlayer = 0
		mine.g.skipOthersTurn()
		expect(mine.requestJump).not.toHaveBeenCalled()

		const end = game([0, 2], [0])
		end.g.currentAction = end.g.actions.length
		end.g.currentPlayer = 2
		end.g.skipOthersTurn()
		expect(end.requestJump).not.toHaveBeenCalled()
	})
})
