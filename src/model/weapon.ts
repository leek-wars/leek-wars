import { Effect } from './effect'

class Weapon {
	public id!: number
	public template!: number
}
export { Weapon }

class WeaponTemplate {
	public id!: number
	public name!: string
	public level!: number
	public min_range!: number
	public max_range!: number
	public launch_type!: number
	public effects!: Effect[]
	public cost!: number
	public area!: number
	public los!: number
	public template!: number
	public passive_effects!: Effect[]
}
export { WeaponTemplate }
