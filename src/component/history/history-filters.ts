import { type Fight, FightContext, FightType } from '@/model/fight'

/*
 * Filtres d'un historique de combats : contexte, type, butin et résultat.
 *
 * Partagés par la page d'historique et le widget « Historique de combat » de
 * l'accueil : les mêmes pastilles doivent garder le même sens aux deux
 * endroits. La période et la recherche par adversaire restent propres à la
 * page.
 */

export interface FightFilters {
	contexts: Record<string, boolean>
	types: Record<string, boolean>
	/** Des RESTRICTIONS, à l'inverse des autres groupes : aucune cochée = tout. */
	loot: Record<string, boolean>
	results: Record<string, boolean>
}

export type HistoryFilterGroup = keyof FightFilters

interface FilterItem { key: string, label: string, color?: string }
interface FilterRow { group: HistoryFilterGroup, label: string, items: FilterItem[] }

/**
 * Les rangées de pastilles, dans l'ordre d'affichage : la seule liste des
 * clés de filtre. `label` est une clé du dictionnaire `history`.
 */
export const FILTER_ROWS: FilterRow[] = [
	{ group: 'contexts', label: 'fight_context', items: [
		{ key: 'challenge', label: 'challenge' },
		{ key: 'garden', label: 'garden' },
		{ key: 'tournament', label: 'tournament' },
	] },
	{ group: 'types', label: 'fight_type', items: [
		{ key: 'solo', label: 'solo' },
		{ key: 'farmer', label: 'farmer' },
		{ key: 'team', label: 'team' },
		{ key: 'battleRoyale', label: 'battle_royale' },
		{ key: 'war', label: 'war' },
		{ key: 'chestHunt', label: 'chest_hunt' },
		{ key: 'colossus', label: 'colossus' },
		{ key: 'boss', label: 'boss' },
	] },
	{ group: 'loot', label: 'loot', items: [
		{ key: 'chests', label: 'chests' },
		{ key: 'rareloot', label: 'rare_loot' },
	] },
	{ group: 'results', label: 'result', items: [
		{ key: 'win', label: 'victories', color: 'res-win' },
		{ key: 'draw', label: 'draws', color: 'res-draw' },
		{ key: 'defeat', label: 'defeats', color: 'res-defeat' },
		{ key: 'generating', label: 'generating', color: 'res-generating' },
	] },
]

const GROUP_KEYS = Object.fromEntries(
	FILTER_ROWS.map(row => [row.group, row.items.map(item => item.key)])
) as Record<HistoryFilterGroup, string[]>

const DEFAULT_GROUP: Record<HistoryFilterGroup, boolean> = {
	contexts: true,
	types: true,
	loot: false,
	results: true,
}

function defaultGroup(group: HistoryFilterGroup): Record<string, boolean> {
	return Object.fromEntries(GROUP_KEYS[group].map(k => [k, DEFAULT_GROUP[group]]))
}

/**
 * Un groupe relu (localStorage, disposition de l'accueil) fusionné avec les
 * valeurs par défaut : une clé ajoutée après l'enregistrement serait sinon
 * `undefined`, donc silencieusement décochée (« generating » masquait ainsi les
 * combats en génération pour tout réglage antérieur). Les valeurs qui ne sont
 * pas des booléens sont ignorées.
 */
export function sanitizeGroup(group: HistoryFilterGroup, raw: unknown): Record<string, boolean> {
	const result = defaultGroup(group)
	if (raw && typeof raw === 'object') {
		for (const key of GROUP_KEYS[group]) {
			const value = (raw as Record<string, unknown>)[key]
			if (typeof value === 'boolean') result[key] = value
		}
	}
	return result
}

export function sanitizeFilters(raw: unknown): FightFilters {
	const source = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {}
	return {
		contexts: sanitizeGroup('contexts', source.contexts),
		types: sanitizeGroup('types', source.types),
		loot: sanitizeGroup('loot', source.loot),
		results: sanitizeGroup('results', source.results),
	}
}

export function isDefaultFilters(filters: FightFilters): boolean {
	return (Object.keys(GROUP_KEYS) as HistoryFilterGroup[])
		.every(group => GROUP_KEYS[group].every(k => filters[group][k] === DEFAULT_GROUP[group]))
}

/**
 * Le combat passe-t-il les filtres ? `ignoreTypes` : l'historique d'une équipe
 * n'a pas de ligne « types », tous ses combats sont des combats d'équipe.
 */
export function fightMatchesFilters(
	fight: Fight, filters: FightFilters, ignoreTypes = false
): boolean {
	const { contexts, types, loot, results } = filters
	const contextFilter = (contexts.challenge && fight.context === FightContext.CHALLENGE)
		|| (contexts.garden && fight.context === FightContext.GARDEN)
		|| (contexts.tournament && fight.context === FightContext.TOURNAMENT)
		|| (contexts.garden && types.battleRoyale && fight.context === FightContext.BATTLE_ROYALE)

	const typeFilter = ignoreTypes
		|| (types.solo && fight.type === FightType.SOLO)
		|| (types.farmer && fight.type === FightType.FARMER)
		|| (types.team && fight.type === FightType.TEAM)
		|| (types.battleRoyale && fight.type === FightType.BATTLE_ROYALE)
		|| (types.war && fight.type === FightType.WAR)
		|| (types.chestHunt && fight.type === FightType.CHEST_HUNT)
		|| (types.colossus && fight.type === FightType.COLOSSUS)
		|| (types.boss && fight.type === FightType.BOSS)

	// Un combat en génération a un butin encore inconnu (chests/rareloot à 0) : il ne
	// doit pas être exclu par le filtre butin, sinon il est invisible même avec le
	// chip « En cours de génération » activé.
	const lootFilter = (!loot.chests && !loot.rareloot)
		|| fight.status === 0
		|| (loot.chests && fight.chests > 0)
		|| (loot.rareloot && fight.rareloot > 0)

	const resultFilter = (results.win && fight.result === 'win')
		|| (results.draw && fight.result === 'draw')
		|| (results.defeat && fight.result === 'defeat')
		|| (results.generating && fight.status === 0)

	return contextFilter && typeFilter && lootFilter && resultFilter
}
