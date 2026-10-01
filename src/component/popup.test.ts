import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { mountComponent } from '@/test/harness'
import { createTestVuetify } from '@/test/vuetify'
import Popup from '@/component/popup.vue'

// Le bandeau d'actions d'une popup suit le slot #actions que l'appelant fournit ou retire en cours
// de route (<template v-if="…" #actions>). useSlots() n'est pas réactif : lu dans un computed, il
// figeait le bandeau dans l'état de la première ouverture. Le dialogue de capital, ouvert à 0 point
// puis rouvert après une potion de restat, n'avait plus son bouton « Valider » (topic forum 12197).

vi.mock('@/model/leekwars', () => ({ LeekWars: { mobile: false } }))

const vuetify = createTestVuetify()
enableAutoUnmount(afterEach)

const open = ref(false)
const withActions = ref(false)

const Host = defineComponent({
	components: { popup: Popup },
	setup: () => ({ open, withActions }),
	template: `
		<popup v-model="open">
			<div class="body">contenu</div>
			<template v-if="withActions" #actions>
				<div class="action green">valider</div>
			</template>
		</popup>`,
})

/** Le dialogue est TÉLÉPORTÉ hors du composant : on le cherche dans le document. */
const dialog = () => document.body.querySelector('.v-overlay-container .popup')

/** Affichées : le bouton est dans le bandeau. Absentes : pas de bandeau du tout, même vide. */
function expectActions(shown: boolean) {
	if (shown) {
		expect(dialog()!.querySelector('.actions .action.green')).not.toBeNull()
	} else {
		expect(dialog()!.querySelector('.actions')).toBeNull()
	}
}

async function mountHost(actions: boolean) {
	open.value = false
	withActions.value = actions
	mountComponent(Host, {}, { vuetify })
	open.value = true
	await flushPromises()
	expect(dialog()?.querySelector('.body'), 'la popup doit être ouverte').not.toBeNull()
	expectActions(actions)
}

describe('popup.vue — slot #actions conditionnel', () => {
	it('rouverte avec des actions apparues entre-temps, elle affiche leurs boutons', async () => {
		await mountHost(false)
		open.value = false
		await flushPromises()
		withActions.value = true
		open.value = true
		await flushPromises()
		expectActions(true)
	})

	it('ouverte, elle affiche les actions dès qu\'elles apparaissent', async () => {
		await mountHost(false)
		withActions.value = true
		await flushPromises()
		expectActions(true)
	})

	it('quand les actions disparaissent, elle ne garde pas de bandeau vide', async () => {
		await mountHost(true)
		withActions.value = false
		await flushPromises()
		expectActions(false)
	})
})
