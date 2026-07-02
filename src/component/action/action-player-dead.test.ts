import { describe, it, expect } from 'vitest'
import { mountComponent } from '@/test/harness'
import ActionPlayerDead from '@/component/action/action-player-dead.vue'
import { TEAM_COLORS } from '@/model/team'

// action-player-dead colore la bordure selon l'équipe du TUEUR (params[2]) : TEAM_COLORS[team-1],
// vide si pas de tueur (params.length <= 2) ou si le leek tueur est absent de `leeks`. Le leek
// mort (params[1]) est rendu via le composant enfant action-leek dans <i18n-t>.
const mountDead = (params: number[], leeks: Record<number, unknown>) => mountComponent(ActionPlayerDead, {
	props: { action: { params }, leeks },
}, { messages: { fight: { leek_is_dead: '{leek} is dead' } } })

describe('action-player-dead.vue', () => {
	const leeks = { 7: { team: 1, translatedName: 'A' }, 8: { team: 2, translatedName: 'B' } }

	it('colore par l\'équipe du tueur (team-1 indexé)', () => {
		const style = mountDead([0, 7, 8], leeks).find('.kill').attributes('style') || ''
		expect(style).toContain(TEAM_COLORS[1]) // tueur team 2 -> TEAM_COLORS[1] (#dd0d0d)
	})

	it('équipe différente -> couleur différente (indexation team-1)', () => {
		const s1 = mountDead([0, 7, 8], { 7: { team: 1 }, 8: { team: 1, translatedName: 'B' } }).find('.kill').attributes('style') || ''
		expect(s1).toContain(TEAM_COLORS[0]) // tueur team 1 -> TEAM_COLORS[0] (#0b30ea)
		expect(s1).not.toContain(TEAM_COLORS[1])
	})

	it('pas de tueur (params.length <= 2) -> aucune bordure', () => {
		const style = mountDead([0, 7], leeks).find('.kill').attributes('style') || ''
		expect(style).not.toContain('border-color')
	})

	it('tueur absent de leeks -> aucune bordure', () => {
		const style = mountDead([0, 7, 99], leeks).find('.kill').attributes('style') || ''
		expect(style).not.toContain('border-color')
	})

	it('rend le nom du leek mort (params[1]) via action-leek', () => {
		const w = mountDead([0, 7, 8], leeks)
		expect(w.text()).toContain('A') // leeks[7].translatedName
	})
})
