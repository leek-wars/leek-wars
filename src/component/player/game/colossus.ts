import { ActionType } from '@/model/action'
import { EffectType } from '@/model/effect'
import type { FightLeek, RawAction } from '@/model/fight'

/** Stats multipliées par l'effet MULTIPLY_STATS côté serveur (EffectMultiplyStats). */
const MULTIPLIED_STATS = ['life', 'strength', 'wisdom', 'agility', 'resistance', 'frequency', 'science', 'magic', 'tp', 'mp']

/**
 * Invocations dont le snapshot de stats de `data.leeks` a été figé APRÈS l'application
 * du multiplicateur du Colosse, dans les combats générés entre le 21/06/2026 et le
 * correctif de State.createSummon : l'action d'effet MULTIPLY_STATS y précède l'action
 * d'invocation. Le client, qui rejoue cette action sur un snapshot déjà multiplié,
 * comptait alors le bonus deux fois (bulbe affiché à 9900 PV au lieu de 3300, mort avec
 * la barre de vie aux deux tiers pleine, combat 53289203 action 1441).
 *
 * Renvoie, par invocation concernée, le facteur à annuler sur son snapshot. Une entité
 * initiale (le colosse lui-même) n'est jamais concernée : son snapshot est émis par
 * recordInitialState avant l'effet.
 */
function getPreSummonMultipliers(entities: FightLeek[], actions: RawAction[]): {[id: number]: number} {
	const factors: {[id: number]: number} = {}
	const notSummonedYet = new Set(entities.filter(e => e.summon).map(e => e.id))
	for (const action of actions) {
		if (action[0] === ActionType.SUMMON) {
			notSummonedYet.delete(action[2])
		} else if (action[0] === ActionType.ADD_CHIP_EFFECT || action[0] === ActionType.ADD_WEAPON_EFFECT || action[0] === ActionType.ADD_STACKED_EFFECT) {
			if (action[5] === EffectType.MULTIPLY_STATS && action[6] > 1 && notSummonedYet.has(action[4]) && !(action[4] in factors)) {
				factors[action[4]] = action[6]
			}
		}
	}
	return factors
}

/**
 * Ramène aux stats de base un snapshot d'entité déjà multiplié par `factor`. Le serveur
 * pose un bonus de `base * (factor - 1)` sur chaque stat, le snapshot vaut donc
 * exactement `base * factor` : la division retombe sur des entiers.
 */
function unmultiplyStats(entity: FightLeek, factor: number): FightLeek {
	const base = { ...entity } as unknown as {[key: string]: unknown}
	for (const stat of MULTIPLIED_STATS) {
		const value = base[stat]
		if (typeof value === 'number') {
			base[stat] = Math.round(value / factor)
		}
	}
	return base as unknown as FightLeek
}

export { getPreSummonMultipliers, unmultiplyStats }
