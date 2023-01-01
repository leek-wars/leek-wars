import { Farmer } from "./farmer"

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
}

export { Group }