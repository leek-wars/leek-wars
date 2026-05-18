import { Farmer } from '@/model/farmer'
import { Fight } from '@/model/fight'
import { Leek } from '@/model/leek'

const TEAM_COLORS = [
	"#0b30ea", // blue
	"#dd0d0d", // red
	"#4FBF1C", // green
	"#FDED00", // yellow
	"#B02D20", // brown
	"#A2A2A2", // grey
	"#9800AE", // purple
	"#FF7D00", // orange
	"#14D7E4", // cyan
	"#E414C9", // pink
	"#000000", // black
	"#ffffff", // white
	"#00ff80", // turquoise
	"#a33000", // brown
	"#158f00", // darkgreen
	"#BEBD7F", // beige
	"#A98307", // honey
	"#641C34", // claret violet
	"#F39F18", // sun
	"#E55137", // salmon
	"#E6D690", // ivory
	"#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000",
	"#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000",
	"#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000",
	"#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000",
	"#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000",
	"#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000",
]

interface TeamCandidacy {
	id: number
	farmer: { id: number, name: string }
}

interface TeamInvitation {
	id: number
	team_id?: number
	team_name?: string
	emblem_changed?: number
	sender_id?: number
	sender_name?: string
	farmer: { id: number, name: string, [key: string]: unknown }
	[key: string]: unknown
}

interface TeamRankingRow {
	id: number
	name?: string
	talent?: number
	level?: number
	me?: boolean
	style?: string
	country?: string | null
	points?: number
}

interface TeamTournament {
	current?: number | null
	registered?: boolean
	[key: string]: unknown
}

interface TournamentRange {
	min: number
	max: number
}

class Team {
	public id!: number
	public name!: string
	public level!: number
	public xp!: number
	public up_xp!: number
	public down_xp!: number
	public emblem_changed!: number
	public members!: TeamMember[]
	public membersById!: {[key: number]: TeamMember}
	public compositions!: Composition[]
	public compositionsById!: {[key: number]: Composition}
	public tournaments!: unknown[]
	public leeks!: Leek[]
	public unengaged_leeks!: Leek[]
	public opened!: boolean
	public description!: string
	public recruitment_message!: string
	public candidacy!: boolean
	public candidacies!: TeamCandidacy[]
	public invitations!: TeamInvitation[]
	public talent!: number
	public max_talent!: number
	public talent_history!: number[]
	public turret_ai!: { path: string } | null
	public chat!: number
	public member_level!: number
	public forum!: number
	public leek_count!: number
	public rankings!: {leeks: TeamRankingRow[], farmers: TeamRankingRow[], trophies: TeamRankingRow[]}
	public members_columns!: { columns: string[], order?: string[], sort: { key: string, order: string } } | null
	public likes!: number
	public liked!: boolean
	public language!: string
	public activity!: number
	public defeats!: number
	public draws!: number
	public victories!: number
	public ratio!: number
	public fights!: Fight[]
	public member_count!: number
	public remaining_xp!: number
	public total_level!: number
	public sent_invitations!: number[]
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any
}

class TeamMember extends Farmer {
	public logs_level!: number
	public join_date!: number
}

enum TeamMemberLevel {
	MEMBER = 1,
	CAPTAIN = 2,
	OWNER = 3,
}

class Composition {
	public id!: number
	public name!: string
	public captain!: boolean
	public leeks!: Leek[]
	public tournament!: TeamTournament
	public fights!: number
	public tournamentRange!: TournamentRange | null
	public tournamentRangeLoading!: boolean
	public talent!: number
	public max_talent!: number
	public total_level?: number
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any
}

export { Composition, Team, TeamMember, TeamMemberLevel, TEAM_COLORS }
export type { TeamCandidacy, TeamInvitation, TeamRankingRow, TeamTournament, TournamentRange }
