import { describe, it, expect, beforeEach, vi } from 'vitest'

// chat-format.ts orchestre protect/linkify (LeekWars), formatEmojis et Commands.execute.
// On mocke ces dépendances par des fonctions contrôlables (vi.hoisted) pour tester
// la LOGIQUE propre de chat-format : masquage des spans de code (#3945/#2712), du
// LaTeX (#11553) et des liens, mentions @, sauts de ligne. Seul le bloc des liens
// branche le vrai linkify, puisque c'est lui qui les pose.
type Linkify = (s: string, wrap?: (link: string) => string) => string
const h = vi.hoisted(() => ({
	protect: (s: string) => s,
	linkify: ((s: string) => s) as Linkify,
	formatEmojis: (s: string) => s,
	execute: (s: string) => s,
}))

vi.mock('@/model/leekwars', () => ({
	LeekWars: {
		protect: (s: string) => h.protect(s),
		linkify: (s: string, wrap?: (link: string) => string) => h.linkify(s, wrap),
	},
}))
vi.mock('@/model/emojis', () => ({ formatEmojis: (s: string) => h.formatEmojis(s) }))
vi.mock('@/model/commands', () => ({ Commands: { execute: (s: string) => h.execute(s) } }))

import { formatChatMessage, formatChatPreview, markupChatCodeLatex } from '@/model/chat-format'
import { CODE_MARK, IMAGE_MARK, LATEX_MARK, LINK_MARK } from '@/model/chat-sentinels'
import { linkify } from '@/model/linkify'

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
	it('un pseudo accentué se mentionne entier', () => {
		const known = { 'Benoît': {}, 'Élodie': {}, 'Weißbier': {} }
		expect(formatChatMessage('salut @Benoît', 'Bob', known)).toBe("salut <span class='pseudo'>Benoît</span>")
		expect(formatChatMessage('@Élodie, @Weißbier.', 'Bob', known))
			.toBe("<span class='pseudo'>Élodie</span>, <span class='pseudo'>Weißbier</span>.")
	})
	it('l\'espace insécable qui suit une mention complétée n\'est pas au pseudo', () => {
		expect(formatChatMessage('@Benoît\u00A0!', 'Bob', { 'Benoît': {} })).toBe("<span class='pseudo'>Benoît</span>\u00A0!")
	})
	it('un idéogramme collé au pseudo n\'en fait pas partie', () => {
		expect(formatChatMessage('@Pilow你好', 'Bob', { Pilow: {} })).toBe("<span class='pseudo'>Pilow</span>你好")
	})
	it('un pseudo non latin se mentionne', () => {
		const known = { 'Иван': {}, '김철수': {} }
		expect(formatChatMessage('@Иван привет', 'Bob', known)).toBe("<span class='pseudo'>Иван</span> привет")
		expect(formatChatMessage('@김철수 안녕', 'Bob', known)).toBe("<span class='pseudo'>김철수</span> 안녕")
	})
	it('collé au mot suivant en chinois ou à la particule en coréen', () => {
		const known = { '李明': {}, '김철수': {} }
		expect(formatChatMessage('@李明你好', 'Bob', known)).toBe("<span class='pseudo'>李明</span>你好")
		expect(formatChatMessage('@김철수님 안녕', 'Bob', known)).toBe("<span class='pseudo'>김철수</span>님 안녕")
	})
	it('le plus long pseudo connu l\'emporte', () => {
		expect(formatChatMessage('@李明华你好', 'Bob', { '李明': {}, '李明华': {} })).toBe("<span class='pseudo'>李明华</span>你好")
	})
	it('ailleurs, une lettre collée empêche la mention', () => {
		expect(formatChatMessage('@Pilowtest', 'Bob', { Pilow: {} })).toBe('@Pilowtest')
		expect(formatChatMessage('@Ивану', 'Bob', { 'Иван': {} })).toBe('@Ивану')
	})
	it('pas de coupure avant un signe combinant ni un allongement', () => {
		expect(formatChatMessage('@ทดสี', 'Bob', { 'ทดส': {} })).toBe('@ทดสี')
		expect(formatChatMessage('@カタカナー', 'Bob', { 'カタカナ': {} })).toBe('@カタカナー')
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

describe('liens posés par linkify', () => {
	// Le vrai linkify : ce qui compte, c'est ce que les étapes suivantes font des liens.
	beforeEach(() => { h.linkify = linkify })
	const lien = (url: string) => "<a target='_blank' rel='noopener' class=\"\" href=\"" + url + '">' + url + '</a>'

	it('une mention dans l\'URL d\'un lien ne réécrit pas le lien', () => {
		expect(formatChatMessage('@bob https://www.youtube.com/@bob', 'Bob', { bob: {} })).toBe(
			"<span class='pseudo'>bob</span> " + lien('https://www.youtube.com/@bob'))
	})
	it('le domaine d\'un e-mail reste dans le mailto, même s\'il est aussi un pseudo', () => {
		expect(formatChatMessage('bob@gmail.com', 'Bob', { gmail: {} })).toBe(
			'<a target="_blank" rel="noopener" href="mailto:bob@gmail.com">bob@gmail.com</a>')
	})
	it('les emojis et les commandes ne touchent pas un lien', () => {
		h.formatEmojis = (s) => s.replace(/:\)/g, '<emoji>')
		h.execute = (s) => s.replace(/\/me/g, 'CMD')
		expect(formatChatMessage('https://example.com/me/(a:) :) /me', 'Bob', {})).toBe(
			lien('https://example.com/me/(a:)') + ' <emoji> CMD')
	})
	it('un segment LaTeX ou de code collé à une URL reste hors du lien', () => {
		expect(formatChatMessage('https://example.com/$x$', 'Bob', {})).toBe(lien('https://example.com/') + '$x$')
		expect(formatChatMessage('https://example.com/`x`', 'Bob', {})).toBe(lien('https://example.com/') + '`x`')
	})
	it('l\'aperçu restitue les liens', () => {
		expect(formatChatPreview('voir https://example.com/a', 'Bob')).toBe('voir ' + lien('https://example.com/a'))
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
	it('les $ dans un bloc de code ne déclenchent pas de LaTeX', () => {
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
	it('rend la sortie de formatChatMessage : un snippet PHP reste du code', () => {
		const stored = formatChatMessage('```php\n$a = $b + 1;\n```', 'Bob', {})
		expect(markupChatCodeLatex(stored)).toBe('<code>php<br>$a = $b + 1;<br></code>')
	})
})

describe('images du chat', () => {
	const hash = 'ab'.repeat(32)
	const url = '/user-image/ab/ab/' + hash + '.webp'

	it('une URL canonique devient une <img>', () => {
		const out = formatChatMessage(url, 'Bob', {})
		expect(out).toBe('<img class="chat-image" src="' + url + '" loading="lazy" decoding="async" alt="">')
	})

	it('l\'image se mêle au texte sans casser le reste du formatage', () => {
		// Le masquage de l'URL ne doit pas soustraire le texte autour aux étapes
		// suivantes : l'emoji juste après l'image est bien passé au formateur.
		h.formatEmojis = (s) => s.replace(':)', '<emoji>')
		const out = formatChatMessage('tiens ' + url + ' :)', 'Bob', {})
		expect(out).toContain('<img class="chat-image"')
		expect(out).toContain('tiens ')
		expect(out).toContain('<emoji>')
	})

	it('l\'URL masquée est opaque aux étapes intermédiaires', () => {
		// Sans la sentinelle, linkify (qui tourne sur du HTML échappé) verrait
		// passer l'URL et en ferait un <a>.
		let vuParLinkify = ''
		h.linkify = (s) => { vuParLinkify = s; return s }
		formatChatMessage(url, 'Bob', {})
		expect(vuParLinkify).not.toContain('user-image')
	})

	it('linkify ne transforme pas l\'URL en <a>', () => {
		// Sans le masquage AVANT linkify, l'URL deviendrait un lien et l'image ne
		// s'afficherait jamais.
		expect(formatChatMessage(url, 'Bob', {})).not.toContain('<a ')
	})

	it('le chemin doit dériver du hash, sinon l\'URL reste du texte', () => {
		// Une seule URL par image : une image atteignable par plusieurs URLs serait
		// mise en cache plusieurs fois.
		const bad = '/user-image/00/00/' + hash + '.webp'
		expect(formatChatMessage(bad, 'Bob', {})).not.toContain('<img')
	})

	it('seule la forme canonique est rendue en image', () => {
		const autres = [
			'/user-image/ab/ab/' + hash + '.png',
			'/user-image/ab/ab/' + hash.toUpperCase() + '.webp',
			'/user-image/ab/ab/' + hash.substring(0, 63) + '.webp',
			'/image/' + hash + '.webp',
		]
		for (const autre of autres) {
			expect(formatChatMessage(autre, 'Bob', {})).not.toContain('<img')
		}
	})

	it('une URL dans un bloc de code reste du code', () => {
		const out = formatChatMessage('`' + url + '`', 'Bob', {})
		expect(out).not.toContain('<img')
		expect(out).toContain(url)
	})

	it('l\'aperçu affiche un pictogramme, pas l\'image', () => {
		// Liste de conversations et toasts sont des lignes uniques : une <img> y
		// casserait la mise en page.
		expect(formatChatPreview('regarde ' + url, 'Bob')).toBe('regarde 🖼️')
	})
})

describe('les sentinelles saisies par l\'utilisateur sont neutralisées', () => {
	const hash = 'ab'.repeat(32)
	const url = '/user-image/ab/ab/' + hash + '.webp'

	it('une sentinelle saisie est neutralisée', () => {
		const out = formatChatMessage(url + ' ' + IMAGE_MARK + '0' + IMAGE_MARK, 'Bob', {})
		expect(out.match(/<img/g)).toHaveLength(1)
		expect(out).not.toContain(IMAGE_MARK)
	})

	it('aucune sentinelle ne subsiste dans la sortie', () => {
		const out = formatChatMessage('a' + CODE_MARK + 'b' + LATEX_MARK + 'c' + IMAGE_MARK + 'd' + LINK_MARK + 'e', 'Bob', {})
		for (const mark of [CODE_MARK, LATEX_MARK, IMAGE_MARK, LINK_MARK]) { expect(out).not.toContain(mark) }
	})

	it('l\'aperçu est protégé de la même façon', () => {
		const out = formatChatPreview(IMAGE_MARK + '0' + IMAGE_MARK, 'Bob')
		expect(out).not.toContain(IMAGE_MARK)
		expect(out).not.toContain('<img')
	})
})
