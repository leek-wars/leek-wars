import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'

// Codes d'erreur renvoyés par les 7 FightController::start*Fight() atteignables depuis le Potager
// (solo, éleveur, équipe, les 3 défis, boss). GardenController les préfixe par 'error_fight_' avant
// de les renvoyer, donc chacun doit avoir sa traduction dans CHAQUE locale — sinon le toast affiche
// la clé brute au joueur, ce qui est resté le cas pendant des mois (cf. #11810483).
const FIGHT_ERROR_CODES = [
	'already_has_fight_in_generation', 'composition_empty', 'composition_modified',
	'composition_no_fights', 'composition_same_team', 'enemy_not_in_arena', 'enemy_not_valid_ai',
	'invalid_composition', 'no_such_boss', 'no_such_enemy', 'no_such_leek', 'no_such_team',
	'not_enough_challenges', 'not_enough_fights', 'not_enough_leeks', 'not_enought_challenges',
	'not_team_member', 'not_your_leek', 'opponent_is_your_leek', 'target_needs_at_least_2_leeks',
	'target_not_in_garden', 'you_need_at_least_1_leek', 'you_need_at_least_2_leeks',
]

// Renvoyés nus, sans préfixe : 'wrong_token' par les 401 de GardenController, 'unknown_error' par
// normalizeApiError quand le corps est inexploitable (502, réponse non-JSON), et les trois codes
// des lots Fast Garden (GardenController::serviceStart*Batch les renvoie tels quels).
const PLAIN_ERROR_KEYS = [
	'wrong_token', 'unknown_error',
	'lwplus_required', 'no_fight_created', 'no_opponent_of_your_size',
]

// Libellés du Fast Garden. Même risque que les erreurs : ils vivent tous dans garden.*, et une
// locale oubliée afficherait la clé brute (pas de fallbackLocale, cf. model/i18n.ts).
const FAST_GARDEN_KEYS = [
	'fast_fight_n', 'fast_fight_choose', 'fast_fight_lwplus_only', 'fast_fight_discover',
	'fast_fight_unavailable', 'fast_fight_boss_master_only',
	'fast_garden_title',
	'fast_batch_title', 'fast_batch_progress', 'fast_batch_done', 'fast_batch_launching', 'fast_batch_results',
	'fast_batch_levelups', 'fast_batch_trophies', 'fast_batch_rareloot', 'fast_batch_chests',
	'fast_batch_avg_duration', 'fast_batch_avg_generation',
]

const DIR = 'src/component/garden'
const LOCALES = readdirSync(DIR)
	.map(f => /^garden\.([a-z]{2})\.i18n$/.exec(f)?.[1])
	.filter((l): l is string => !!l)
	.sort()

describe('traductions des erreurs de combat du Potager', () => {
	it('trouve bien tous les fichiers de locale', () => {
		expect(LOCALES.length).toBeGreaterThanOrEqual(17)
		expect(LOCALES).toContain('fr')
	})

	it.each(LOCALES)('%s : toutes les clés d\'erreur sont présentes et non vides', (locale) => {
		const messages = JSON.parse(readFileSync(`${DIR}/garden.${locale}.i18n`, 'utf8')) as Record<string, string>
		const expected = [...FIGHT_ERROR_CODES.map(c => 'error_fight_' + c), ...PLAIN_ERROR_KEYS]

		expect(expected.filter(k => !(k in messages))).toEqual([])
		expect(expected.filter(k => !messages[k]?.trim())).toEqual([])
	})

	// Le serveur ne renvoie jamais ces codes sans le préfixe error_fight_ : une clé 'error_<code>'
	// ne résoudrait rien. C'est le piège dans lequel 455f39c9e était tombé.
	it.each(LOCALES)('%s : pas de clé error_ sans le préfixe error_fight_', (locale) => {
		const messages = JSON.parse(readFileSync(`${DIR}/garden.${locale}.i18n`, 'utf8')) as Record<string, string>
		const orphans = Object.keys(messages).filter(k => k.startsWith('error_') && !k.startsWith('error_fight_'))
		expect(orphans).toEqual([])
	})
})

describe('traductions du Fast Garden', () => {
	it.each(LOCALES)('%s : tous les libellés sont présents et non vides', (locale) => {
		const messages = JSON.parse(readFileSync(`${DIR}/garden.${locale}.i18n`, 'utf8')) as Record<string, string>

		expect(FAST_GARDEN_KEYS.filter(k => !(k in messages))).toEqual([])
		expect(FAST_GARDEN_KEYS.filter(k => !messages[k]?.trim())).toEqual([])
	})

	// Les libellés paramétrés doivent garder leurs placeholders : une traduction qui perd
	// {0} affiche « Lot de combats » sans le nombre, sans que rien ne casse.
	it.each(LOCALES)('%s : les placeholders sont conservés', (locale) => {
		const messages = JSON.parse(readFileSync(`${DIR}/garden.${locale}.i18n`, 'utf8')) as Record<string, string>

		expect(messages.fast_fight_n).toContain('{0}')
		expect(messages.fast_batch_title).toContain('{0}')
		expect(messages.fast_batch_progress).toContain('{0}')
		expect(messages.fast_batch_progress).toContain('{1}')
	})
})
