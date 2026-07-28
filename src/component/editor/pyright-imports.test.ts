// Tests de RÉSOLUTION D'IMPORTS : ils font tourner le VRAI Pyright (celui bundlé dans node_modules,
// même version que le worker) sur une arborescence temporaire, configuré avec les `extraPaths` que
// `importRoots` produirait. Ils vérifient donc le contrat qui compte réellement pour le joueur :
// « ce que l'éditeur accepte est ce que le combat accepte », là où un test du helper seul ne voyait
// qu'une liste de chaînes.
//
// Origine : régression signalée par un joueur (28/07/2026). Les extraPaths contenaient le dossier de
// CHAQUE .py ; un dossier dans le chemin de recherche rend ses fichiers importables en modules de
// premier niveau et MASQUE le paquet de même nom -> `attack/attack.py` cassait `import attack.attack`.

import { describe, it, expect } from 'vitest'
import { execFileSync } from 'child_process'
import { writeFileSync, mkdtempSync, mkdirSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join, dirname } from 'path'
import { importRoots } from './pyright-map'

const clientRoot = process.cwd()
const pyrightBin = join(clientRoot, 'node_modules', '.bin', 'pyright')
const typeshedPath = join(clientRoot, 'node_modules', 'pyright', 'dist', 'typeshed-fallback')
const hasBundledPyright = existsSync(pyrightBin) && existsSync(typeshedPath)

/**
 * Écrit les fichiers dans un dossier temporaire, configure Pyright avec les extraPaths calculés par
 * `importRoots(entryPaths)` (exactement ce que fait pyright-client), analyse `mainPath` et renvoie
 * les messages d'erreur.
 */
function analyze(files: Record<string, string>, entryPaths: string[], mainPath: string): string[] {
	const dir = mkdtempSync(join(tmpdir(), 'lwpyimports-'))
	for (const [path, content] of Object.entries(files)) {
		const full = join(dir, path)
		mkdirSync(dirname(full), { recursive: true })
		writeFileSync(full, content)
	}
	// importRoots rend des chemins absolus façon FS du worker ('/MonIA') -> relatifs au projet ici.
	const extraPaths = importRoots(entryPaths).map((p) => p.replace(/^\//, ''))
	writeFileSync(join(dir, 'pyrightconfig.json'), JSON.stringify({
		typeCheckingMode: 'basic', typeshedPath, extraPaths,
	}))
	let out = ''
	try {
		out = execFileSync(pyrightBin, ['--outputjson', mainPath], { cwd: dir, encoding: 'utf-8', stdio: 'pipe' })
	} catch (e) {
		out = (e as { stdout?: string }).stdout ?? ''
	}
	const report = JSON.parse(out) as { generalDiagnostics: Array<{ severity: string, message: string }> }
	return report.generalDiagnostics.filter((d) => d.severity === 'error').map((d) => d.message)
}

describe.runIf(hasBundledPyright)('résolution des imports entre IA (vrai Pyright)', () => {
	it('un dossier bibliothèque s’importe en paquet, même si un fichier porte son nom (régression joueur)', () => {
		const errors = analyze({
			'attack/attack.py': 'def turn_attack():\n    return 42\n',
			'main.py': 'import attack.attack as att\nfrom attack.attack import turn_attack\n\ndef turn():\n    return att.turn_attack() + turn_attack()\n',
		}, ['main.py'], 'main.py') // IA d'entrée à la racine -> aucun extraPath
		expect(errors, `imports cassés :\n${errors.join('\n')}`).toEqual([])
	})

	it('une IA d’entrée rangée dans un dossier importe ses voisins (comme le sys.path du moteur)', () => {
		const errors = analyze({
			'MonIA/util.py': 'def step():\n    return 2\n',
			'MonIA/main.py': 'from util import step\n\ndef turn():\n    return step()\n',
		}, ['MonIA/main.py'], 'MonIA/main.py') // entrée dans MonIA -> extraPath /MonIA
		expect(errors, `import voisin cassé :\n${errors.join('\n')}`).toEqual([])
	})

	it('sous-dossier importé en paquet depuis une entrée à la racine', () => {
		const errors = analyze({
			'lib/helper.py': 'def bonus():\n    return 7\n',
			'main.py': 'from lib import helper\n\ndef turn():\n    return helper.bonus()\n',
		}, ['main.py'], 'main.py')
		expect(errors, `import de paquet cassé :\n${errors.join('\n')}`).toEqual([])
	})

	// Test de caractérisation : il fige la RAISON du correctif. Si quelqu'un réélargit les extraPaths
	// aux dossiers de tous les .py (c'était le code d'origine), c'est ce comportement de Pyright qu'il
	// réintroduira. Le test échoue si l'hypothèse change, et sert d'explication sur place.
	it('MASQUAGE : mettre le dossier bibliothèque dans les chemins de recherche casse l’import', () => {
		const errors = analyze({
			'attack/attack.py': 'def turn_attack():\n    return 42\n',
			'main.py': 'import attack.attack as att\n\ndef turn():\n    return att.turn_attack()\n',
		}, ['attack/attack.py'], 'main.py') // <- l'ancien calcul : le dossier de CHAQUE .py
		expect(errors.join('\n')).toMatch(/attack\.attack/)
	})

	it('un import réellement inexistant reste signalé (le garde ne doit pas tout accepter)', () => {
		const errors = analyze({
			'main.py': 'import nexiste_pas\n',
		}, ['main.py'], 'main.py')
		expect(errors.join('\n')).toMatch(/nexiste_pas/)
	})
})
