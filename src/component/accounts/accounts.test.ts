import { describe, expect, it, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountComponent } from '@/test/harness'
import { createTestVuetify } from '@/test/vuetify'
import Accounts from '@/component/accounts/accounts.vue'
import Panel from '@/component/app/panel.vue'
import Popup from '@/component/popup.vue'

// Le dialogue de confirmation de la déliaison vivait dans le slot par DÉFAUT du <panel>, qui ne
// rend que son #content dès qu'on lui en fournit un : le bouton « Délier » basculait bien son
// booléen mais n'ouvrait rien, et rien n'arrivait jamais au serveur (topic forum 12109).
// Ce test monte le panneau pour de vrai et va jusqu'à l'appel d'API.

const posts: Array<{ url: string, form: Record<string, unknown> }> = []

/** Le composant n'appelle jamais que `.then(apply).error(cb)` : on n'imite que ça. */
const fakeRequest = (data: unknown) => ({
	then: (onSuccess: (d: unknown) => void) => { onSuccess(data); return { error: () => { /* jamais d'échec ici */ } } },
})

const ME = { id: 1, name: 'moi', avatar_changed: 0, talent: 0, total_level: 10, leeks: 1, lwplus: false }
const OTHER = { id: 2, name: 'autre', avatar_changed: 0, talent: 0, total_level: 20, leeks: 2, lwplus: false }
const STATE = { player: { id: 7, main: 1 }, accounts: [ME, OTHER], max: 10 }

vi.mock('@/model/leekwars', () => ({
	LeekWars: {
		AVATAR: '/',
		mobile: false, // lu par popup.vue pour la classe de son overlay
		formatNumber: (n: number) => String(n),
		toast: () => { /* noop */ },
		get: () => fakeRequest(STATE),
		post: (url: string, form: Record<string, unknown>) => { posts.push({ url, form }); return fakeRequest(STATE) },
	},
}))

vi.mock('@/model/store', () => ({ store: { state: { accounts: [], farmer: { id: 1 } } } }))

// Pas de messages seedés : accounts.vue traduit via useNamespacedT, qui lit le singleton i18n de
// l'app et pas l'instance du harnais. Les clés sortent donc brutes, et les assertions ci-dessous
// visent des sélecteurs, jamais du texte.
const mountAccounts = () => mountComponent(Accounts, {
	attachTo: document.body,
	global: { components: { panel: Panel, popup: Popup, loader: { template: '<div class="loader" />' } } },
}, { vuetify: createTestVuetify() })

describe('accounts.vue — déliaison', () => {
	beforeEach(() => { posts.length = 0 })

	it('ouvre le dialogue de confirmation et poste la déliaison', async () => {
		const w = mountAccounts()
		await flushPromises()

		// Deux comptes liés : chacun porte un bouton de déliaison.
		const buttons = w.findAll('.account-action.red')
		expect(buttons).toHaveLength(2)

		await buttons[1].trigger('click')
		await flushPromises()

		// Le dialogue est TÉLÉPORTÉ hors du composant : on le cherche dans le document.
		const dialog = document.body.querySelector('.v-overlay-container .popup')
		expect(dialog, 'le dialogue de confirmation doit être rendu').not.toBeNull()
		// La ligne de message n'est rendue que si la cible de la déliaison est bien posée.
		expect(dialog!.querySelector('.unlink-message'), 'le message doit nommer le compte visé').not.toBeNull()

		const confirm = dialog!.querySelector('.actions .action.red')
		expect(confirm, 'le bouton de confirmation doit exister').not.toBeNull()
		confirm!.dispatchEvent(new Event('click', { bubbles: true }))
		await flushPromises()

		expect(posts).toEqual([{ url: 'player/unlink', form: { farmer_id: 2 } }])

		// Laisser le VDialog finir de se fermer avant de démonter : ses callbacks de transition
		// déréférencent l'overlay et lèveraient en pleine sortie.
		await flushPromises()
		w.unmount()
	})
})
