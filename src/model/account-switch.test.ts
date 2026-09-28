import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'

// Le vrai routeur tire toute l'app : on monte un routeur mémoire et un store réduit à
// l'éleveur actif. La page de test note le compte qu'elle voit à chaque (dé)montage.
vi.mock('@/model/leekwars', async () => {
	const { reactive } = await import('vue')
	return { LeekWars: reactive({ DEV: false, routerViewKey: 0 }) }
})
const account = vi.hoisted(() => ({ id: 1 }))
vi.mock('@/model/store', () => ({
	store: { commit: vi.fn((type: string, data: { farmer: { id: number } }) => { if (type === 'connect') { account.id = data.farmer.id } }) },
}))
const events = vi.hoisted(() => [] as string[])
const navigations = vi.hoisted(() => [] as string[])
// Une page qui retient des modifications non enregistrées refuse d'être rouverte.
const unsaved = vi.hoisted(() => ({ value: false }))
vi.mock('@/router', async () => {
	const { createRouter, createMemoryHistory, onBeforeRouteUpdate } = await import('vue-router')
	const { defineComponent, h, onMounted, onUnmounted } = await import('vue')
	const Page = defineComponent({
		setup() {
			onMounted(() => events.push('mounted ' + account.id))
			onUnmounted(() => events.push('unmounted ' + account.id))
			onBeforeRouteUpdate(() => !unsaved.value)
			return () => h('div')
		},
	})
	const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/market', component: Page }, { path: '/garden/:category/:item', component: Page }] })
	router.beforeEach((to, from) => { navigations.push(from.fullPath + ' → ' + to.fullPath) })
	return { default: router }
})

import { activateAccount } from '@/model/account-switch'
import PageHost from '@/component/app/page-host.vue'
import router from '@/router'
import { store } from '@/model/store'

describe('activateAccount', () => {
	let wrapper: VueWrapper | null = null
	const other = { farmer: { id: 2 }, token: 'jwt' }

	beforeEach(() => {
		account.id = 1
		unsaved.value = false
		vi.mocked(store.commit).mockClear()
	})
	afterEach(() => {
		wrapper?.unmount()
		wrapper = null
	})

	const mountAt = async (path: string) => {
		await router.push(path)
		wrapper = mount(PageHost, { global: { plugins: [router] } })
		await flushPromises()
		events.length = 0
		navigations.length = 0
	}

	it('rouvre la même adresse et recrée la page pour le nouveau compte', async () => {
		await mountAt('/garden/solo/12?tab=2#top')
		await activateAccount(other)
		await flushPromises()
		// La page voit le nouveau compte avant d'être recréée : ses propres réactions au
		// changement (l'accueil abandonne une sauvegarde en attente) ont lieu.
		expect(events).toEqual(['unmounted 2', 'mounted 2'])
		expect(router.currentRoute.value.fullPath).toBe('/garden/solo/12?tab=2#top')
		// La navigation forcée repasse par les gardes globaux (actions de la barre…).
		expect(navigations).toEqual(['/garden/solo/12?tab=2#top → /garden/solo/12?tab=2#top'])
		expect(store.commit).toHaveBeenCalledWith('connect', { farmer: { id: 2 }, token: '$' })
	})

	it('laisse la page que ses gardes retiennent, mais change de compte', async () => {
		await mountAt('/market')
		unsaved.value = true
		await activateAccount(other)
		await flushPromises()
		expect(events).toEqual([])
		expect(store.commit).toHaveBeenCalledWith('connect', { farmer: { id: 2 }, token: '$' })
	})
})
