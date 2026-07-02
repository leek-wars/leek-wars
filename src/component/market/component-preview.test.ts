import { describe, it, expect } from 'vitest'
import { mountComponent } from '@/test/harness'
import ComponentPreview from '@/component/market/component-preview.vue'

// component-preview rend les stats d'un composant. Par stat : classe {[nom]:true, negative:val<0},
// image /image/charac/<nom>.png, et la valeur en gras. 0 n'est PAS négatif. Sans prop -> rien.
const mountPreview = (component?: unknown) => mountComponent(ComponentPreview, { props: { component } }, {})

describe('component-preview.vue', () => {
	it('sans composant : ne rend rien', () => {
		expect(mountPreview(undefined).find('.stats').exists()).toBe(false)
	})

	it('liste vide : conteneur présent, aucune stat', () => {
		const w = mountPreview({ stats: [] })
		expect(w.find('.stats').exists()).toBe(true)
		expect(w.findAll('.stat')).toHaveLength(0)
	})

	it('stat positive : classe du nom, pas negative, image et valeur', () => {
		const w = mountPreview({ stats: [['strength', 5]] })
		const stat = w.find('.stat')
		expect(stat.classes()).toContain('strength')
		expect(stat.classes()).not.toContain('negative')
		expect(w.find('img.icon').attributes('src')).toBe('/image/charac/strength.png')
		expect(w.find('b').text()).toBe('5')
	})

	it('stat négative : classe negative', () => {
		const w = mountPreview({ stats: [['agility', -3]] })
		expect(w.find('.stat').classes()).toEqual(expect.arrayContaining(['agility', 'negative']))
		expect(w.find('b').text()).toBe('-3')
	})

	it('zéro n\'est pas négatif', () => {
		const w = mountPreview({ stats: [['tp', 0]] })
		expect(w.find('.stat').classes()).toContain('tp')
		expect(w.find('.stat').classes()).not.toContain('negative')
	})

	it('plusieurs stats : seule la négative reçoit la classe', () => {
		const w = mountPreview({ stats: [['a', 1], ['b', -1]] })
		const stats = w.findAll('.stat')
		expect(stats[0].classes()).not.toContain('negative')
		expect(stats[1].classes()).toContain('negative')
	})
})
