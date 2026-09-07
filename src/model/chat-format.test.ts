import { describe, it, expect, beforeEach, vi } from 'vitest'

// chat-format.ts orchestre protect/linkify (LeekWars), formatEmojis et Commands.execute.
// On mocke ces dépendances par des fonctions contrôlables (vi.hoisted) pour tester
// la LOGIQUE propre de chat-format : masquage des spans de code (#3945/#2712),
// masquage LaTeX (#11553), mentions @, sauts de ligne. Pas les dépendances elles-mêmes.
const h = vi.hoisted(() => ({
	protect: (s: string) => s,
	linkify: (s: string) => s,
	formatEmojis: (s: string) => s,
	execute: (s: string) => s,
}))

vi.mock('@/model/leekwars', () => ({
	LeekWars: {
		protect: (s: string) => h.protect(s),
		linkify: (s: string) => h.linkify(s),
	},
}))
vi.mock('@/model/emojis', () => ({ formatEmojis: (s: string) => h.formatEmojis(s) }))
vi.mock('@/model/commands', () => ({ Commands: { execute: (s: string) => h.execute(s) } }))

import { formatChatMessage, formatChatPreview, markupChatCodeLatex } from '@/model/chat-format'

beforeEach(() => {
	h.protect = (s) => s
	h.linkify = (s) => s
	h.formatEmojis = (s) => s
	h.execute = (s) => s
})

describe('formatChatMessage - cas de base', () => {
	it('contenu vide → vide', () => expect(formatChatMessage('', 'Bob', {})).toBe(''))
	it('les sauts de ligne deviennent <br>', () => {
		expect(formatChatMessage('a\nb', 'Bob', {})).toBe('a<br>b')
	})
})

describe('formatChatMessage - mentions @', () => {
	it('un farmer connu devient un pseudo, un inconnu reste brut', () => {
		const out = formatChatMessage('salut @bob et @carol', 'Bob', { bob: {} })
		expect(out).toContain("<span class='pseudo'>bob</span>")
		expect(out).toContain('@carol')
	})
})

describe('formatChatMessage - spans de code (#3945/#2712)', () => {
	it('protège le contenu du code des emojis et commandes', () => {
		h.formatEmojis = (s) => s.replace(/:\)/g, '😀')
		h.execute = (s) => s.replace(/\/me/g, 'CMD')
		const out = formatChatMessage('hi :) `x :) /me`', 'Bob', {})
		expect(out).toBe('hi 😀 `x :) /me`')
	})
	it('échappe le HTML dans un bloc ``` et conserve les délimiteurs', () => {
		const out = formatChatMessage('a\n```<b>x</b>```', 'Bob', {})
		expect(out).toBe('a<br>```&lt;b&gt;x&lt;/b&gt;```')
	})
	it('un saut de ligne dans un bloc ``` devient <br>', () => {
		expect(formatChatMessage('```a\nb```', 'Bob', {})).toBe('```a<br>b```')
	})
})

describe('formatChatMessage - segments LaTeX (#11553)', () => {
	it('masque $...$ pour qu\'un linkify destructeur ne casse pas le délimiteur', () => {
		h.linkify = (s) => s.replace(/\$/g, '_')
		const out = formatChatMessage('voir $x+1$ fin', 'Bob', {})
		expect(out).toBe('voir $x+1$ fin')
	})
})

describe('formatChatPreview', () => {
	it('contenu vide → vide', () => expect(formatChatPreview('', 'Bob')).toBe(''))
	it('aplati les sauts de ligne en espaces et garde le code échappé', () => {
		expect(formatChatPreview('a\n`<b>`', 'Bob')).toBe('a `&lt;b&gt;`')
	})
})

describe('markupChatCodeLatex (directive v-chat-code-latex)', () => {
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
	it('un segment $...$ n\'enjambe pas un bloc de code, le LaTeX qui suit reste rendu', () => {
		expect(markupChatCodeLatex('prix $5 puis `$x` fin')).toBe('prix $5 puis <code>$x</code> fin')
		expect(markupChatCodeLatex('prix $5 avec `x` et $y^2$')).toBe('prix $5 avec <code>x</code> et <latex>$y^2$</latex>')
	})
	it('pas de LaTeX autour d\'une balise HTML (URL linkifiée) ni sur $$ vide', () => {
		const html = '$<a href="/x">/x</a>$'
		expect(markupChatCodeLatex(html)).toBe(html)
		expect(markupChatCodeLatex('a $$ b')).toBe('a $$ b')
	})
	it('LaTeX et code cohabitent dans un même message', () => {
		expect(markupChatCodeLatex('$a$ `b` $c$')).toBe('<latex>$a$</latex> <code>b</code> <latex>$c$</latex>')
	})
	it('rend la sortie de formatChatMessage : un snippet PHP reste du code', () => {
		const stored = formatChatMessage('```php\n$a = $b + 1;\n```', 'Bob', {})
		expect(markupChatCodeLatex(stored)).toBe('<code>php<br>$a = $b + 1;<br></code>')
	})
})
