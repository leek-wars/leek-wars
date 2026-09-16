import { Leek } from './leek'

enum ItemType {
	ALL = 0,
	WEAPON = 1,
	CHIP = 2,
	POTION = 3,
	HAT = 4,
	POMP = 5,
	FIGHT_PACK = 6,
	RESOURCE = 7,
	COMPONENT = 8,
	SCHEME = 9,
}
const ItemTypes = [ItemType.ALL, ItemType.WEAPON, ItemType.CHIP, ItemType.POTION, ItemType.HAT, ItemType.POMP, ItemType.FIGHT_PACK, ItemType.RESOURCE, ItemType.COMPONENT, ItemType.SCHEME]

export { ItemType, ItemTypes }

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
	public params!: number
	public buyable!: boolean
	public public!: boolean
	public singleton!: boolean
	// id numérique brut via data/get-all, objet via market/get-item-templates
	public trophy!: number | { id: number, name: string, code?: string } | null
	public market!: boolean
	public buyable_crystals!: boolean
	public rarity!: number

	public leeks?: number[]
	public leek_objs?: Leek[]
	public leek_count?: number
	public farmer_count?: number
	public sell_price?: number
	public seen?: boolean
	[key: string]: unknown
}

const ITEM_CATEGORY_NAME: { [key: number]: string } = {
	[ItemType.ALL]: 'all',
	[ItemType.WEAPON]: 'weapon',
	[ItemType.CHIP]: 'chip',
	[ItemType.POTION]: 'potion',
	[ItemType.HAT]: 'hat',
	[ItemType.POMP]: 'pomp',
	[ItemType.FIGHT_PACK]: 'fight-pack',
	[ItemType.RESOURCE]: 'resource',
	[ItemType.COMPONENT]: 'component',
	[ItemType.SCHEME]: 'scheme',
}

const ITEM_TYPE_NAME: { [key: number]: string } = {
	[ItemType.ALL]: 'all',
	[ItemType.WEAPON]: 'weapons',
	[ItemType.CHIP]: 'chips',
	[ItemType.POTION]: 'potions',
	[ItemType.HAT]: 'hats',
	[ItemType.POMP]: 'pomps',
	[ItemType.FIGHT_PACK]: 'fight-packs',
	[ItemType.RESOURCE]: 'resources',
	[ItemType.COMPONENT]: 'components',
	[ItemType.SCHEME]: 'schemes',
}

const ITEM_TYPE_ICONS: { [key: number]: string } = {
	[ItemType.ALL]: 'mdi-all-inclusive',
	[ItemType.WEAPON]: 'mdi-pistol',
	[ItemType.CHIP]: 'mdi-chip',
	[ItemType.POTION]: 'mdi-bottle-tonic-plus-outline',
	[ItemType.HAT]: 'mdi-hat-fedora',
	[ItemType.POMP]: 'mdi-auto-fix',
	[ItemType.FIGHT_PACK]: 'mdi-sword-cross',
	[ItemType.RESOURCE]: 'mdi-leaf',
	[ItemType.COMPONENT]: 'mdi-sd',
	[ItemType.SCHEME]: 'mdi-map-outline',
}

// Types dont le nom d'item est déjà le nom de fichier image, sans préfixe de catégorie
// (ex: resource « sun_shard » → /image/resource/sun_shard.png).
const UNPREFIXED_IMAGE_TYPES: number[] = [ItemType.RESOURCE, ItemType.COMPONENT]

/** Nom de fichier image d'un item, sans extension ni dossier. */
function itemImageName(item: { type: number, name: string }): string {
	if (UNPREFIXED_IMAGE_TYPES.indexOf(item.type) !== -1) return item.name
	return item.name.substring(item.name.indexOf('_') + 1)
}

/** URL complète de l'image d'un item. */
function itemImageUrl(item: { type: number, name: string }): string {
	return '/image/' + ITEM_CATEGORY_NAME[item.type] + '/' + itemImageName(item) + '.png'
}

/** Clé de traduction du nom d'un item (ex: weapon.desert_saber, resource.sun_shard). */
function itemTranslationKey(item: { type: number, name: string }): string {
	return ITEM_CATEGORY_NAME[item.type] + '.' + itemImageName(item)
}

export { Item, ItemTemplate, ITEM_CATEGORY_NAME, ITEM_TYPE_NAME, ITEM_TYPE_ICONS, itemImageName, itemImageUrl, itemTranslationKey }
