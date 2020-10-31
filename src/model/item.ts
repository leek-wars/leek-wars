import { Leek } from './leek'

enum ItemType {
	WEAPON = 1,
	CHIP = 2,
	POTION = 3,
	HAT = 4,
	POMP = 5,
	FIGHT_PACK = 6,
}
export { ItemType }

class ItemTemplate {
	public id!: number
	public name!: string
	public type!: ItemType
	public price!: number | null
	public crystals!: number | null
	public sellable!: boolean
	public level!: number
	public params!: any
	public buyable!: boolean
	public public!: boolean
	public singleton!: boolean
	public trophy!: number | null
	public market!: boolean
	public buyable_crystals!: boolean

	public leeks?: number[]
	public leek_objs?: Leek[]
	public leek_count?: number
	public farmer_count?: number
	public sell_price?: number
	public seen?: boolean
}
export { ItemTemplate }
