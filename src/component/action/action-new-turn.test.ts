import { describe, it, expect } from 'vitest'
import { mountComponent } from '@/test/harness'
import { createTestVuetify } from '@/test/vuetify'
import ActionNewTurn from '@/component/action/action-new-turn.vue'

// action-new-turn : en-tête de tour avec navigation. Numéro = action.params[1] || 1 (défaut 1).
// Émet goToTurn au clic (label -> n, gauche -> n-1, droite -> n+1). Icône gauche désactivée si
// n==1 && !hasErrWarn ; droite désactivée si params[1] === report.duration. Icônes seulement si
// report présent. Nécessite Vuetify (v-icon) + i18n.
const mountTurn = (props: Record<string, unknown>) => mountComponent(ActionNewTurn, { props }, {
	vuetify: createTestVuetify(), messages: { fight: { turn_n: 'Turn {0}' } },
})

describe('action-new-turn.vue', () => {
	it('affiche le numéro de tour et pose l\'id', () => {
		const w = mountTurn({ action: { params: [0, 3] }, report: { duration: 10 }, hasErrWarn: false })
		expect(w.find('.label').text()).toBe('Turn 3')
		expect(w.find('#turn-3').exists()).toBe(true)
		const icons = w.findAll('.v-icon')
		expect(icons[0].classes()).not.toContain('disabled') // 3 != 1
		expect(icons[1].classes()).not.toContain('disabled') // 3 != duration 10
	})

	it('défaut au tour 1 quand params[1] absent', () => {
		const w = mountTurn({ action: { params: [] }, report: { duration: 2 } })
		expect(w.find('.label').text()).toBe('Turn 1')
		expect(w.find('#turn-1').exists()).toBe(true)
	})

	it('icône gauche désactivée au tour 1 sans erreur/avertissement', () => {
		expect(mountTurn({ action: { params: [0, 1] }, report: { duration: 5 }, hasErrWarn: false }).findAll('.v-icon')[0].classes()).toContain('disabled')
	})

	it('icône gauche active au tour 1 s\'il y a erreur/avertissement', () => {
		expect(mountTurn({ action: { params: [0, 1] }, report: { duration: 5 }, hasErrWarn: true }).findAll('.v-icon')[0].classes()).not.toContain('disabled')
	})

	it('icône droite désactivée au dernier tour (params[1] === duration)', () => {
		expect(mountTurn({ action: { params: [0, 5] }, report: { duration: 5 } }).findAll('.v-icon')[1].classes()).toContain('disabled')
	})

	it('aucune icône sans report', () => {
		expect(mountTurn({ action: { params: [0, 3] } }).findAll('.v-icon')).toHaveLength(0)
	})

	it('émet goToTurn au clic sur le label', async () => {
		const w = mountTurn({ action: { params: [0, 3] }, report: { duration: 10 } })
		await w.find('.label').trigger('click')
		expect(w.emitted('goToTurn')).toEqual([[3]])
	})
})
