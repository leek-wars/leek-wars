import { FightData } from '@/component/player/game/fight'
import { Farmer } from '@/model/farmer'
import { Comment } from './comment'
import { Leek } from './leek'

enum FightType {
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
	public leeks1!: ReportLeek[]
	public leeks2!: ReportLeek[]
	public farmer1!: ReportFarmer
	public farmer2!: ReportFarmer
	public team1!: ReportTeam
	public team2!: ReportTeam
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
	public farmers1!: Farmer[]
	public team1_name!: string
	public team2_name!: string
	public data!: FightData
	public comments!: Comment[]
	public result!: string
	public report!: Report
}

export { Fight, FightType, FightContext, Report, ReportLeek, ReportFarmer, ReportTeam }
