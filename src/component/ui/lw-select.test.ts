import { describe, it, expect } from 'vitest'
import { mountComponent } from '@/test/harness'
import { createTestVuetify } from '@/test/vuetify'
import LWSelect from '@/component/ui/lw-select.vue'

// lw-select remplace v-select (#1101). Ce qui est testé ici est la partie qui
// rend sans ouvrir la liste : la normalisation des items — c'est elle qui décide
// ce que voit l'appelant — et le clavier. Le contenu déroulant passe par
// l'overlay de v-menu, hors de portée d'un montage jsdom.
const mountSelect = (props: Record<string, unknown>) =>
	mountComponent(LWSelect, { props }, { vuetify: createTestVuetify() })

describe('lw-select.vue', () => {
	it('liste de chaînes : la valeur est son propre libellé', () => {
		const w = mountSelect({ items: ['EUR', 'USD'], modelValue: 'USD' })
		expect(w.find('.lw-select .value').text()).toBe('USD')
	})

	it('liste d\'objets : item-title et item-value sont respectés', () => {
		const w = mountSelect({
			items: [{ id: 1, t: 'Actives' }, { id: 2, t: 'Très actives' }],
			itemValue: 'id',
			itemTitle: 't',
			modelValue: 2,
		})
		expect(w.find('.lw-select .value').text()).toBe('Très actives')
	})

	it('valeur absente des items : aucun libellé, pas de plantage', () => {
		const w = mountSelect({ items: ['EUR'], modelValue: 'GBP' })
		expect(w.find('.lw-select .value').text()).toBe('')
	})

	it('libellé affiché quand il est fourni', () => {
		const w = mountSelect({ items: ['a'], modelValue: 'a', label: 'Activité' })
		expect(w.find('.lw-select .label').text()).toBe('Activité')
	})

	it('sans libellé, pas de ligne de libellé', () => {
		expect(mountSelect({ items: ['a'], modelValue: 'a' }).find('.label').exists()).toBe(false)
	})

	// Comportement d'un select natif : les flèches changent de valeur sans ouvrir.
	it('flèche bas : passe à la valeur suivante', async () => {
		const w = mountSelect({ items: ['a', 'b', 'c'], modelValue: 'a' })
		await w.find('.lw-select').trigger('keydown', { key: 'ArrowDown' })
		expect(w.emitted('update:modelValue')![0]).toEqual(['b'])
	})

	it('flèche haut : passe à la valeur précédente', async () => {
		const w = mountSelect({ items: ['a', 'b', 'c'], modelValue: 'c' })
		await w.find('.lw-select').trigger('keydown', { key: 'ArrowUp' })
		expect(w.emitted('update:modelValue')![0]).toEqual(['b'])
	})

	it('flèche bas sur la dernière valeur : rien n\'est émis', async () => {
		const w = mountSelect({ items: ['a', 'b'], modelValue: 'b' })
		await w.find('.lw-select').trigger('keydown', { key: 'ArrowDown' })
		expect(w.emitted('update:modelValue')).toBeUndefined()
	})

	it('désactivé : le clavier ne change rien', async () => {
		const w = mountSelect({ items: ['a', 'b'], modelValue: 'a', disabled: true })
		await w.find('.lw-select').trigger('keydown', { key: 'ArrowDown' })
		expect(w.emitted('update:modelValue')).toBeUndefined()
	})

	it('liste vide : rien n\'est émis et rien ne plante', async () => {
		const w = mountSelect({ items: [], modelValue: null })
		await w.find('.lw-select').trigger('keydown', { key: 'ArrowDown' })
		expect(w.emitted('update:modelValue')).toBeUndefined()
	})
})
