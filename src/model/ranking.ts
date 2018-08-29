class RankingRow {
	public style!: string
	public me!: string
	public id!: number
}
class RankingLeekRow extends RankingRow {

}
class RankingFarmerRow extends RankingRow {

}
class RankingTeamRow extends RankingRow {

}

type Ranking = RankingRow[]

export { Ranking, RankingRow, RankingLeekRow, RankingFarmerRow, RankingTeamRow }
