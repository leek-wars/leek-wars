import { Farmer } from "./farmer"
import { Fight } from "./fight"
import { Tournament } from "./tournament"

class Group {
	public id!: number
	public name!: string
	public creation_date!: number
	public owner!: Farmer
	public chat!: number
	public setting_br!: boolean
	public setting_tournaments!: boolean
	public setting_buy_fights!: boolean
	public setting_public_chat!: boolean
	public setting_bank!: boolean
	public setting_chat!: boolean
	public setting_xp_blocked!: boolean
	public setting_equipment_blocked!: boolean
	public setting_new_leek!: boolean
	public characteristics!: Record<string, number>
	public weapons!: number[]
	public chips!: number[]
	public level!: number
	public max_weapons!: number
	public max_chips!: number
	public cores!: number
	public ram!: number
	public capital!: number
	public members!: Farmer[]
	public use_passwords!: boolean
	public fights!: Fight[]
	public is_supervisor!: boolean
	public demo!: boolean
	public tournament!: number | null
	public tournaments!: Tournament[]
	[key: string]: unknown
}

export { Group }
