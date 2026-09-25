const tutorial_items = [
	{ image: '/image/feature/editor_black.webp', name: "editor", icon: "laptop" },
	{ image: '/image/tutorial/variables.png', name: "variables", icon: "alpha-x-box-outline" },
	{ image: '/image/feature/documentation.webp', name: "standard_functions", icon: "function" },
	{ image: '/image/tutorial/conditions.png', name: "conditions", icon: "source-branch" },
	{ image: '/image/tutorial/boolean_null.png', name: "boolean_null", icon: "circle-off-outline" },
	{ image: '/image/changelog/229_anim_explosion.png', name: "operators", icon: "plus" },
	{ image: '/image/tutorial/standard_functions.png', name: "strings", icon: "format-text" },
	{ image: '/image/tutorial/loops.png', name: "loops", icon: "restore" },
	{ image: '/image/changelog/208_laser.png', name: "lists", icon: "code-brackets" },
	{ image: '/image/tutorial/functions.png', name: "functions", icon: "function-variant" },
	// { image: '/image/feature/debug_mark.webp', name: "Les tables", items: "Calculer les cellules accessibles", icon: "table" },
	// { image: '/image/encyclopedia/TutoMap1.png', name: "Complexité", items: "Implémenter un cache-cache", icon: "graph-outline" },
	// { image: '/image/feature/leek_chips.webp', name: "Récursivité", items: "Combos : algorithme sac à dos", icon: "file-tree" },
	// { image: '/image/changelog/208_area.png', name: "Classes et objets", items: "Simulation du jeu", icon: "code-braces" },
	// { image: '/image/encyclopedia/TutoMapAPlat.png', name: "Registres et JSON", items: "Sauvegarder des données", icon: "database" },
	// { image: '/image/encyclopedia/stacktrace.png', name: "Inclusions", items: "Utiliser plusieurs fichiers", icon: "file-outline" },
]

// Le tutoriel existe en plusieurs langages de code. Chaque « piste » (track) pointe vers
// son propre jeu de pages d'encyclopédie ; les chapitres et la progression restent communs.
// JavaScript et TypeScript partagent la même piste (langages quasi identiques).
type TutorialTrack = 'leekscript' | 'javascript' | 'python'

const tutorial_tracks: TutorialTrack[] = ['leekscript', 'javascript', 'python']

// Locales pour lesquelles les tutoriels JS/TS et Python ont été traduits. Pour les autres
// locales, on retombe sur l'anglais plutôt que d'afficher une page inexistante (le tutoriel
// LeekScript, lui, existe dans toutes les langues).
const tutorial_translated_locales = ['fr', 'en']

// Locale effective à utiliser pour une piste donnée : la locale UI si la piste y est traduite,
// sinon 'en' (repli). LeekScript existe partout, donc on garde toujours la locale UI.
function tutorialLocale(track: TutorialTrack, ui_locale: string): string {
	if (track === 'leekscript') return ui_locale
	return tutorial_translated_locales.includes(ui_locale) ? ui_locale : 'en'
}

// Langage d'IA choisi par le fermier (farmer.ai_language) -> piste de tutoriel.
function tutorialTrackForLanguage(ai_language: string | undefined | null): TutorialTrack {
	switch (ai_language) {
		case 'javascript':
		case 'typescript': return 'javascript'
		case 'python': return 'python'
		default: return 'leekscript'
	}
}

// Valide une piste reçue depuis le markdown d'une page ({{ tutorial-menu:python }}).
function toTutorialTrack(value: string | undefined | null): TutorialTrack {
	return (value && (tutorial_tracks as string[]).includes(value)) ? value as TutorialTrack : 'leekscript'
}

// Suffixe ajouté au titre (et donc au slug) des pages d'encyclopédie d'une piste donnée.
// La piste LeekScript conserve les pages historiques (sans suffixe) ; les autres pistes
// utilisent des pages dédiées « Titre (JavaScript) », « Titre (Python) ».
// Pas de « / » dans le suffixe : ce serait interprété comme séparateur de chemin dans l'URL.
function tutorialTitleSuffix(track: TutorialTrack): string {
	switch (track) {
		case 'javascript': return ' (JavaScript)'
		case 'python': return ' (Python)'
		default: return ''
	}
}

export { tutorial_items, tutorial_tracks, tutorialTrackForLanguage, toTutorialTrack, tutorialTitleSuffix, tutorialLocale }
export type { TutorialTrack }