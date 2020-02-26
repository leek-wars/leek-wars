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
	public leeks!: number[]
	public leek_objs!: Leek[]
	public leek_count!: number
	public farmer_count!: number
	public price_habs!: number
	public price_crystals!: number
	public sellable!: boolean
	public sell_price!: number
	public seen!: boolean
}
export { ItemTemplate }
