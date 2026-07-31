import { describe, it, expect } from 'vitest'
import { normalizeApiError } from '@/model/api-error'

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
		// null = réponse non-JSON (502, timeout Traefik) lue en responseType 'json'.
		for (const body of [null, undefined, '', { error: '' }, 500, ['a']]) {
			expect(normalizeApiError(body).error).toBe('unknown_error')
		}
	})
})
