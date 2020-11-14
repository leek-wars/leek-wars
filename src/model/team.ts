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
}

class TeamMember extends Farmer {
	public grade!: string
	public logs_level!: number
}

class Composition {
	public id!: number
	public name!: string
	public captain!: boolean
	public leeks!: Leek[]
	public tournament!: any
	public fights!: number
}

export { Composition, Team, TeamMember, TEAM_COLORS }
