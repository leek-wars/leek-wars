import { LeekWars } from '@/model/leekwars'

// Thèmes de coloration disponibles (mêmes que l'éditeur Monaco, cf. editor.vue).
const CODE_THEMES = ['leek-wars', 'vs', 'hc-light', 'leek-wars-dark', 'monokai', 'vs-dark', 'hc-black']

// Les thèmes sombres, en un seul endroit : la coquille de l'éditeur (onglets, panneaux
// git, terminal) s'y accroche pour savoir si elle doit se peindre en sombre.
export const DARK_CODE_THEMES = ['leek-wars-dark', 'monokai', 'vs-dark', 'hc-black']

export function isDarkCodeTheme(theme: string): boolean {
	return DARK_CODE_THEMES.includes(theme)
}

// Équivalent sombre de chaque thème clair. Un thème clair rendu sur le site en mode
// sombre est illisible : les thèmes clairs ne posent pas de fond (l'aperçu épouse
// celui de la page, cf. monaco-highlight.scss), donc leur encre — noire, bleu marine
// pour les mots-clés — se retrouvait sur le fond presque noir du site.
const DARK_COUNTERPART: { [key: string]: string } = {
	'leek-wars': 'leek-wars-dark',
	'vs': 'vs-dark',
	'hc-light': 'hc-black',
}

// Résout le thème de coloration effectif pour les aperçus de code (chat, encyclopédie...),
// à partir des réglages de l'éditeur (localStorage `editor/theme*`) et du mode sombre du site.
// Reproduit la logique de `appliedTheme` de editor.vue pour que les aperçus soient colorés
// comme l'éditeur du joueur. Lit LeekWars.darkMode (réactif) => réactif au basculement clair/sombre.
export function resolveCodeTheme(): string {
	let theme: string | null
	if (localStorage.getItem('editor/theme_auto') === 'true') {
		theme = LeekWars.darkMode
			? localStorage.getItem('editor/dark_theme')
			: localStorage.getItem('editor/light_theme')
	} else {
		theme = localStorage.getItem('editor/theme')
	}
	if (!theme || !CODE_THEMES.includes(theme)) { theme = LeekWars.darkMode ? 'leek-wars-dark' : 'leek-wars' }
	// Un aperçu vit DANS la page, pas dans l'éditeur : sur fond sombre il prend le
	// pendant sombre du thème choisi. L'inverse n'a pas lieu d'être, les thèmes
	// sombres portent leur propre fond et restent lisibles sur une page claire.
	if (LeekWars.darkMode && theme in DARK_COUNTERPART) { theme = DARK_COUNTERPART[theme] }
	return theme
}

// Classe CSS à poser sur le conteneur d'aperçu (cf. monaco-highlight.scss).
export function resolveCodeThemeClass(): string {
	return 'code-theme-' + resolveCodeTheme()
}
