import { Farmer } from '@/model/farmer'
import { Leek } from '@/model/leek'

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
	public unengaged_leeks!: Leek[]
	public opened!: boolean
	public description!: string
	public candidacy!: boolean
	public talent!: number
}

class TeamMember extends Farmer {
	public grade!: string
}

class Composition {
	public id!: number
	public name!: string
	public captain!: boolean
	public leeks!: Leek[]
	public tournament!: any
	public fights!: number
}

export { Composition, Team, TeamMember }
