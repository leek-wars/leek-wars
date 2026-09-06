import type * as Monaco from 'monaco-editor'

/**
 * Détruit un éditeur Monaco en détachant d'abord son modèle.
 *
 * Monaco n'annule les opérations liées à l'état de l'éditeur (« Peek references », « Aller à la
 * définition ») que sur onDidChangeModel : `dispose()` seul les laisse en vol, et quand la réponse
 * arrive le widget peek s'ouvre sur un éditeur détruit (#5026, #5008, #5027). Détacher le modèle
 * annule le jeton. Le modèle lui-même n'est pas détruit, il appartient à l'appelant.
 */
export function disposeEditor(editor: Monaco.editor.IStandaloneCodeEditor | Monaco.editor.IStandaloneDiffEditor | null | undefined) {
	if (!editor) return
	// L'éditeur de diff accepte null sans le déclarer dans sa signature.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(editor as any).setModel(null)
	editor.dispose()
}
