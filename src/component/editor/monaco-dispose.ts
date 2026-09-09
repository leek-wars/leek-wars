import type * as Monaco from 'monaco-editor'
import { setHoverDelegateFactory } from 'monaco-editor/esm/vs/base/browser/ui/hover/hoverDelegateFactory.js'
import { StandaloneServices } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js'
import { IInstantiationService } from 'monaco-editor/esm/vs/platform/instantiation/common/instantiation.js'
import { WorkbenchHoverDelegate } from 'monaco-editor/esm/vs/platform/hover/browser/hover.js'

interface InstantiationService {
	createInstance(ctor: unknown, ...args: unknown[]): unknown
}

/**
 * Ré-arme la fabrique globale des survols de Monaco sur le service d'instanciation global.
 *
 * Chaque StandaloneCodeEditor écrase `setHoverDelegateFactory` avec SON service d'instanciation
 * (standaloneCodeEditor.js). Pour les deux éditeurs internes d'un éditeur de diff, ce service est
 * un enfant détruit avec le diff : la fabrique globale pointe alors sur un service mort, et le
 * prochain ActionBar créé sans délégué explicite — l'en-tête du widget « Peek » d'un éditeur
 * encore vivant, par exemple — jette `InstantiationService has been disposed` (#5036, #5037,
 * #5025). Bug présent dans monaco-editor 0.55.1 et 0.56.0 ; même fabrique que celle posée par
 * StandaloneCodeEditor, mais sur le service global, qui n'est jamais détruit.
 */
function rearmHoverDelegateFactory() {
	const instantiationService = StandaloneServices.get<InstantiationService>(IInstantiationService)
	setHoverDelegateFactory((placement, instantHover) => instantiationService.createInstance(WorkbenchHoverDelegate, placement, { instantHover }, {}))
}

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
	rearmHoverDelegateFactory()
}
