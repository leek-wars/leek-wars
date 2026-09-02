enum PotionEffect {
	RESTAT = 1,
	CHANGE_SKIN = 2,
	BOOST_CHARACTERISTIC = 3,
	CLOVER_PASSED = 4,
	CLOVER_HOUR = 5,
	CLOVER_SECOND = 6,
}
class Potion {
	public id!: number
	public template!: number
	public quantity!: number
	public time!: number
}
class PotionTemplate {
	public id!: number
	public name!: string
	public level!: number
	public consumable!: boolean
	public effects!: { type: number, params: unknown[], [key: string]: unknown }[]
	public duration!: number
}
/** Potion dont un effet est un restat : la 49 (achetée) comme la 58 (offerte en compensation). */
function isRestatPotion(template: PotionTemplate | undefined): boolean {
	return !!template?.effects?.some(e => e.type === PotionEffect.RESTAT)
}
export { PotionEffect, Potion, PotionTemplate, isRestatPotion }
