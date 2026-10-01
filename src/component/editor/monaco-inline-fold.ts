import * as monaco from 'monaco-editor'
import { codeMask, findInlineFoldRegions, foldLine, INLINE_FOLD_MIN_LENGTH, mayHaveInlineFold, unfoldBreakOffsets, type FoldedLine, type InlineFoldRegion } from './inline-fold'
import './monaco-inline-fold.scss'

// Repli « en ligne » des longs tableaux : `COEFS = [0.5, 0.25, …]` sur 800 caractères se
// réduit à `COEFS = [⋯ 84]`. Monaco ne replie que des lignes entières. Ici, une décoration cache
// l'intérieur de la paire (CSS), un texte injecté affiche le « ⋯ », et le calcul des retours à la
// ligne est recalé pour ignorer les caractères cachés : sans ça, la ligne repliée garderait ses
// neuf lignes d'écran, vides. Le chevron est posé dans la marge, à la place de ceux de Monaco.

const LANGUAGES = new Set(['leekscript', 'python', 'javascript', 'typescript', 'json'])
const TOGGLE_CLASS = 'inline-fold-toggle'
const PLACEHOLDER_CLASS = 'inline-fold-placeholder'
// Source de nos propres déplacements du curseur, que followCursor ignore
const SOURCE = 'inlineFold'
// Clé des plis dans le view state de l'éditeur, à côté de ceux de Monaco
const STATE_KEY = 'leekwars.inlineFolds'

const EXPANDED_TOGGLE: monaco.editor.IModelDecorationOptions = {
	isWholeLine: true,
	firstLineDecorationClassName: 'codicon codicon-folding-expanded ' + TOGGLE_CLASS,
}
const COLLAPSED_TOGGLE: monaco.editor.IModelDecorationOptions = {
	isWholeLine: true,
	firstLineDecorationClassName: 'codicon codicon-folding-collapsed ' + TOGGLE_CLASS,
}

/** Un pli et le texte qu'il cache. Sert aussi de marque sur le « ⋯ » (attachedData). */
class Fold {
	constructor(readonly text: string, readonly count: number) {}
}

// Internes de Monaco 0.55 absents du .d.ts : le découpage des lignes du modèle de vue.
interface LineInjectedText {
	column: number
	options: { content: string, attachedData?: unknown }
}
interface LineBreakData {
	injectionOffsets: number[] | null
	breakOffsets: number[]
}
interface LineBreaksComputer {
	addRequest(lineText: string, injectedText: LineInjectedText[] | null, previous: LineBreakData | null): void
	finalize(): (LineBreakData | null)[]
}
interface ViewModelLines {
	createLineBreaksComputer(...args: unknown[]): LineBreaksComputer
}

// Enveloppe le calcul des retours à la ligne : une ligne qui porte un « ⋯ » est découpée comme si
// ses plages cachées n'existaient pas, puis les coupures sont reportées sur le texte complet.
function foldingLineBreaksComputer(computer: LineBreaksComputer): LineBreaksComputer {
	const requests: ({ folded: FoldedLine, injected: LineInjectedText[] } | null)[] = []
	return {
		addRequest(lineText, injectedText, previous) {
			const injected = injectedText ?? []
			const hidden = injected.flatMap((text) => {
				const fold = text.options.attachedData
				return fold instanceof Fold ? [{ start: text.column - 1, length: fold.text.length }] : []
			})
			if (!hidden.length) {
				requests.push(null)
				computer.addRequest(lineText, injectedText, previous)
				return
			}
			const folded = foldLine(lineText, injected.map((text) => ({ offset: text.column - 1, length: text.options.content.length })), hidden)
			requests.push({ folded, injected })
			computer.addRequest(folded.text, folded.kept.map((k, i) => ({ ...injected[k], column: folded.offsets[i] + 1 })), null)
		},
		finalize() {
			const result = computer.finalize()
			requests.forEach((request, i) => {
				const data = result[i]
				if (!request || !data) return
				// Monaco modifie lui-même ces objets en place (createLineBreaksFromPreviousLineBreaks)
				data.injectionOffsets = request.folded.kept.map((k) => request.injected[k].column - 1)
				data.breakOffsets = unfoldBreakOffsets(data.breakOffsets, request.folded.insertions)
			})
			return result
		},
	}
}

