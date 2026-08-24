import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountComponent } from '@/test/harness'
import { createTestVuetify } from '@/test/vuetify'

// La forge peut être remplie par un schéma qu'on n'a pas les moyens de fabriquer : le bouton
// Fabriquer du marché (#craft=<schéma>) y dépose les ingrédients sans regarder l'inventaire.
// Elle doit alors montrer ce qui manque et refuser le craft, au lieu de laisser croire au
// joueur qu'il lui suffit de cliquer.

const leekWarsMock = vi.hoisted(() => ({
	LeekWars: {
		items: {
			430: { id: 430, name: 'sun_shard', type: 7 },
			193: { id: 193, name: 'iron', type: 7 },
			440: { id: 440, name: 'weapon_sun_spear', type: 1 },
		},
		mobile: false,
		footer: true,
		box: false,
		post: vi.fn(() => Promise.resolve({ id: 1, template: 440, time: 0 })),
		toast: vi.fn(),
	},
}))
vi.mock('@/model/leekwars', () => leekWarsMock)
vi.mock('@/model/i18n', () => ({ t: (key: string) => key }))

// Mêmes sémantiques que les getters du vrai store (cf. itemQuantity dans src/model/store.ts).
// L'inventaire est rendu réactif dans la factory du mock (`vue` n'est pas importable depuis un
// vi.hoisted) : sans ça la forge ne verrait pas les ingrédients consommés par la fabrication.
const inventory = vi.hoisted(() => ({ owned: {} as Record<number, number> }))
vi.mock('@/model/store', async () => {
	const { reactive } = await import('vue')
	inventory.owned = reactive(inventory.owned)
	return {
		store: {
			commit: vi.fn(),
			getters: {
				item_quantity: (template: number) => inventory.owned[template] ?? 0,
				scheme_possible: (scheme: { items: ([number, number] | null)[] }) =>
					scheme.items.every(item => item === null || (inventory.owned[item[0]] ?? 0) >= item[1]),
			},
		},
	}
})

// Émetteur minimal : la forge s'abonne à 'craft' au montage, le test déclenche ce handler.
const emitterMock = vi.hoisted(() => {
	const handlers: Record<string, ((payload: unknown) => void)[]> = {}
	return {
		handlers,
		emitter: {
			on: (event: string, handler: (payload: unknown) => void) => { (handlers[event] ??= []).push(handler) },
			off: (event: string) => { delete handlers[event] },
			emit: (event: string, payload: unknown) => { for (const h of handlers[event] ?? []) h(payload) },
		},
	}
})
vi.mock('@/model/emitter', () => ({ emitter: emitterMock.emitter }))

// __esModule : sans ce marqueur, defineAsyncComponent prend l'espace de noms du mock pour le
// composant lui-même au lieu de son export default, et le rendu casse.
vi.mock('@/component/rich-tooltip/rich-tooltip-item.vue', () => ({
	__esModule: true,
	default: {
		name: 'RichTooltipItem',
		props: ['item', 'inventory', 'quantity', 'openDelay'],
		template: '<div class="tooltip"><slot :props="{}" /></div>',
	},
}))

import Forge from '@/component/forge/forge.vue'

// Schéma de la Lance du soleil (69) : 30 éclats de soleil + 60 fers
const SCHEME = { id: 69, result: 440, quantity: 1, items: [[430, 30], [193, 60], null, null, null, null, null, null] }

const mountForge = async () => {
	const wrapper = mountComponent(Forge, {
		global: { mocks: { $filters: { number: (n: number) => String(n) } } },
	}, { leekWars: leekWarsMock.LeekWars, vuetify: createTestVuetify() })
	await flushPromises()
	emitterMock.emitter.emit('craft', SCHEME)
	await flushPromises()
	return wrapper
}

