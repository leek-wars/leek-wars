import { describe, it, expect } from 'vitest'
import { setTranslations } from '@/locale'
import { ActionType } from '@/model/action'
import type { Fight } from '@/model/fight'

// statistics.ts tire model/leekwars.ts, qui lit LANGUAGES[locale] au chargement du module :
// hors de l'app, la locale est vide tant que main.ts n'a pas appelé setTranslations.
setTranslations('fr', {})
const { FightStatistics } = await import('@/component/report/statistics')

// FightStatistics.generate() rejoue les actions d'un combat pour reconstruire l'état des
// entités (vie, vie max, vivant/mort) et les séries du graphe de vie.
const makeFight = (actions: unknown[][]): Fight => ({
	data: {
		map: { width: 9, height: 9 },
		leeks: [
			{ id: 0, name: 'A', level: 100, team: 1, life: 1000, cellPos: 10, type: 0, summon: false },
			{ id: 1, name: 'B', level: 100, team: 2, life: 1000, cellPos: 20, type: 0, summon: false },
		],
		actions,
		ops: {},
	},
	report: { duration: 4 },
} as unknown as Fight)

describe('statistics.ts — résurrection', () => {
	// L'action RESURRECTION porte la nouvelle vie max en 6e paramètre (le moteur divise la
	// vie max par deux à la résurrection). Sans la reprendre, une entité ressuscitée puis
	// soignée à fond s'affichait à ~50% sur le graphe en pourcentage. Topic forum 12089.
	const resurrected = () => {
		const stats = new FightStatistics()
		stats.generate(makeFight([
			[ActionType.NEW_TURN, 1],
			[ActionType.PLAYER_DEAD, 1, 0],
			[ActionType.RESURRECTION, 0, 1, 20, 250, 500],
		]))
		return stats.entities[1]
	}

	it('reprend la vie max portée par l\'action', () => {
		expect(resurrected().max_life).toBe(500)
	})

	it('remet l\'entité en vie', () => {
		expect(resurrected().alive).toBe(true)
	})

	it('compte la résurrection et applique la vie', () => {
		const entity = resurrected()
		expect(entity.resurrection).toBe(1)
		expect(entity.life).toBe(250)
	})

	it('sans vie max dans l\'action (vieux combats), garde l\'ancienne', () => {
		const stats = new FightStatistics()
		stats.generate(makeFight([
			[ActionType.NEW_TURN, 1],
			[ActionType.PLAYER_DEAD, 1, 0],
			[ActionType.RESURRECTION, 0, 1, 20, 250],
		]))
		expect(stats.entities[1].max_life).toBe(1000)
	})
})
