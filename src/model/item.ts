import { Leek } from './leek'
import { design } from './design'

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
	ALTERATION = 10,
}
const ItemTypes = [ItemType.ALL, ItemType.WEAPON, ItemType.CHIP, ItemType.POTION, ItemType.HAT, ItemType.POMP, ItemType.FIGHT_PACK, ItemType.RESOURCE, ItemType.COMPONENT, ItemType.SCHEME, ItemType.ALTERATION]

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
	[ItemType.ALTERATION]: 'alteration',
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
	[ItemType.ALTERATION]: 'alterations',
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
	[ItemType.ALTERATION]: 'mdi-flask',
}

/**
 * Nom de fichier image d'un item, sans extension ni dossier.
 *
 * La plupart des noms sont prefixes par leur categorie (weapon_pistol,
 * fight-pack_fight_pack_50...) et le prefixe doit sauter ; ressources,
 * composants et alterations portent deja le nom du fichier. On retire donc le
 * prefixe de categorie quand il est la, plutot que de couper au premier `_` :
 * sinon une alteration comme vitamin_d finissait en /image/alteration/d.png,
 * et un pack de combats nomme fight_pack_50 (la forme courte que le
 * marche fabrique) en /image/fight-pack/pack_50.png.
 */
function itemImageName(item: { type: number, name: string }): string {
	const prefix = ITEM_CATEGORY_NAME[item.type] + '_'
	return item.name.startsWith(prefix) ? item.name.substring(prefix.length) : item.name
}

/**
 * URL de la tuile d'une puce, par son nom de fichier (sans le préfixe `chip_`).
 *
 * Deux dossiers plutôt qu'un : les images sont servies avec un cache d'un an,
 * un même nom de fichier ne peut donc pas changer de dessin sans que les
 * joueurs gardent l'ancien pendant des mois. La série redessinée pour la 3.00
 * vit dans `chipv3`, et `chip` garde les tuiles d'origine — que l'ancien design
 * réaffiche.
 */
function chipImageDir(): string {
	return design.legacy ? 'chip' : 'chipv3'
}

function chipImageUrl(name: string): string {
	return '/image/' + chipImageDir() + '/' + name + '.png'
}

/** URL complete de l'image d'un item. */
function itemImageUrl(item: { type: number, name: string }): string {
	if (item.type === ItemType.CHIP) return chipImageUrl(itemImageName(item))
	return '/image/' + ITEM_CATEGORY_NAME[item.type] + '/' + itemImageName(item) + '.png'
}

/** Clé de traduction du nom d'un item (ex: weapon.desert_saber, resource.sun_shard). */
function itemTranslationKey(item: { type: number, name: string }): string {
	return ITEM_CATEGORY_NAME[item.type] + '.' + itemImageName(item)
}

export { Item, ItemTemplate, ITEM_CATEGORY_NAME, ITEM_TYPE_NAME, ITEM_TYPE_ICONS, chipImageDir, chipImageUrl, itemImageName, itemImageUrl, itemTranslationKey }
