import { Farmer } from '@/model/farmer'
import { Comment } from './comment'
import { Leek } from './leek'
import { Team } from './team'

enum FightType {
	FREE = -1,
	SOLO = 0,
	FARMER = 1,
	TEAM = 2,
	BATTLE_ROYALE = 3,
	BOSS = 4,
	WAR = 5,
	CHEST_HUNT = 6,
	COLOSSUS = 7,
}

enum ArenaMode {
	BATTLE_ROYALE = 0,
	WAR = 1,
	CHEST_HUNT = 2,
	COLOSSUS = 3,
}

enum FightContext {
	TEST = 0,
	CHALLENGE = 1,
	GARDEN = 2,
	TOURNAMENT = 3,
	BATTLE_ROYALE = 5,
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
	weapon!: number | null
	resources!: {[key: number]: number}
	mob!: boolean
	xp_locked!: boolean
	dead?: boolean
	level?: number
	money?: number
	talent?: number
	talent_gain?: number
	[key: string]: unknown
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
	level!: number
	talent!: number
	talent_gain!: number
	xp!: number
	cur_xp!: number
	prev_xp!: number
	next_xp!: number
}

class Report {
	public win!: number
	public bonus!: number
	public ai_times!: number[]
	public leeks!: ReportLeek[]
	public leeks1!: ReportLeek[]
	public leeks2!: ReportLeek[]
	public farmer1!: ReportFarmer
	public farmer2!: ReportFarmer
	public team1!: ReportTeam
	public team2!: ReportTeam
	public flags1!: string[]
	public flags2!: string[]
	public duration!: number
	public season?: string        // saison événementielle active (#4383), ex : 'summer'
	public season_bonus?: number  // bonus XP/butin en % appliqué à ce combat (boss en saison)
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
	public farmer1_name?: string
	public farmer2_name?: string
	public composition1?: number
	public composition2?: number
	public team1!: Team | null
	public team2!: Team | null
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
	public trophies!: { trophy: number, name: string, farmer: Farmer }[]
	public boss_name?: string
	public chests!: number
	public size!: number
	public generation_time!: number
	public levelups!: number
	public rareloot!: number
	public starter?: number
	public views?: number
	public too_long?: boolean
	public tournament?: number
	public seed?: number
	[key: string]: unknown
}

class FightMap {
	public id!: number
	public width!: number
	public height!: number
	public obstacles!: {[key: number]: number[]}
	public type!: number
	public pattern!: number[]
	public players!: {[key: number]: number[]}
}

class FightLeek {
	public agility!: number
	public cellPos!: number
	public chips!: number[]
	public farmer!: number
	public frequency!: number
	public hat!: number
	public metal!: boolean
	public face!: number
	public id!: number
	public level!: number
	public life!: number
	public magic!: number
	public mp!: number
	public pm!: number
	public name!: string
	public translatedName!: string
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
	public orientation!: number
}

/**
 * Raw action array from the server: [ActionType, ...params].
 * Most elements are numbers; in MOVE_TO actions, element [3] is a number[].
 * Typed as number[] for ergonomics; cast element [3] to number[] in MOVE_TO.
 */
type RawAction = number[]

class FightData {
	public actions!: RawAction[]
	public map!: FightMap
	public leeks!: FightLeek[]
	public team1!: number[]
	public team2!: number[]
	public ops!: {[key: number]: number}
}

export { Fight, FightType, FightContext, ArenaMode, Report, ReportLeek, ReportFarmer, ReportTeam, FightLeek, FightMap, FightData }
export type { RawAction }
