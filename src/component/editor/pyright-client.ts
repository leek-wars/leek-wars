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
import type { Diagnostic, PublishDiagnosticsParams, ConfigurationParams } from 'vscode-languageserver-protocol'
import { injectImport } from './pyright-inject'
// Worker prébuilt (IIFE webpack). ?worker -> Vite émet le chunk et fournit le constructeur.
import PyrightWorker from '@typefox/pyright-browser/dist/pyright.worker.js?worker'

const STUB_PATH = '/leekwars.pyi'
const MARKER_OWNER = 'pyright'

let connection: MessageConnection | null = null
let ready: Promise<void> | null = null
let currentStub = ''
// État par document ouvert. `refs` = nombre d'éditeurs affichant ce modèle (split view : le MÊME
// modèle Monaco, keyé par URI, peut être ouvert par 2 panneaux) -> on ne ferme (didClose + efface les
// marqueurs) qu'au dernier. `refs` est incrémenté SYNCHRONEMENT par openPy avant tout await, et
// décrémenté par closePy : ainsi un close qui arrive avant que l'open async n'ait fini annule
// proprement l'ouverture (reconcile voit refs<=0). `open` = didOpen déjà envoyé au worker.
interface DocState { refs: number, open: boolean, version: number, injectLine: number }
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
// erreurs de type de base. On coupe le bruit hors-sujet en mono-fichier (imports manquants).
const PY_SETTINGS = {
	typeCheckingMode: 'basic',
	diagnosticMode: 'openFilesOnly',
	useLibraryCodeForTypes: false,
	autoImportCompletions: false,
	diagnosticSeverityOverrides: {
		reportMissingImports: 'none',
		reportMissingModuleSource: 'none',
		reportSelfClsParameterName: 'none',
		reportUndefinedVariable: 'error',
	},
}

// Remappe les positions LSP (document AVEC l'import injecté) vers le modèle Monaco (sans). L'import est
// inséré à la ligne `injectLine` : les lignes >= injectLine sont décalées de +1 dans le doc envoyé.
function mapDiagnostics(injectLine: number, diagnostics: Diagnostic[]): monaco.editor.IMarkerData[] {
	const back = (line: number) => (line > injectLine ? line - 1 : line)
	const markers: monaco.editor.IMarkerData[] = []
	for (const d of diagnostics) {
		if (d.range.start.line === injectLine) continue // diagnostic sur notre ligne injectée : ignoré
		markers.push({
			message: typeof d.message === 'string' ? d.message : d.message.value,
			severity: severity(d.severity),
			startLineNumber: back(d.range.start.line) + 1,
			startColumn: d.range.start.character + 1,
			endLineNumber: back(d.range.end.line) + 1,
			endColumn: d.range.end.character + 1,
			source: 'Pyright',
		})
	}
	return markers
}


// Réinitialise l'état pour permettre une nouvelle tentative (worker mort / boot échoué / connexion
// fermée). Les modèles gardent leurs marqueurs Pyright existants ; un ré-open les rafraîchira.
function teardown(): void {
	ready = null
	connection = null
	docs.clear()
}

// Démarre le worker + connexion LSP + initialize (une seule fois). Idempotent. En cas d'échec (worker
// qui ne boote pas, initialize sans réponse), `ready` est remis à null pour autoriser une reprise au
// prochain openPy plutôt que de rester bloqué sur une promesse rejetée/en attente à jamais.
function ensure(): Promise<void> {
	if (ready) return ready
	ready = (async () => {
		const worker = new PyrightWorker()
		worker.onerror = (e) => { console.error('[pyright] worker error', e.message || e); teardown() }
		// Le worker prébuilt attend un message de boot pour se câbler en serveur (mode foreground) ;
		// les threads d'analyse de fond se ré-instancient eux-mêmes (cf BrowserWorkersHost).
		worker.postMessage({ type: 'browser/boot', mode: 'foreground' })
		const conn = createMessageConnection(new BrowserMessageReader(worker), new BrowserMessageWriter(worker))
		connection = conn
		conn.onError((e) => console.error('[pyright] connection error', e))
		conn.onClose(() => { if (connection === conn) teardown() })

		// Pyright pousse les diagnostics via cette notification.
		conn.onNotification('textDocument/publishDiagnostics', (params: PublishDiagnosticsParams) => {
			const model = monaco.editor.getModel(monaco.Uri.parse(params.uri))
			if (model && model.getLanguageId() === 'python') {
				const injectLine = docs.get(params.uri)?.injectLine ?? 0
				monaco.editor.setModelMarkers(model, MARKER_OWNER, mapDiagnostics(injectLine, params.diagnostics || []))
			}
		})
		// Pyright demande sa config (typeCheckingMode...) : on répond pour chaque section demandée.
		conn.onRequest('workspace/configuration', (params: ConfigurationParams) => (params.items || []).map(() => PY_SETTINGS))
		// Enregistrements de capacités dynamiques : on accepte sans rien faire.
		conn.onRequest('client/registerCapability', () => null)
		conn.onRequest('window/workDoneProgress/create', () => null)
		conn.listen()

		await conn.sendRequest('initialize', {
			processId: null,
			rootUri: 'file:///',
			workspaceFolders: [{ uri: 'file:///', name: 'leekwars' }],
			// Seed la FS in-memory du worker avec le stub de l'API (cf PyrightServer.initialize).
			initializationOptions: { files: { [STUB_PATH]: currentStub } },
			capabilities: {
				workspace: { configuration: true, didChangeConfiguration: { dynamicRegistration: true } },
				textDocument: { publishDiagnostics: { relatedInformation: false }, synchronization: {} },
			},
		})
		conn.sendNotification('initialized', {})
		conn.sendNotification('workspace/didChangeConfiguration', { settings: { python: { analysis: PY_SETTINGS } } })
	})().catch((e) => { console.error('[pyright] init failed', e); teardown(); throw e })
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
		const inj = injectImport(model.getValue())
		s.injectLine = inj.line
		connection.sendNotification('textDocument/didOpen', {
			textDocument: { uri, languageId: 'python', version: 1, text: inj.text },
		})
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
	else docs.set(uri, { refs: 1, open: false, version: 0, injectLine: 0 })
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
	s.version++
	const inj = injectImport(model.getValue())
	s.injectLine = inj.line
	connection.sendNotification('textDocument/didChange', {
		textDocument: { uri, version: s.version },
		contentChanges: [{ text: inj.text }],
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
	if (s.open) connection?.sendNotification('textDocument/didClose', { textDocument: { uri } })
	const model = monaco.editor.getModel(monaco.Uri.parse(uri))
	if (model) monaco.editor.setModelMarkers(model, MARKER_OWNER, [])
}
