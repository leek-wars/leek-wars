import { describe, it, expect, vi, beforeEach } from 'vitest'

// filesystem.ts tire un gros graphe (AI/monaco, model/vue qui bootstrappe l'app, leekwars,
// cache IndexedDB). On mocke ces feuilles lourdes mais on garde les VRAIS Folder/AIItem
// (editor-item, léger) pour exercer la vraie construction d'arbre et la résolution de chemins.
const cache = vi.hoisted(() => ({
	getAICache: vi.fn(() => Promise.resolve(null as { code: string, mtime: number } | null)),
	removeAICache: vi.fn(() => Promise.resolve()),
	setAICache: vi.fn(() => Promise.resolve()),
	clearAICache: vi.fn(() => Promise.resolve()),
}))
vi.mock('@/model/ai-code-cache', () => cache)

const emitterMock = vi.hoisted(() => ({ emit: vi.fn() }))
vi.mock('@/model/emitter', () => ({ emitter: emitterMock }))

vi.mock('@/model/leekwars', () => ({ LeekWars: { post: vi.fn(), get: vi.fn(), delete: vi.fn(), toast: vi.fn(), socket: {} } }))
vi.mock('@/model/i18n', () => ({ i18n: { t: (k: string, args?: unknown) => args === undefined ? k : `${k}|${JSON.stringify(args)}` } }))
vi.mock('@/model/ai', () => ({
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	AI: class AI { functions: unknown[] = []; constructor(d: Record<string, unknown>) { Object.assign(this, d) } analyze() {} },
}))

import { FileSystem, translateFileSystemError, type FarmerTree } from '@/model/filesystem'
import { Folder, AIItem } from '@/component/editor/editor-item'
import { AI } from '@/model/ai'
import { LeekWars } from '@/model/leekwars'

// Fabrique une réponse LeekWars.post/get factice supportant le chaînage `.then().error()`
// utilisé par le vrai client. `.then` appelle le callback synchronement avec `data`, `.error`
// est un no-op sur le chemin succès. Les deux renvoient `this` pour permettre le chaînage.
const req = (data: unknown) => ({
	then(cb: (d: unknown) => void) { cb(data); return this },
	error() { return this },
})

const tree = (): FarmerTree => ({
	folders: ['Combat', 'Move', 'Combat/utils'],
	files: [
		{ path: 'main', valid: true, version: 1 },
		{ path: 'Combat/attack', valid: true, version: 1 },
		{ path: 'Combat/utils/helper', valid: true, version: 1 },
		{ path: 'Move/step', valid: false, version: 1 },
	],
	bin: [{ path: 'oldfile', valid: false, version: 1 }],
	leek_ais: { 100: 'main' },
})

const folderNamed = (fs: FileSystem, parent: Folder, name: string) =>
	parent.items.find(i => i.folder && i.name === name) as Folder

beforeEach(() => {
	cache.getAICache.mockClear().mockResolvedValue(null)
	cache.removeAICache.mockClear()
	emitterMock.emit.mockClear()
})

describe('translateFileSystemError', () => {
	it('traduit un code d\'erreur connu (string)', () => {
		expect(translateFileSystemError('invalid_path')).toBe('leekscript.fs_invalid_path')
	})
	it('traduit un code connu porté par un objet { error }', () => {
		expect(translateFileSystemError({ error: 'name_conflict' })).toBe('leekscript.fs_name_conflict')
	})
	it('rabat un code inconnu sur fs_unknown_error avec le code en argument', () => {
		expect(translateFileSystemError('boom')).toBe('leekscript.fs_unknown_error|["boom"]')
	})
	it('utilise "unknown" quand il n\'y a pas de code exploitable', () => {
		expect(translateFileSystemError(null)).toBe('leekscript.fs_unknown_error|["unknown"]')
		expect(translateFileSystemError({})).toBe('leekscript.fs_unknown_error|["unknown"]')
	})
})

describe('FileSystem.init', () => {
	it('reconstruit l\'arborescence, les AIs, la corbeille et leek_ais', () => {
		const fs = new FileSystem()
		fs.init(tree())

		expect(fs.aiCount).toBe(4)
		expect(fs.ais['main']).toBeDefined()
		expect(fs.ais['Combat/attack']).toBeDefined()
		expect(fs.ais['Combat/utils/helper']).toBeDefined()

		// arbre : Combat et Move à la racine, utils sous Combat
		const combat = folderNamed(fs, fs.rootFolder, 'Combat')
		expect(combat).toBeDefined()
		expect(folderNamed(fs, combat, 'utils')).toBeDefined()

		// corbeille + bot AIs + leek_ais
		expect(fs.ais['.trash/oldfile']).toBeDefined()
		expect(fs.bin.items).toHaveLength(1)
		expect(fs.ais['/lambda']).toBeDefined()
		expect(fs.leekAIs[100]).toBe('main')
	})
})

