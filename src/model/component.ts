class Component {
	public id!: number
	public template!: number
	public quantity!: number
}

class ComponentTemplate {
	id!: number
	name!: string
	stats!: [string, number][]
	template!: number
}

export { Component, ComponentTemplate }