import { describe, expect, it, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mountComponent } from '@/test/harness'
import { createTestVuetify } from '@/test/vuetify'

// Le dialogue de confirmation de la déliaison vivait dans le slot par DÉFAUT du <panel>, qui ne
// rend que son #content dès qu'on lui en fournit un : le bouton « Délier » basculait bien son
// booléen mais n'ouvrait rien, et rien n'arrivait jamais au serveur (topic forum 12109).
// Ce test monte le panneau pour de vrai et va jusqu'à l'appel d'API.

const posts: Array<{ url: string, form: Record<string, unknown> }> = []

/** Réplique le contrat des requêtes de l'app : un thenable qui porte aussi .error(). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fakeRequest(data: unknown): any {
	const promise = Promise.resolve(data)
	const originalThen = promise.then.bind(promise)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const extended = promise as any
	extended.error = () => promise
	extended.then = (onSuccess: (d: unknown) => void) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const chained = originalThen(onSuccess) as any
		chained.error = () => chained
		return chained
	}
	return extended
}

const ME = { id: 1, name: 'moi', avatar_changed: 0, talent: 0, total_level: 10, leeks: 1, lwplus: false }
const OTHER = { id: 2, name: 'autre', avatar_changed: 0, talent: 0, total_level: 20, leeks: 2, lwplus: false }
const STATE = { player: { id: 7, main: 1 }, accounts: [ME, OTHER], max: 10 }

vi.mock('@/model/leekwars', () => ({
	LeekWars: {
		AVATAR: '/', mobile: false,
		formatNumber: (n: number) => String(n),
		toast: () => { /* noop */ },
		get: () => fakeRequest(STATE),
		post: (url: string, form: Record<string, unknown>) => { posts.push({ url, form }); return fakeRequest(STATE) },
	},
}))

vi.mock('@/model/store', () => ({ store: { state: { accounts: [], farmer: { id: 1 } } } }))

const MESSAGES = { accounts: { title: 'Mes comptes', unlink: 'Délier', unlink_message: 'Retirer {0} ?', cancel: 'Annuler' } }

async function mountAccounts() {
	const [Accounts, Panel, Popup] = await Promise.all([
		import('@/component/accounts/accounts.vue'),
		import('@/component/app/panel.vue'),
		import('@/component/popup.vue'),
	])
	return mountComponent(Accounts.default, {
		attachTo: document.body,
		global: { components: { panel: Panel.default, popup: Popup.default, loader: { template: '<div class="loader" />' } } },
	}, { messages: MESSAGES, vuetify: createTestVuetify() })
}

describe('accounts.vue — déliaison', () => {
	beforeEach(() => { posts.length = 0 })

	it('ouvre le dialogue de confirmation et poste la déliaison', async () => {
		const w = await mountAccounts()
		await nextTick()
		await nextTick()

		// Deux comptes liés : chacun porte un bouton de déliaison.
		const buttons = w.findAll('.account-action.red')
		expect(buttons).toHaveLength(2)

		await buttons[1].trigger('click')
		await nextTick()
		await nextTick()

		// Le dialogue est TÉLÉPORTÉ hors du composant : on le cherche dans le document.
		const dialog = document.body.querySelector('.v-overlay-container .popup')
		expect(dialog, 'le dialogue de confirmation doit être rendu').not.toBeNull()
		// useNamespacedT lit l'instance i18n de l'app, pas celle du harnais : les clés sortent
		// brutes. Voir `unlink_message` suffit — il n'est rendu que si la cible est bien posée.
		expect(dialog!.textContent).toContain('unlink_message')

		const confirm = [...dialog!.querySelectorAll('.actions .action')].find(el => el.classList.contains('red'))
		expect(confirm, 'le bouton de confirmation doit exister').toBeTruthy()
		confirm!.dispatchEvent(new Event('click', { bubbles: true }))
		await nextTick()

		expect(posts).toEqual([{ url: 'player/unlink', form: { farmer_id: 2 } }])

		// Laisser le VDialog finir de se fermer avant de démonter : ses callbacks de transition
		// déréférencent l'overlay et lèveraient en pleine sortie.
		await new Promise(resolve => setTimeout(resolve, 0))
		w.unmount()
		await new Promise(resolve => setTimeout(resolve, 0))
	})
})
