enum PotionEffect {
	RESTAT = 1,
	CHANGE_SKIN = 2,
}
class Potion {
	public id!: number
	public template!: number
	public quantity!: number
}
class PotionTemplate {
	public id!: number
	public name!: string
	public level!: number
	public consumable!: number
	public effects!: any[]
}
export { PotionEffect, Potion, PotionTemplate }
