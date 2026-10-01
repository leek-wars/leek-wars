class RankingRow {
	public style!: string
	public me!: string
	public id!: number
	public rank!: number
	public active!: boolean
	public name!: string
	public talent!: number
	public country?: string
	public team?: string
	public team_id?: number
	public team_name?: string
	[key: string]: unknown
}
class RankingLeekRow extends RankingRow {
	public level!: number
	public xp!: number
	public farmer!: string
	public farmer_id!: number
	// Éleveur vu il y a moins d'une minute. Le nom de la colonne dit
	// bien de qui on parle : dans ce tableau, la ligne est un poireau.
	public farmer_connected?: boolean
}
class RankingFarmerRow extends RankingRow {
	public trophies!: number
	public total_level!: number
	public leek_count!: number
	// Vu il y a moins d'une minute.
	public connected?: boolean
	// Nombre de comptes du joueur derrière la ligne : 1 = compte solo.
	public accounts?: number
}
class RankingTeamRow extends RankingRow {
	// Taux d'activité, affiché en flammes comme sur la page des équipes.
	public activity?: number
	public level!: number
	public total_level!: number
	public xp!: number
	public farmer_count!: number
	public leek_count!: number
}
class RankingCompositionRow extends RankingRow {
	public total_level!: number
	public leek_count!: number
}

type Ranking = RankingRow[]

/**
 * Ancre de la ligne à surligner quand on ouvre le classement sur une entité
 * (bouton de rang, recherche) : l'entité elle-même, pas son rang. Le rang dépend
 * du mode affiché (tous les comptes ou non), et un compte secondaire n'a pas de
 * ligne dans le classement dédupliqué : mieux vaut ne rien surligner qu'un autre.
 */
function rankingAnchor(type: string, id: number): string {
	return '#' + type + '-' + id
}

/** L'entité que désigne l'ancre, si elle est du type des lignes affichées. */
function rankingAnchorId(hash: string, type: string): number | null {
	const match = /^#([a-z]+)-(\d+)$/.exec(hash)
	return match && match[1] === type ? parseInt(match[2], 10) : null
}

export { RankingRow, RankingLeekRow, RankingFarmerRow, RankingTeamRow, RankingCompositionRow, rankingAnchor, rankingAnchorId }
export type { Ranking }
