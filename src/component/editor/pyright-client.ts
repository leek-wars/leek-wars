// Pont LSP mince entre Monaco et Pyright (build navigateur @typefox/pyright-browser), pour valider les
// IA Python (.py) dans l'éditeur — noms indéfinis (dont `me` nu), syntaxe, types. 100% client : Pyright
// tourne dans un web worker, aucun aller-retour serveur.
//
// On n'utilise PAS monaco-languageclient (il exige le fork @codingame/monaco-vscode-api ; ce projet est
// sur monaco-editor vanilla). À la place : worker prébuilt + JSON-RPC LSP maison sur postMessage, et
// mapping manuel publishDiagnostics -> monaco.editor.setModelMarkers (owner 'pyright').
//
// Le worker est chargé PARESSEUSEMENT (bundle ~2 Mo) : rien n'est instancié tant qu'aucun .py n'est
// ouvert. Cf. pyright.ts (import dynamique) qui garde ce module hors du chunk principal.

import * as monaco from 'monaco-editor'
import { BrowserMessageReader, BrowserMessageWriter, createMessageConnection, type MessageConnection } from 'vscode-jsonrpc/browser'
import type { CompletionItem as LspCompletionItem, CompletionList as LspCompletionList, Diagnostic, Hover as LspHover, Location as LspLocation, MarkupContent, PublishDiagnosticsParams, ConfigurationParams, Range as LspRange } from 'vscode-languageserver-protocol'
import { importRoots } from './pyright-map'
import { mergeCompletionDocumentation } from './markdown-safe'
import { getLanguageForPath } from './file-types'
import { fileSystem } from '@/model/filesystem'
import { emitter } from '@/model/emitter'
// Stubs typeshed (stdlib Python) : @typefox/pyright-browser n'embarque PAS typeshed -> sans ça Pyright
// n'a aucun builtin (print/len/range... = « not defined »). Fournis par pyrightTypeshedPlugin
// (vite.config.ts), bundlés dans ce chunk lazy et seedés dans la FS du worker sous TYPESHED_ROOT.
import typeshedStdlib from 'virtual:pyright-typeshed'

const TYPESHED_ROOT = '/typeshed'
const TYPESHED_FILES: Record<string, string> = Object.fromEntries(
	Object.entries(typeshedStdlib).map(([relPath, content]) => [`${TYPESHED_ROOT}/${relPath}`, content]),
)
// Worker prébuilt (IIFE webpack). ?worker -> Vite émet le chunk et fournit le constructeur.
import PyrightWorker from '@typefox/pyright-browser/dist/pyright.worker.js?worker'
import { logger } from '@/utils/logger'

// En DEV, Vite sert le worker en module (un `import "/@vite/env"` est injecté en tête) : le worker
// principal (type module) boote, mais les threads d'analyse de fond que Pyright spawne LUI-MÊME
// (new Worker(location.href) SANS type module, cf BrowserWorkersHost) tombent sur « Cannot use import
// statement outside a module » -> onerror -> teardown : toute la vérif Python était morte en dev. On
// instancie donc depuis le fichier BRUT (?raw, aucune transformation) via un Blob classique ; les
// threads de fond rechargent la même URL blob (non révoquée exprès), en classique aussi. En build,
// la branche est éliminée (import.meta.env.DEV === false) et le ?worker émis par Vite est classique.
async function createWorker(): Promise<Worker> {
	if (import.meta.env.DEV) {
		const src = (await import('@typefox/pyright-browser/dist/pyright.worker.js?raw')).default
		return new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })))
	}
	return new PyrightWorker()
}

// Stub de l'API de combat, monté comme `__builtins__.pyi` à la racine : Pyright fusionne ses symboles
// dans le scope builtins de TOUS les fichiers — exactement la sémantique runtime (le generator pose
// les noms publics Fight/Weapon/Entity... sur les builtins, visibles du fichier principal ET des
// modules importés, sans le moindre import). Aucune injection d'import dans les documents : les
// positions Monaco et LSP coïncident, et le namespace des modules du joueur reste propre (au combat,
// `mon_module.Weapon` n'existe pas — ici non plus).
const STUB_PATH = '/__builtins__.pyi'
const MARKER_OWNER = 'pyright'

