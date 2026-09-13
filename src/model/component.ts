import { mergeStats } from './alteration'

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

/**
 * Bonus de caractéristiques apportés par les pièces équipées sur un poireau, ALTÉRATIONS
 * COMPRISES (#622) : les stats comptées sont celles de la pièce, pas celles de son
 * template, sinon une pièce altérée n'affiche ses vrais bonus qu'au rechargement de la
 * page. Miroir de Leek::getTotalCharacteristics côté serveur.
 *
 * `baseStats` donne les stats de catalogue d'un template : une pièce dont le template
 * est inconnu du client ne compte simplement pas, comme dans l'affichage.
 */
function componentsBonus(components: (Component | null)[], maxComponents: number,
                         baseStats: (template: number) => [string, number][] | undefined): { [carac: string]: number } {
	const bonus: { [carac: string]: number } = {}
	for (let i = 0; i < components.length && i < maxComponents; ++i) {
		const component = components[i]
		if (!component) continue
		const base = baseStats(component.template)
		if (!base) continue
		for (const [carac, value] of mergeStats(base, component.stats)) {
			bonus[carac] = (bonus[carac] || 0) + value
		}
	}
	return bonus
}

export { Component, ComponentTemplate, componentsBonus }