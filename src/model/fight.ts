import { Farmer } from '@/model/farmer'
import { Comment } from './comment'
import { Leek } from './leek'

enum FightType {
	FREE = -1,
	SOLO = 0,
	FARMER = 1,
	TEAM = 2,
	BATTLE_ROYALE = 3,
}

enum FightContext {
	TEST = 0,
	CHALLENGE = 1,
	GARDEN = 2,
	TOURNAMENT = 3,
	BATTLE_ROYALE = 4,
}

class ReportLeek {
	id!: number
	name!: string
	xp!: number
	cur_xp!: number
	new_xp!: number
	next_xp!: number
	prev_xp!: number
	aiTime!: number
	weapon_name!: string
}

class ReportFarmer {
	id!: number
	name!: string
	talent!: number
	talent_gain!: number
}

class ReportTeam {
	id!: number
	name!: string
}

class Report {
	public win!: number
	public bonus!: number
	public ai_times!: any[]
	public leeks!: ReportLeek[]
	public leeks1!: ReportLeek[]
	public leeks2!: ReportLeek[]
	public farmer1!: ReportFarmer
	public farmer2!: ReportFarmer
	public team1!: ReportTeam
	public team2!: ReportTeam
	public duration!: number
}

class Fight {
	public id!: number
	public date!: number
	public status!: number
	public type!: FightType
	public context!: FightContext
	public leeks1!: Leek[]
	public leeks2!: Leek[]
	public farmer1!: number
	public farmer2!: number
	public team1!: number
	public team2!: number
	public title!: string
	public farmers1!: {[key: number]: Farmer}
	public farmers2!: {[key: number]: Farmer}
	public team1_name!: string
	public team2_name!: string
	public data!: FightData
	public comments!: Comment[]
	public result!: string
	public report!: Report
	public winner!: number
	public queue!: number
}

class FightMap {
	public width!: number
	public height!: number
	public obstacles!: {[key: number]: number[]}
	public type!: number
}

class FightLeek {
	public agility!: number
	public cellPos!: number
	public chips!: number[]
	public farmer!: number
	public frequency!: number
	public hat!: number
	public id!: number
	public level!: number
	public life!: number
	public magic!: number
	public mp!: number
	public pm!: number
	public name!: string
	public owner!: number
	public critical!: boolean
	public resistance!: number
	public science!: number
	public skin!: number
	public strength!: number
	public force!: number
	public summon!: boolean
	public team!: number
	public tp!: number
	public pt!: number
	public type!: number
	public weapons!: number[]
	public wisdom!: number
}

class FightData {
	public actions!: any[][]
	public map!: FightMap
	public leeks!: FightLeek[]
	public team1!: number[]
	public team2!: number[]
	public ops!: any
}

export { Fight, FightType, FightContext, Report, ReportLeek, ReportFarmer, ReportTeam, FightLeek, FightMap, FightData }
