import { describe, it, expect } from 'vitest'
import { mountComponent } from '@/test/harness'
import { createTestVuetify } from '@/test/vuetify'
import Breadcrumb from '@/component/forum/breadcrumb.vue'

// breadcrumb rend chaque item en <router-link> (si item.link) ou <span> (sinon), classe .item,
// avec un chevron v-icon ENTRE items seulement (i < length-1). Classe raw sur la racine si raw.
// Nécessite Vuetify (v-icon + directive v-ripple).
const mountCrumb = (props: Record<string, unknown>) => mountComponent(Breadcrumb, { props }, { vuetify: createTestVuetify() })

describe('breadcrumb.vue', () => {
	it('items + chevrons entre eux seulement', () => {
		const w = mountCrumb({ items: [{ name: 'A', link: '/a' }, { name: 'B', link: '/b' }, { name: 'C' }] })
		const items = w.findAll('.item')
		expect(items.map(i => i.text())).toEqual(['A', 'B', 'C'])
		expect(w.findAll('.v-icon')).toHaveLength(2) // 3 items -> 2 séparateurs
	})

	it('item avec link -> <a>, sans link -> <span>', () => {
		const items = mountCrumb({ items: [{ name: 'A', link: '/a' }, { name: 'B' }] }).findAll('.item')
		expect(items[0].element.tagName).toBe('A')
		expect(items[1].element.tagName).toBe('SPAN')
	})

	it('un seul item : aucun chevron', () => {
		const w = mountCrumb({ items: [{ name: 'Only' }] })
		expect(w.findAll('.item')).toHaveLength(1)
		expect(w.findAll('.v-icon')).toHaveLength(0)
	})

	it('classe raw quand raw=true, absente par défaut', () => {
		expect(mountCrumb({ items: [{ name: 'A' }], raw: true }).find('.breadcrumb').classes()).toContain('raw')
		expect(mountCrumb({ items: [{ name: 'A' }] }).find('.breadcrumb').classes()).not.toContain('raw')
	})
})