let connection: MessageConnection | null = null
let ready: Promise<void> | null = null
let currentStub = ''
// État par document ouvert. `refs` = nombre d'éditeurs affichant ce modèle (split view : le MÊME
// modèle Monaco, keyé par URI, peut être ouvert par 2 panneaux) -> on ne ferme (didClose + efface les
// marqueurs) qu'au dernier. `refs` est incrémenté SYNCHRONEMENT par openPy avant tout await, et
// décrémenté par closePy : ainsi un close qui arrive avant que l'open async n'ait fini annule
// proprement l'ouverture (reconcile voit refs<=0). `open` = didOpen déjà envoyé au worker.
// `lastText` = dernier contenu envoyé au worker (didOpen/didChange) : dédoublonne les didChange
// (chaque createFile/didChange coûte une réanalyse) et permet le flush juste avant une complétion.
interface DocState { refs: number, open: boolean, version: number, lastText: string }
const docs = new Map<string, DocState>() // uri -> état

// LSP DiagnosticSeverity (1..4) -> Monaco MarkerSeverity.
function severity(s: number | undefined): monaco.MarkerSeverity {
	switch (s) {
		case 1: return monaco.MarkerSeverity.Error
		case 2: return monaco.MarkerSeverity.Warning
		case 3: return monaco.MarkerSeverity.Info
		default: return monaco.MarkerSeverity.Hint
	}
}

// Réglages renvoyés à Pyright (workspace/configuration). typeCheckingMode 'basic' = noms indéfinis +
// erreurs de type de base. Les .py du fermier étant montés dans la FS du worker (cf seedPlayerFiles),
// reportMissingImports est actif : un import qui ne résout pas ici échouerait aussi au combat.
// extraPaths (dynamique) = dossiers contenant des .py, miroir du sys.path runtime (le generator monte
// /ai ET le dossier de l'IA d'entrée en tête de path ; sous-dossiers = packages).
let extraPaths: string[] = []
const pySettings = () => ({
	typeCheckingMode: 'basic',
	diagnosticMode: 'openFilesOnly',
	useLibraryCodeForTypes: false,
	autoImportCompletions: false,
	typeshedPaths: [TYPESHED_ROOT], // stdlib seedée dans la FS du worker (cf TYPESHED_FILES)
	extraPaths,
	diagnosticSeverityOverrides: {
		reportMissingImports: 'error',
		reportMissingModuleSource: 'none',
		reportSelfClsParameterName: 'none',
		reportUndefinedVariable: 'error',
	},
})

// Positions LSP (0-based) -> marqueurs Monaco (1-based). Les documents sont envoyés TELS QUELS
// (l'API vient du stub __builtins__.pyi, aucun import injecté) : les lignes coïncident.
function mapDiagnostics(diagnostics: Diagnostic[]): monaco.editor.IMarkerData[] {
	return diagnostics.map((d) => ({
		message: typeof d.message === 'string' ? d.message : d.message.value,
		severity: severity(d.severity),
		startLineNumber: d.range.start.line + 1,
		startColumn: d.range.start.character + 1,
		endLineNumber: d.range.end.line + 1,
		endColumn: d.range.end.character + 1,
		source: 'Pyright',
	}))
}

// --- Fichiers du joueur dans la FS du worker ---
// Les IA .py peuvent s'importer entre elles (le generator monte les fichiers du joueur sous /ai en
// tête de sys.path, sous-dossiers = packages). Pour que Pyright résolve ces imports (complétion,
// types, diagnostics), on monte TOUS les .py du fermier dans la FS in-memory du worker à leur path
// (racine = /), tels quels (les globales de l'API leur viennent du stub __builtins__.pyi, comme au
// runtime). Les documents ouverts restent portés par didOpen/didChange (l'overlay prime
// pour leur analyse, mais la résolution d'imports passe par la FS -> la copie FS existe en parallèle,
// rafraîchie à la fermeture du doc). Créations / renommages / suppressions arrivent par les événements
// du filesystem éditeur (ai-created / ai-path-changed / ai-deleted).
const seeded = new Set<string>() // paths (sans / initial) montés dans la FS du worker