describe('FileSystem.find', () => {
	let fs: FileSystem
	beforeEach(() => { fs = new FileSystem(); fs.init(tree()) })

	it('trouve une IA à la racine par nom', () => {
		expect(fs.find('main', fs.rootFolder.id)?.name).toBe('main')
	})
	it('gère un chemin absolu (préfixe /)', () => {
		expect(fs.find('/Combat/attack', 999)?.name).toBe('attack')
	})
	it('descend dans les sous-dossiers', () => {
		expect(fs.find('Combat/utils/helper', fs.rootFolder.id)?.name).toBe('helper')
	})
	it('résout . et .. relativement au dossier courant', () => {
		const combat = folderNamed(fs, fs.rootFolder, 'Combat')
		const utils = folderNamed(fs, combat, 'utils')
		expect(fs.find('../attack', utils.id)?.name).toBe('attack')
		expect(fs.find('./helper', utils.id)?.name).toBe('helper')
	})
	it('renvoie null pour un chemin ou un dossier inexistant', () => {
		expect(fs.find('nope', fs.rootFolder.id)).toBeNull()
		expect(fs.find('Combat/nope', fs.rootFolder.id)).toBeNull()
		expect(fs.find('x', 4242)).toBeNull()
	})
})

describe('FileSystem.getFolderPath', () => {
	it('reconstruit le chemin complet d\'un dossier', () => {
		const fs = new FileSystem(); fs.init(tree())
		const combat = folderNamed(fs, fs.rootFolder, 'Combat')
		const utils = folderNamed(fs, combat, 'utils')
		expect(fs.getFolderPath(combat)).toBe('Combat/')
		expect(fs.getFolderPath(utils)).toBe('Combat/utils/')
	})
	it('renvoie un marqueur d\'erreur pour un dossier absent', () => {
		const fs = new FileSystem()
		expect(fs.getFolderPath(undefined as unknown as Folder)).toBe('##folder_error##')
	})
})

describe('FileSystem.isInBin', () => {
	it('reconnaît la corbeille et la racine', () => {
		const fs = new FileSystem(); fs.init(tree())
		expect(fs.isInBin(-1)).toBe(true)
		expect(fs.isInBin(0)).toBe(false)
		expect(fs.isInBin(folderNamed(fs, fs.rootFolder, 'Combat').id)).toBe(false)
	})
	it('remonte la chaîne des parents jusqu\'à la corbeille', () => {
		const fs = new FileSystem(); fs.init(tree())
		const nested = new Folder(500, 'x', -1)
		fs.folderById[500] = nested
		expect(fs.isInBin(500)).toBe(true)
	})
})

describe('FileSystem.setPath / renameAI (#4318 invalidation)', () => {
	it('re-clé la map, invalide l\'ancien et le nouveau cache, émet ai-path-changed', () => {
		const fs = new FileSystem(); fs.init(tree())
		const ai = fs.ais['main']
		fs.setPath(ai, 'renamed')

		expect(fs.ais['renamed']).toBe(ai)
		expect(fs.ais['main']).toBeUndefined()
		expect(ai.path).toBe('renamed')
		expect(cache.removeAICache).toHaveBeenCalledWith('main')
		expect(cache.removeAICache).toHaveBeenCalledWith('renamed')
		expect(emitterMock.emit).toHaveBeenCalledWith('ai-path-changed', { oldPath: 'main', newPath: 'renamed' })
	})

	it('ne fait rien si le chemin est inchangé', () => {
		const fs = new FileSystem(); fs.init(tree())
		fs.setPath(fs.ais['main'], 'main')
		expect(emitterMock.emit).not.toHaveBeenCalled()
		expect(cache.removeAICache).not.toHaveBeenCalled()
	})

	it('renameAI recalcule le chemin complet à partir du dossier', () => {
		const fs = new FileSystem(); fs.init(tree())
		const attack = fs.ais['Combat/attack']
		fs.renameAI(attack, 'strike')
		expect(attack.name).toBe('strike')
		expect(fs.ais['Combat/strike']).toBe(attack)
		expect(fs.ais['Combat/attack']).toBeUndefined()
	})
})

describe('FileSystem.sortFolder', () => {
	it('place les dossiers avant les fichiers, chaque groupe trié par nom', () => {
		const fs = new FileSystem()
		const f = new Folder(0, 'r', 0)
		f.items = [
			new AIItem(new AI({ name: 'Zoe' }), 0),
			new Folder(1, 'Beta', 0),
			new AIItem(new AI({ name: 'Alpha' }), 0),
			new Folder(2, 'Alpha', 0),
		]
		fs.sortFolder(f)
		expect(f.items.map(i => [i.folder, i.name])).toEqual([
			[true, 'Alpha'], [true, 'Beta'], [false, 'Alpha'], [false, 'Zoe'],
		])
	})
})

