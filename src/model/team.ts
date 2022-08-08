import { Farmer } from '@/model/farmer'
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
]
const TEAM_COLORS_DARK = [
	"#6e86ff", // blue
	"#ff3838", // red
	"#4FBF1C", // green
	"#FDED00", // yellow
	"#B02D20", // brown
	"#A2A2A2", // grey
	"#ac4cba", // purple
	"#FF7D00", // orange
	"#14D7E4", // cyan
	"#ff99f2", // pink
	"#000000", // black
	"#ffffff", // white
	"#00ae57", // turquoise
	"#6b2000", // brown
	"#0c5100", // darkgreen
]

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
	public tournaments!: any
	public leeks!: Leek[]
	public unengaged_leeks!: Leek[]
	public opened!: boolean
	public description!: string
	public candidacy!: boolean
	public talent!: number
	public turret_ai!: any
	public chat!: number
	public member_level!: number
	public forum!: number
	public leek_count!: number
}

class TeamMember extends Farmer {
	public logs_level!: number
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
	public tournament!: any
	public fights!: number
	public tournamentRange!: any
	public tournamentRangeLoading!: any
	public talent!: number
}

export { Composition, Team, TeamMember, TeamMemberLevel, TEAM_COLORS, TEAM_COLORS_DARK }