describe('forge.vue', () => {
	beforeEach(() => {
		for (const key of Object.keys(inventory.owned)) { delete inventory.owned[+key] }
		leekWarsMock.LeekWars.post.mockClear()
		leekWarsMock.LeekWars.toast.mockClear()
		vi.useRealTimers()
	})

	it('signale les ingrédients manquants ou insuffisants', async () => {
		inventory.owned[430] = 12 // pas assez
		const cells = (await mountForge()).findAll('.cell')
		expect(cells[0].classes()).toContain('partial')
		expect(cells[1].classes()).toContain('missing') // aucun fer
		expect(cells[2].classes()).not.toContain('missing') // case vide
	})

	it('refuse de fabriquer quand les ingrédients manquent', async () => {
		inventory.owned[430] = 30
		const wrapper = await mountForge()
		const craftCell = wrapper.findAll('.cell')[8]
		expect(craftCell.classes()).toContain('impossible')
		expect(craftCell.classes()).not.toContain('active')
		await craftCell.trigger('click')
		expect(leekWarsMock.LeekWars.post).not.toHaveBeenCalled()
	})

	it('fabrique quand tous les ingrédients sont là', async () => {
		inventory.owned[430] = 30
		inventory.owned[193] = 100
		const wrapper = await mountForge()
		const cells = wrapper.findAll('.cell')
		expect(cells[0].classes()).not.toContain('partial')
		expect(cells[1].classes()).not.toContain('missing')
		const craftCell = cells[8]
		expect(craftCell.classes()).toContain('active')
		expect(craftCell.classes()).not.toContain('impossible')
		await craftCell.trigger('click')
		expect(leekWarsMock.LeekWars.post).toHaveBeenCalledWith('item/craft', { scheme_id: 69 })

		// Les ingrédients sont retirés de l'inventaire dès la réponse du serveur, alors qu'ils
		// sont encore affichés le temps de l'animation : ils ne doivent pas virer au rouge.
		delete inventory.owned[430]
		delete inventory.owned[193]
		await flushPromises()
		expect(wrapper.findAll('.cell')[0].classes()).not.toContain('missing')
		expect(wrapper.findAll('.cell')[8].classes()).not.toContain('impossible')
	})

	it("n'envoie qu'une requête même en cliquant plusieurs fois pendant l'animation", async () => {
		inventory.owned[430] = 30
		inventory.owned[193] = 100
		const wrapper = await mountForge()
		const craftCell = wrapper.findAll('.cell')[8]
		await craftCell.trigger('click')
		await craftCell.trigger('click')
		expect(leekWarsMock.LeekWars.post).toHaveBeenCalledTimes(1)
	})

	it("ne conclut pas à une fabrication quand le serveur refuse", async () => {
		inventory.owned[430] = 30
		inventory.owned[193] = 100
		leekWarsMock.LeekWars.post.mockImplementationOnce(() =>
			Promise.reject({ error: 'no_such_item_or_not_enough_quantity' }))
		const wrapper = await mountForge()
		vi.useFakeTimers()
		await wrapper.findAll('.cell')[8].trigger('click')
		await vi.advanceTimersByTimeAsync(500)
		vi.useRealTimers()
		await flushPromises()
		// Pas d'état « fabriqué » : la recette reste affichée, le joueur est prévenu
		expect(wrapper.findAll('.cell')[8].classes()).not.toContain('built')
		expect(wrapper.findAll('.cell')[0].classes()).toContain('active')
		expect(leekWarsMock.LeekWars.toast).toHaveBeenCalled()
	})

	// Scénario du rapport #4886 : ressources pour un seul exemplaire, on fabrique, puis le
	// bouton de recraft refait apparaître la recette — elle doit montrer ses manques et
	// refuser le craft au lieu de rejouer l'animation dans le vide.
	it('le recraft sans ressources montre les manques au lieu de rejouer l\'animation', async () => {
		inventory.owned[430] = 30
		inventory.owned[193] = 60 // de quoi fabriquer une seule fois
		const wrapper = await mountForge()
		const craftCell = () => wrapper.findAll('.cell')[8]
		vi.useFakeTimers()
		await craftCell().trigger('click')
		await vi.advanceTimersByTimeAsync(500)
		vi.useRealTimers()
		// Le serveur a consommé les ingrédients (le vrai store le ferait via les commits)
		delete inventory.owned[430]
		delete inventory.owned[193]
		await flushPromises()
		expect(craftCell().classes()).toContain('built')
		// Recraft : la recette réapparaît avec ses manques, hors d'état de fabriquer
		await craftCell().trigger('click')
		expect(wrapper.findAll('.cell')[0].classes()).toContain('missing')
		expect(craftCell().classes()).toContain('impossible')
		await craftCell().trigger('click')
		expect(leekWarsMock.LeekWars.post).toHaveBeenCalledTimes(1)
	})
})
