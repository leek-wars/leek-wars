import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// `src/model/vue.ts` est le BOOTSTRAP de l'application : son code de haut niveau s'exécute
// à l'import (app.use(router), router.beforeEach, store.commit…). Il doit donc rester une
// RACINE du graphe d'imports, atteignable uniquement depuis le point d'entrée.
//
// Sinon il devient membre d'un cycle d'imports (il en existait un :
//   router.ts → store.ts → chat.ts → farmer.ts → leek.ts → ai.ts → filesystem.ts → vue.ts → router.ts
// via le `emitter` que vue.ts ré-exportait), et l'ordre d'évaluation ESM n'est plus garanti :
// si router.ts entre dans le cycle en premier, le corps de vue.ts tourne alors que le
// binding `router` est encore en zone morte temporelle (TDZ) →
//   « ReferenceError: Cannot access 'router' before initialization ».
//
// En prod l'ordre était stable (vue.ts entrait toujours en premier depuis main.ts) donc le
// cycle passait inaperçu, mais en dev Vite ré-exécute les modules invalidés par HMR lors du
// prochain import dynamique (cf. vitejs/vite#16580) : l'ordre d'entrée changeait, la
// navigation suivante échouait dans une promesse et le clic ne faisait plus rien.
//
// Corollaire : ce qui doit être importable par un composant (emitter, createSubApp, les
// directives, le report d'erreurs, vuetify) vit dans son propre module.
const SRC = path.resolve(__dirname, '..')
const ENTRY_POINT = 'main.ts'

function sourceFiles(dir: string): string[] {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
		const full = path.join(dir, entry.name)
		if (entry.isDirectory()) return sourceFiles(full)
		return /\.(ts|vue)$/.test(entry.name) ? [full] : []
	})
}

/** Résout un spécificateur d'import statique vers un fichier de src/, ou null (paquet npm). */
function resolveImport(spec: string, from: string): string | null {
	let base: string
	if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2))
	else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec)
	else return null
	for (const candidate of [base, base + '.ts', base + '.vue', path.join(base, 'index.ts')]) {
		if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate
	}
	return null
}

// `import '@/model/vue'` (effet de bord, sans clause) et `import … from '@/model/vue'`.
// Le second interdit à son joker de traverser un autre `import`, sinon une ligne d'effet de
// bord serait avalée par le `from` de la ligne suivante — et le cycle passerait inaperçu.
const SIDE_EFFECT_IMPORT = /^[ \t]*import\s+(['"])([^'"]+)\1/gm
const CLAUSED_IMPORT = /^[ \t]*import\s+(?!type\s)(?:(?!\bimport\b)[\s\S])*?\sfrom\s+(['"])([^'"]+)\1/gm

/** Imports statiques d'un fichier (les `import type` et les `import()` dynamiques sont ignorés). */
function staticImports(file: string): string[] {
	const source = fs.readFileSync(file, 'utf8')
	const specs = [...source.matchAll(SIDE_EFFECT_IMPORT), ...source.matchAll(CLAUSED_IMPORT)]
	return specs.map(m => resolveImport(m[2], file)).filter((f): f is string => f !== null)
}

describe('graphe d\'imports du bootstrap', () => {

	const files = sourceFiles(SRC).filter(f => !f.endsWith('.test.ts'))
	const importers = (target: string) => files
		.filter(f => staticImports(f).includes(path.join(SRC, target)))
		.map(f => path.relative(SRC, f))
		.sort()

	it('model/vue.ts n\'est importé que par le point d\'entrée', () => {
		expect(importers('model/vue.ts')).toEqual([ENTRY_POINT])
	})

	it('le point d\'entrée n\'est importé par personne', () => {
		// Garantit que model/vue.ts est bien une racine, donc hors de tout cycle.
		expect(importers(ENTRY_POINT)).toEqual([])
	})
})
