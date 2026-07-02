import { describe, it, expect } from 'vitest'
import { mountComponent } from '@/test/harness'
import { createTestVuetify } from '@/test/vuetify'
import Talent from '@/component/talent.vue'

// talent.vue valide le leg Vuetify du harnais : <v-tooltip> + activator slot + directive v-ripple,
// combinés au mixin LeekWars (formatNumber/goToRanking) et à $t. On assère sur l'activateur
// (toujours rendu) ; le contenu du tooltip vit dans un overlay non ouvert en test.
describe('talent.vue', () => {
	const mountTalent = (props: Record<string, unknown>) => mountComponent(Talent, { props }, {
		vuetify: createTestVuetify(),
		leekWars: { formatNumber: (n: number) => 'N(' + n + ')', goToRanking: () => {} },
	})

	it('monte avec Vuetify et formate le talent via LeekWars', () => {
		const w = mountTalent({ talent: 1234, id: 5, category: 'ranking' })
		expect(w.find('.talent').exists()).toBe(true)
		expect(w.find('.value').text()).toBe('N(1234)')
		expect(w.find('img[src="/image/talent.png"]').exists()).toBe(true)
	})
})
