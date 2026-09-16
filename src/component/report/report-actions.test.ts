import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountComponent } from '@/test/harness'
import { createTestVuetify } from '@/test/vuetify'
import { ActionType } from '@/model/action'

// report-actions rend la liste d'actions du rapport. Tout le bloc est cliquable : un clic sur une
// action ouvre le player à cette action (flèche ➡️ au survol, cf. `.fight-actions > div[a]` dans
// global.scss). Les en-têtes de tour portent leurs PROPRES contrôles (label + chevrons < >) qui
// naviguent dans le rapport : ils ne doivent pas ouvrir le player (issue #4714).
// On ne branche que action-new-turn dans la table des composants : le vrai module tire tout le jeu
// d'actions et d'effets, inutile ici.
vi.mock('@/model/action-components', async () => {
	const ActionNewTurn = (await import('@/component/action/action-new-turn.vue')).default
	return { ActionComponents: { [6 /* NEW_TURN */]: ActionNewTurn } }
})
// report-log tire le store (et donc le localStorage/env de l'app) ; on n'affiche pas de log ici.
vi.mock('@/component/report/report-log.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/router', () => ({ default: { push: vi.fn() } }))

// Trois tours, pour que les chevrons de l'en-tête du tour 2 pointent vers des ancres existantes
// (goToTurn cherche l'élément #turn-<n> dans le document, d'où le attachTo).
const TURNS = [1, 2, 3].map((turn) => ({ type: ActionType.NEW_TURN, params: [0, turn], logs: [] }))

const mountReport = async () => {
	const Actions = (await import('@/component/report/report-actions.vue')).default
	return mountComponent(Actions, {
		attachTo: document.body,
		props: {
			fight: { id: 42 },
			report: { duration: 3 },
			actions: TURNS,
			leeks: {},
			displayLogs: false,
			displayAlliesLogs: false,
			hasErrWarn: false,
		},
	}, {
		vuetify: createTestVuetify(), messages: { fight: { turn_n: 'Turn {0}' } },
	})
}

describe('report-actions.vue', () => {
	beforeEach(() => {
		window.scrollTo = vi.fn()
	})

	it('ouvre le player au clic sur le corps de l\'action', async () => {
		const w = await mountReport()
		const push = vi.spyOn(w.vm.$router, 'push').mockResolvedValue(undefined)
		await w.findAll('.turn')[1].trigger('click', { button: 0 })
		expect(push).toHaveBeenCalledWith('/fight/42?action=1')
	})

	it('n\'ouvre pas le player au clic sur les chevrons de navigation', async () => {
		const w = await mountReport()
		const push = vi.spyOn(w.vm.$router, 'push').mockResolvedValue(undefined)
		const icons = w.findAll('.turn')[1].findAll('.v-icon')
		expect(icons).toHaveLength(2)
		for (const icon of icons) {
			await icon.trigger('click', { button: 0 })
		}
		expect(push).not.toHaveBeenCalled()
		expect(window.scrollTo).toHaveBeenCalledTimes(2)
	})

	it('n\'ouvre pas le player au clic sur le label du tour', async () => {
		const w = await mountReport()
		const push = vi.spyOn(w.vm.$router, 'push').mockResolvedValue(undefined)
		await w.findAll('.turn')[1].find('.label').trigger('click', { button: 0 })
		expect(push).not.toHaveBeenCalled()
	})
})
