import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountComponent } from '@/test/harness'
import ResourcePreview from '@/component/market/resource-preview.vue'

// La fiche d'une ressource annonce le stock de l'éleveur. Le cas qui compte est celui de la
// forge : la case d'un ingrédient porte la quantité REQUISE par la recette, pas celle possédée.

const session = vi.hoisted(() => ({ farmer: null as unknown, owned: {} as Record<number, number> }))
vi.mock('@/model/store', () => ({
	store: {
		state: session,
		getters: { item_quantity: (template: number) => session.owned[template] ?? 0 },
	},
}))
vi.mock('@/model/leekwars', () => ({
	// Espace ordinaire là où le vrai formatNumber pose une fine insécable : c'est le
	// groupement par milliers qu'on veut voir passer, pas le caractère choisi.
	LeekWars: { formatNumber: (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') },
}))

const APPLE = 191

const mountPreview = (resource?: unknown) => mountComponent(ResourcePreview,
	{ props: { resource } },
	{ messages: { main: { owned_quantity: 'Quantité possédée' } }, locale: 'fr' })

describe('resource-preview.vue', () => {
	beforeEach(() => {
		session.farmer = { id: 1 }
		session.owned = {}
	})

	it('affiche le stock de l\'éleveur, formaté', () => {
		session.owned[APPLE] = 76564
		expect(mountPreview({ id: APPLE }).text()).toContain('Quantité possédée : 76 564')
	})

	// Zéro est justement la réponse cherchée devant une recette impossible : on l'affiche.
	it('affiche zéro plutôt que rien quand l\'éleveur n\'en a aucune', () => {
		expect(mountPreview({ id: APPLE }).text()).toContain('Quantité possédée : 0')
	})

	// Un visiteur déconnecté n'a pas d'inventaire : lui annoncer 0 serait un mensonge.
	it('ne rend rien pour un visiteur déconnecté', () => {
		session.farmer = null
		session.owned[APPLE] = 12
		expect(mountPreview({ id: APPLE }).find('.stats').exists()).toBe(false)
	})

	it('ne rend rien sans ressource', () => {
		expect(mountPreview(undefined).find('.stats').exists()).toBe(false)
	})
})
