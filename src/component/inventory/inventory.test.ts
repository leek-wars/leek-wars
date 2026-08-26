import { describe, it, expect, vi } from 'vitest'
import { mountComponent } from '@/test/harness'
import { createTestVuetify } from '@/test/vuetify'

// inventory.vue déréférence LeekWars.items[item.template] partout (bordure de rareté, image,
// tri, groupes, total). Un objet dont le template manque aux game data — ressource de saison
// tout juste droppée, cache client pas encore rafraîchi — faisait planter la page entière
// (#4503 : « Cannot read properties of undefined (reading 'rarity') »).

const leekWarsMock = vi.hoisted(() => ({
	LeekWars: {
		items: { 390: { id: 390, name: 'feather', type: 7, price: 1120530, level: 1, rarity: 4 } },
		schemes: {},
		mobile: false,
		christmasPresents: false,
		footer: true,
		box: false,
		setTitle: () => undefined,
		setSubTitle: () => undefined,
		setActions: () => undefined,
		formatNumber: (n: number) => String(n),
	},
}))
vi.mock('@/model/leekwars', () => leekWarsMock)

const storeMock = vi.hoisted(() => ({ store: { state: { farmer: null as unknown } } }))
vi.mock('@/model/store', () => storeMock)
vi.mock('@/model/emitter', () => ({ emitter: { on: () => undefined, off: () => undefined } }))

import Inventory from '@/component/inventory/inventory.vue'

const farmer = (resources: object[]) => ({
	weapons: [], chips: [], potions: [], hats: [], pomps: [], components: [], schemes: [], fight_packs: [],
	resources, habs: 0, crystals: 0,
})

// Vuetify est installé pour de vrai (cf src/test/vuetify.ts) ; seuls les composants maison
// sont stubbés. `panel` doit rendre ses slots, sinon le contenu de l'inventaire — la partie
// testée — n'est jamais monté.
const STUBS = {
	panel: { template: '<div><slot name="title" /><slot name="actions" /><slot name="content" /></div>' },
	loader: true,
	popup: true,
	'item-preview': true,
	'scheme-image': true,
}

const mountInventory = (resources: object[]) => {
	storeMock.store.state.farmer = farmer(resources)
	return mountComponent(Inventory, {
		global: {
			stubs: STUBS,
			mocks: { $filters: { number: (n: number) => String(n) }, $store: storeMock.store },
		},
	}, { leekWars: leekWarsMock.LeekWars, vuetify: createTestVuetify() })
}

describe('inventory.vue', () => {
	it('affiche les objets dont le template est connu', () => {
		const cells = mountInventory([{ id: 1, template: 390, quantity: 3, time: 100 }]).findAll('.cell')
		expect(cells).toHaveLength(1)
		expect(cells[0].html()).toContain('/image/resource/feather.png')
		expect(cells[0].classes()).toContain('rarity-border-4')
	})

	it('ignore un template inconnu au lieu de planter la page (#4503)', () => {
		// 432 = golden_sand, droppée dès le début de la Canicule mais absente des game data
		// tant qu'elle n'est pas publique côté serveur.
		const w = mountInventory([
			{ id: 1, template: 390, quantity: 3, time: 100 },
			{ id: 2, template: 432, quantity: 10, time: 200 },
		])
		const cells = w.findAll('.cell')
		expect(cells).toHaveLength(1)
		expect(cells[0].html()).toContain('/image/resource/feather.png')
	})

	it('ne plante pas quand tous les templates sont inconnus', () => {
		const w = mountInventory([{ id: 2, template: 432, quantity: 10, time: 200 }])
		expect(w.findAll('.cell')).toHaveLength(0)
	})
})
