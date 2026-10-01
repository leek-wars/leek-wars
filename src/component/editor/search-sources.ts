/**
 * Recherche dans tous les fichiers : le code sur lequel chercher.
 *
 * La recherche tourne dans le navigateur, sur une copie locale de chaque fichier, par ordre
 * de préférence :
 *   1. le modèle Monaco s'il existe : c'est ce que le joueur voit, modifications non
 *      enregistrées comprises ;
 *   2. la copie en mémoire ou dans le cache IndexedDB, si elle est à jour (même règle de
 *      mtime que `fileSystem.load`) ;
 *   3. sinon le serveur, par lots (`ai/read-many`), sans passer par `fileSystem.load` qui
 *      lancerait une analyse par fichier.
 */
import { AI } from '@/model/ai'
import { getAICacheMany, setAICache } from '@/model/ai-code-cache'
import { fileSystem } from '@/model/filesystem'
import { LeekWars } from '@/model/leekwars'
import { farmerId } from '@/model/store'

// Taille de lot maximale acceptée par `ai/read-many`.
const READ_MANY_MAX_PATHS = 500

interface Source { code: string, mtime: number }

interface ReadManyResponse {
	files: { path: string, code: string, mtime: number }[]
	skipped: { path: string | null, error: string }[]
	remaining: string[]
}

// Clés préfixées par l'éleveur, comme le cache IndexedDB : un changement de
// compte ne doit pas faire chercher dans le code de l'autre.
const key = (path: string) => farmerId() + '/' + path
const memory = new Map<string, Source>()
// Fichiers que le serveur refuse de renvoyer (binaires, trop gros), avec le mtime auquel
// il les a refusés : on ne les redemande pas à chaque frappe.
const unreadable = new Map<string, number>()

function isFresh(entry: Source, ai: AI) {
	return entry.mtime > 0 && ai.mtime > 0 && entry.mtime >= ai.mtime
}

export function isInClosedFolder(ai: AI) {
	let folder = fileSystem.folderById[ai.folder]
	while (folder && folder.id !== 0) {
		if (folder.closed) { return true }
		folder = fileSystem.folderById[folder.parent]
	}
	return false
}

/**
 * Les fichiers où chercher, triés par chemin. Hors corbeille et IA des bots ; les dossiers
 * fermés sont exclus sauf demande explicite.
 */
export function searchableAIs(includeClosed: boolean): AI[] {
	return Object.values(fileSystem.ais)
		.filter(ai => !ai.bot && ai.path && !ai.path.startsWith('.trash/') && !fileSystem.isInBin(ai.folder))
		.filter(ai => includeClosed || !isInClosedFolder(ai))
		.sort((a, b) => a.path.localeCompare(b.path))
}

export interface LoadedSources {
	sources: Map<string, string>
	// Fichiers écartés : binaires, trop gros, ou disparus entre-temps.
	skipped: number
	// Le chargement s'est arrêté sur une erreur : on cherche quand même dans le reste.
	failed: boolean
}

export async function loadSources(ais: AI[], onProgress: (done: number, total: number) => void, isCancelled: () => boolean): Promise<LoadedSources> {
	const sources = new Map<string, string>()
	let skipped = 0
	const missing: AI[] = []
	for (const ai of ais) {
		if (ai.model && !ai.model.isDisposed()) {
			sources.set(ai.path, ai.model.getValue())
			continue
		}
		const entry = memory.get(key(ai.path))
		if (entry && isFresh(entry, ai)) {
			sources.set(ai.path, entry.code)
		} else if (ai.mtime > 0 && unreadable.get(key(ai.path)) === ai.mtime) {
			skipped++
		} else {
			missing.push(ai)
		}
	}
	if (!missing.length) { return { sources, skipped, failed: false } }

	const cached = await getAICacheMany(missing.map(ai => ai.path))
	const toFetch: string[] = []
	const byPath = new Map<string, AI>()
	missing.forEach((ai, i) => {
		const entry = cached[i]
		if (entry && isFresh(entry, ai)) {
			memory.set(key(ai.path), entry)
			sources.set(ai.path, entry.code)
		} else {
			toFetch.push(ai.path)
			byPath.set(ai.path, ai)
		}
	})

	const total = toFetch.length
	let done = 0
	if (total) { onProgress(done, total) }
	while (toFetch.length && !isCancelled()) {
		const batch = toFetch.splice(0, READ_MANY_MAX_PATHS)
		let data: ReadManyResponse | null
		try {
			data = await LeekWars.post<ReadManyResponse>('ai/read-many', { paths: batch })
		} catch {
			return { sources, skipped, failed: true }
		}
		if (!data) { return { sources, skipped, failed: true } }
		for (const file of data.files) {
			const entry = { code: file.code, mtime: file.mtime }
			memory.set(key(file.path), entry)
			unreadable.delete(key(file.path))
			setAICache(file.path, file.code, file.mtime)
			sources.set(file.path, file.code)
		}
		for (const s of data.skipped) {
			skipped++
			const ai = s.path !== null ? byPath.get(s.path) : undefined
			if (ai && (s.error === 'binary' || s.error === 'ai_too_long')) {
				unreadable.set(key(ai.path), ai.mtime)
			}
		}
		done += data.files.length + data.skipped.length
		// Aucun progrès : on s'arrête plutôt que de boucler sur la même réponse.
		if (!data.files.length && !data.skipped.length) {
			return { sources, skipped, failed: data.remaining.length > 0 }
		}
		toFetch.unshift(...data.remaining)
		onProgress(done, total)
	}
	return { sources, skipped, failed: false }
}
