enum PotionEffect {
	RESTAT = 1,
	CHANGE_SKIN = 2,
	BOOST_CHARACTERISTIC = 3,
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
	public consumable!: boolean
	public effects!: any[]
	public duration!: number
}
export { PotionEffect, Potion, PotionTemplate }
