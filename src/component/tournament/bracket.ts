import type { ComputedRef, InjectionKey } from 'vue'
import type { TournamentEntry } from '@/model/tournament'

/**
 * Vainqueur du tournoi, descendu du graphe jusqu'aux cases : chacune se compare
 * à lui pour se border d'or, sans que le bracket ait à passer la comparaison en
 * prop à chacune de ses 126 cases.
 */
export const CHAMPION: InjectionKey<ComputedRef<TournamentEntry | null>> = Symbol('tournament-champion')

/**
 * Deux entrées désignent le même participant. L'`id` est l'identité la plus
 * sûre : en tournoi d'équipe, le lien mène à l'ÉQUIPE, partagé par toutes ses
 * compositions, alors que l'`id` est celui de la composition. Le lien puis le
 * nom servent de repli.
 */
export function sameEntry(a?: { id?: number, link?: string, name?: string } | null, b?: { id?: number, link?: string, name?: string } | null) {
	if (!a || !b) return false
	if (a.id && b.id) return a.id === b.id
	return a.link && b.link ? a.link === b.link : a.name === b.name
}

/**
 * Étiquette du nom sous (ou sur) une case, en unités du repère du bracket — le
 * SVG étant mis à l'échelle pour tenir dans l'écran, elles valent à peu près
 * autant de pixels. Taille FIXE et volontairement mesurée : proportionnelle à
 * la case, elle coupait les noms des petits tours (les plus nombreux) très tôt
 * et donnait deux tailles de texte par colonne. 10 et non 8 : le texte du bracket se lisait mal, l'arbre étant mis à l'échelle
 * de la hauteur libre.
 *
 * Ce qui bornait la taille, ce n'était pas la place mais la LARGEUR de la case :
 * l'étiquette y était confinée, et à 9 déjà `RubyLeek3` et `LitleMaster`
 * passaient en « RubyLee… » sur les cases du premier tour, les plus nombreuses.
 * D'où `NAME_OVERFLOW` : l'étiquette déborde de part et d'autre de sa case, dans
 * les 30 unités qui séparent les deux adversaires d'un match — deux étiquettes
 * voisines se touchent au pire, sans se recouvrir. Le repère du graphe s'élargit
 * d'autant, sinon les étiquettes du premier tour sortiraient du viewBox.
 *
 * `NAME_HEIGHT` est la hauteur de la boîte du nom : le graphe en déduit le bas
 * de son repère, sinon grossir le texte le ferait rogner par le viewBox.
 */
export const NAME_FONT_SIZE = 10
export const NAME_HEIGHT = NAME_FONT_SIZE * 1.6
export const NAME_OVERFLOW = 15

/**
 * Carré aux deux coins coupés en diagonale, en haut à gauche et en bas à
 * droite : la coupe des avatars du redesign (18 % du côté), reprise sur les
 * cases du bracket pour que la case et l'avatar de l'éleveur qu'elle porte se
 * répondent. Comme pour les avatars la coupe est proportionnelle : une case de
 * tournoi va de 40 à 120 unités.
 */
export function cutSquare(x: number, y: number, size: number) {
	const cut = size * 0.18
	return [
		[x + cut, y],
		[x + size, y],
		[x + size, y + size - cut],
		[x + size - cut, y + size],
		[x, y + size],
		[x, y + cut],
	].map(point => point.join(' ')).join(', ')
}
