import { describe, it, expect, vi, afterEach } from 'vitest'
import { enableAutoUnmount, flushPromises } from '@vue/test-utils'
import { mountComponent } from '@/test/harness'
import { createTestVuetify } from '@/test/vuetify'

// La palette grise les altérations qui ne rentrent plus dans la capacité de la pièce posée.
// Le cas du forum : un ressort en élinvar (1 PM natif, capacité 129) ramené à 34 de
// charge. Si la casse a emporté son PM, le remettre ne coûte que le quart de sa puissance et
// doit rester possible ; s'il l'a encore, un second PM (100 de charge) ne rentre plus.

const leekWarsMock = vi.hoisted(() => ({
	LeekWars: {
		alterations: {
			alterations: {
				10: { id: 10, name: 'vitamin_b5', carac: 'mp', family: 1, number: 46, template: 539 },
				22: { id: 22, name: 'magnalium', carac: 'mp', family: 2, number: 38, template: 551 },
				34: { id: 34, name: 'servomotor', carac: 'mp', family: 3, number: 31, template: 563 },
			},
			// Le ressort en élinvar est PHYSIQUE : seul l'alliage y pose un PM.
			component_families: { 10: 2 },
			efficiency: { 1: { 1: 1, 2: 0.2, 3: 0.04 }, 2: { 1: 0.04, 2: 1, 3: 0.2 }, 3: { 1: 0.2, 2: 0.04, 3: 1 } },
			weights: { life: 1, mp: 100 },
			gains: { life: [50, 10, 2], mp: [1, 1, 1] },
			well_coefficient: 0.2,
			max_items: 8,
		},
		items: {},
		characteristics: ['life', 'mp'],
		componentCapacity: () => 129,
	},
}))
vi.mock('@/model/leekwars', () => leekWarsMock)
vi.mock('@/model/store', () => ({ store: { state: { farmer: { alterations: [] } } } }))
vi.mock('@/model/emitter', async () => {
	const { default: mitt } = await import('mitt')
	return { emitter: mitt() }
})
// __esModule : sans ce marqueur, defineAsyncComponent prend l'espace de noms du mock pour le
// composant lui-même au lieu de son export default (cf. forge.test.ts).
vi.mock('@/component/rich-tooltip/rich-tooltip-item.vue', () => ({
	__esModule: true,
	default: { name: 'RichTooltipItem', props: ['item', 'inventory', 'bottom', 'pin'], template: '<div><slot :props="{}" /></div>' },
}))
vi.mock('@/component/alteration/alteration-icon.vue', () => ({
	__esModule: true,
	default: { name: 'AlterationIcon', props: ['template', 'title'], template: '<i />' },
}))

import AlterationPalette from '@/component/forge/alteration-palette.vue'
import { emitter } from '@/model/emitter'
import { forgeComponent, forgeProjected } from '@/model/forge-state'

const vuetify = createTestVuetify()

enableAutoUnmount(afterEach)

// Pose le ressort en élinvar avec ces écarts et rend la case de l'alliage de PM, la seule des
// trois familles permise sur un composant physique.
async function magnaliumCell(added: { [carac: string]: number }) {
	forgeComponent.value = { id: 1, component: 10, level: 293, template: 299, stats: added, optimal_dose: null }
	forgeProjected.value = added
	const wrapper = mountComponent(AlterationPalette, {}, { leekWars: leekWarsMock.LeekWars, vuetify })
	await flushPromises()
	return wrapper.findAll('.cell')[1]
}

describe('alteration-palette.vue', () => {
	afterEach(() => {
		forgeComponent.value = null
		forgeProjected.value = {}
		emitter.all.clear()
	})

	it('laisse remettre un PM natif perdu, au quart de sa puissance', async () => {
		const added = vi.fn()
		emitter.on('add-alteration', added)
		// 59 de vie et le PM perdu (-25) : 34/129, et 59/129 une fois le PM remis.
		const cell = await magnaliumCell({ life: 59, mp: -1 })
		expect(cell.classes()).not.toContain('over')
		await cell.trigger('click')
		expect(added).toHaveBeenCalledWith(expect.objectContaining({ template: 551 }))
	})

	it('grise un PM de plus quand la pièce a gardé le sien', async () => {
		const added = vi.fn()
		emitter.on('add-alteration', added)
		// 34/129 sans déficit : un PM de plus mènerait à 134/129.
		const cell = await magnaliumCell({ life: 34 })
		expect(cell.classes()).toContain('over')
		await cell.trigger('click')
		expect(added).not.toHaveBeenCalled()
	})
})
