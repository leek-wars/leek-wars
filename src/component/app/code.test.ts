import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mountComponent } from '@/test/harness'
import Code from '@/component/app/code.vue'

// createCodeArea* passe par le coloriseur Monaco (chargé à la demande, inutile ici). On rejoue
// en revanche son contrat essentiel : un élément DÉJÀ formaté n'est jamais reformaté, sans quoi
// les appelants qui relisent le DOM (encyclopédie) rechargeraient les numéros de ligne injectés.
const format = (code: string, element: HTMLElement) => {
	if (element.dataset.lwFormatted) { return }
	element.dataset.lwFormatted = '1'
	element.innerHTML = '<pre>' + code + '</pre>'
}
vi.mock('@/model/leekwars', () => ({ LeekWars: {
	createCodeArea: (code: string, element: HTMLElement) => format(code, element),
	createCodeAreaSimple: (code: string, element: HTMLElement) => format(code, element),
} }))
vi.mock('@/component/editor/code-theme', () => ({ resolveCodeThemeClass: () => 'theme-light' }))

describe('code', () => {
	it('affiche le code', async () => {
		const wrapper = mountComponent(Code, { props: { code: 'getLife()', single: true } })
		await nextTick()
		expect(wrapper.find('code').text()).toBe('getLife()')
	})

	it('remplace le code quand le composant est réutilisé', async () => {
		// Marché : passer d'une arme à l'autre réutilise le même composant pour chaque effet.
		// Sans élément neuf, la ligne brute gardait le code de l'arme précédente (#4811).
		const wrapper = mountComponent(Code, { props: { code: 'getLife()', single: true } })
		await nextTick()
		await wrapper.setProps({ code: 'getStrength()' })
		await nextTick()
		expect(wrapper.find('code').text()).toBe('getStrength()')
	})
})
