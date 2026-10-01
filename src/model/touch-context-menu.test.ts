import { afterEach, describe, expect, it } from 'vitest'
import { shouldPreventContextMenu } from '@/model/touch-context-menu'

// Une URL d'image uploadée valide : les deux premiers octets du chemin doivent
// reprendre le début du hash, c'est ce que vérifie isUserImageUrl.
const HASH = 'ab' + 'cd' + '0'.repeat(60)
const USER_IMAGE = '/user-image/ab/cd/' + HASH + '.webp'

function target(html: string, selector: string): Element {
	document.body.innerHTML = html
	return document.querySelector(selector)!
}

describe('touch-context-menu', () => {

	afterEach(() => {
		document.body.innerHTML = ''
	})

	it('désamorce le menu natif sur une image d\'interface au doigt', () => {
		const img = target('<img src="/image/no_avatar.png">', 'img')
		expect(shouldPreventContextMenu(img, 'touch')).toBe(true)
	})

	it('laisse le clic droit du bureau tranquille', () => {
		const img = target('<img src="/image/no_avatar.png">', 'img')
		expect(shouldPreventContextMenu(img, 'mouse')).toBe(false)
		expect(shouldPreventContextMenu(img, 'pen')).toBe(false)
	})

	it('couvre le <image> d\'un <svg>, dont les avatars des brackets', () => {
		// C'est le cas du rapport : l'avatar d'éleveur d'un bloc de tournoi, rendu
		// en SVG et dont l'appui long ouvre l'infobulle.
		const image = target('<svg><image xlink:href="/avatar/512.png" /></svg>', 'image')
		expect(shouldPreventContextMenu(image, 'touch')).toBe(true)
	})

	it('ne touche pas aux éléments qui ne sont pas des images', () => {
		// Un lien NU garde son menu : au doigt, c'est « ouvrir dans un nouvel onglet ».
		const link = target('<a href="/farmer/512">WhiteSlash</a>', 'a')
		expect(shouldPreventContextMenu(link, 'touch')).toBe(false)
		const input = target('<input value="texte">', 'input')
		expect(shouldPreventContextMenu(input, 'touch')).toBe(false)
	})

	it('désamorce sur un activateur d\'infobulle qui ne mène nulle part', () => {
		const html = '<span class="rich-tooltip-activator">twogether</span>'
		expect(shouldPreventContextMenu(target(html, 'span'), 'touch')).toBe(true)
	})

	it('couvre un descendant de l\'activateur, pas seulement l\'activateur', () => {
		// Les appelants posent souvent du balisage dans le slot (icône + nom).
		const html = '<span class="rich-tooltip-activator"><b>Le Poireau</b></span>'
		expect(shouldPreventContextMenu(target(html, 'b'), 'touch')).toBe(true)
	})

	it('laisse son menu à un activateur qui est un LIEN', () => {
		// La forme du classement : « ouvrir dans un nouvel onglet » vaut plus cher
		// que l'infobulle sur ces 150 liens.
		const html = '<a href="/leek/54510"><span class="rich-tooltip-activator">twogether</span></a>'
		expect(shouldPreventContextMenu(target(html, 'span'), 'touch')).toBe(false)
		expect(shouldPreventContextMenu(target(html, 'a'), 'touch')).toBe(false)
	})

	it('mais une IMAGE d\'interface perd son menu même dans un lien', () => {
		// Le cas d'origine du rapport : l'avatar d'éleveur d'un bracket de tournoi
		// est un <image> SVG dans un <a>. La règle image passe avant l'exception.
		const html = '<a href="/farmer/512"><img src="/avatar/512.png"></a>'
		expect(shouldPreventContextMenu(target(html, 'img'), 'touch')).toBe(true)
	})

	it('un <a> sans href ne compte pas comme un lien', () => {
		const html = '<a><span class="rich-tooltip-activator">twogether</span></a>'
		expect(shouldPreventContextMenu(target(html, 'span'), 'touch')).toBe(true)
	})

	it('laisse le clic droit du bureau sur une infobulle riche', () => {
		const html = '<span class="rich-tooltip-activator">twogether</span>'
		expect(shouldPreventContextMenu(target(html, 'span'), 'mouse')).toBe(false)
	})

	it('garde le menu sur une image postée par un joueur', () => {
		const img = target('<div class="text"><img src="' + USER_IMAGE + '"></div>', 'img')
		expect(shouldPreventContextMenu(img, 'touch')).toBe(false)
	})

	it('garde le menu sur les images d\'une page markdown', () => {
		// Forum et encyclopédie passent tous les deux par markdown.vue (.md).
		const img = target('<div class="md"><img src="https://i.imgur.com/x.png"></div>', 'img')
		expect(shouldPreventContextMenu(img, 'touch')).toBe(false)
	})

	it('désamorce quand même une image d\'interface posée dans une page markdown', () => {
		// Une icône de puce insérée par le rendu markdown reste de l'interface :
		// seule une vraie image de contenu porte une URL de contenu.
		const img = target('<div class="md"><img src="/image/no_avatar.png"></div>', 'img')
		// `.md` prime : on préfère perdre le menu sur une icône que de le retirer
		// sur une capture d'écran postée dans un message.
		expect(shouldPreventContextMenu(img, 'touch')).toBe(false)
	})
})
