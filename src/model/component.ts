import { mergeStats } from './alteration'

class Component {
	public id!: number
	public template!: number
	public quantity!: number
	// Alterations portees par l'instance, sur les composants du poireau.
	public stats?: { [carac: string]: number } | null
	public altered_power?: number
	/**
	 * Dosage optimal de l'instance (#12146), présent seulement une fois l'énigme résolue.
	 */
	public optimal_dose?: number
}

class ComponentTemplate {
	id!: number
	name!: string
	stats!: [string, number][]
	template!: number
	// Capacité d'altération, déjà calculée dans les game data (surcharge fixe pour certaines
	// pièces, ex. le RGB).
	capacity?: number
}

/**
 * Bonus de caractéristiques apportés par les pièces équipées sur un poireau, ALTÉRATIONS
 * COMPRISES : les stats comptées sont celles de la pièce, pas celles de son
 * template, sinon une pièce altérée n'affiche ses vrais bonus qu'au rechargement de la
 * page.
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

/** Ligne du stock libre de l'éleveur : un composant, plus la date qui sert au tri. */
interface StockComponent extends Component {
	time?: number
}

/** Ce que le serveur renvoie d'une tentative d'altération, réduit à ce qui touche au stock. */
interface AlterationOutcome {
	/** Id de la pièce APRÈS coup : différent quand le serveur l'a détachée de sa pile. */
	id?: number
	/** Date remontée quand les stats ont bougé (tri par date de l'inventaire). */
	time?: number
	stats: { [carac: string]: number }
	/** Charge atteinte, en points de puissance (`capacity.used`). */
	used: number
	/**
	 * Dosage optimal, non nul dès que la pièce est résolue (#12146). Une pièce déjà résolue
	 * le renvoie à chaque tentative suivante : il ne se perd donc pas d'un essai à l'autre.
	 */
	optimal_dose?: number | null
}

/**
 * Reporte le résultat d'une tentative d'altération sur le stock libre, et rend la pièce
 * que la forge doit désormais tenir.
 *
 * Le serveur DÉTACHE la pièce de sa pile dès sa première altération : elle repart avec un
 * nouvel id, et la pile garde l'ancien en restant NEUVE. Écrire les stats sur l'objet posé
 * dans la forge ne suffit donc pas — et surtout, cet objet est parfois la ligne MÊME du
 * store (« Recommencer » après un recyclage, rejeu d'une recette depuis l'historique,
 * pièce qu'on vient de fabriquer). La pile héritait alors des altérations ET de l'id de la
 * pièce détachée : deux lignes sous le même id, des pièces améliorées en double à l'écran,
 * et un « composant déjà équipé » à la pose puisque la vraie pièce était déjà partie sur un
 * poireau. On retrouve donc la ligne du stock AVANT d'écrire quoi que ce soit.
 */
function applyAlteration(components: StockComponent[] | undefined,
                         item: StockComponent, outcome: AlterationOutcome): StockComponent {
	const time = outcome.time ?? item.time
	const stored = components ? components.find(c => c.id === item.id) ?? null : null
	// Dosage optimal : écrit seulement quand le serveur l'a livré (pièce résolue, #12146).
	// Jamais effacé sur un `null` : une pièce résolue le reste, et une tentative qui ne le
	// renvoie pas ne doit pas faire disparaître le chiffre déjà affiché.
	const solved = outcome.optimal_dose ?? undefined
	if (outcome.id !== undefined && outcome.id !== item.id) {
		// Détachée : la pile ne bouge que d'une unité et ne porte AUCUNE altération.
		const piece: StockComponent = { id: outcome.id, template: item.template, quantity: 1,
			time, stats: outcome.stats, altered_power: outcome.used, optimal_dose: solved }
		if (components && stored) {
			stored.quantity--
			if (stored.quantity <= 0) { components.splice(components.indexOf(stored), 1) }
			components.push(piece)
		}
		return piece
	}
	// Pièce déjà individuelle : c'est sa ligne qu'on met à jour. L'objet posé dans la forge
	// peut en être une copie (l'inventaire en construit), d'où les deux écritures.
	for (const target of stored && stored !== item ? [stored, item] : [item]) {
		target.stats = outcome.stats
		target.altered_power = outcome.used
		target.time = time
		if (solved !== undefined) target.optimal_dose = solved
	}
	return item
}

export { Component, ComponentTemplate, componentsBonus, applyAlteration }
export type { AlterationOutcome, StockComponent }