function isPlayerPy(path: string): boolean {
	// getLanguageForPath (basename lowercasé) = même prédicat que le reste de l'éditeur : un `Bot.PY`
	// reçoit le langage python -> il doit aussi être monté ici, sinon ses importeurs voient une erreur.
	return getLanguageForPath(path) === 'python' && !path.startsWith('.trash/')
}

function fsUri(path: string): string {
	return monaco.Uri.file(path).toString()
}

/** Charge le code de tous les .py du fermier (modèle ouvert, cache IndexedDB ou ai/read) dans `out`
 *  ({ '/path': code }, rempli au fil de l'eau) pour le seed initial (initializationOptions.files).
 *  Ne touche PAS à `seeded` : ensure() l'alimente depuis le snapshot qu'il retient — ainsi un
 *  chargement qui résout APRÈS le timeout de boot ne marque rien comme monté à tort. */
async function loadPlayerPyFiles(out: Record<string, string>): Promise<void> {
	await Promise.all(Object.values(fileSystem.ais).filter((ai) => isPlayerPy(ai.path)).map(async (ai) => {
		try {
			out['/' + ai.path] = ai.model ? ai.model.getValue() : ((await fileSystem.load(ai)).code ?? '')
		} catch (e) {
			// Non monté : ses importeurs verront « import non résolu » (reportMissingImports) -> tracer.
			logger.warn('[pyright] seed impossible pour', ai.path, e)
		}
	}))
}

// Chemins de recherche = dossiers des IA d'ENTRÉE (assignées à un poireau), comme au runtime.
function currentImportRoots(): string[] {
	return importRoots(Object.values(fileSystem.leekAIs).filter(isPlayerPy))
}

// Recalcule les extraPaths ; pousse la config au worker si ça change (nouvelle IA d'entrée, renommage).
function maybeUpdateExtraPaths(): void {
	const next = currentImportRoots()
	if (next.join('\n') === extraPaths.join('\n')) return
	extraPaths = next
	connection?.sendNotification('workspace/didChangeConfiguration', { settings: { python: { analysis: pySettings() } } })
}

/** (Re)monte un .py dans la FS du worker (création, renommage, rafraîchissement à la fermeture). */
async function seedFile(path: string): Promise<void> {
	const ai = fileSystem.ais[path]
	const conn = connection
	if (!ai || !conn) return
	let code: string
	try {
		code = ai.model ? ai.model.getValue() : ((await fileSystem.load(ai)).code ?? '')
	} catch (e) {
		logger.warn('[pyright] seed impossible pour', path, e)
		return
	}
	// Re-vérifie APRÈS l'await : un renommage/suppression pendant le chargement rendrait ce montage
	// fantôme (fichier recréé à l'ancien path), et un teardown rendrait `seeded` menteur.
	if (connection !== conn || fileSystem.ais[path] !== ai) return
	conn.sendNotification('pyright/createFile', { uri: fsUri(path), text: code })
	seeded.add(path)
	maybeUpdateExtraPaths()
}

function removeSeededFile(path: string): void {
	if (!seeded.delete(path)) return
	connection?.sendNotification('pyright/deleteFile', { uri: fsUri(path) })
}

// Suivi du filesystem éditeur. Worker pas encore démarré : rien à faire, le seed initial de ensure()
// partira de l'état courant (seedFile/removeSeededFile sont des no-ops sans connexion).
emitter.on('ai-path-changed', ({ oldPath, newPath }) => {
	if (isPlayerPy(oldPath)) removeSeededFile(oldPath)
	if (newPath && isPlayerPy(newPath)) void seedFile(newPath)
})
emitter.on('ai-created', (path) => { if (isPlayerPy(path)) void seedFile(path) })
emitter.on('ai-deleted', (path) => { if (isPlayerPy(path)) removeSeededFile(path) })

// Réinitialise l'état pour permettre une nouvelle tentative (worker mort / boot échoué / connexion
// fermée). Les modèles gardent leurs marqueurs Pyright existants ; un ré-open les rafraîchira.
function teardown(): void {
	ready = null
	connection = null
	docs.clear()
	seeded.clear() // la FS du worker est partie avec lui : re-seed complet au prochain boot
}

