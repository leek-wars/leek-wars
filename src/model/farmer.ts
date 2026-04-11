import { Chip } from '@/model/chip'
import { Hat } from '@/model/hat'
import { Leek } from '@/model/leek'
import { Loadout } from '@/model/loadout'
import { Potion } from '@/model/potion'
import { Team } from '@/model/team'
import { Weapon } from '@/model/weapon'
import { Group } from './group'

class Farmer {
	public id!: number
	public name!: string
	public habs!: number
	public animated_habs!: number
	public crystals!: number
	public animated_crystals!: number
	public banned!: boolean
	public deleted!: boolean
	public tournaments!: any[]
	public trophies!: number
	public trophies_list!: any
	public leeks!: {[key: number]: Leek}
	public weapons!: Weapon[]
	public potions!: Potion[]
	public avatar_changed!: number
	public tournament!: any
	public in_garden!: boolean
	public talent_more!: number
	public country!: string | null
	public warnings!: any[]
	public candidacy!: any
	public team_invitations!: any[]
	public website!: string
	public github!: string
	public hats!: Hat[]
	public grade!: string
	public muted!: boolean
	public fights!: number
	public bought_fights!: number
	public habs_fights!: boolean
	public team_fights!: number
	public chips!: Chip[]
	public didactitiel_seen!: boolean
	public last_connection!: number
	public moderator!: boolean
	public admin!: boolean
	public talent!: number
	public max_talent!: number
	public talent_history!: number[]
	public team!: Team | null
	public total_level!: number
	public ai_tree?: { files: any[], folders: string[], bin: any[], leek_ais: {[key: string]: string} }
	public language!: string
	public title!: number[]
	public show_ai_lines!: boolean
	public pomps!: any[]
	public pass!: boolean
	public errors!: number
	public contributor!: boolean
	public rewards!: Reward[]
	public resources!: any[]
	public components!: any[]
	public schemes!: any[]
	public verified!: boolean
	public tutorial_progress!: number
	public group!: Group
	public public_chat_enabled!: boolean
	public equipment_enabled!: boolean
	public loadouts!: Loadout[]
	public mail!: string
	public can_create_leek!: boolean
	public godsons_level!: number
	public password!: string
	public role!: string
	public connected!: boolean
	public color!: string
	public points!: number
	public forum_messages!: number
}

class Member extends Farmer {
	public leek!: string
}

class Reward {
	public trophy!: number
	public habs!: number
}

export { Farmer, Member, Reward }
