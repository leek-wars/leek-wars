import 'chart.js/auto'
import type { ChartDataset, ChartOptions, ScriptableContext } from 'chart.js'

/**
 * L'historique de talent est tracé à l'identique sur la page éleveur, la page
 * poireau, la page équipe et deux widgets de l'accueil. Le dataset vivait en
 * cinq copies : le moindre réglage visuel demandait cinq modifications
 * jumelles, et une oubliée passait inaperçue. Il est construit ici.
 */

/** Repli si le thème n'expose pas `--primary` (le vert du v2). */
const FALLBACK_GREEN = '#5fad1b'

/** `#rrggbb` + alpha. La couleur peut venir d'une variable CSS (`--primary`) :
 *  si ce n'est pas un hexa à 6 chiffres, on la rend telle quelle — le canvas la
 *  comprend et on perd seulement la transparence. */
function alpha(color: string, suffix: string) {
	return /^#[0-9a-f]{6}$/i.test(color) ? color + suffix : color
}

/** Une couleur du thème, lue sur le body : elle change entre v2 et v3, et entre
 *  le mode clair et le mode sombre. À relire à chaque bascule. */
export function themeColor(name: string, fallback: string) {
	const value = getComputedStyle(document.body).getPropertyValue(name).trim()
	return value || fallback
}

/**
 * La courbe de talent : trait plein, points carrés, dégradé sous la courbe, et
 * le dernier segment en pointillés (le talent du jour est encore en cours).
 *
 * La couleur est le vert du THÈME et non le `#5fad1b` du v2 : celui-ci était
 * écrit en dur dans quatre des cinq graphiques, qui restaient donc au vert du
 * v2 sous le design v3 (où le vert est plus sombre en clair, néon en sombre).
 */
export function talentDataset(data: number[], color = themeColor('--primary', FALLBACK_GREEN)): ChartDataset<'line'> {
	const lastIndex = data.length - 1
	return {
		tension: 0.2,
		data,
		borderColor: color,
		borderWidth: 2,
		pointStyle: 'rect',
		pointBackgroundColor: color,
		pointBorderColor: color,
		fill: 'origin',
		// Dégradé sous la courbe : teinte franche sous le trait, transparente en
		// bas de l'aire. Le gradient a besoin des dimensions de l'aire de tracé,
		// que Chart.js n'a pas encore mesurées au tout premier passage — d'où la
		// teinte plate de repli, remplacée dès le passage suivant.
		backgroundColor: (ctx: ScriptableContext<'line'>) => {
			const area = ctx.chart.chartArea
			if (!area) return alpha(color, '30')
			const gradient = ctx.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom)
			gradient.addColorStop(0, alpha(color, '59'))
			gradient.addColorStop(1, alpha(color, '00'))
			return gradient
		},
		// Le talent d'aujourd'hui est encore en cours : segment en pointillés.
		segment: {
			borderDash: (ctx) => ctx.p1DataIndex === lastIndex ? [6, 6] : undefined,
		},
	}
}

/**
 * Les axes de la courbe de talent : grille en pointillés, aux couleurs du
 * thème. Chart.js tire ses gris par défaut de nulle part — ils sont invisibles
 * sur le fond sombre, ce qui revenait à n'avoir aucune grille.
 *
 * La grille est tracée AVANT les datasets : elle se lit à travers le dégradé.
 */
export function talentScales(): ChartOptions<'line'>['scales'] {
	// `--border-strong` et pas `--border` : mesuré sur les deux fonds, `--border`
	// tombe à 1.35 de contraste — en sombre la grille n'existait pas. Le fort
	// tient 1.9 des deux côtés, ce qu'il faut à un trait pointillé de 1 px.
	const line = themeColor('--border-strong', 'rgba(0, 0, 0, 0.1)')
	const text = themeColor('--text-color-secondary', '#666')
	// C'est `border.dash` qui met les LIGNES de la grille en pointillés :
	// `grid.tickBorderDash` ne touche que les graduations, hors de l'aire.
	const axis = { grid: { color: line }, border: { color: line, dash: [3, 3] }, ticks: { color: text } }
	return { x: {...axis}, y: {...axis} }
}