// Démarre le worker + connexion LSP + initialize (une seule fois). Idempotent. En cas d'échec (worker
// qui ne boote pas, initialize sans réponse), `ready` est remis à null pour autoriser une reprise au
// prochain openPy plutôt que de rester bloqué sur une promesse rejetée/en attente à jamais.
function ensure(): Promise<void> {
	if (ready) return ready
	ready = (async () => {
		const filesAcc: Record<string, string> = {} // rempli au fil de l'eau par loadPlayerPyFiles
		const playerFilesPromise = loadPlayerPyFiles(filesAcc) // chargement en parallèle du boot
		const worker = await createWorker()
		worker.onerror = (e) => { logger.error('[pyright] worker error', e.message || e); teardown() }
		// Le worker prébuilt attend un message de boot pour se câbler en serveur (mode foreground) ;
		// les threads d'analyse de fond se ré-instancient eux-mêmes (cf BrowserWorkersHost).
		worker.postMessage({ type: 'browser/boot', mode: 'foreground' })
		const conn = createMessageConnection(new BrowserMessageReader(worker), new BrowserMessageWriter(worker))
		connection = conn
		conn.onError((e) => logger.error('[pyright] connection error', e))
		conn.onClose(() => { if (connection === conn) teardown() })

		// Pyright pousse les diagnostics via cette notification.
		conn.onNotification('textDocument/publishDiagnostics', (params: PublishDiagnosticsParams) => {
			const model = monaco.editor.getModel(monaco.Uri.parse(params.uri))
			if (model && model.getLanguageId() === 'python') {
				monaco.editor.setModelMarkers(model, MARKER_OWNER, mapDiagnostics(params.diagnostics || []))
			}
		})
		// Pyright demande sa config (typeCheckingMode...) : on répond pour chaque section demandée.
		conn.onRequest('workspace/configuration', (params: ConfigurationParams) => (params.items || []).map(() => pySettings()))
		// Enregistrements de capacités dynamiques : on accepte sans rien faire.
		conn.onRequest('client/registerCapability', () => null)
		conn.onRequest('window/workDoneProgress/create', () => null)
		conn.listen()

		// Timeout : un seul ai/read qui pend ne doit pas bloquer TOUTE la validation Python de la
		// session. Au-delà, on démarre avec le snapshot des fichiers déjà chargés ; les retardataires
		// seront montés à leur ouverture (reconcile -> seedFile).
		await Promise.race([playerFilesPromise, new Promise((resolve) => setTimeout(resolve, 10000))])
		const playerFiles = { ...filesAcc }
		for (const key of Object.keys(playerFiles)) seeded.add(key.slice(1))
		extraPaths = currentImportRoots() // prêt AVANT que le worker demande sa config
		await conn.sendRequest('initialize', {
			processId: null,
			rootUri: 'file:///',
			workspaceFolders: [{ uri: 'file:///', name: 'leekwars' }],
			// Seed la FS in-memory du worker : stubs typeshed (builtins/stdlib), stub de l'API de combat
			// et .py du fermier (cf PyrightServer.initialize -> fileSystem.apply, gère les sous-dossiers).
			// typeshedPath complète typeshedPaths.
			initializationOptions: { files: { ...TYPESHED_FILES, [STUB_PATH]: currentStub, ...playerFiles }, typeshedPath: TYPESHED_ROOT },
			capabilities: {
				workspace: { configuration: true, didChangeConfiguration: { dynamicRegistration: true } },
				textDocument: {
					publishDiagnostics: { relatedInformation: false },
					synchronization: {},
					completion: {
						completionItem: { snippetSupport: true, documentationFormat: ['markdown', 'plaintext'], deprecatedSupport: true },
						// Sans valueSet, Pyright rabat tout kind non déclaré sur Text (icônes plates).
						completionItemKind: { valueSet: Array.from({ length: 25 }, (_, i) => i + 1) },
						contextSupport: false,
					},
					hover: { contentFormat: ['markdown', 'plaintext'] },
					definition: {},
				},
			},
		})
		conn.sendNotification('initialized', {})
		conn.sendNotification('workspace/didChangeConfiguration', { settings: { python: { analysis: pySettings() } } })
	})().catch((e) => { logger.error('[pyright] init failed', e); teardown(); throw e })
	return ready
}

