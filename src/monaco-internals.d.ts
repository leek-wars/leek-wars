// Internes de Monaco (livrés sans .d.ts), utilisés par src/component/editor/monaco-dispose.ts
// pour ré-armer la fabrique globale des survols après la destruction d'un éditeur.
// Fichier script (sans import/export) : dans un module, `declare module` serait une augmentation.

declare module 'monaco-editor/esm/vs/base/browser/ui/hover/hoverDelegateFactory.js' {
	export function setHoverDelegateFactory(factory: (placement: 'mouse' | 'element', enableInstantHover: boolean) => unknown): void
}

declare module 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js' {
	export const StandaloneServices: { get<T>(serviceId: unknown): T }
}

declare module 'monaco-editor/esm/vs/platform/instantiation/common/instantiation.js' {
	export const IInstantiationService: unknown
}

declare module 'monaco-editor/esm/vs/platform/hover/browser/hover.js' {
	export const WorkbenchHoverDelegate: unknown
}

// Métadonnées du dernier copier/couper (retour à la ligne, multi-curseurs), utilisées par
// src/component/editor/monaco-context-paste.ts pour que le « Coller » du menu contextuel
// se comporte comme le Ctrl+V natif.
declare module 'monaco-editor/esm/vs/editor/browser/controller/editContext/clipboardUtils.js' {
	export const InMemoryClipboardMetadataManager: {
		INSTANCE: {
			get(pastedText: string): { isFromEmptySelection?: boolean, multicursorText?: string[] | null, mode?: string | null } | null
		}
	}
}
