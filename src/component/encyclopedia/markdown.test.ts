import { describe, expect, it, vi } from 'vitest'
import { mountComponent } from '@/test/harness'
import Markdown from '@/component/encyclopedia/markdown.vue'

vi.mock('@/component/editor/code-theme', () => ({ resolveCodeThemeClass: () => 'theme-light' }))
vi.mock('@/model/leekwars', () => ({
	LeekWars: {
		protect: (s: string) => s,
		createCodeArea: () => {},
		createCodeAreaSimple: () => {},
		encyclopedia: {},
		chips: {},
		weaponByName: {},
		potionByName: {},
		items: {},
	},
}))
// DOMPurify sous jsdom dépouille les <h1> (il les conserve dans un vrai navigateur), ce qui
// masquerait justement la structure titre/citation observée ici : on neutralise la passe de
// sanitisation, hors sujet pour ces tests de placement.
vi.mock('dompurify', () => ({
	default: { sanitize: (html: string) => html, addHook: () => {}, removeHook: () => {} },
}))

async function render(content: string) {
	const wrapper = mountComponent(Markdown, { props: { content, mode: 'encyclopedia' } }, { locale: 'fr' })
	await wrapper.vm.$nextTick()
	await wrapper.vm.$nextTick()
	return [...(wrapper.element as HTMLElement).children].map(c => c.tagName + (c.className ? '.' + c.className : ''))
}

describe('markdown encyclopédie', () => {
	// La citation « > Parent » est masquée par la règle CSS `h1:first-child + blockquote` :
	// tout ce qui s'insère entre les deux la fait réapparaître (rapport forum #12086).
	it('garde la citation du parent collée au titre quand la page a un alias', async () => {
		const tags = await render('# FABOUUUUU\n> Communauté\n{{alias:fabou}}\n\nUn membre.')
		expect(tags.slice(0, 3)).toEqual(['H1', 'BLOCKQUOTE', 'DIV.aliases-display'])
	})

	it('affiche l’encart d’alias juste après le titre sans page parent', async () => {
		const tags = await render('# FABOUUUUU\n\n{{alias:fabou}}\n\nUn membre.')
		expect(tags.slice(0, 2)).toEqual(['H1', 'DIV.aliases-display'])
	})
})
