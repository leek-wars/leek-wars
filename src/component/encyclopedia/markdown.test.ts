import { describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountComponent } from '@/test/harness'
import Markdown from '@/component/encyclopedia/markdown.vue'

vi.mock('@/model/leekwars', () => ({
	// `chips` est lu à l'import (sorted_chips), `protect` à l'insertion des alias : le reste
	// des champs n'est jamais déréférencé par les contenus testés ici.
	LeekWars: { protect: (s: string) => s, chips: {} },
}))
// DOMPurify sous happy-dom dépouille les <h1> (il les conserve dans un vrai navigateur), ce
// qui masquerait justement la structure titre/citation observée ici : on neutralise la passe
// de sanitisation, hors sujet pour ces tests de placement.
vi.mock('dompurify', () => ({
	default: { sanitize: (html: string) => html, addHook: () => {}, removeHook: () => {} },
}))

async function render(content: string, mode = 'encyclopedia') {
	const wrapper = mountComponent(Markdown, { props: { content, mode } })
	await flushPromises()
	const root = wrapper.element as HTMLElement
	return {
		tags: [...root.children].map(c => c.tagName + (c.className ? '.' + c.className : '')),
		root,
	}
}

describe('markdown encyclopédie', () => {
	// La citation « > Parent » est une métadonnée, masquée via `blockquote.parent-page` ;
	// l'encart d'alias doit se placer après elle, pas entre elle et le titre (rapport forum #12086).
	it('marque la citation du parent et place l’encart d’alias après elle', async () => {
		const { tags } = await render('# FABOUUUUU\n> Communauté\n{{alias:fabou}}\n\nUn membre.')
		expect(tags.slice(0, 3)).toEqual(['H1', 'BLOCKQUOTE.parent-page', 'DIV.aliases-display'])
	})

	it('affiche l’encart d’alias juste après le titre sans page parent', async () => {
		const { tags } = await render('# FABOUUUUU\n\n{{alias:fabou}}\n\nUn membre.')
		expect(tags.slice(0, 2)).toEqual(['H1', 'DIV.aliases-display'])
	})

	it('ne marque pas les citations d’un message de forum', async () => {
		const { root } = await render('# Mon titre\n> une citation\n\nla suite.', 'forum')
		expect(root.querySelector('blockquote.parent-page')).toBeNull()
	})
})
