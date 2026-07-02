import { describe, it, expect } from 'vitest'
import { mountComponent } from '@/test/harness'
import Pagination from '@/component/pagination.vue'

// pagination.vue valide le harnais router (<router-link> avec :to calculés) et couvre la vraie
// arithmétique de pagination : center = max(5, min(total-4, current)), start = center-4,
// end = min(total, center+4), séparateur de page '/page-' (ou '&page=' en mode query).
describe('pagination.vue', () => {
	it('ne rend rien quand il n\'y a aucune page', () => {
		const w = mountComponent(Pagination, { props: { current: 1, total: 0, url: '/r' } })
		expect(w.find('.pagination').exists()).toBe(false)
	})

	it('petit total : pas d\'ellipse, la page 1 pointe sur l\'url nue', () => {
		const w = mountComponent(Pagination, { props: { current: 1, total: 5, url: '/r' } })
		const links = w.findAll('a')
		expect(links).toHaveLength(5)
		expect(w.findAll('span')).toHaveLength(0) // pas d'ellipse
		expect(links[0].text()).toBe('1')
		expect(links[0].attributes('href')).toBe('/r') // page 1 = url sans /page-
		expect(links[1].attributes('href')).toBe('/r/page-2')
		expect(w.find('a.current').text()).toBe('1')
	})

	it('grand total centré : raccourcis première/dernière page + deux ellipses', () => {
		const w = mountComponent(Pagination, { props: { current: 10, total: 20, url: '/ranking' } })
		const links = w.findAll('a')
		// 1 (première) + 9 (fenêtre 6..14) + 1 (dernière) = 11
		expect(links).toHaveLength(11)
		expect(w.findAll('span')).toHaveLength(2) // deux "..."
		expect(links[0].text()).toBe('1')
		expect(links[0].attributes('href')).toBe('/ranking')
		expect(links[links.length - 1].text()).toBe('20')
		expect(w.find('a.current').text()).toBe('10')
	})

	it('mode query : le séparateur de page devient &page=', () => {
		const w = mountComponent(Pagination, { props: { current: 10, total: 20, url: '/r', query: true } })
		expect(w.findAll('a').some(a => a.attributes('href')?.includes('&page='))).toBe(true)
	})
})
