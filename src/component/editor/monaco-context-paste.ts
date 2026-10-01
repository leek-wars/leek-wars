// Rend utilisable le « Coller » du menu contextuel de Monaco, qui ne fait rien du tout.
//
// L'implémentation `code-editor` de `editor.action.clipboardPasteAction` commence par
// `accessor.get(IProductService)` (pour une mesure de durée envoyée en télémétrie). Or le build
// standalone n'enregistre jamais ce service : l'appel lève `[invokeFunction] unknown service
// 'productService'` avant d'avoir rien fait, l'exception interrompt la boucle des implémentations de
// la MultiCommand, et le clic sur « Coller » reste sans effet — en silence. Couper et copier
// n'interrogent pas ce service et fonctionnent, d'où un menu qui semble à moitié cassé.
//
// On enregistre donc une implémentation prioritaire, qui lit le presse-papiers par l'API asynchrone.
// Elle ne détourne rien : dans un navigateur cette commande n'a pas de raccourci (Monaco laisse
// Ctrl+V au chemin natif, `kbOpts` n'est posé que sur bureau), elle n'est atteignable que par le menu
// contextuel et la palette de commandes.
import { editor as monacoEditor, type editor as monacoEditorNs } from 'monaco-editor/esm/vs/editor/editor.api.js'
import { InMemoryClipboardMetadataManager } from 'monaco-editor/esm/vs/editor/browser/controller/editContext/clipboardUtils.js'
// La contribution est livrée avec un `.d.ts` vide : on récupère la commande par le namespace, comme
// `monaco.ts` le fait pour les défauts TypeScript.
import * as clipboardContribution from 'monaco-editor/esm/vs/editor/contrib/clipboard/browser/clipboard.js'

interface MultiCommand {
	addImplementation(priority: number, name: string, implementation: () => boolean | Promise<void>): unknown
}

const pasteAction = (clipboardContribution as unknown as { PasteAction?: MultiCommand }).PasteAction

pasteAction?.addImplementation(20000, 'leek-wars-async-clipboard', () => {
	// Le menu rend le focus à l'éditeur avant d'exécuter l'action ; la palette, elle, ne le fait pas.
	const editors = monacoEditor.getEditors()
	const target = editors.find((e) => e.hasTextFocus()) ?? editors.find((e) => e.hasWidgetFocus())
	if (!target || !target.getModel() || target.getOption(monacoEditor.EditorOption.readOnly)) return false
	return paste(target)
})

async function paste(target: monacoEditorNs.ICodeEditor) {
	let text: string
	try {
		text = await navigator.clipboard.readText()
	} catch {
		// Presse-papiers refusé (permission non accordée, ou hors geste utilisateur) : rien à coller.
		return
	}
	if (!text) return
	// Mêmes métadonnées que le chemin natif, pour qu'une ligne copiée sans sélection soit recollée
	// sur sa propre ligne et qu'un copier multi-curseurs reparte sur plusieurs curseurs.
	const metadata = InMemoryClipboardMetadataManager.INSTANCE.get(text)
	target.focus()
	target.trigger('keyboard', 'paste', {
		text,
		pasteOnNewLine: target.getOption(monacoEditor.EditorOption.emptySelectionClipboard) && !!metadata?.isFromEmptySelection,
		multicursorText: metadata?.multicursorText ?? null,
		mode: metadata?.mode ?? null,
	})
}
