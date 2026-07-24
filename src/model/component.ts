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
	// Capacité d'altération, pré-calculée par le serveur : colonne component_template.capacity
	// si réglée (ex. le RGB), sinon la formule 0,2 × puissance des stats de base (#622).
	capacity?: number
}

export { Component, ComponentTemplate }