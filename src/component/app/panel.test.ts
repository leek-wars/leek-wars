import { beforeEach, describe, expect, it } from 'vitest'
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

	it('relit le cran numérique', () => {
		localStorage.setItem('test/panel', '1')
		const w = mountPanel({ states: 3 })
		expect(w.find('.content').exists()).toBe(true)
		expect(w.vm.state).toBe(1)
	})
})
