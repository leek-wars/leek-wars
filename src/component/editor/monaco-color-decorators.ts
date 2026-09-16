import type * as monaco from 'monaco-editor'

// Le calcul par défaut des couleurs (pastille devant `#ff0000`) se fait dans le worker Monaco avec
// une regex à lookbehind, non supportée par Safari < 16.4 (iOS 15) : le worker lève « Invalid regular
// expression: invalid group specifier name » à chaque frappe (#4693). On coupe donc les pastilles sur
// ces navigateurs — l'app n'enregistre aucun provider de couleurs, il n'y a rien d'autre à y perdre,
// et couper la détection entière évite aussi le calcul à vide à chaque frappe. Ailleurs, comportement
// Monaco d'origine. La regex de test passe par `new RegExp` : en littérale, elle ferait échouer le
// parsing du bundle sur ces mêmes navigateurs.
const lookbehindSupported = (() => {
	try {
		new RegExp('(?<=a)b')
		return true
	} catch {
		return false
	}
})()

// À étaler dans les options de tout éditeur créé (`monaco.editor.create`, `createDiffEditor`).
export const colorDecoratorOptions: monaco.editor.IEditorOptions = lookbehindSupported ? {} : { colorDecorators: false }
