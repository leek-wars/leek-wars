import { describe, it, expect, beforeEach, vi } from 'vitest'

// emojis.ts importe LeekWars (graphe lourd) uniquement pour le flag `nativeEmojis`
// (et `protect` pour formatEmojisText). On mocke ces deux points pour un test hermétique.
// On utilise vi.hoisted pour pouvoir basculer nativeEmojis par test.
const h = vi.hoisted(() => ({ nativeEmojis: false }))

vi.mock('@/model/leekwars', () => ({
	LeekWars: {
		get nativeEmojis() { return h.nativeEmojis },
		protect: (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
	},
}))

import { formatEmojis, formatEmojisText, applyEmojis } from '@/model/emojis'

beforeEach(() => { h.nativeEmojis = false })

// Construit un sous-arbre DOM, applique applyEmojis, renvoie la racine pour inspection.
function render(html: string): HTMLElement {
	const root = document.createElement('div')
	root.innerHTML = html
	applyEmojis(root)
	return root
}

describe('formatEmojis - entrées non-textuelles', () => {
	it('chaîne vide → vide', () => expect(formatEmojis('')).toBe(''))
	it('null/undefined → vide', () => {
		expect(formatEmojis(null)).toBe('')
		expect(formatEmojis(undefined)).toBe('')
	})
	it('nombre → sa représentation texte', () => expect(formatEmojis(42)).toBe('42'))
})

describe('formatEmojis - smileys custom', () => {
	it('remplace un smiley en début de chaîne', () => {
		const out = formatEmojis(':)')
		expect(out).toContain('image="smile"')
		expect(out).toContain('alt=":)"')
		expect(out).toContain('src="/image/emoji/smile.png"')
	})
	it('ne remplace pas un smiley collé à un mot (règle de frontière)', () => {
		expect(formatEmojis('hi:)')).toBe('hi:)')
	})
	it('remplace un smiley précédé d\'un espace', () => {
		const out = formatEmojis('hi :)')
		expect(out.startsWith('hi ')).toBe(true)
		expect(out).toContain('image="smile"')
	})
	it('remplace un smiley "mot" comme (lama)', () => {
		expect(formatEmojis('(lama)')).toContain('image="lama"')
	})
	it('le coeur attend la forme HTML-échappée &lt;3', () => {
		expect(formatEmojis('&lt;3')).toContain('image="heart"')
	})
})

describe('formatEmojis - emojis unicode', () => {
	it('entoure un emoji unicode quand nativeEmojis=false', () => {
		expect(formatEmojis('😀')).toBe("<span class='emoji emoji-font'>😀</span>")
	})
	it('laisse l\'emoji intact quand nativeEmojis=true', () => {
		h.nativeEmojis = true
		expect(formatEmojis('😀')).toBe('😀')
	})
})

describe('formatEmojisText', () => {
	it('null/undefined → vide', () => {
		expect(formatEmojisText(null)).toBe('')
		expect(formatEmojisText(undefined)).toBe('')
	})
	it('échappe le HTML avant emojis : <3 → &lt;3 → coeur', () => {
		expect(formatEmojisText('<3')).toContain('image="heart"')
	})
})

describe('applyEmojis - sur un DOM rendu', () => {
	it('convertit un smiley dans un paragraphe', () => {
		const root = render('<p>salut :)</p>')
		const img = root.querySelector('img.emoji')
		expect(img).not.toBeNull()
		expect(img!.getAttribute('image')).toBe('smile')
		expect(root.querySelector('p')!.textContent!.startsWith('salut ')).toBe(true)
	})

	it('convertit un smiley imbriqué dans une balise inline', () => {
		const root = render('<p>coucou <b>:D</b></p>')
		expect(root.querySelector('b img.emoji')!.getAttribute('image')).toBe('grinning')
	})

	it('convertit plusieurs smileys différents dans le même texte', () => {
		const root = render('<p>:) et :(</p>')
		const imgs = root.querySelectorAll('img.emoji')
		expect(imgs).toHaveLength(2)
		expect(imgs[0].getAttribute('image')).toBe('smile')
		expect(imgs[1].getAttribute('image')).toBe('frowning')
	})

	it('convertit <3 en coeur (markdown produit l\'entité &lt;3 dans le HTML)', () => {
		const root = render('<p>je t\'aime &lt;3</p>')
		expect(root.querySelector('img.emoji')!.getAttribute('image')).toBe('heart')
	})

	it('convertit un emoji unicode (nativeEmojis=false)', () => {
		const root = render('<p>hello 😀</p>')
		expect(root.querySelector('span.emoji.emoji-font')!.textContent).toBe('😀')
	})

	// --- Conflits : ce qui NE doit PAS être converti ---

	it('ne touche pas au contenu d\'un <code> inline', () => {
		const root = render('<p>voir <code>a :) b</code></p>')
		expect(root.querySelectorAll('img.emoji')).toHaveLength(0)
		expect(root.querySelector('code')!.textContent).toBe('a :) b')
	})

	it('ne touche pas au contenu d\'un bloc <pre><code>', () => {
		const root = render('<pre><code>if (x) return :) // :D</code></pre>')
		expect(root.querySelectorAll('img.emoji')).toHaveLength(0)
		expect(root.querySelector('code')!.textContent).toBe('if (x) return :) // :D')
	})

	it('ne touche pas au texte d\'un lien <a> (protège les URL)', () => {
		const root = render('<a href="x">clique :)</a>')
		expect(root.querySelectorAll('img.emoji')).toHaveLength(0)
		expect(root.querySelector('a')!.textContent).toBe('clique :)')
	})

	it('ne convertit pas le :/ d\'une URL en texte brut (règle de frontière)', () => {
		const root = render('<p>https://leekwars.com</p>')
		expect(root.querySelectorAll('img.emoji')).toHaveLength(0)
		expect(root.querySelector('p')!.textContent).toBe('https://leekwars.com')
	})

	it('convertit :/ isolé mais pas celui collé à un mot', () => {
		expect(render('<p>bof :/</p>').querySelector('img.emoji')!.getAttribute('image')).toBe('confused')
		const glued = render('<p>a:/b</p>')
		expect(glued.querySelectorAll('img.emoji')).toHaveLength(0)
		expect(glued.querySelector('p')!.textContent).toBe('a:/b')
	})

	it('laisse un texte sans emoji strictement intact (aucun span/img parasite)', () => {
		const root = render('<p>juste du texte normal</p>')
		expect(root.querySelectorAll('img, span')).toHaveLength(0)
		expect(root.querySelector('p')!.childNodes).toHaveLength(1)
		expect(root.querySelector('p')!.firstChild!.nodeType).toBe(3) // TEXT_NODE
	})

	it('préserve les caractères spéciaux sans smiley (entités &lt; &gt; &amp; du HTML markdown)', () => {
		const root = render('<p>a &lt; b &amp;&amp; c &gt; d</p>')
		expect(root.querySelectorAll('img.emoji')).toHaveLength(0)
		expect(root.querySelector('p')!.textContent).toBe('a < b && c > d')
	})

	it('convertit le smiley d\'un texte contenant aussi des caractères spéciaux', () => {
		const root = render('<p>x &lt; y :)</p>')
		expect(root.querySelector('img.emoji')!.getAttribute('image')).toBe('smile')
		// le "<" reste du texte, pas une balise parasite
		expect(root.querySelector('p')!.textContent).toContain('x < y')
	})
})
