class Component {
	public id!: number
	public template!: number
	public quantity!: number
	// Alterations portees par l'instance (#622), sur les composants du poireau.
	public stats?: { [carac: string]: number } | null
	public altered_power?: number
}

class ComponentTemplate {
	id!: number
	name!: string
	stats!: [string, number][]
	template!: number
}

export { Component, ComponentTemplate }