/** Met à jour le stub de l'API (appelé quand les game data / la doc changent). No-op si identique
 *  (évite une ré-analyse complète du worker à chaque changement de langue). */
export function updatePyStub(text: string): void {
	if (text === currentStub) return
	currentStub = text
	// createFile est appliqué à la FS du worker ET déclenche invalidateAndForceReanalysis (les docs
	// ouverts sont revalidés contre le nouveau stub).
	connection?.sendNotification('pyright/createFile', { uri: 'file://' + STUB_PATH, text })
}

// Réconcilie l'état LSP d'un doc avec son intention (refs) une fois la connexion prête : envoie le
// didOpen manquant, ou le didClose si un close est arrivé pendant l'ouverture async.
function reconcile(model: monaco.editor.ITextModel, uri: string): void {
	if (!connection) return
	const s = docs.get(uri)
	if (!s) return
	if (s.refs > 0 && !s.open) {
		s.open = true
		s.version = 1
		s.lastText = model.getValue()
		connection.sendNotification('textDocument/didOpen', {
			textDocument: { uri, languageId: 'python', version: 1, text: s.lastText },
		})
		// Fichier jamais monté (créé après le boot du worker) : copie FS aussi, car la résolution des
		// imports des AUTRES fichiers passe par la FS, pas par l'overlay didOpen.
		const path = monaco.Uri.parse(uri).path.slice(1)
		if (isPlayerPy(path) && !seeded.has(path)) void seedFile(path)
	} else if (s.refs <= 0) {
		closeDoc(uri)
	}
}

/** Ouvre un modèle Python auprès de Pyright (didOpen). Démarre le worker si besoin. Idempotent par
 *  URI via comptage de références (split view). */
export async function openPy(model: monaco.editor.ITextModel): Promise<void> {
	const uri = model.uri.toString()
	// Incrément SYNCHRONE avant tout await : un closePy concurrent verra refs et pourra l'annuler.
	const s = docs.get(uri)
	if (s) s.refs++
	else docs.set(uri, { refs: 1, open: false, version: 0, lastText: '' })
	try {
		await ensure()
	} catch {
		return // worker indisponible : pas de validation Python (l'éditeur reste fonctionnel)
	}
	reconcile(model, uri)
}

/** Notifie un changement de contenu (didChange, sync full). */
export function changePy(model: monaco.editor.ITextModel): void {
	const uri = model.uri.toString()
	const s = docs.get(uri)
	// Pas encore ouvert (ouverture async en vol) : le didOpen à venir portera le contenu à jour -> rien
	// à faire. Jamais suivi du tout (ne devrait pas arriver, l'éditeur appelle openPy avant) : on ouvre.
	if (!connection || !s) { void openPy(model); return }
	if (!s.open) return
	const text = model.getValue()
	if (text === s.lastText) return // rien de neuf : évite une réanalyse gratuite côté worker
	s.lastText = text
	s.version++
	connection.sendNotification('textDocument/didChange', {
		textDocument: { uri, version: s.version },
		contentChanges: [{ text }],
	})
}

/** Relâche une référence sur un document ; ferme (didClose + efface les marqueurs) au dernier. */
export function closePy(uri: string): void {
	const s = docs.get(uri)
	if (!s) return
	if (--s.refs > 0) return // encore affiché ailleurs (split) : on garde ouvert
	closeDoc(uri)
}

function closeDoc(uri: string): void {
	const s = docs.get(uri)
	if (!s) return
	docs.delete(uri)
	const model = monaco.editor.getModel(monaco.Uri.parse(uri))
	if (s.open) {
		// Rafraîchit la copie FS : une fois l'overlay parti, les imports de ce module par d'autres
		// fichiers doivent voir son dernier contenu. Seulement si le doc a été MODIFIÉ (version > 1) :
		// sinon la copie du seed est déjà bonne et le createFile coûterait une réanalyse complète à
		// chaque bascule d'onglet. seedFile re-vérifie l'existence dans fileSystem.ais : un fichier
		// qui vient d'être supprimé/renommé (ai-deleted déjà parti) n'est PAS remonté en zombie.
		const path = monaco.Uri.parse(uri).path.slice(1)
		if (isPlayerPy(path) && (s.version > 1 || !seeded.has(path))) void seedFile(path)
		connection?.sendNotification('textDocument/didClose', { textDocument: { uri } })
	}
	if (model) monaco.editor.setModelMarkers(model, MARKER_OWNER, [])
}

