// Appui long au doigt : pas de menu natif là où le geste sert déjà.
//
// Sur mobile, l'appui long qui ouvre une infobulle ouvre EN MÊME TEMPS un menu
// natif du navigateur. Un seul geste, deux réponses : on voulait lire
// l'infobulle, on se retrouve avec un menu par-dessus, qu'il faut refermer pour
// la lire. Deux règles le désamorcent, dans cet ordre :
//  1. une IMAGE d'interface (avatar d'éleveur d'un bracket, poireau, icône
//     d'objet) : c'est le menu « Enregistrer l'image » qui s'ouvrait ;
//  2. un activateur d'infobulle riche QUI N'EST PAS UN LIEN.
//
// Pourquoi ce n'est pas réglé en CSS : `-webkit-touch-callout: none` n'est
// respecté que par Safari iOS, Chrome Android l'ignore. Le seul levier qui
// marche partout est un `preventDefault()` sur `contextmenu`. Appliqué
// globalement il emporterait le clic droit du bureau, où c'est le menu du
// navigateur tout entier qui disparaîtrait : on ne le fait donc que si le geste
// vient d'un doigt (le `pointerType` du dernier `pointerdown`).
//
// ⚠️ Un LIEN garde toujours son menu, même quand il porte une infobulle.
// Sur le classement, les noms de poireau, d'éleveur et d'équipe sont
// tous des <span> dans un <a> : leur retirer « ouvrir dans un nouvel onglet »
// et « copier l'adresse » coûterait plus cher que l'infobulle ne rapporte,
// ~150 liens par page. La règle 2 ne couvre donc que les activateurs qui ne
// mènent nulle part.
// ⚠️ La règle 1 passe AVANT et ne connaît pas cette exception : l'avatar d'un
// bracket de tournoi est un <image> dans un <a>, et c'est le cas d'origine du
// rapport. Une image d'interface perd son menu, lien ou pas.
//
// Ce qui garde son menu : les liens, les champs de saisie, le texte ordinaire,
// et les images de CONTENU — celles postées par les joueurs (chat, forum) et
// celles des pages markdown (forum, encyclopédie, tutoriel). Le contenu
// l'emporte sur les deux règles.
//
// Le pendant iOS de la règle 1 est en CSS dans global.scss : les deux doivent
// bouger ensemble. La règle 2 n'y a pas d'équivalent — sur un activateur sans
// lien ni image, ce que Safari affiche est la poignée de SÉLECTION de texte,
// que `-webkit-touch-callout` ne gouverne pas.

import { isUserImageUrl } from '@/model/user-image'

// Les éléments pour lesquels le navigateur propose d'enregistrer ce qu'il
// affiche. `tagName` est en majuscules pour un élément HTML, et rendu tel quel
// pour un élément SVG — d'où `image`, le <image> d'un <svg> (leek-image, avatars
// des brackets de tournoi).
const IMAGE_TAGS = new Set(['IMG', 'CANVAS', 'image'])

// Les zones dont les images sont du contenu et non de l'interface. `.md` est la
// racine de markdown.vue, qui rend aussi bien l'encyclopédie que les messages du
// forum.
const CONTENT_ZONE = '.md'

// Marqueur posé par les sept composants rich-tooltip sur leur activateur. Il
// couvre ce que la règle « images » ne voit pas : une infobulle riche s'ouvre le
// plus souvent sur un NOM, un <span> posé dans un <a> (les noms de poireau,
// d'éleveur et d'équipe du classement), et l'appui long y ouvre le menu de LIEN
// du navigateur, pas celui d'image. Les cinq composants qui enveloppent leur
// slot posent la classe sur ce <span> ; les deux qui passent le slot nu la font
// voyager dans les props de l'activateur, que l'appelant reverse sur son propre
// élément. `closest` la retrouve depuis n'importe quel descendant.
const TOOLTIP_ACTIVATOR = '.rich-tooltip-activator'

// Le tactile ne dit pas de quel geste vient un `contextmenu` : c'est un
// MouseEvent, sans `pointerType`. On retient celui du dernier `pointerdown`, qui
// précède toujours l'appui long.
let lastPointerType = ''

function imageSource(element: Element): string {
	return element.getAttribute('src')
		?? element.getAttribute('href')
		?? element.getAttribute('xlink:href')
		?? ''
}

// Le contenu l'emporte sur tout le reste, et c'est ce qui garde cette règle
// tenable : une seule question à se poser en ajoutant une surface, « est-ce que
// le joueur peut vouloir enregistrer ça ». C'est aussi ce qui permet au pendant
// CSS de dire exactement la même chose que ce module.
function isContent(element: Element): boolean {
	if (element.closest(CONTENT_ZONE)) { return true }
	return isUserImageUrl(imageSource(element))
}

// Un <a> sans `href` ne mène nulle part et n'ouvre aucun menu : ce qui compte
// est l'attribut, pas la balise. Le `xlink:href` couvre les <a> d'un SVG.
function isLink(element: Element): boolean {
	const link = element.closest('a')
	return !!link && (link.hasAttribute('href') || link.hasAttribute('xlink:href'))
}

/** Vrai si le menu natif doit être désamorcé pour cet appui. Exporté pour les tests. */
export function shouldPreventContextMenu(target: EventTarget | null, pointerType: string): boolean {
	// Le stylet est exclu comme la souris : sur une tablette graphique, l'appui
	// long du stylet EST le clic droit, et son menu est attendu.
	if (pointerType !== 'touch') { return false }
	if (!(target instanceof Element)) { return false }
	if (isContent(target)) { return false }
	if (IMAGE_TAGS.has(target.tagName)) { return true }
	return !!target.closest(TOOLTIP_ACTIVATOR) && !isLink(target)
}

export function installTouchContextMenu() {
	document.addEventListener('pointerdown', (event) => {
		lastPointerType = event.pointerType
	}, { capture: true, passive: true })
	// En capture : on passe avant les `@contextmenu` des composants, dont
	// certains coupent la propagation (l'arbre de l'éditeur, par exemple). Ceux-là
	// posent déjà leur propre `preventDefault`, mais rien ne garantit que le
	// prochain le fera.
	document.addEventListener('contextmenu', (event) => {
		if (shouldPreventContextMenu(event.target, lastPointerType)) { event.preventDefault() }
	}, { capture: true })
}
