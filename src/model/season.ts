// Saisons événementielles (#4383). L'état (calendrier, bonus, dialogue à montrer)
// vient du serveur dans le payload de boot (farmer.season, cf. Season.class.php).
// Ce module ne porte QUE la configuration d'affichage (emoji + couleurs) keyée par
// la clé de saison ; les libellés/textes sont dans les i18n co-localisés.

export interface SeasonState {
	key: string         // 'summer' | 'halloween' | 'easter' | 'christmas'
	instance: string    // instance unique dans le temps, ex : 'summer-2026'
	active: boolean     // saison en cours (bandeau affiché)
	start: number       // timestamp unix (secondes)
	end: number         // timestamp unix (secondes)
	bonus: number       // bonus XP/butin en % sur les combats éligibles
	dialog: 'start' | 'end' | null // dialogue (montré une fois) à ouvrir
}

export interface SeasonDisplay {
	emoji: string
	gradient: [string, string] // dégradé du bandeau / en-tête du dialogue
	accent: string             // couleur d'accent (texte, tag rapport)
}

export const SEASON_DISPLAY: Record<string, SeasonDisplay> = {
	solstice:  { emoji: '☀️', gradient: ['#ffd84d', '#ff9a2e'], accent: '#e07a0a' }, // été festif
	heatwave:  { emoji: '🏖️', gradient: ['#2bc4d4', '#ffdf91'], accent: '#1497a6' }, // été plage
	halloween: { emoji: '🎃', gradient: ['#ff7a18', '#5b2a86'], accent: '#d5610a' },
	easter:    { emoji: '🐣', gradient: ['#9be3b4', '#ffd9a8'], accent: '#3f9d56' },
	christmas: { emoji: '🎄', gradient: ['#1a7a4c', '#b02a37'], accent: '#b02a37' },
}

const FALLBACK_DISPLAY: SeasonDisplay = { emoji: '✨', gradient: ['#9aa7ff', '#6c7cf0'], accent: '#5566e0' }

export function seasonDisplay(key: string): SeasonDisplay {
	return SEASON_DISPLAY[key] ?? FALLBACK_DISPLAY
}
