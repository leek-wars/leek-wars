import { AI } from '@/model/ai'
import { Chip } from '@/model/chip'
import { Weapon } from '@/model/weapon'
import { Hat } from './hat'
import { Options } from './component'

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

enum LeekFace {
	NEUTRAL = 0,
	HAPPY = 1,
	ANGRY = 2
}

const LEEK_FACES = ['', '_happy', '_angry']

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
	public hat!: Hat | null
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
	public cores!: number
	public ram!: number
	public science!: number
	public magic!: number
	public tp!: number
	public mp!: number
	public talent!: number
	public weapon!: number
	public title!: number[]
	public auto_br!: boolean
	public fish!: boolean
	public ally!: boolean
	public back!: boolean
	public metal!: boolean
	public face!: number
	public xp_blocked!: boolean
	public fights!: any[]
	public tournaments!: any[]
	public victories!: number
	public ranking!: number
	public components!: Component[]
	public total_ram!: number

	constructor(data: any) {
		Object.assign(this, data)
	}
	get baseLife() {
		return 100 + (this.level - 1) * 3
	}
	get isMaxLevel() {
		return this.level === 301
	}
	get talentGains() {
		return Math.round(this.talent_more / 3)
	}
}

export const COSTS: {[key: string]: any} = {
	life : [
		{step : 0, capital : 1, sup : 4},
		{step : 1000, capital : 1, sup : 3},
		{step : 2000, capital : 1, sup : 2},
	],
	strength : [
		{step : 0, capital : 1, sup : 2},
		{step : 200, capital : 1, sup : 1},
		{step : 400, capital : 2, sup : 1},
		{step : 600, capital : 3, sup : 1},
	],
	wisdom : [
		{step : 0, capital : 1, sup : 2},
		{step : 200, capital : 1, sup : 1},
		{step : 400, capital : 2, sup : 1},
		{step : 600, capital : 3, sup : 1},
	],
	agility : [
		{step : 0, capital : 1, sup : 2},
		{step : 200, capital : 1, sup : 1},
		{step : 400, capital : 2, sup : 1},
		{step : 600, capital : 3, sup : 1},
	],
	resistance : [
		{step : 0, capital : 1, sup : 2},
		{step : 200, capital : 1, sup : 1},
		{step : 400, capital : 2, sup : 1},
		{step : 600, capital : 3, sup : 1},
	],
	science : [
		{step : 0, capital : 1, sup : 2},
		{step : 200, capital : 1, sup : 1},
		{step : 400, capital : 2, sup : 1},
		{step : 600, capital : 3, sup : 1},
	],
	magic : [
		{step : 0, capital : 1, sup : 2},
		{step : 200, capital : 1, sup : 1},
		{step : 400, capital : 2, sup : 1},
		{step : 600, capital : 3, sup : 1},
	],
	frequency : [
		{step : 0, capital : 1, sup : 1}
	],
	cores : [
		{step : 0, capital : 20, sup : 1},
		{step : 1, capital : 30, sup : 1},
		{step : 2, capital : 40, sup : 1},
		{step : 3, capital : 50, sup : 1},
		{step : 4, capital : 60, sup : 1},
		{step : 5, capital : 70, sup : 1},
		{step : 6, capital : 80, sup : 1},
		{step : 7, capital : 90, sup : 1},
		{step : 8, capital : 100, sup : 1},
	],
	ram : [
		{step : 0, capital : 20, sup : 1},
		{step : 1, capital : 30, sup : 1},
		{step : 2, capital : 40, sup : 1},
		{step : 3, capital : 50, sup : 1},
		{step : 4, capital : 60, sup : 1},
		{step : 5, capital : 70, sup : 1},
		{step : 6, capital : 80, sup : 1},
		{step : 7, capital : 90, sup : 1},
		{step : 8, capital : 100, sup : 1},
	],
	tp : [
		{step : 0, capital : 30, sup : 1}, {step : 1, capital : 35, sup : 1},
		{step : 2, capital : 40, sup : 1}, {step : 3, capital : 45, sup : 1},
		{step : 4, capital : 50, sup : 1}, {step : 5, capital : 55, sup : 1},
		{step : 6, capital : 60, sup : 1}, {step : 7, capital : 65, sup : 1},
		{step : 8, capital : 70, sup : 1}, {step : 9, capital : 75, sup : 1},
		{step : 10, capital : 80, sup : 1}, {step : 11, capital : 85, sup : 1},
		{step : 12, capital : 90, sup : 1}, {step : 13, capital : 95, sup : 1},
		{step : 14, capital : 100, sup : 1}
	],
	mp : [
		{step : 0, capital : 20, sup : 1},
		{step : 1, capital : 40, sup : 1},
		{step : 2, capital : 60, sup : 1},
		{step : 3, capital : 80, sup : 1},
		{step : 4, capital : 100, sup : 1},
		{step : 5, capital : 120, sup : 1},
		{step : 6, capital : 140, sup : 1},
		{step : 7, capital : 160, sup : 1},
		{step : 8, capital : 180, sup : 1}
	]
}

export { Leek, Characteristic, Register, LeekFace, LEEK_FACES }