// --- Requêtes LSP à la position courante (complétion, survol, définition) ---

// Position Monaco (1-based) -> LSP (0-based). Les documents sont envoyés tels quels : pas de décalage.
function lspPosition(position: monaco.Position): { line: number, character: number } {
	return { line: position.lineNumber - 1, character: position.column - 1 }
}

function lspRangeToMonaco(r: LspRange): monaco.IRange {
	return {
		startLineNumber: r.start.line + 1, startColumn: r.start.character + 1,
		endLineNumber: r.end.line + 1, endColumn: r.end.character + 1,
	}
}

// LSP CompletionItemKind (1..25) -> Monaco, indexé par la valeur LSP.
const LSP_COMPLETION_KINDS: Record<number, monaco.languages.CompletionItemKind> = (() => {
	const K = monaco.languages.CompletionItemKind
	return {
		1: K.Text, 2: K.Method, 3: K.Function, 4: K.Constructor, 5: K.Field, 6: K.Variable,
		7: K.Class, 8: K.Interface, 9: K.Module, 10: K.Property, 11: K.Unit, 12: K.Value,
		13: K.Enum, 14: K.Keyword, 15: K.Snippet, 16: K.Color, 17: K.File, 18: K.Reference,
		19: K.Folder, 20: K.EnumMember, 21: K.Constant, 22: K.Struct, 23: K.Event,
		24: K.Operator, 25: K.TypeParameter,
	}
})()

function asDocumentation(d: string | MarkupContent | undefined): monaco.IMarkdownString | undefined {
	if (!d) return undefined
	return { value: typeof d === 'string' ? d : d.value }
}

// Item Monaco portant l'item LSP d'origine, pour completionItem/resolve (Pyright a besoin de son
// champ `data` opaque pour retrouver le symbole et calculer la doc/le détail à la demande).
interface PyCompletionItem extends monaco.languages.CompletionItem { __lsp?: LspCompletionItem }

function mapCompletionItem(item: LspCompletionItem, range: monaco.IRange): PyCompletionItem {
	const mapped: PyCompletionItem = {
		label: item.label,
		kind: LSP_COMPLETION_KINDS[item.kind ?? 1] ?? monaco.languages.CompletionItemKind.Text,
		// textEdit.newText plutôt que label quand présent (Pyright y met le vrai texte à insérer) ; la
		// plage d'insertion reste le mot courant côté Monaco (`range`), pas celle du textEdit LSP.
		insertText: item.textEdit?.newText ?? item.insertText ?? item.label,
		range,
		sortText: item.sortText,
		filterText: item.filterText,
		detail: item.detail,
		documentation: asDocumentation(item.documentation),
		__lsp: item,
	}
	if (item.insertTextFormat === 2) mapped.insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
	if (item.tags?.includes(1)) mapped.tags = [monaco.languages.CompletionItemTag.Deprecated]
	return mapped
}

/** Complétion Pyright à la position donnée. Renvoie null si indisponible (worker mort, doc pas
 *  encore ouvert, requête en échec) : l'appelant (monaco.ts) replie alors sur la complétion
 *  statique de l'API. */
export async function completePy(model: monaco.editor.ITextModel, position: monaco.Position): Promise<monaco.languages.CompletionList | null> {
	const uri = model.uri.toString()
	const s = docs.get(uri)
	if (!connection || !s || !s.open) return null
	// Flush : le didChange normal est debouncé (analyzer, ~500 ms) ; sans ça, une complétion en cours
	// de frappe interrogerait Pyright sur l'ANCIEN texte à la position du nouveau (liste hors sujet).
	changePy(model)
	let result: LspCompletionList | LspCompletionItem[] | null
	try {
		result = await connection.sendRequest('textDocument/completion', {
			textDocument: { uri },
			position: lspPosition(position),
		})
	} catch (e) {
		logger.error('[pyright] completion failed', e)
		return null
	}
	if (!result) return null
	const items = Array.isArray(result) ? result : result.items
	const word = model.getWordUntilPosition(position)
	const range = {
		startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
		startColumn: word.startColumn, endColumn: word.endColumn,
	}
	return {
		suggestions: items.map((item) => mapCompletionItem(item, range)),
		incomplete: Array.isArray(result) ? false : result.isIncomplete,
	}
}

