import { describe, it, expect } from 'vitest'
import { apiErrorKey, isReportedByTransport, normalizeApiError } from '@/model/api-error'
import fr from '@/lang/fr/main.json'

// Régression #11810483 : les endpoints garden/start-*-fight répondent une string JSON nue
// ('error_fight_not_enough_fights'), pas un objet. Les appelants faisaient `t(error.error)` avec
// error.error === undefined → SyntaxError vue-i18n dans un .catch() → unhandledrejection.
describe('normalizeApiError', () => {
	it('enveloppe une string nue dans {error}', () => {
		expect(normalizeApiError('error_fight_not_enough_fights')).toEqual({ error: 'error_fight_not_enough_fights' })
	})

	it('laisse intact un corps déjà bien formé, params compris', () => {
		const body = { error: 'error_muted', params: [42] }
		expect(normalizeApiError(body)).toBe(body)
	})

	it('conserve les champs annexes quand error est absent ou inexploitable', () => {
		expect(normalizeApiError({ detail: 'boom' })).toEqual({ detail: 'boom', error: 'unknown_error' })
		expect(normalizeApiError({ error: { code: 17 }, detail: 'boom' })).toEqual({ detail: 'boom', error: 'unknown_error' })
	})

	// Régression #11811619 : le tableau d'erreurs de formulaire finissait étalé en objet.
	it('conserve un tableau d\'erreurs de formulaire dans fields', () => {
		const body = [[0, 'login_length', [3, 30]], [2, 'mail_already_used']]
		expect(normalizeApiError(body)).toEqual({ error: 'login_length', params: [3, 30], fields: body })
	})

	it('rattrape les corps vides ou de type inattendu', () => {
		// null = corps de réponse vide (502, timeout Traefik) ; un corps illisible arrive, lui,
		// sous la forme {invalid_response} posée par request().
		for (const body of [null, undefined, '', { error: '' }, 500, ['a']]) {
			expect(normalizeApiError(body).error).toBe('unknown_error')
		}
	})
})

// La panne réseau est le seul code fabriqué par la couche requête qui soit affiché au joueur.
// Son libellé est commun à tout le site (main.json) et non recopié dans le .i18n de chaque
// appelant : sans ces deux règles il ressortait en clé brute, le défaut même qu'on corrigeait.
describe('network_error', () => {
	it('pointe vers le libellé commun, traduit, et non vers une clé par composant', () => {
		expect(apiErrorKey({ error: 'network_error' })).toBe('main.network_error')
		expect(fr).toHaveProperty('network_error')
	})

	it('garde la convention error_ pour les codes du serveur', () => {
		expect(apiErrorKey({ error: 'not_enough_habs' })).toBe('error_not_enough_habs')
		expect(apiErrorKey({ error: 'unknown_error' })).toBe('error_unknown')
	})

	it('est signalé par la couche requête, donc silencieux chez les appelants', () => {
		expect(isReportedByTransport({ error: 'network_error' })).toBe(true)
		expect(isReportedByTransport({ error: 'not_enough_habs' })).toBe(false)
		expect(isReportedByTransport({ error: 'unknown_error' })).toBe(false)
	})
})
