/**
 * Utilitaires pour le parsing et la résolution des conflits de merge git.
 * Inclut les helpers Monaco pour les décorations et CodeLens.
 */
import * as monaco from 'monaco-editor'

export interface MergeConflict {
	/** 0-based line index of <<<<<<< */
	startLine: number
	/** 0-based line index of ======= */
	separatorLine: number
	/** 0-based line index of >>>>>>> */
	endLine: number
	currentLabel: string
	incomingLabel: string
}

/**
 * Parse les marqueurs de conflit dans un contenu textuel.
 * Retourne la liste des conflits trouvés.
 */
export function parseConflicts(content: string): MergeConflict[] {
	const lines = content.split('\n')
	const conflicts: MergeConflict[] = []
	let currentStart = -1
	let currentLabel = ''
	let separator = -1

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		if (line.startsWith('<<<<<<<')) {
			currentStart = i
			currentLabel = line.substring(8).trim()
		} else if (line.startsWith('=======') && currentStart !== -1) {
			separator = i
		} else if (line.startsWith('>>>>>>>') && currentStart !== -1 && separator !== -1) {
			conflicts.push({
				startLine: currentStart,
				separatorLine: separator,
				endLine: i,
				currentLabel,
				incomingLabel: line.substring(8).trim(),
			})
			currentStart = -1
			separator = -1
		}
	}
	return conflicts
}

/**
 * Vérifie si un contenu contient des marqueurs de conflit.
 */
export function hasConflictMarkers(content: string): boolean {
	return content.includes('<<<<<<<') && content.includes('=======') && content.includes('>>>>>>>')
}

/**
 * Résout un conflit spécifique dans un contenu textuel.
 * Retourne le nouveau contenu avec le conflit résolu.
 */
export function resolveConflict(content: string, conflict: MergeConflict, choice: 'current' | 'incoming' | 'both'): string {
	const lines = content.split('\n')

	let replacement: string[]
	if (choice === 'current') {
		replacement = lines.slice(conflict.startLine + 1, conflict.separatorLine)
	} else if (choice === 'incoming') {
		replacement = lines.slice(conflict.separatorLine + 1, conflict.endLine)
	} else {
		replacement = [
			...lines.slice(conflict.startLine + 1, conflict.separatorLine),
			...lines.slice(conflict.separatorLine + 1, conflict.endLine),
		]
	}

	const before = lines.slice(0, conflict.startLine)
	const after = lines.slice(conflict.endLine + 1)
	return [...before, ...replacement, ...after].join('\n')
}

/**
 * Résout tous les conflits d'un contenu avec le même choix.
 * Résout du dernier au premier pour ne pas décaler les indices.
 */
export function resolveAllConflicts(content: string, choice: 'current' | 'incoming' | 'both'): string {
	let result = content
	let conflicts = parseConflicts(result)
	for (let i = conflicts.length - 1; i >= 0; i--) {
		result = resolveConflict(result, conflicts[i], choice)
	}
	return result
}

/**
 * Construit les décorations Monaco pour les zones de conflit.
 */
export function buildConflictDecorations(model: monaco.editor.ITextModel, conflicts: MergeConflict[]): monaco.editor.IModelDeltaDecoration[] {
	const decorations: monaco.editor.IModelDeltaDecoration[] = []
	for (const conflict of conflicts) {
		const startCol = model.getLineMaxColumn(conflict.startLine + 1)
		const endCol = model.getLineMaxColumn(conflict.endLine + 1)
		// Ligne <<<<<<<
		decorations.push({
			range: new monaco.Range(conflict.startLine + 1, 1, conflict.startLine + 1, 1),
			options: { isWholeLine: true, className: 'merge-marker-current', overviewRuler: { color: '#4caf50', position: monaco.editor.OverviewRulerLane.Full } }
		})
		decorations.push({
			range: new monaco.Range(conflict.startLine + 1, startCol, conflict.startLine + 1, startCol),
			options: { afterContentClassName: 'merge-label-current' }
		})
		// Zone current
		if (conflict.separatorLine > conflict.startLine + 1) {
			decorations.push({
				range: new monaco.Range(conflict.startLine + 2, 1, conflict.separatorLine, 1),
				options: { isWholeLine: true, className: 'merge-current-zone' }
			})
		}
		// Zone incoming
		if (conflict.endLine > conflict.separatorLine + 1) {
			decorations.push({
				range: new monaco.Range(conflict.separatorLine + 2, 1, conflict.endLine, 1),
				options: { isWholeLine: true, className: 'merge-incoming-zone' }
			})
		}
		// Ligne >>>>>>>
		decorations.push({
			range: new monaco.Range(conflict.endLine + 1, 1, conflict.endLine + 1, 1),
			options: { isWholeLine: true, className: 'merge-marker-incoming', overviewRuler: { color: '#2196f3', position: monaco.editor.OverviewRulerLane.Full } }
		})
		decorations.push({
			range: new monaco.Range(conflict.endLine + 1, endCol, conflict.endLine + 1, endCol),
			options: { afterContentClassName: 'merge-label-incoming' }
		})
	}
	return decorations
}

/**
 * Applique un choix de résolution sur le modèle Monaco (undoable via pushEditOperations).
 */
export function applyConflictResolution(model: monaco.editor.ITextModel, conflictIndex: number, choice: 'current' | 'incoming' | 'both'): boolean {
	const content = model.getValue()
	const conflicts = parseConflicts(content)
	if (conflictIndex >= conflicts.length) return false
	const resolved = resolveConflict(content, conflicts[conflictIndex], choice)
	model.pushEditOperations([], [{
		range: model.getFullModelRange(),
		text: resolved,
	}], () => null)
	return true
}

/**
 * Enregistre les CodeLens et commandes pour la résolution de conflits.
 * Retourne un disposable qui nettoie le provider ET les commandes.
 */
export function registerConflictCodeLens(
	editor: monaco.editor.IStandaloneCodeEditor,
	model: monaco.editor.ITextModel,
	conflicts: MergeConflict[],
	onResolve: () => void
): monaco.IDisposable {
	const commandIds: string[] = []
	for (let i = 0; i < conflicts.length; i++) {
		const idx = i
		const resolve = (choice: 'current' | 'incoming' | 'both') => {
			applyConflictResolution(model, idx, choice)
			onResolve()
		}
		commandIds.push(
			editor.addCommand(0, () => resolve('current')) || '',
			editor.addCommand(0, () => resolve('incoming')) || '',
			editor.addCommand(0, () => resolve('both')) || '',
		)
	}

	const provider = monaco.languages.registerCodeLensProvider('leekscript', {
		provideCodeLenses: (m) => {
			if (m !== model) return { lenses: [], dispose() {} }
			const lenses: monaco.languages.CodeLens[] = []
			for (let i = 0; i < conflicts.length; i++) {
				const line = conflicts[i].startLine + 1
				const base = i * 3
				lenses.push({ range: new monaco.Range(line, 1, line, 1), command: { id: commandIds[base], title: 'Accept Current' } })
				lenses.push({ range: new monaco.Range(line, 1, line, 1), command: { id: commandIds[base + 1], title: 'Accept Incoming' } })
				lenses.push({ range: new monaco.Range(line, 1, line, 1), command: { id: commandIds[base + 2], title: 'Accept Both' } })
			}
			return { lenses, dispose() {} }
		},
		resolveCodeLens: (_m, lens) => lens
	})

	return provider
}
