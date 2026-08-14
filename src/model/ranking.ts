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
	// Éleveur vu il y a moins d'une minute (#4804). Le nom de la colonne dit
	// bien de qui on parle : dans ce tableau, la ligne est un poireau.
	public farmer_connected?: boolean
}
class RankingFarmerRow extends RankingRow {
	public trophies!: number
	public total_level!: number
	public leek_count!: number
	// Vu il y a moins d'une minute (#4804).
	public connected?: boolean
}
class RankingTeamRow extends RankingRow {
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

export { RankingRow, RankingLeekRow, RankingFarmerRow, RankingTeamRow, RankingCompositionRow }
export type { Ranking }
