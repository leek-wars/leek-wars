import { Leek } from './leek'

enum ItemType {
	WEAPON = 1,
	CHIP = 2,
	POTION = 3,
	HAT = 4,
	POMP = 5,
	FIGHT_PACK = 6,
	RESOURCE = 7,
}
export { ItemType }

class Item {
	public id!: number
	public template!: number
	public quantity!: number
	public time!: number
}

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
	public rarity!: number

	public leeks?: number[]
	public leek_objs?: Leek[]
	public leek_count?: number
	public farmer_count?: number
	public sell_price?: number
	public seen?: boolean
}

const ITEM_CATEGORY_NAME = {
	[ItemType.WEAPON]: 'weapon',
	[ItemType.CHIP]: 'chip',
	[ItemType.POTION]: 'potion',
	[ItemType.HAT]: 'hat',
	[ItemType.POMP]: 'pomp',
	[ItemType.FIGHT_PACK]: 'fight-pack',
	[ItemType.RESOURCE]: 'resource',
}

export { Item, ItemTemplate, ITEM_CATEGORY_NAME }
