import { describe, expect, it, vi } from 'vitest'
import { mountComponent } from '@/test/harness'
import CodeTabs from '@/component/encyclopedia/code-tabs.vue'
import { docLanguage, setDocLanguage } from '@/model/doc-language'

// createCodeArea passe par le coloriseur Monaco (chargé à la demande, inutile ici) : on
// observe juste QU'IL est appelé, avec le bon code et le bon langage.
const createCodeArea = vi.fn()
vi.mock('@/model/leekwars', () => ({ LeekWars: { createCodeArea: (...a: unknown[]) => createCodeArea(...a) } }))
vi.mock('@/component/editor/code-theme', () => ({ resolveCodeThemeClass: () => 'theme-light' }))

const BLOCKS = [
	{ language: 'leekscript' as const, code: 'getLife()' },
	{ language: 'javascript' as const, code: 'entity.life' },
	{ language: 'python' as const, code: 'entity.life' },
]

function mountTabs(blocks = BLOCKS) {
	createCodeArea.mockClear()
	return mountComponent(CodeTabs, { props: { blocks } })
}

describe('code-tabs', () => {
	it('affiche un onglet par langage', () => {
		const wrapper = mountTabs()
		expect(wrapper.findAll('.code-tab')).toHaveLength(3)
	})

	it('affiche le bloc du langage global sélectionné', async () => {
		setDocLanguage('python')
		const wrapper = mountTabs()
		await wrapper.vm.$nextTick()
		expect(wrapper.find('.code-tab.active').text()).toContain('Python')
		expect(createCodeArea).toHaveBeenCalledWith('entity.life', expect.anything(), 'python')
	})

	it('change l’état GLOBAL quand on clique un onglet', async () => {
		setDocLanguage('leekscript')
		const wrapper = mountTabs()
		await wrapper.findAll('.code-tab')[2].trigger('click')
		// Tout l'intérêt : basculer ici bascule aussi les autres blocs et les autres pages.
		expect(docLanguage.value).toBe('python')
	})

	it('retombe sur le premier onglet quand le langage global est absent du bloc', async () => {
		setDocLanguage('python')
		const wrapper = mountTabs([BLOCKS[0], BLOCKS[1]])
		await wrapper.vm.$nextTick()
		// Le lecteur en Python garde sa préférence pour la suite, mais voit quand même
		// quelque chose sur un exemple qui n'a pas de version Python.
		expect(wrapper.find('.code-tab.active').text()).toContain('LeekScript')
		expect(docLanguage.value).toBe('python')
	})

	it('affiche le bloc JavaScript à un lecteur en TypeScript', async () => {
		// Même API objet, même runtime : dupliquer chaque exemple en trois n'aurait pas de sens.
		setDocLanguage('typescript')
		const wrapper = mountTabs([BLOCKS[0], BLOCKS[1]])
		await wrapper.vm.$nextTick()
		expect(wrapper.find('.code-tab.active').text()).toContain('JavaScript')
	})
})
