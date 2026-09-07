import { describe, expect, it, vi } from 'vitest'

// directives.ts importe Code.vue et le sous-app Vue : on ne teste ici que le balisage pur
// des messages de chat (markupChatCodeLatex), les dépendances DOM sont neutralisées.
vi.mock('@/component/app/code.vue', () => ({ default: {} }))
vi.mock('./sub-app', () => ({ createSubApp: () => ({ mount: () => ({}) }) }))
vi.mock('@/model/leekwars', () => ({ LeekWars: { codeLanguageMode: () => undefined } }))

import { markupChatCodeLatex } from '@/model/directives'

describe('markupChatCodeLatex', () => {
	it('un segment $...$ devient <latex>', () => {
		expect(markupChatCodeLatex('voir $x^2$ fin')).toBe('voir <latex>$x^2$</latex> fin')
	})
	it('un bloc ``` devient <code>', () => {
		expect(markupChatCodeLatex('a ```x = 1<br>y = 2``` b')).toBe('a <code>x = 1<br>y = 2</code> b')
	})
	it('un `code` inline devient <code>', () => {
		expect(markupChatCodeLatex('a `x` b')).toBe('a <code>x</code> b')
	})
	it('les $ dans un bloc de code ne déclenchent pas de LaTeX (#5030)', () => {
		expect(markupChatCodeLatex('```$a = 1; $b = 2;```')).toBe('<code>$a = 1; $b = 2;</code>')
		expect(markupChatCodeLatex('`$x` et `$y`')).toBe('<code>$x</code> et <code>$y</code>')
	})
	it('un $ hors code et un $ dans du code ne forment pas un segment LaTeX', () => {
		expect(markupChatCodeLatex('prix $5 puis `$x` fin')).toBe('prix $5 puis <code>$x</code> fin')
	})
	it('pas de LaTeX autour d\'une balise HTML (URL linkifiée)', () => {
		const html = '$<a href="/x">/x</a>$'
		expect(markupChatCodeLatex(html)).toBe(html)
	})
	it('LaTeX et code cohabitent dans un même message', () => {
		expect(markupChatCodeLatex('$a$ `b` $c$')).toBe('<latex>$a$</latex> <code>b</code> <latex>$c$</latex>')
	})
})
