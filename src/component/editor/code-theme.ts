import { LeekWars } from '@/model/leekwars'

// Thèmes de coloration disponibles (mêmes que l'éditeur Monaco, cf. editor.vue).
const CODE_THEMES = ['leek-wars', 'vs', 'hc-light', 'monokai', 'vs-dark', 'hc-black']

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
	if (!theme) { theme = LeekWars.darkMode ? 'monokai' : 'leek-wars' }
	return CODE_THEMES.includes(theme) ? theme : (LeekWars.darkMode ? 'monokai' : 'leek-wars')
}

// Classe CSS à poser sur le conteneur d'aperçu (cf. monaco-highlight.scss).
export function resolveCodeThemeClass(): string {
	return 'code-theme-' + resolveCodeTheme()
}
