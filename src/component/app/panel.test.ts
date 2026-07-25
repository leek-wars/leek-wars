import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, onMounted } from 'vue'
import { mountComponent } from '@/test/harness'
import Panel from '@/component/app/panel.vue'

/**
 * Le panneau est partagé par une vingtaine d'écrans et persiste son état chez le joueur :
 * un changement de format de stockage rouvrirait des panneaux que chacun avait repliés.
 * Ces tests verrouillent les deux modes et la compatibilité de l'ancien format (#622).
 */
const mountPanel = (props: Record<string, unknown> = {}) =>
	mountComponent(Panel, { props: { title: 'Titre', toggle: 'test/panel', ...props } },
		{ messages: {}, leekWars: {} })

/** Le bouton de repli est le dernier bouton des actions de l'en-tête. */
const toggle = (w: ReturnType<typeof mountPanel>) => w.find('.button.expand')

describe('panel.vue', () => {
	beforeEach(() => localStorage.clear())

	it('deux crans par défaut : ouvert, replié, ouvert', async () => {
		const w = mountPanel()
		expect(w.find('.content').exists()).toBe(true)

		await toggle(w).trigger('click')
		expect(w.find('.content').exists()).toBe(false)
		// Format booléen historique conservé : les autres écrans relisent cette clé.
		expect(localStorage.getItem('test/panel')).toBe('false')

		await toggle(w).trigger('click')
		expect(w.find('.content').exists()).toBe(true)
		expect(localStorage.getItem('test/panel')).toBe('true')
	})

	it('trois crans : replié, mi-hauteur, plein, en boucle', async () => {
		const w = mountPanel({ states: 3 })
		const states: number[] = []
		for (let i = 0; i < 4; i++) {
			await toggle(w).trigger('click')
			states.push(w.emitted('update:state')!.at(-1)![0] as number)
		}
		// Depuis le plein : replié, mi-hauteur, plein, puis on reboucle.
		expect(states).toEqual([0, 1, 2, 0])
	})

	it('trois crans : le contenu disparaît seulement au cran replié', async () => {
		const w = mountPanel({ states: 3 })
		await toggle(w).trigger('click') // replié
		expect(w.find('.content').exists()).toBe(false)
		await toggle(w).trigger('click') // mi-hauteur
		expect(w.find('.content').exists()).toBe(true)
		await toggle(w).trigger('click') // plein
		expect(w.find('.content').exists()).toBe(true)
	})

	it('relit l\'ancien format booléen', () => {
		localStorage.setItem('test/panel', 'false')
		expect(mountPanel({ states: 3 }).find('.content').exists()).toBe(false)

		localStorage.setItem('test/panel', 'true')
		expect(mountPanel({ states: 3 }).find('.content').exists()).toBe(true)
	})

	// L'inventaire ouvre l'atelier au clic sur un composant puis REJOUE l'evenement au
	// nextTick, parce que le panneau demonte son contenu quand il est replie : la forge
	// n'existe pas encore au moment du clic. Ce test verrouille l'ordonnancement dont
	// depend ce rejeu, sinon le panneau s'ouvrirait sur une forge vide (#622).
	it('monte le contenu avant le nextTick qui suit l\'ouverture', async () => {
		let mountedAt = 0
		let tick = 0
		const child = defineComponent({
			setup() {
				onMounted(() => { mountedAt = ++tick })
				return () => h('div', 'contenu')
			},
		})
		localStorage.setItem('test/panel', 'false')
		const w = mountComponent(Panel,
			{ props: { title: 'Titre', toggle: 'test/panel' }, slots: { content: () => h(child) } },
			{ messages: {}, leekWars: {} })
		expect(mountedAt).toBe(0)

		await toggle(w).trigger('click')
		const replayedAt = ++tick
		expect(mountedAt).toBeGreaterThan(0)
		expect(mountedAt).toBeLessThan(replayedAt)
		await nextTick()
	})

	it('relit le cran numérique', async () => {
		localStorage.setItem('test/panel', '1')
		const w = mountPanel({ states: 3 })
		expect(w.find('.content').exists()).toBe(true)
		// Le cran relu est bien 1 (mi-hauteur) et non 2 : le clic suivant ouvre en grand.
		await toggle(w).trigger('click')
		expect(w.emitted('update:state')!.at(-1)![0]).toBe(2)
	})
})
