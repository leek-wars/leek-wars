import { describe, it, expect, vi } from 'vitest'
import { ActionType } from '@/model/action'
import type { Fight, FightLeek, RawAction } from '@/model/fight'

// statistics.ts ne touche LeekWars/CHIPS que pour les templates d'armes et de puces, dont
// aucune des actions rejouées ici. cell.ts (via Field) tire le moteur de jeu (canvas) pour
// des types : on le stub comme dans src/model/field.test.ts.
vi.mock('@/model/leekwars', () => ({ LeekWars: { weapons: {}, chipTemplates: {} } }))
vi.mock('@/model/chips', () => ({ CHIPS: {} }))
vi.mock('@/component/player/game/game', () => ({ Game: class {} }))
vi.mock('@/component/player/game/obstacle', () => ({ Obstacle: class {} }))
vi.mock('@/component/player/game/entity', () => ({ FightEntity: class {} }))

import { FightStatistics } from '@/component/report/statistics'

// FightStatistics.generate() rejoue les actions d'un combat pour reconstruire l'état des
// entités (vie, vie max, vivant/mort) et les séries du graphe de vie.
const LEEKS = [0, 1].map(id => ({
	id, name: 'leek' + id, level: 100, team: id + 1, life: 1000, cellPos: 10 + id * 10, type: 0, summon: false,
}) as unknown as FightLeek)

const replay = (actions: RawAction[]) => {
	const stats = new FightStatistics()
	stats.generate({
		data: { map: { width: 9, height: 9 }, leeks: LEEKS, actions, ops: {} },
		report: { duration: 4 },
	} as unknown as Fight)
	return stats.entities[1]
}

// L'action RESURRECTION porte la nouvelle vie max en 6e paramètre (le moteur divise la vie
// max par deux à la résurrection). Sans la reprendre, une entité ressuscitée puis soignée à
// fond s'affichait à ~50% sur le graphe en pourcentage. Topic forum 12089.
const DEATH: RawAction[] = [[ActionType.NEW_TURN, 1], [ActionType.PLAYER_DEAD, 1, 0]]

describe('statistics.ts — résurrection', () => {
	const resurrected = () => replay([...DEATH, [ActionType.RESURRECTION, 0, 1, 20, 250, 500]])

	it('reprend la vie max portée par l\'action, la vie, et remet en vie', () => {
		const entity = resurrected()
		expect(entity.max_life).toBe(500)
		expect(entity.alive).toBe(true)
		expect(entity.life).toBe(250)
		expect(entity.resurrection).toBe(1)
	})

	// game.ts lit params[5] sans garde, mais les statistiques rejouent aussi les archives :
	// une action sans vie max doit laisser l'ancienne plutôt que de poser undefined (NaN%).
	it('sans vie max dans l\'action (vieux combats), garde l\'ancienne', () => {
		expect(replay([...DEATH, [ActionType.RESURRECTION, 0, 1, 20, 250]]).max_life).toBe(1000)
	})

	it('sans résurrection, l\'entité morte le reste', () => {
		expect(replay(DEATH).alive).toBe(false)
	})
})
