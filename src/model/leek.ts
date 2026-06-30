import { AI } from '@/model/ai'
import { Chip } from '@/model/chip'
import { Farmer } from '@/model/farmer'
import { Fight } from '@/model/fight'
import { Tournament } from '@/model/tournament'
import { Weapon } from '@/model/weapon'
import { Hat } from './hat'
import { Component } from './component'

const LEEK_FACES = ['', '_happy', '_angry']

class Register {
	public key!: string
	public value!: string
}

class Leek {
	public id!: number
	public name!: string
	public level!: number
	public farmer!: Farmer
	public chips!: Chip[]
	public weapons!: Weapon[]
	public opponents!: Leek[]
	public down_xp!: number
	public up_xp!: number
	public xp!: number
	public skin!: number
	public hat!: Hat | null
	public tournament!: Tournament | null
	public in_garden!: boolean
	public talent_history!: number[]
	public dragging!: boolean
	public level_seen!: number
	public ai!: AI | null
	public ai_path!: string | null
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
	public max_talent!: number
	public weapon!: number
	public title!: number[]
	public auto_br!: boolean
	public fish!: boolean
	public ally!: boolean
	public back!: boolean
	public metal!: boolean
	public face!: number
	public xp_blocked!: boolean
	public fights!: Fight[]
	public tournaments!: Tournament[]
	public victories!: number
	public ranking!: number
	public components!: (Component | null)[]
	public total_ram!: number
	public itemUsageStats: { [itemId: number]: { uses: number, fights: number } } | null = null
	public itemUsageTotalFights: number = 0
	public itemUsageHistograms: { [itemId: number]: number[] } | null = null
	public country: string | null = null
	public team_fights!: number
	public preference!: number
	[key: string]: unknown

	constructor(data: Record<string, unknown>) {
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

export const MAX_COMPONENTS = 8

// COSTS / CostEntry vivent désormais dans le module feuille costs.ts (sans dépendances),
// pour que capital.ts et les composants ne tirent pas tout le graphe de modèles via leek.ts.
// Ré-export ici pour ne pas casser les imports existants `from '@/model/leek'`.
export type { CostEntry } from './costs'
export { COSTS } from './costs'

export { Leek, Register, LEEK_FACES }
