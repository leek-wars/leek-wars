import { Area } from './area'

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
	public effects!: any[]
	public cost!: number
	public area!: Area
	public los!: number
	public template!: number
	public cooldown!: number
	public team_cooldown!: number
	public initial_cooldown!: number
}
export { ChipTemplate }
