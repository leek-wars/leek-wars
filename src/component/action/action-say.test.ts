import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountComponent } from '@/test/harness'

// action-say importe { store } de @/model/store (graphe app lourd) -> on le mocke. store.state.
// farmer.admin est mutable (vi.hoisted) pour tester la porte admin qui gate l'affichage de la
// valeur glagolitique décodée.
const storeMock = vi.hoisted(() => ({ state: { farmer: { admin: true } as { admin: boolean } } }))
vi.mock('@/model/store', () => ({ store: storeMock }))

import ActionSay from '@/component/action/action-say.vue'

// Logique testée : glagoliticToDecimal SOMME les valeurs des chiffres glagolitiques (Ⰰ=1..Ⱌ=900),
// renvoie null si 0 ou >3 caractères, ou sur tout caractère hors table. Masquage si muted.
// L'affichage " (N)" n'apparaît que si valeur != null ET admin.
const mountSay = (entity: unknown, text: string) => mountComponent(ActionSay, {
	props: { action: { entity, params: [0, text] } },
}, { messages: { fight: { leek_speak: '{leek} : {text} {cost}', n_tp: '{0} TP' } } })

beforeEach(() => { storeMock.state.farmer.admin = true })

describe('action-say.vue', () => {
	it('décode un chiffre glagolitique (admin) : Ⱂ -> 90', () => {
		expect(mountSay({ translatedName: 'Bob' }, 'Ⱂ').text()).toContain('Ⱂ (90)')
	})

	it('SOMME les chiffres (pas de valeur de position) : ⰀⰀ -> 2', () => {
		expect(mountSay({ translatedName: 'Bob' }, 'ⰀⰀ').text()).toContain('ⰀⰀ (2)')
		expect(mountSay({ translatedName: 'Bob' }, 'ⰀⰉ').text()).toContain('ⰀⰉ (11)') // 1 + 10
	})

	it('plus de 3 caractères -> null (pas de parenthèses)', () => {
		expect(mountSay({ translatedName: 'Bob' }, 'ⰀⰀⰀⰀ').text()).not.toContain('(')
	})

	it('caractères hors table -> null', () => {
		expect(mountSay({ translatedName: 'Bob' }, 'hello').text()).not.toContain('(')
	})

	it('leek muté : texte masqué, pas de décodage', () => {
		const t = mountSay({ farmer: { muted: true }, translatedName: 'X' }, 'secret').text()
		expect(t).toContain('@*%#$€')
		expect(t).not.toContain('(')
	})

	it('non-admin : valeur décodée mais masquée par la porte admin', () => {
		storeMock.state.farmer.admin = false
		const t = mountSay({ translatedName: 'Bob' }, 'Ⱂ').text()
		expect(t).toContain('Ⱂ')
		expect(t).not.toContain('(90)')
	})
})
