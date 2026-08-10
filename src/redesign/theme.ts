import { onUnmounted, watch } from 'vue'
import { LeekWars } from '@/model/leekwars'

/**
 * Le mockup Leek Wars 3.0 pilote sa palette par html[data-theme="dark"|"light"],
 * le site par LeekWars.darkMode (localStorage `theme` + classe .dark sur #app).
 * On branche le premier sur le second : un seul réglage de thème pour le joueur.
 *
 * html[data-redesign] active les jetons de design, qui n'existent pas ailleurs.
 * Les deux attributs sont retirés en quittant la page, pour que le reste du site
 * retrouve exactement son état d'origine.
 */
export function useRedesignTheme() {
	const root = document.documentElement
	root.dataset.redesign = ''
	const stop = watch(() => LeekWars.darkMode, (dark) => {
		root.dataset.theme = dark ? 'dark' : 'light'
	}, { immediate: true })
	onUnmounted(() => {
		stop()
		delete root.dataset.redesign
		delete root.dataset.theme
	})
}