function lineIndent(text: string, tabSize: number): number {
	let column = 0
	for (const c of text) {
		if (c === ' ') column++
		else if (c === '\t') column += tabSize - (column % tabSize)
		else return column
	}
	return -1
}

// Ligne qui ouvre un bloc plus indenté : Monaco y pose son propre chevron (repli par indentation)
// et un clic replierait les deux. On lui laisse la place.
function opensIndentedBlock(model: monaco.editor.ITextModel, lineNumber: number, text: string): boolean {
	const tabSize = model.getOptions().tabSize
	const indent = lineIndent(text, tabSize)
	for (let line = lineNumber + 1; line <= model.getLineCount(); line++) {
		const next = lineIndent(model.getLineContent(line), tabSize)
		if (next >= 0) return next > indent
	}
	return false
}

/** Intérieur de la paire, ce que le pli cache. */
function regionRange(lineNumber: number, region: InlineFoldRegion) {
	return new monaco.Range(lineNumber, region.open + 2, lineNumber, region.close + 1)
}

export interface InlineFolding extends monaco.IDisposable {
	/** Range les plis du modèle affiché dans son view state (`editor.saveViewState()`). */
	saveState(viewState: monaco.editor.ICodeEditorViewState): void
	/** Replie ce que le view state avait rangé, avant `editor.restoreViewState` (même mise en page). */
	restoreState(viewState: monaco.editor.ICodeEditorViewState): void
}

