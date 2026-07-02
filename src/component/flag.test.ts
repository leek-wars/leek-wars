import { describe, it, expect } from 'vitest'
import { mountComponent } from '@/test/harness'
import Flag from '@/component/flag.vue'

// flag.vue valide le harnais i18n ($t('country.<code>')) + router (<router-link>).
// Logique : url (code présent -> drapeau du pays, sinon drapeau générique) et _clickable.
//
// NB comportement ACTUEL : à cause du cast booléen de Vue 3 (prop Boolean omise = false),
// `clickable !== false` vaut false quand la prop est omise -> le drapeau n'est PAS cliquable
// par défaut, alors que l'idiome `!== false` suggère l'inverse. Conséquence latente : les
// drapeaux pays du classement/profil/équipe (qui omettent clickable) ne sont pas cliquables.
// Corriger le défaut est un changement transverse (~20 sites, certains décoratifs dans des
// v-btn/v-menu/v-list-item, + signup.vue verrouillé) qui demande une QA visuelle : hors scope ici.
// Ce test verrouille donc le comportement actuel ; à mettre à jour si le défaut est corrigé.
describe('flag.vue', () => {
	it('n\'est PAS cliquable quand clickable est omis (cast booléen Vue 3)', () => {
		const w = mountComponent(Flag, { props: { code: 'fr' } }, { messages: { country: { fr: 'France' } } })
		expect(w.find('a').exists()).toBe(false)
		expect(w.find('span.flag').exists()).toBe(true)
		expect(w.find('img').attributes('src')).toBe('/image/flag/fr.png?2')
		expect(w.find('.flag').attributes('title')).toBe('France')
	})

	it('devient un lien vers le classement du pays avec :clickable="true"', () => {
		const w = mountComponent(Flag, { props: { code: 'fr', clickable: true } }, { messages: { country: { fr: 'France' } } })
		expect(w.find('a').exists()).toBe(true)
		expect(w.find('a').attributes('href')).toBe('/ranking?country=fr')
		expect(w.find('img').attributes('src')).toBe('/image/flag/fr.png?2')
		expect(w.find('.flag').attributes('title')).toBe('France')
	})

	it('utilise le drapeau générique et aucun titre sans code', () => {
		const w = mountComponent(Flag, { props: { clickable: true } })
		expect(w.find('img').attributes('src')).toBe('/image/flag/_.png?2')
		expect(w.find('.flag').attributes('title')).toBeUndefined()
	})
})
