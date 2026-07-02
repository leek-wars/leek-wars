import { describe, it, expect } from 'vitest'
import { mountComponent } from '@/test/harness'
import EffectPoison from '@/component/effect/effect-poison.vue'

// effect-poison.vue est représentatif de la famille effect-* : un <i18n-t> à slots nommés
// (#leek via le composant enfant action-leek, #value, #turns) + le bare LeekWars.formatTurns
// du template. Ce test établit le pattern (messages i18n seedés + stub LeekWars) qui couvre
// toute la famille effect-*/action-*.
describe('effect-poison.vue', () => {
	const mountPoison = () => mountComponent(EffectPoison, {
		props: { leek: { team: 1, translatedName: 'Bob' }, value: 5, turns: 3, a: 1 },
	}, {
		messages: { fight: { leek_receives_x: '{leek} receives {value} during {turns}', n_poison: '{0} poison' } },
		leekWars: { formatTurns: (t: number) => t + ' turns' },
	})

	it('rend le message de séquelle avec les slots interpolés', () => {
		const text = mountPoison().text()
		expect(text).toContain('Bob')       // slot #leek (enfant action-leek)
		expect(text).toContain('5 poison')  // slot #value ($t fight.n_poison)
		expect(text).toContain('3 turns')   // slot #turns (LeekWars.formatTurns)
	})

	it('rend le nom du poireau via le composant enfant action-leek', () => {
		const w = mountPoison()
		expect(w.find('span.team1').text()).toBe('Bob')
	})
})
