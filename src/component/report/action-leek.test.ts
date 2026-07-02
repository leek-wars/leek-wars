import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ActionLeek from '@/component/report/action-leek.vue'

// Composant le plus simple du site (un seul <span>), sans aucune dépendance : sert de
// test fumigène du harnais @vue/test-utils + happy-dom (montage, binding de prop, classe, texte).
describe('action-leek.vue', () => {
	it('affiche le nom traduit du poireau', () => {
		const wrapper = mount(ActionLeek, { props: { leek: { team: 2, translatedName: 'Bob' } } })
		expect(wrapper.text()).toBe('Bob')
	})
	it('applique la classe d\'équipe', () => {
		const wrapper = mount(ActionLeek, { props: { leek: { team: 1, translatedName: 'Alice' } } })
		expect(wrapper.find('span').classes()).toContain('team1')
	})
})
