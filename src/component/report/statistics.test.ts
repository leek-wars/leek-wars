import { describe, it, expect, vi } from 'vitest'
import { ActionType } from '@/model/action'
import { EffectType } from '@/model/effect'
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

const generate = (actions: RawAction[], date = 1_700_000_000) => {
	const stats = new FightStatistics()
	stats.generate({
		date,
		data: { map: { width: 9, height: 9 }, leeks: LEEKS, actions, ops: {} },
		report: { duration: 4 },
	} as unknown as Fight)
	return stats
}
const replay = (actions: RawAction[]) => generate(actions).entities[1]

const turn = (id: number): RawAction => [ActionType.LEEK_TURN, id]
// Effet lancé par leek0 sur leek1 : [type, objet, id de l'effet, lanceur, cible, type d'effet, valeur, tours]
const effect = (id: number, type: EffectType, value: number): RawAction =>
	[ActionType.ADD_CHIP_EFFECT, 1, id, 0, 1, type, value, 3]
// leek0 tire (sans arme équipée : aucun gabarit lu) et leek1 perd `damage` PV
const hit = (damage: number): RawAction[] => [[ActionType.USE_WEAPON, 11, 1], [ActionType.LIFE_LOST, 1, damage]]

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

	// Le générateur retire en silence les effets posés sur un mort. Gardés, les poisons d'un
	// ressuscité le frappaient encore, comptés à leur lanceur à chacun de ses tours. Topic 11159.
	it('perd les poisons qu\'il portait à sa mort', () => {
		const stats = generate([
			turn(0), effect(1, EffectType.POISON, 100), turn(1),
			[ActionType.PLAYER_DEAD, 1, 0], [ActionType.RESURRECTION, 0, 1, 20, 250, 500], turn(1),
		])
		expect(stats.entities[0].poison_out).toBe(100)
		expect(stats.entities[1].poison_in).toBe(100)
	})
})

describe('statistics.ts — effets cumulés (STACK_EFFECT)', () => {
	// Un lancer identique grossit l'effet déjà posé : ignoré, un poison cumulé ne comptait
	// que son premier lancer. Topic 11159.
	it('un poison cumulé frappe de sa valeur totale', () => {
		const stats = generate([turn(0), effect(1, EffectType.POISON, 100), [ActionType.STACK_EFFECT, 1, 50], turn(1)])
		expect(stats.entities[0].poison_out).toBe(150)
	})

	it('un bouclier cumulé compte en entier, et disparaît en entier', () => {
		const stacked: RawAction[] = [turn(0), effect(1, EffectType.RELATIVE_SHIELD, 20), [ActionType.STACK_EFFECT, 1, 30]]
		expect(replay(stacked).relativeShield).toBe(50)
		expect(replay([...stacked, [ActionType.REMOVE_EFFECT, 1]]).relativeShield).toBe(0)
	})
})

describe('statistics.ts — boucliers', () => {
	// Ajout, mise à jour et retrait passent par la même table : la mise à jour d'un bouclier
	// absolu brut était ignorée, et son retrait laissait un bouclier fantôme.
	it('un bouclier réduit puis retiré disparaît en entier', () => {
		const reduced: RawAction[] = [turn(0), effect(1, EffectType.RAW_ABSOLUTE_SHIELD, 100), [ActionType.UPDATE_EFFECT, 1, 60]]
		expect(replay(reduced).absoluteShield).toBe(60)
		expect(replay([...reduced, [ActionType.REMOVE_EFFECT, 1]]).absoluteShield).toBe(0)
	})
})

describe('statistics.ts — tank', () => {
	it('compte ce que le bouclier a évité', () => {
		expect(replay([turn(0), effect(1, EffectType.RELATIVE_SHIELD, 50), ...hit(100)]).tank).toBe(100)
	})

	// À 100 %, tout coup tombe à 0 et le log ne dit plus ce qu'il valait : la division par
	// 1 - 100 / 100 affichait un tank « Infinity ». Topic 11247.
	it('reste fini à 100 % de bouclier relatif', () => {
		const entity = replay([
			turn(0), effect(1, EffectType.RELATIVE_SHIELD, 100), effect(2, EffectType.ABSOLUTE_SHIELD, 280), ...hit(0),
		])
		expect(entity.tank).toBe(0)
	})
})

describe('statistics.ts — kills', () => {
	// Depuis le 18/10/2020, une mort sans tueur ([PLAYER_DEAD, id]) n'est le kill de
	// personne : les invocations mortes avec leur invocateur étaient comptées à l'entité
	// dont c'était le tour. Topic 11227.
	const DEATH_WITHOUT_KILLER: RawAction[] = [turn(0), [ActionType.PLAYER_DEAD, 1]]

	it('une mort sans tueur n\'est le kill de personne', () => {
		expect(generate(DEATH_WITHOUT_KILLER).entities[0].kills).toBe(0)
	})

	// Personne ne joue dans DEATH : seul le tueur logué peut recevoir le kill
	it('le tueur logué reçoit le kill', () => {
		expect(generate(DEATH).entities[0].kills).toBe(1)
	})

	// Les tout premiers combats ne loguaient jamais le tueur : l'entité qui jouait le reste.
	it('dans un combat de 2014, l\'entité qui joue reçoit le kill', () => {
		expect(generate(DEATH_WITHOUT_KILLER, 1_413_000_000).entities[0].kills).toBe(1)
	})
})
