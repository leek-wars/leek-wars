// Images uploadées par les joueurs : règles de forme des URLs, mêmes que côté serveur.
//
// Volontairement séparé de chat-format.ts : le chat est la première surface à rendre
// ces images, mais le forum et l'encyclopédie tomberont sur le même besoin, et il ne
// doit y avoir qu'UNE définition de ce qu'est une URL d'image valide. Deux copies de
// cette règle qui divergent, c'est une surface qui rend en <img> ce qu'une autre
// refuse.
//
// Ce qui reste propre à chaque surface : la classe CSS (les contraintes de taille
// n'ont rien à voir entre une colonne de chat et une page de forum) et le moment où
// la substitution a lieu dans le pipeline de formatage.

// Forme canonique, identique à celle du serveur. Chemin RELATIF, pour que le même
// texte s'affiche quel que soit l'hôte. Les caractères
// capturés se limitent à [0-9a-f], '/' et '.' — rien qui puisse fermer un attribut
// HTML, ce qui permet d'interpoler l'URL dans un `src=""` sans autre échappement.
const USER_IMAGE_PATTERN = '/user-image/([0-9a-f]{2})/([0-9a-f]{2})/([0-9a-f]{64})\\.webp'

// Marqueur que la modération écrit dans le texte À LA PLACE de l'URL quand elle
// bannit l'image, identique au marqueur du serveur. Il ne désigne
// aucun fichier : `banned` n'est pas un couple hexadécimal. Le serveur le refuse à
// l'entrée, donc sa seule provenance possible est un bannissement.
//
// Pourquoi passer par le texte et pas par l'échec de chargement de l'image : le
// navigateur qui avait déjà chargé l'image la ressort de son cache sans rien
// redemander, et rien côté serveur ne peut vider un cache déjà posé. Tant que l'URL
// reste dans le texte, une image bannie reste affichée chez qui l'avait vue.
const BANNED_IMAGE_PATTERN = '/user-image/banned/([0-9a-f]{64})\\.webp'

const USER_IMAGE_PARTS_RE = new RegExp('^' + USER_IMAGE_PATTERN + '$')
const BANNED_IMAGE_PARTS_RE = new RegExp('^' + BANNED_IMAGE_PATTERN + '$')

/**
 * Un scanner neuf à chaque appel : une regex globale porte un `lastIndex` mutable.
 *
 * Il ramène les deux formes — l'image et son marqueur de bannissement — parce que le
 * formatage doit les masquer TOUTES LES DEUX avant linkify, qui ferait sinon un lien
 * du marqueur. Les groupes 1 à 3 restent ceux de l'URL d'image ; l'alternative n'est
 * jamais confondue avec elle, puisque isUserImageUrl reste la seule chose qui décide
 * de ce qui s'affiche en <img>.
 */
export function userImageScanner(): RegExp {
	return new RegExp(USER_IMAGE_PATTERN + '|' + BANNED_IMAGE_PATTERN, 'g')
}

/** Vrai si l'URL est le marqueur laissé par la modération à la place d'une image. */
export function isBannedImageUrl(url: string): boolean {
	return BANNED_IMAGE_PARTS_RE.test(url)
}

// Le marqueur tel qu'il apparaît dans un texte MARKDOWN : soit seul, soit — le cas
// courant — dans la syntaxe d'image `![texte](…)` que la modération a réécrite sans
// la défaire. L'alternative prend la forme longue d'abord, sinon le marqueur nu
// s'apparierait le premier et laisserait derrière lui un `![]( … )` orphelin.
const BANNED_IMAGE_MARKDOWN_RE = new RegExp(
	'!\\[[^\\]]*\\]\\(\\s*' + BANNED_IMAGE_PATTERN + '\\s*\\)' + '|' + BANNED_IMAGE_PATTERN, 'g')

/**
 * Remplace les images bannies d'un texte markdown par ce qui doit s'afficher à leur
 * place. Le remplacement appartient à la surface : le chat pose un <span>, une
 * notification par courriel voudrait du texte brut.
 */
export function replaceBannedImages(content: string, replacement: string): string {
	return content.replace(BANNED_IMAGE_MARKDOWN_RE, replacement)
}

/**
 * Vrai si l'URL est une image uploadée valide. Les deux niveaux de répertoire doivent
 * être les 4 premiers caractères du hash, même règle que côté serveur : sans
 * ça, la même image serait atteignable par plusieurs URLs, toutes mises en cache un an.
 */
export function isUserImageUrl(url: string): boolean {
	const parts = USER_IMAGE_PARTS_RE.exec(url)
	return !!parts && parts[1] === parts[3].substring(0, 2) && parts[2] === parts[3].substring(2, 4)
}

/**
 * Vrai si le texte contient au moins une image uploadée AFFICHABLE.
 *
 * Même règle que isUserImageUrl, et pas le simple motif : sans ça, un texte dont
 * toutes les URLs sont non canoniques passait pour illustré, et l'appelant
 * proposait d'agir sur des images qui n'en sont pas.
 */
export function containsUserImage(text: string): boolean {
	const scanner = userImageScanner()
	let match: RegExpExecArray | null
	while ((match = scanner.exec(text)) !== null) {
		if (isUserImageUrl(match[0])) { return true }
	}
	return false
}

/** Les hashs des images AFFICHABLES d'un texte, sans doublon. */
export function userImageHashes(text: string): string[] {
	const scanner = userImageScanner()
	const hashes = new Set<string>()
	let match: RegExpExecArray | null
	while ((match = scanner.exec(text)) !== null) {
		if (isUserImageUrl(match[0])) { hashes.add(match[3]) }
	}
	return [...hashes]
}

/**
 * Balise <img> pour une URL d'image uploadée, ou l'URL en texte si elle n'est pas
 * canonique (visible, sans rien casser). `cssClass` appartient à la surface : c'est
 * elle qui sait à quelle taille l'image doit tenir.
 */
export function userImageTag(url: string, cssClass: string): string {
	if (!isUserImageUrl(url)) { return url }
	return '<img class="' + cssClass + '" src="' + url + '" loading="lazy" decoding="async" alt="">'
}
