import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Le store tire tout le client : on isole les dépendances lourdes.
vi.mock('@/model/leekwars', () => {
	const noop = () => undefined
	return { LeekWars: {
		setTitleCounter: noop, clearIntervals: noop, startIntervals: noop, displayMessage: noop,
		arena: { suspend: noop }, bossSquads: { leaveSquad: noop }, publicChats: {},
	} }
})
vi.mock('@/model/filesystem', () => ({ fileSystem: { clear: () => undefined, init: () => undefined } }))

import type { Farmer } from '@/model/farmer'
import { store } from '@/model/store'

const farmer = (id: number, habs: number) => ({ id, habs, animated_habs: habs, crystals: 0, animated_crystals: 0, leeks: {} }) as unknown as Farmer

beforeEach(() => {
	vi.useFakeTimers()
	store.state.farmer = farmer(1, 1000)
})
afterEach(() => { vi.useRealTimers() })

describe('compteur de Habs animé', () => {
	it("défile jusqu'à la nouvelle valeur puis s'arrête", () => {
		store.commit('update-habs', 460)
		vi.runAllTimers()
		expect(store.state.farmer!.animated_habs).toBe(1460)
	})

	// Des combats finis sur un compte, puis un changement de compte pendant l'animation.
	it("n'ajoute pas les Habs d'un compte au compteur du compte suivant", () => {
		const previous = store.state.farmer!
		store.commit('update-habs', 500)
		vi.advanceTimersByTime(100)
		store.state.farmer = farmer(2, 200)
		vi.runAllTimers()
		expect(store.state.farmer!.animated_habs).toBe(200)
		expect(previous.animated_habs).toBe(1500)
	})

	it("s'arrête sur la valeur même si elle change pendant l'animation", () => {
		store.commit('update-habs', 500)
		vi.advanceTimersByTime(100)
		store.commit('set-habs', 900)
		vi.runAllTimers()
		expect(store.state.farmer!.animated_habs).toBe(900)
		store.commit('update-habs', 1)
		vi.advanceTimersByTime(100)
		store.commit('set-habs', 1000000)
		vi.runAllTimers()
		expect(store.state.farmer!.animated_habs).toBe(1000000)
	})

	it('reset arrête les animations en cours', () => {
		store.commit('update-habs', 500)
		store.commit('update-crystals', 50)
		store.commit('reset')
		expect(vi.getTimerCount()).toBe(0)
	})
})
