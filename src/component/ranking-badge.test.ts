import { describe, it, expect, vi } from 'vitest'
import { mountComponent } from '@/test/harness'
import { createTestVuetify } from '@/test/vuetify'
import RankingBadge from '@/component/ranking-badge.vue'

// ranking-badge dérive des classes CSS CUMULATIVES depuis le rang : {first:===1, second:===2,
// third:===3, ten:<=10, cent:<=100}. Les seuils <= s'accumulent (rang 1 = first+ten+cent).
// Clic → LeekWars.goToRanking(category,'talent',id). Nécessite Vuetify (v-icon + v-ripple).
const mountBadge = (props: Record<string, unknown>, goToRanking = vi.fn()) => ({
	w: mountComponent(RankingBadge, { props }, { vuetify: createTestVuetify(), leekWars: { goToRanking } }),
	goToRanking,
})

describe('ranking-badge.vue', () => {
	it('rang 1 cumule first + ten + cent', () => {
		const { w } = mountBadge({ ranking: 1, id: 7, category: 'leek' })
		const c = w.find('.badge').classes()
		expect(c).toEqual(expect.arrayContaining(['first', 'ten', 'cent']))
		expect(c).not.toContain('second')
		expect(c).not.toContain('third')
		expect(w.find('.value').text()).toBe('1')
	})

	it('rangs 2 et 3 : médaille + ten + cent', () => {
		expect(mountBadge({ ranking: 2, id: 1, category: 'leek' }).w.find('.badge').classes()).toEqual(expect.arrayContaining(['second', 'ten', 'cent']))
		expect(mountBadge({ ranking: 3, id: 1, category: 'leek' }).w.find('.badge').classes()).toEqual(expect.arrayContaining(['third', 'ten', 'cent']))
	})

	it('rang 10 : ten + cent, pas de médaille', () => {
		const c = mountBadge({ ranking: 10, id: 1, category: 'leek' }).w.find('.badge').classes()
		expect(c).toEqual(expect.arrayContaining(['ten', 'cent']))
		expect(c).not.toContain('first')
	})

	it('rang 11 : cent seulement (frontière ten)', () => {
		const c = mountBadge({ ranking: 11, id: 1, category: 'leek' }).w.find('.badge').classes()
		expect(c).toContain('cent')
		expect(c).not.toContain('ten')
	})

	it('rang 101 : aucune classe de rang (frontière cent)', () => {
		const c = mountBadge({ ranking: 101, id: 1, category: 'leek' }).w.find('.badge').classes()
		for (const k of ['first', 'second', 'third', 'ten', 'cent']) { expect(c).not.toContain(k) }
		expect(mountBadge({ ranking: 101, id: 1, category: 'leek' }).w.find('.value').text()).toBe('101')
	})

	it('clic → goToRanking(category, talent, id)', async () => {
		const { w, goToRanking } = mountBadge({ ranking: 5, id: 42, category: 'farmer' })
		await w.find('.badge').trigger('click')
		expect(goToRanking).toHaveBeenCalledWith('farmer', 'talent', 42)
	})
})