describe('FileSystem.load (cache hit)', () => {
	it('sert le code du cache sans appeler le serveur quand le mtime est à jour', async () => {
		const fs = new FileSystem(); fs.init(tree())
		const ai = fs.ais['main']
		ai.mtime = 50
		cache.getAICache.mockResolvedValueOnce({ code: 'DU_CACHE', mtime: 100 })
		const analyze = vi.spyOn(ai, 'analyze')
		await fs.load(ai)
		expect(ai.code).toBe('DU_CACHE')
		expect(analyze).toHaveBeenCalled()
		expect(LeekWars.post).not.toHaveBeenCalled()
	})

	// Régression : un fichier fraîchement créé/restauré/en corbeille a ai.mtime===0. Avant le fix,
	// la garde `cached.mtime >= ai.mtime` valait `cached.mtime >= 0` (toujours vrai) → une entrée de
	// cache orpheline (ancien fichier du même nom) écrasait le vrai code serveur = mauvais contenu.
	it('ne sert PAS un cache orphelin quand ai.mtime===0 : le serveur fait autorité', async () => {
		const fs = new FileSystem(); fs.init(tree())
		const ai = fs.ais['main']
		ai.mtime = 0
		cache.getAICache.mockResolvedValueOnce({ code: 'CACHE_PERIME', mtime: 123456 })
		;(LeekWars.post as ReturnType<typeof vi.fn>).mockReturnValueOnce(req({ code: 'DU_SERVEUR', mtime: 999 }))
		await fs.load(ai)
		expect(LeekWars.post).toHaveBeenCalledWith('ai/read', { path: 'main' })
		expect(ai.code).toBe('DU_SERVEUR')
	})
})

describe('FileSystem.restore', () => {
	beforeEach(() => { (LeekWars.post as ReturnType<typeof vi.fn>).mockClear() })

	it('invalide le cache du path corbeille ET du path cible restauré', () => {
		const fs = new FileSystem(); fs.init(tree())
		const ai = fs.ais['.trash/oldfile']
		;(LeekWars.post as ReturnType<typeof vi.fn>).mockReturnValueOnce(req({ path: 'oldfile' }))
		fs.restore(ai)
		expect(cache.removeAICache).toHaveBeenCalledWith('.trash/oldfile')
		expect(cache.removeAICache).toHaveBeenCalledWith('oldfile')
		expect(fs.ais['oldfile']).toBe(ai)
		expect(fs.ais['.trash/oldfile']).toBeUndefined()
	})

	// Le serveur suffixe le nom sur conflit (oldfile -> oldfile_2) : le client doit poser le path
	// autoritatif renvoyé, pas le nom deviné.
	it('pose le path suffixé renvoyé par le serveur sur conflit', () => {
		const fs = new FileSystem(); fs.init(tree())
		const ai = fs.ais['.trash/oldfile']
		;(LeekWars.post as ReturnType<typeof vi.fn>).mockReturnValueOnce(req({ path: 'oldfile_2' }))
		fs.restore(ai)
		expect(fs.ais['oldfile_2']).toBe(ai)
		expect(ai.name).toBe('oldfile_2')
		expect(ai.path).toBe('oldfile_2')
		expect(fs.ais['oldfile']).toBeUndefined()
		expect(emitterMock.emit).toHaveBeenCalledWith('ai-created', 'oldfile_2')
	})

	// Régression F1 : restaurer un fichier dont le nom existe déjà à la racine ne doit PAS écraser
	// l'entrée de map ni le cache du fichier existant (le serveur suffixe le restauré en _2).
	it('ne clobbe pas un fichier racine existant du même nom', () => {
		const fs = new FileSystem(); fs.init(tree())
		const existing = new AI({ name: 'oldfile', path: 'oldfile', folder: 0 })
		fs.ais['oldfile'] = existing
		const trashed = fs.ais['.trash/oldfile']
		;(LeekWars.post as ReturnType<typeof vi.fn>).mockReturnValueOnce(req({ path: 'oldfile_2' }))
		fs.restore(trashed)
		// le fichier existant reste intact (map + cache non touchés)
		expect(fs.ais['oldfile']).toBe(existing)
		expect(cache.removeAICache).not.toHaveBeenCalledWith('oldfile')
		// le restauré prend le path suffixé
		expect(fs.ais['oldfile_2']).toBe(trashed)
		expect(trashed.path).toBe('oldfile_2')
	})
})
