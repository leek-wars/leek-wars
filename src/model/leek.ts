import { AI } from '@/model/ai'
import { Chip } from '@/model/chip'
import { LeekWars } from '@/model/leekwars'
import { Weapon } from '@/model/weapon'

enum Characteristic {
	LIFE = 0,
	STRENGTH = 1,
	WISDOM = 2,
	AGILITY = 3,
	RESISTANCE = 4,
	SCIENCE = 5,
	MAGIC = 6,
	FREQUENCY = 7,
	TP = 8,
	MP = 9,
}

class Register {
	public key!: string
	public value!: string
}

class Leek {
	public id!: number
	public name!: string
	public level!: number
	public farmer!: any
	public chips!: Chip[]
	public weapons!: Weapon[]
	public opponents!: Leek[]
	public down_xp!: number
	public up_xp!: number
	public xp!: number
	public skin!: number
	public hat!: number | null
	public tournament!: any
	public in_garden!: boolean
	public talent_history!: number[]
	public dragging!: boolean
	public level_seen!: number
	public ai!: AI | null
	public talent_more!: number
	public registers!: Register[]
	public max_weapons!: number
	public max_chips!: number
	public real!: boolean
	public bot!: boolean
	public capital!: number
	public life!: number
	public strength!: number
	public wisdom!: number
	public agility!: number
	public resistance!: number
	public frequency!: number
	public science!: number
	public magic!: number
	public tp!: number
	public mp!: number
	public talent!: number
	public weapon!: number
	public title!: number[]
	public auto_br!: boolean

	constructor(data: any) {
		Object.assign(this, data)
	}
	get baseLife() {
		return 100 + (this.level - 1) * 3
	}
	get isMaxLevel() {
		return this.level === 301
	}
	get orderedChips() {
		return [...this.chips].sort((chipA, chipB) => {
			return LeekWars.orderedChips[chipA.template] - LeekWars.orderedChips[chipB.template]
		})
	}
	get orderedWeapons() {
		return [...this.weapons].sort((weaponA, weaponB) => {
			return LeekWars.weapons[weaponA.template].level - LeekWars.weapons[weaponB.template].level
		})
	}
	get talentGains() {
		return Math.round(this.talent_more / 3)
	}
}
export { Leek, Characteristic, Register }
