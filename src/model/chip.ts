import { Area } from './area'
import { Effect } from './effect'

class Chip {
	public id!: number
	public template!: number
	public quantity!: number
}
export { Chip }

class ChipTemplate {
	public id!: number
	public name!: string
	public level!: number
	public min_range!: number
	public max_range!: number
	public launch_type!: number
	public effects!: Effect[]
	public cost!: number
	public area!: Area
	public los!: boolean
	public template!: number
	public cooldown!: number
	public team_cooldown!: boolean
	public initial_cooldown!: number
	public type!: number
	public max_uses!: number
}
export { ChipTemplate }
