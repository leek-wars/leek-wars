import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountComponent } from '@/test/harness'
import { createTestVuetify } from '@/test/vuetify'

// Lignes RESCALE (action 5) de l'historique : le rééquilibrage de la 3.01 réduit une pièce trop
// chargée au nouveau barème (stats retirées, charge, remboursement), ou rend à l'inventaire la
// pièce en surnombre d'un poireau.

const leekWarsMock = vi.hoisted(() => ({
	LeekWars: {
		items: { 315: { id: 315, name: 'ram3' } } as Record<number, { id: number, name: string }>,
		alterations: { alterations: { 7: { name: 'vitamin_b1' } } },
		darkMode: false,
		formatDateTime: () => '30/09/2026',
		get: vi.fn(),
	},
}))
vi.mock('@/model/leekwars', () => leekWarsMock)
vi.mock('@/model/i18n', () => ({ t: (key: string) => key }))
vi.mock('@/model/emitter', () => ({ emitter: { on: () => undefined, off: () => undefined, emit: () => undefined } }))
vi.mock('@/model/forge-state', async () => {
	const { ref } = await import('vue')
	return { forgeComponent: ref(null) }
})

import ItemHistory from '@/component/inventory/item-history.vue'

const MESSAGES = {
	main: {
		history: 'Historique',
		history_this_component: 'Ce composant',
		all: 'Tout',
		history_rescale: 'Rééquilibrage {0}',
		history_rescale_returned: "revenue dans l'inventaire",
		loadout_skipped_reason_duplicate_exception_stat: 'Caractéristique déjà apportée par un autre composant',
	},
}

function mountWith(history: object[]) {
	leekWarsMock.LeekWars.get.mockResolvedValue({ history, total: history.length, page: 1 })
	return mountComponent(ItemHistory, {
		props: { action: 2 },
		global: { config: { globalProperties: { $filters: { number: (n: number) => String(n) } } } },
	}, { messages: MESSAGES, vuetify: createTestVuetify() })
}

describe('item-history : lignes du rééquilibrage 3.01', () => {
	beforeEach(() => leekWarsMock.LeekWars.get.mockReset())

	it('une pièce réduite montre sa charge, les stats retirées et le remboursement', async () => {
		const wrapper = mountWith([{
			id: 1, action: 5, template: 315, item: 42, date: 1790800000,
			details: {
				version: '3.01', reason: 'charge',
				before: { tp: 1, life: 20 }, after: { life: 20 }, removed: { tp: 1 },
				charge: { old: 88.5, new: 131.2, final: 88.4 },
				refund: { share: 0.5, habs: 123456, alterations: { 7: 2 } },
			},
		}])
		await flushPromises()
		const line = wrapper.find('.entry .line')
		expect(line.text()).toContain('Rééquilibrage 3.01')
		expect(line.find('.charge').text()).toBe('131.2 % → 88.4 %')
		expect(line.find('.broken').text()).toBe('−1')
		expect(line.find('.broken img').attributes('src')).toBe('/image/charac/small/tp.png')
		expect(line.find('.rendered-item.alteration img').attributes('src')).toBe('/image/alteration/vitamin_b1.png')
		expect(line.find('.rendered-item.alteration .qty').text()).toBe('×2')
		expect(line.find('.rendered-item.habs').text()).toContain('+123456')
		expect(line.find('.outcome.rescale').exists()).toBe(true)
	})

	it("une pièce en surnombre dit qu'elle est revenue dans l'inventaire", async () => {
		const wrapper = mountWith([{
			id: 2, action: 5, template: 315, item: 43, date: 1790800000,
			details: { version: '3.01', reason: 'exception', caracs: ['tp'], leek: 7, index: 1, kept: 44, replacement: 45, created: false },
		}])
		await flushPromises()
		const line = wrapper.find('.entry .line')
		expect(line.text()).toContain('Rééquilibrage 3.01')
		expect(line.text()).toContain("revenue dans l'inventaire")
		expect(line.find('.charge').exists()).toBe(false)
		expect(line.find('.rendered-item').exists()).toBe(false)
	})
})
