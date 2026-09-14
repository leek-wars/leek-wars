import { describe, it, expect, beforeEach, vi } from 'vitest'

// Le store tire tout le client : on isole les dépendances lourdes.
vi.mock('@/model/leekwars', () => {
	const noop = () => undefined
	const LeekWars = {
		setTitleCounter: noop, clearIntervals: noop, startIntervals: noop, displayMessage: noop,
		arena: { suspend: noop }, bossSquads: { leaveSquad: noop }, publicChats: {},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		selectWhere: (list: any[], field: string, value: unknown) => list.find(i => i[field] === value) ?? null,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		removeOneWhere: (list: any[], field: string, value: unknown) => {
			const index = list.findIndex(i => i[field] === value)
			if (index !== -1) list.splice(index, 1)
		},
	}
	return { LeekWars }
})
vi.mock('@/model/filesystem', () => ({ fileSystem: { clear: () => undefined, init: () => undefined } }))

import { store } from '@/model/store'
import { ItemType } from '@/model/item'

// 470 pommes neuves et UNE pomme altérée : deux lignes d'inventaire sous le même
// template, l'altérée en tête (c'est l'ordre que renvoie l'API). Le serveur ne
// connaît que la pile neuve (`stats IS NULL`), le client doit dire pareil.
const APPLE = 1234
beforeEach(() => {
	store.state.farmer = {
		id: 42, habs: 0,
		resources: [], potions: [], chips: [], weapons: [], hats: [], pomps: [], alterations: [],
		components: [
			{ id: 2, template: APPLE, quantity: 1, stats: { strength: 12 } },
			{ id: 1, template: APPLE, quantity: 470 },
		],
	} as never
})

describe('item_quantity avec une pièce altérée', () => {
	it('compte la pile neuve, pas l\'instance altérée', () => {
		expect(store.getters.item_quantity(APPLE)).toBe(470)
	})

	it('ne rend fabricable une recette que si la pile neuve suffit', () => {
		const scheme = { items: [[APPLE, 2], null] }
		expect(store.getters.scheme_possible(scheme as never)).toBe(true)
	})

	it('ne voit rien quand il ne reste que l\'altérée', () => {
		store.state.farmer!.components = [{ id: 2, template: APPLE, quantity: 1, stats: { strength: 12 } }] as never
		expect(store.getters.item_quantity(APPLE)).toBe(0)
	})
})

describe('remove-inventory sans id', () => {
	it('entame la pile neuve et laisse l\'altérée en place', () => {
		store.commit('remove-inventory', { type: ItemType.COMPONENT, item_template: APPLE, quantity: 2 })
		const components = store.state.farmer!.components
		expect(components.length).toBe(2)
		expect(components.find(c => c.id === 1)!.quantity).toBe(468)
		expect(components.find(c => c.id === 2)!.quantity).toBe(1)
	})

	it('retire bien la ligne visée quand un id est donné', () => {
		store.commit('remove-inventory', { type: ItemType.COMPONENT, id: 2, item_template: APPLE, quantity: 1 })
		const components = store.state.farmer!.components
		expect(components.length).toBe(1)
		expect(components[0].id).toBe(1)
	})
})
