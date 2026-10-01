// Sentinelles de masquage du formatage de chat.
//
// Le pipeline de chat-format.ts masque tour à tour les blocs de code, les segments
// LaTeX, les URLs d'images et les liens posés par linkify, en les remplaçant par un
// caractère de la zone à usage privé Unicode encadrant un index. Ces caractères sont
// réservés au formatage : ils sont retirés du contenu à l'entrée.
//
// Elles vivent dans leur propre module parce que plusieurs fichiers en dépendent sans
// pouvoir s'importer les uns les autres : chat-format.ts les pose ; linkify.ts et
// commands.ts n'en englobent jamais ; emojis.ts lit la fin d'un lien masqué comme une
// balise. Une définition unique évite qu'une sentinelle ajoutée ne soit prise en
// compte que d'un côté.

export const CODE_MARK = String.fromCharCode(0xE000)
export const LATEX_MARK = String.fromCharCode(0xE001)
export const IMAGE_MARK = String.fromCharCode(0xE002)
export const LINK_MARK = String.fromCharCode(0xE003)

// Écrites en échappement et non en caractère littéral : elles sont invisibles dans
// un éditeur, et une copie ou un outil de formatage peut les perdre sans que rien
// ne le signale. C'est déjà la convention du dépôt.

/** Toutes les sentinelles, à concaténer dans une classe de caractères. */
export const SENTINELS = CODE_MARK + LATEX_MARK + IMAGE_MARK + LINK_MARK

const SENTINEL_RE = new RegExp('[' + SENTINELS + ']', 'g')

/**
 * Retire les sentinelles d'un contenu à formater.
 *
 * À appeler À L'ENTRÉE du formatage, avant tout masquage — sinon on effacerait les
 * sentinelles qu'on vient soi-même de poser.
 */
export function stripSentinels(content: string): string {
	return content.replace(SENTINEL_RE, '')
}

const HAS_SENTINEL_RE = new RegExp('[' + SENTINELS + ']')

/**
 * Vrai si le texte contient un segment masqué. Ce qui produit du HTML au milieu du
 * formatage (un lien, une commande) ne doit jamais en englober un : chaque segment
 * doit être restitué à sa place dans le texte.
 */
export function hasSentinel(text: string): boolean {
	return HAS_SENTINEL_RE.test(text)
}