/** Résolution paresseuse (focus d'un item dans le widget) : Pyright calcule alors doc et détail. La
 *  doc déjà posée côté client (lien vers la doc LW) est conservée et concaténée après celle de
 *  Pyright. En cas d'échec, l'item est rendu tel quel. */
export async function resolveCompletionPy(item: monaco.languages.CompletionItem): Promise<monaco.languages.CompletionItem> {
	const lsp = (item as PyCompletionItem).__lsp
	if (!connection || !lsp) return item
	let resolved: LspCompletionItem
	try {
		resolved = await connection.sendRequest('completionItem/resolve', lsp)
	} catch {
		return item
	}
	if (resolved.detail) item.detail = resolved.detail
	const doc = asDocumentation(resolved.documentation)
	if (doc) {
		const existing = item.documentation
		const existingValue = typeof existing === 'string' ? existing : existing?.value
		// Fusion déléguée à markdown-safe : elle garantit l'absence d'isTrusted (la docstring venue de
		// Pyright est du contenu de fichier arbitraire) et ce contrat y est testé.
		item.documentation = mergeCompletionDocumentation(doc.value, existingValue)
	}
	return item
}

// --- Survol & définition ---

// contents LSP (MarkupContent | MarkedString | MarkedString[]) -> markdown. Pyright renvoie en
// pratique un MarkupContent markdown (signature ```python``` + docstring) ; les autres formes sont
// gérées par complétude LSP.
function hoverMarkdown(c: LspHover['contents']): string {
	if (typeof c === 'string') return c
	if (Array.isArray(c)) return c.map((m) => typeof m === 'string' ? m : '```' + m.language + '\n' + m.value + '\n```').join('\n\n')
	return c.value
}

/** Survol Pyright : type du symbole (+ docstring) en markdown, et range du symbole survolé.
 *  null si indisponible (worker mort, doc pas ouvert, rien sous le curseur). */
export async function hoverPy(model: monaco.editor.ITextModel, position: monaco.Position): Promise<{ contents: string, range: monaco.IRange | null } | null> {
	const uri = model.uri.toString()
	const s = docs.get(uri)
	if (!connection || !s || !s.open) return null
	changePy(model) // flush (didChange debouncé) : survol juste après une frappe = texte à jour
	let h: LspHover | null
	try {
		h = await connection.sendRequest('textDocument/hover', { textDocument: { uri }, position: lspPosition(position) })
	} catch (e) {
		logger.error('[pyright] hover failed', e)
		return null
	}
	if (!h) return null
	const contents = hoverMarkdown(h.contents)
	if (!contents.trim()) return null
	return { contents, range: h.range ? lspRangeToMonaco(h.range) : null }
}

/** Définition Pyright : path éditeur (sans / initial) + range 1-based de la déclaration. Seuls les
 *  fichiers du joueur sont des cibles (les stubs __builtins__.pyi / typeshed sont filtrés : pas de
 *  saut vers un fichier que l'éditeur ne peut pas afficher). */
export async function definitionPy(model: monaco.editor.ITextModel, position: monaco.Position): Promise<{ path: string, range: monaco.IRange } | null> {
	const uri = model.uri.toString()
	const s = docs.get(uri)
	if (!connection || !s || !s.open) return null
	changePy(model) // flush : positions calculées sur le texte courant
	let d: LspLocation | LspLocation[] | null
	try {
		d = await connection.sendRequest('textDocument/definition', { textDocument: { uri }, position: lspPosition(position) })
	} catch (e) {
		logger.error('[pyright] definition failed', e)
		return null
	}
	const loc = Array.isArray(d) ? d[0] : d
	if (!loc) return null
	const path = monaco.Uri.parse(loc.uri).path.slice(1)
	if (!isPlayerPy(path)) return null
	return { path, range: lspRangeToMonaco(loc.range) }
}
