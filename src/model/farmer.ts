import { Chip } from '@/model/chip'
import { Hat } from '@/model/hat'
import { Leek } from '@/model/leek'
import { Loadout } from '@/model/loadout'
import { Potion } from '@/model/potion'
import { Team } from '@/model/team'
import { Weapon } from '@/model/weapon'
import { Group } from './group'
import { FarmerTree } from './filesystem'

interface InventoryItem {
	id: number
	template: number
	quantity: number
	time?: number
	type?: number
}

interface FarmerTournament {
	current?: number
	registered?: boolean
}

interface FarmerGodson {
	id: number
	name: string
}

interface TeamInvitation {
	id: number
	team_id: number
	team_name: string
	emblem_changed?: number
	sender_id?: number
	sender_name?: string
	farmer?: { id: number, name: string, [key: string]: unknown }
}

class Farmer {
	public id!: number
	public name!: string
	public habs!: number
	public animated_habs!: number
	public crystals!: number
	public animated_crystals!: number
	public banned!: boolean
	public deleted!: boolean
	public tournaments!: unknown[]
	public trophies!: number
	public trophies_list!: unknown
	public leeks!: {[key: number]: Leek}
	public weapons!: Weapon[]
	public potions!: Potion[]
	public avatar_changed!: number
	public tournament!: FarmerTournament | null
	public in_garden!: boolean
	public talent_more!: number
	public country!: string | null
	public warnings!: unknown[]
	public candidacy!: unknown
	public team_invitations!: TeamInvitation[]
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
	public didactitiel_step!: number
	public didactitiel_completed_at!: number | null
	public verify_modal_dismissed_at!: number | null
	public verify_code_at!: number | null
	public last_connection!: number
	public moderator!: boolean
	public admin!: boolean
	public talent!: number
	public max_talent!: number
	public talent_history!: number[]
	public team!: Team | null
	public total_level!: number
	public ai_tree?: FarmerTree
	public language!: string
	public title!: number[]
	public show_ai_lines!: boolean
	public pomps!: InventoryItem[]
	public pass!: boolean
	public errors!: number
	public contributor!: boolean
	public rewards!: Reward[]
	public resources!: InventoryItem[]
	public components!: InventoryItem[]
	public schemes!: InventoryItem[]
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
	public tournaments_enabled!: boolean
	public likes!: number
	public liked!: boolean
	public register_date!: number
	public ranking!: number
	public victories!: number
	public draws!: number
	public defeats!: number
	public ratio!: number
	public won_solo_tournaments!: number
	public won_farmer_tournaments!: number
	public won_team_tournaments!: number
	public won_battle_royale!: number
	public fight_history!: unknown[]
	public fight_pack!: unknown
	public godfather!: FarmerGodson | null
	public godsons!: FarmerGodson[]
	public hat!: unknown
	public item!: unknown
	public login!: string
	public potion!: unknown
	public resource!: unknown
	public trophy!: unknown
	public leek_error!: { error: string, params?: unknown } | null
	public mail_error!: { error: string, params?: unknown } | null
	public name_error!: { error: string, params?: unknown } | null
	public password_error!: { error: string, params?: unknown } | null
	public candidacies!: TeamInvitation[]
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any
}

class Member extends Farmer {
	public leek?: string
}

class Reward {
	public trophy!: number
	public habs!: number
}

export { Farmer, Member, Reward }
export type { InventoryItem }
