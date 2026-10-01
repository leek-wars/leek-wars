import { describe, it, expect } from 'vitest'
import { redactReport } from './redact'

// Un JWT factice : {"alg":"HS256"} . {"id":1} . signature
const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MX0.c2lnbmF0dXJl'

describe('redactReport', () => {
	it('masque le jeton d\'un lien de connexion', () => {
		expect(redactReport('https://leekwars.com/login/' + JWT)).toBe('https://leekwars.com/login/…')
		expect(redactReport('Route: /login/' + JWT + ' [login]')).toBe('Route: /login/… [login]')
	})

	it('masque un JWT où qu\'il soit, même coupé', () => {
		expect(redactReport('/bank?token=' + JWT + '&x=1')).toBe('/bank?token=…&x=1')
		expect(redactReport('nav-done +12ms /login/' + JWT.slice(0, 30))).toBe('nav-done +12ms /login/…')
	})

	it('masque les segments privés du changement d\'e-mail et du mot de passe oublié', () => {
		expect(redactReport('/change-email/confirm/0a1b2c3d')).toBe('/change-email/confirm/…')
		expect(redactReport('Previous route: /forgot-password/42/0a1b2c3d [x]')).toBe('Previous route: /forgot-password/42/… [x]')
		expect(redactReport('/forgot-password/email-sent/joueur%40exemple.fr')).toBe('/forgot-password/email-sent/…')
	})

	it('laisse le reste intact', () => {
		for (const text of [
			'https://leekwars.com/login',
			'https://leekwars.com/forgot-password',
			'→ ../../src/component/forgot-password/forgot-password.vue',
			'https://leekwars.com/assets/login-D1x2.js:2:1234',
			'const keyJson = monkeyJ.a.b',
		]) {
			expect(redactReport(text)).toBe(text)
		}
	})
})
