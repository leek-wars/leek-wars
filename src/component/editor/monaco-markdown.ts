import type * as Monaco from 'monaco-editor'
import { colorDecoratorOptions } from './monaco-color-decorators'
import { defineLeekWarsThemes } from './monaco-themes'
import { LeekWars } from '@/model/leekwars'

// Éditeur Monaco pour du markdown : l'édition des pages de l'encyclopédie et le mode
// « Code » de <markdown-editor> (forum). Ces pages importent Monaco sans passer par
// monaco.ts, qui est la configuration de l'éditeur d'IA.

export type MonacoModule = typeof Monaco
export type MonacoLifecycle = typeof import('./monaco-dispose')

/**
 * Charge Monaco et son cycle de vie commun (voir monaco-dispose.ts). Toujours en import
 * dynamique : une arête statique vers Monaco ferait précharger son chunk (plusieurs Mo)
 * sur toutes les routes qui importent ce module.
 */
export function loadMonaco(): Promise<{ monaco: MonacoModule, lifecycle: MonacoLifecycle }> {
	return Promise.all([import('monaco-editor'), import('./monaco-dispose')])
		.then(([monaco, lifecycle]) => ({ monaco, lifecycle }))
}

export function markdownTheme() {
	return LeekWars.darkMode ? 'leek-wars-dark' : 'leek-wars'
}

export function createMarkdownEditor(monaco: MonacoModule, container: HTMLElement, value: string, options: Monaco.editor.IStandaloneEditorConstructionOptions = {}) {
	// L'éditeur suit le thème du site : thèmes maison.
	defineLeekWarsThemes(monaco)
	return monaco.editor.create(container, {
		value,
		language: 'markdown',
		automaticLayout: true,
		wordWrap: 'on',
		fontSize: 14,
		lineHeight: 22,
		theme: markdownTheme(),
		tabSize: 4,
		insertSpaces: false,
		minimap: { enabled: false },
		scrollBeyondLastLine: false,
		overviewRulerLanes: 0,
		overviewRulerBorder: false,
		renderLineHighlight: 'line',
		accessibilitySupport: 'off', // Workaround Firefox : sélection backward + remplacement
		...colorDecoratorOptions,
		...options,
	})
}
