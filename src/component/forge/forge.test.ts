import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { enableAutoUnmount, flushPromises } from '@vue/test-utils'
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

// Une vraie instance mitt plutôt qu'une réimplémentation maison : même dispatch et même
// off ciblé que le module de prod, sans tirer ses imports.
vi.mock('@/model/emitter', async () => {
	const { default: mitt } = await import('mitt')
	return { emitter: mitt() }
})

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
import { emitter } from '@/model/emitter'
import type { SchemeTemplate } from '@/model/scheme'

// Schéma de la Lance du soleil (69) : 30 éclats de soleil + 60 fers
const SCHEME: SchemeTemplate = { id: 69, result: 440, quantity: 1, items: [[430, 30], [193, 60], null, null, null, null, null, null] }

// Une seule instance Vuetify pour tout le fichier : sa construction est coûteuse
// (tous les composants + directives) et les tests sont séquentiels.
const vuetify = createTestVuetify()

enableAutoUnmount(afterEach)

const mountForge = async (owned: Record<number, number> = {}) => {
	Object.assign(inventory.owned, owned)
	const wrapper = mountComponent(Forge, {
		global: { mocks: { $filters: { number: (n: number) => String(n) } } },
	}, { leekWars: leekWarsMock.LeekWars, vuetify })
	await flushPromises()
	emitter.emit('craft', SCHEME)
	await flushPromises()
	return wrapper
}

// Joue un craft complet : clic sur la case centrale, aller-retour serveur et 500 ms
// d'animation sous fake timers. `during` s'exécute en vol : après la réponse du serveur,
// avant la fin de l'animation. Restaurer les vrais timers AVANT flushPromises, sinon le
// flush (basé sur un timer) pend sous fake timers.
async function craftThroughAnimation(wrapper: Awaited<ReturnType<typeof mountForge>>, during?: () => Promise<void> | void) {
	vi.useFakeTimers()
	await wrapper.findAll('.cell')[8].trigger('click')
	if (during) {
		await vi.advanceTimersByTimeAsync(100)
		await during()
	}
	await vi.advanceTimersByTimeAsync(500)
	vi.useRealTimers()
	await flushPromises()
}

describe('forge.vue', () => {
	beforeEach(() => {
		for (const key of Object.keys(inventory.owned)) { delete inventory.owned[+key] }
		emitter.all.clear()
		// mockReset (et pas mockClear) : purge aussi une file mockImplementationOnce laissée
		// armée par un test en échec, en restaurant l'implémentation d'origine.
		leekWarsMock.LeekWars.post.mockReset()
		leekWarsMock.LeekWars.toast.mockClear()
		vi.useRealTimers()
	})

	it('signale les ingrédients manquants ou insuffisants', async () => {
		const cells = (await mountForge({ 430: 12 })).findAll('.cell') // pas assez d'éclats
		expect(cells[0].classes()).toContain('partial')
		expect(cells[1].classes()).toContain('missing') // aucun fer
		expect(cells[2].classes()).not.toContain('missing') // case vide
	})

	it('refuse de fabriquer quand les ingrédients manquent', async () => {
		const wrapper = await mountForge({ 430: 30 })
		const craftCell = wrapper.findAll('.cell')[8]
		expect(craftCell.classes()).toContain('impossible')
		expect(craftCell.classes()).not.toContain('active')
		await craftCell.trigger('click')
		expect(leekWarsMock.LeekWars.post).not.toHaveBeenCalled()
	})

	it('fabrique quand tous les ingrédients sont là', async () => {
		const wrapper = await mountForge({ 430: 30, 193: 100 })
		const cells = wrapper.findAll('.cell')
		expect(cells[0].classes()).not.toContain('partial')
		expect(cells[1].classes()).not.toContain('missing')
		expect(cells[8].classes()).toContain('active')
		expect(cells[8].classes()).not.toContain('impossible')
		await craftThroughAnimation(wrapper, async () => {
			expect(leekWarsMock.LeekWars.post).toHaveBeenCalledWith('item/craft', { scheme_id: 69 })
			// Les ingrédients sont retirés de l'inventaire dès la réponse du serveur, alors qu'ils
			// sont encore affichés le temps de l'animation : ils ne doivent pas virer au rouge.
			delete inventory.owned[430]
			delete inventory.owned[193]
			await vi.advanceTimersByTimeAsync(0)
			expect(wrapper.findAll('.cell')[0].classes()).not.toContain('missing')
			expect(wrapper.findAll('.cell')[8].classes()).not.toContain('impossible')
		})
		// Fin de l'animation : état « fabriqué », le bouton de recraft apparaît
		expect(wrapper.findAll('.cell')[8].classes()).toContain('built')
	})

	it('un retour en vol après re-remplissage ne marque pas la nouvelle recette fabriquée', async () => {
		const wrapper = await mountForge({ 430: 30, 193: 100 })
		await craftThroughAnimation(wrapper, () => {
			// Le marché ré-émet le MÊME objet schéma (singleton) pendant l'aller-retour
			emitter.emit('craft', SCHEME)
		})
		// La complétion périmée ne doit ni vider la forge ni afficher le bouton de recraft
		expect(wrapper.findAll('.cell')[8].classes()).not.toContain('built')
		expect(wrapper.findAll('.cell')[0].classes()).toContain('active')
	})

	it("n'envoie qu'une requête même en cliquant plusieurs fois pendant l'animation", async () => {
		const wrapper = await mountForge({ 430: 30, 193: 100 })
		await craftThroughAnimation(wrapper, async () => {
			await wrapper.findAll('.cell')[8].trigger('click')
		})
		expect(leekWarsMock.LeekWars.post).toHaveBeenCalledTimes(1)
	})

	it('ne conclut pas à une fabrication quand le serveur refuse', async () => {
		leekWarsMock.LeekWars.post.mockImplementationOnce(() =>
			Promise.reject({ error: 'no_such_item_or_not_enough_quantity' }))
		const wrapper = await mountForge({ 430: 30, 193: 100 })
		await craftThroughAnimation(wrapper)
		// Pas d'état « fabriqué » : la recette reste affichée, le joueur est prévenu
		expect(wrapper.findAll('.cell')[8].classes()).not.toContain('built')
		expect(wrapper.findAll('.cell')[0].classes()).toContain('active')
		expect(leekWarsMock.LeekWars.toast).toHaveBeenCalled()
	})

	// Scénario du rapport #4886 : ressources pour un seul exemplaire, on fabrique, puis le
	// bouton de recraft refait apparaître la recette — elle doit montrer ses manques et
	// refuser le craft au lieu de rejouer l'animation dans le vide.
	it("le recraft sans ressources montre les manques au lieu de rejouer l'animation", async () => {
		const wrapper = await mountForge({ 430: 30, 193: 60 }) // de quoi fabriquer une seule fois
		const craftCell = () => wrapper.findAll('.cell')[8]
		await craftThroughAnimation(wrapper, () => {
			// Le serveur a consommé les ingrédients (le vrai store le ferait via les commits)
			delete inventory.owned[430]
			delete inventory.owned[193]
		})
		expect(craftCell().classes()).toContain('built')
		// Recraft : la recette réapparaît avec ses manques, hors d'état de fabriquer
		await craftCell().trigger('click')
		expect(wrapper.findAll('.cell')[0].classes()).toContain('missing')
		expect(craftCell().classes()).toContain('impossible')
		await craftCell().trigger('click')
		expect(leekWarsMock.LeekWars.post).toHaveBeenCalledTimes(1)
	})
})
