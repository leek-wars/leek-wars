import { describe, it, expect } from 'vitest'
import { createApp, h } from 'vue'
import { i18n, t, useNamespacedT } from '@/model/i18n'

// Le module démarre sur la locale vide de @/locale (renseignée au boot par index.html).
i18n.locale = 'fr'
i18n.global.mergeLocaleMessage('fr', {
	hello: 'Bonjour',
	error_fight_not_enough_fights: 'Plus de combats disponibles',
	garden: { error_fight_target_not_in_garden: 'Cet adversaire a quitté le potager' },
})

// Régression #11810483 : vue-i18n lève un SyntaxError (INVALID_ARGUMENT) sur une clé non-string.
// Les clés viennent souvent du serveur ; un throw depuis un .catch() devient une unhandledrejection
// non rattrapée qui casse la page, et depuis un render il casse le composant.
const UNUSABLE_KEYS = [undefined, null, '', { code: 17 }, []]

describe('t', () => {
	it('traduit une clé connue', () => {
		expect(t('hello')).toBe('Bonjour')
	})

	it('dégrade sur une clé inexploitable au lieu de lever', () => {
		for (const key of UNUSABLE_KEYS) {
			expect(t(key as unknown as string)).toBe('')
		}
	})
})

describe('useNamespacedT', () => {
	const tg = useNamespacedT('garden')

	it('préfère la clé du namespace du composant', () => {
		expect(tg('error_fight_target_not_in_garden')).toBe('Cet adversaire a quitté le potager')
	})

	it('retombe sur la clé globale hors namespace', () => {
		expect(tg('error_fight_not_enough_fights')).toBe('Plus de combats disponibles')
	})

	it('dégrade sur une clé inexploitable au lieu de lever', () => {
		for (const key of UNUSABLE_KEYS) {
			expect(tg(key as unknown as string)).toBe('')
		}
	})
})

// La garde est posée sur le composer, pas sur les helpers : $t doit en hériter. vue-i18n recopie le
// descripteur de composer.t dans globalProperties au app.use(), donc l'ordre d'installation compte —
// ce test casse si un jour vue-i18n capture la fonction plus tôt.
describe('$t global', () => {
	it('hérite de la garde posée sur le composer', () => {
		const seen: Record<string, unknown> = {}
		const app = createApp({
			render() {
				seen.valide = (this as unknown as { $t: (k: unknown) => string }).$t('hello')
				seen.invalide = (this as unknown as { $t: (k: unknown) => string }).$t(undefined)
				return h('div')
			},
		})
		app.use(i18n)
		app.mount(document.createElement('div'))
		expect(seen).toEqual({ valide: 'Bonjour', invalide: '' })
	})
})
