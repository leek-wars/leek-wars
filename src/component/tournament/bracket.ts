import type { ComputedRef, InjectionKey } from 'vue'
import type { TournamentEntry } from '@/model/tournament'

/**
 * Vainqueur du tournoi, descendu du graphe jusqu'aux cases : chacune se compare
 * à lui pour se border d'or, sans que le bracket ait à passer la comparaison en
 * prop à chacune de ses 126 cases.
 */
export const CHAMPION: InjectionKey<ComputedRef<TournamentEntry | null>> = Symbol('tournament-champion')

/**
 * Deux entrées désignent le même participant. Le lien (`/leek/42`) est
 * l'identité la plus sûre ; le nom sert de repli, les entrées d'un tournoi
 * d'équipe n'ayant pas toujours de lien.
 */
export function sameEntry(a?: { link?: string, name?: string } | null, b?: { link?: string, name?: string } | null) {
	if (!a || !b) return false
	return a.link && b.link ? a.link === b.link : a.name === b.name
}

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
