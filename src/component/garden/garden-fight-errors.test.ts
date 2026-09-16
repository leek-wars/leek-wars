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
// normalizeApiError quand le corps est inexploitable (502, réponse non-JSON).
const PLAIN_ERROR_KEYS = ['wrong_token', 'unknown_error']

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
