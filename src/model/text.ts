/**
 * Texte replié pour une recherche : minuscules et sans accent, à appliquer des deux
 * côtés de la comparaison — « ecran » trouve « écran », « FRAISE » trouve « fraise ».
 */
export function foldText(text: string): string {
	return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}