/** Branche le repli en ligne sur un éditeur. */
export function installInlineFolding(editor: monaco.editor.ICodeEditor): InlineFolding {
	// Plis du modèle affiché, dans l'ordre de leurs décorations dans `hidden`
	let folds: Fold[] = []
	const hidden = editor.createDecorationsCollection()
	const toggles = editor.createDecorationsCollection()
	let foldable = new Map<number, { regions: InlineFoldRegion[], toggle: boolean }>()
	// Paires des lignes du dernier passage, par texte de ligne : seules les lignes modifiées sont relues
	let cache = new Map<string, InlineFoldRegion[]>()
	let scanTimeout: ReturnType<typeof setTimeout> | undefined
	let lines: ViewModelLines | null = null
	// Le texte caché reste dans la ligne d'écran du pli : au-delà de 10 000 caractères, Monaco cesse de
	// la dessiner et le `]` disparaît. Avec le retour à la ligne, les autres lignes d'écran sont courtes.
	const stopRenderingLineAfter = editor.getOption(monaco.editor.EditorOption.stopRenderingLineAfter)
	editor.updateOptions({ stopRenderingLineAfter: -1 })

	function patchLineBreaks(): boolean {
		const current = (editor as unknown as { _getViewModel?(): { _lines?: ViewModelLines } | undefined })._getViewModel?.()?._lines
		// Les très gros modèles ne sont pas découpés (ViewModelLinesFromModelAsIs) : pas de repli.
		if (!current || typeof current.createLineBreaksComputer !== 'function' || !('modelLineProjections' in current)) return false
		if (current !== lines) {
			const original = current.createLineBreaksComputer
			current.createLineBreaksComputer = function (this: ViewModelLines, ...args: unknown[]) {
				return foldingLineBreaksComputer(original.apply(this, args))
			}
			lines = current
		}
		return true
	}

	/** Plis et leur plage actuelle, que Monaco suit au fil des éditions. */
	function current() {
		return folds.flatMap((fold, i) => {
			const range = hidden.getRange(i)
			return range ? [{ fold, range }] : []
		})
	}

	function setFolds(entries: { fold: Fold, range: monaco.IRange }[]) {
		folds = entries.map((entry) => entry.fold)
		hidden.set(entries.map(({ fold, range }) => ({
			range,
			options: {
				inlineClassName: 'inline-fold-hidden',
				inlineClassNameAffectsLetterSpacing: true,
				stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
				before: {
					content: fold.count > 1 ? '⋯ ' + fold.count : '⋯',
					inlineClassName: PLACEHOLDER_CLASS,
					inlineClassNameAffectsLetterSpacing: true,
					attachedData: fold,
				},
			},
		})))
		renderToggles()
	}

	function renderToggles() {
		const collapsedLines = new Set(current().map(({ range }) => range.startLineNumber))
		const decorations: monaco.editor.IModelDeltaDecoration[] = []
		for (const [line, entry] of foldable) {
			if (entry.toggle) decorations.push({ range: new monaco.Range(line, 1, line, 1), options: collapsedLines.has(line) ? COLLAPSED_TOGGLE : EXPANDED_TOGGLE })
		}
		toggles.set(decorations)
	}

	function scan() {
		clearTimeout(scanTimeout)
		const model = editor.getModel()
		const next = new Map<string, InlineFoldRegion[]>()
		foldable = new Map()
		if (model && LANGUAGES.has(model.getLanguageId()) && patchLineBreaks()) {
			for (let line = 1; line <= model.getLineCount(); line++) {
				if (model.getLineLength(line) < INLINE_FOLD_MIN_LENGTH + 2) continue
				const text = model.getLineContent(line)
				if (!mayHaveInlineFold(text)) continue
				const regions = cache.get(text) ?? findInlineFoldRegions(text, codeMask(text, model.getLanguageId()))
				next.set(text, regions)
				if (regions.length) foldable.set(line, { regions, toggle: !opensIndentedBlock(model, line, text) })
			}
		}
		cache = next
		// Un pli dont la paire a disparu (crochet effacé, langage changé…) se rouvre.
		const kept = current().filter(({ range }) => foldable.get(range.startLineNumber)?.regions.some((region) => regionRange(range.startLineNumber, region).containsRange(range)))
		if (kept.length !== folds.length) setFolds(kept)
		else renderToggles()
	}

	/** Pli qui cache la position : strictement à l'intérieur, ses deux bords restent visibles. */
	function foldAt(position: monaco.IPosition) {
		return current().find(({ range }) => range.startLineNumber === position.lineNumber && position.column > range.startColumn && position.column < range.endColumn)
	}

	function collapse(model: monaco.editor.ITextModel, targets: { lineNumber: number, region: InlineFoldRegion }[]) {
		const entries = current()
		const before = entries.length
		for (const { lineNumber, region } of targets) {
			const range = regionRange(lineNumber, region)
			if (entries.some((entry) => monaco.Range.areIntersecting(entry.range, range))) continue
			entries.push({ fold: new Fold(model.getValueInRange(range), region.count), range })
		}
		if (entries.length === before) return
		setFolds(entries)
		// Un curseur resté dedans serait invisible : il passe au bord gauche du pli.
		let moved = false
		const selections = (editor.getSelections() ?? []).map((selection) => {
			const hit = foldAt(selection.getPosition()) ?? foldAt(selection.getSelectionStart())
			if (!hit) return selection
			moved = true
			return monaco.Selection.fromPositions(hit.range.getStartPosition())
		})
		if (moved) editor.setSelections(selections, SOURCE)
	}

	function expand(opened: Set<Fold>) {
		if (opened.size) setFolds(current().filter(({ fold }) => !opened.has(fold)))
	}

	function toggleLine(lineNumber: number) {
		const model = editor.getModel()
		const entry = foldable.get(lineNumber)
		if (!model || !entry) return
		const onLine = current().filter(({ range }) => range.startLineNumber === lineNumber)
		if (onLine.length) expand(new Set(onLine.map(({ fold }) => fold)))
		else collapse(model, entry.regions.map((region) => ({ lineNumber, region })))
	}

	// Où poser un curseur entré dans le pli en se déplaçant : sur la même ligne, le bord opposé à
	// celui d'où il vient ; en arrivant d'une autre ligne, la position visible la plus proche à l'écran.
	function jumpTarget(model: monaco.editor.ITextModel, range: monaco.Range, previous: monaco.Position | undefined): monaco.Position {
		const start = range.getStartPosition()
		if (!previous) return start
		if (previous.lineNumber === range.startLineNumber) return previous.column <= range.startColumn ? range.getEndPosition() : start
		const x = (position: monaco.IPosition) => editor.getScrolledVisiblePosition(position)?.left
		const from = x(previous)
		if (from === undefined) return start
		const candidates = [start, range.getEndPosition(), new monaco.Position(range.startLineNumber, model.getLineMaxColumn(range.startLineNumber))]
		let best = start
		let distance = Infinity
		for (const candidate of candidates) {
			const left = x(candidate)
			if (left !== undefined && Math.abs(left - from) < distance) {
				best = candidate
				distance = Math.abs(left - from)
			}
		}
		return best
	}

	function followCursor(model: monaco.editor.ITextModel, e: monaco.editor.ICursorSelectionChangedEvent) {
		// Déplacement explicite (flèches, mot suivant, début de ligne…) : le curseur enjambe le pli.
		// Sinon (recherche, saut vers une erreur ou un résultat, annulation), on déplie pour montrer la cible.
		const moving = e.reason === monaco.editor.CursorChangeReason.Explicit && e.source !== 'mouse'
		const opened = new Set<Fold>()
		let moved = false
		const selections = [e.selection, ...e.secondarySelections].map((selection, i) => {
			const anchor = selection.isEmpty() ? undefined : foldAt(selection.getSelectionStart())
			const active = foldAt(selection.getPosition())
			if (anchor) opened.add(anchor.fold)
			if (!active) return selection
			if (!moving || anchor) {
				opened.add(active.fold)
				return selection
			}
			moved = true
			const target = jumpTarget(model, active.range, e.oldSelections?.[i]?.getPosition())
			return selection.isEmpty() ? monaco.Selection.fromPositions(target) : monaco.Selection.fromPositions(selection.getSelectionStart(), target)
		})
		if (moved) editor.setSelections(selections, SOURCE)
		expand(opened)
	}

	const disposables: monaco.IDisposable[] = [
		editor.onMouseDown((e) => {
			const { type, element, position } = e.target
			if (!e.event.leftButton || !position) return
			if (type === monaco.editor.MouseTargetType.GUTTER_LINE_DECORATIONS && element?.classList.contains(TOGGLE_CLASS)) {
				toggleLine(position.lineNumber)
			} else if (type === monaco.editor.MouseTargetType.CONTENT_TEXT && element?.classList.contains(PLACEHOLDER_CLASS)) {
				// Clic sur le « ⋯ » : Monaco le situe au bord gauche du pli qu'il remplace
				expand(new Set(current().filter(({ range }) => range.containsPosition(position)).map(({ fold }) => fold)))
			}
		}),
		editor.onDidChangeCursorSelection((e) => {
			const model = editor.getModel()
			if (e.source !== SOURCE && model && folds.length) followCursor(model, e)
		}),
		editor.onKeyDown((e) => {
			const backspace = e.keyCode === monaco.KeyCode.Backspace
			if (!folds.length || e.shiftKey || (!backspace && e.keyCode !== monaco.KeyCode.Delete)) return
			const selections = editor.getSelections() ?? []
			const touched = current().filter(({ range }) => selections.some((s) => s.isEmpty() && s.positionLineNumber === range.startLineNumber && s.positionColumn === (backspace ? range.endColumn : range.startColumn)))
			if (!touched.length) return
			// Effacer contre le pli supprimerait un caractère caché : on déplie à la place.
			e.preventDefault()
			e.stopPropagation()
			expand(new Set(touched.map(({ fold }) => fold)))
		}),
		editor.onDidChangeModelContent(() => {
			const model = editor.getModel()
			if (!model) return
			// Texte caché modifié (remplacer tout, annuler…) : on le montre.
			const intact = current().filter(({ fold, range }) => model.getValueInRange(range) === fold.text)
			if (intact.length !== folds.length) setFolds(intact)
			clearTimeout(scanTimeout)
			scanTimeout = setTimeout(scan, 300)
		}),
		editor.onDidChangeModelLanguage(() => {
			cache = new Map()
			scan()
		}),
		editor.onWillChangeModel(() => {
			clearTimeout(scanTimeout)
			// Monaco retire nos décorations du modèle qu'on quitte
			folds = []
		}),
		editor.onDidChangeModel(() => scan()),
	]

	scan()

	return {
		saveState(viewState) {
			viewState.contributionsState[STATE_KEY] = current().map(({ range }) => [range.startLineNumber, range.startColumn])
		},
		restoreState(viewState) {
			const model = editor.getModel()
			const saved: unknown = viewState.contributionsState?.[STATE_KEY]
			if (!model || !Array.isArray(saved)) return
			collapse(model, saved.flatMap(([lineNumber, column]) => {
				const region = foldable.get(lineNumber)?.regions.find((r) => regionRange(lineNumber, r).containsPosition({ lineNumber, column }))
				return region ? [{ lineNumber, region }] : []
			}))
		},
		dispose() {
			clearTimeout(scanTimeout)
			for (const disposable of disposables) disposable.dispose()
			hidden.clear()
			toggles.clear()
			editor.updateOptions({ stopRenderingLineAfter })
			if (lines) delete (lines as Partial<ViewModelLines>).createLineBreaksComputer
		},
	}
}
