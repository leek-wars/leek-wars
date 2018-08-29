class FightMap {
	public width!: number
	public height!: number
	public obstacles!: {[key: number]: number[]}
	public type!: number
}

class FightLeek {
	public agility!: number
	public appearence!: number
	public cellPos!: number
	public chips!: number[]
	public farmer!: number
	public frequency!: number
	public hat!: number
	public id!: number
	public level!: number
	public life!: number
	public magic!: number
	public mp!: number
	public pm!: number
	public name!: string
	public owner!: number
	public resistance!: number
	public science!: number
	public skin!: number
	public strength!: number
	public force!: number
	public summon!: boolean
	public team!: number
	public tp!: number
	public pt!: number
	public type!: number
	public valid_ai!: boolean
	public weapons!: number[]
	public wisdom!: number
}

class FightData {
	public actions!: number[][]
	public map!: FightMap
	public leeks!: FightLeek[]
	public team1!: number[]
	public team2!: number[]
}

export { FightMap, FightData, FightLeek }
