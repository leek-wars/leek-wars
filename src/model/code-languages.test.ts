import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// Deux listes doivent rester d'accord : les alias acceptés dans une fence ```<lang>
// (CODE_LANGUAGE_IDS, leekwars.ts) et les grammaires Monarch réellement enregistrées
// (monaco-highlight.ts). Un alias sans grammaire passe silencieusement — editor.tokenize
// rend le code sans aucune coloration — d'où ce contrôle statique.
const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')

const declaredIds = () => {
	const src = read('./leekwars.ts')
	const block = src.slice(src.indexOf('const CODE_LANGUAGE_IDS'))
	const body = block.slice(block.indexOf('{') + 1, block.indexOf('\n}'))
	return new Set([...body.matchAll(/:\s*'([a-z]+)'/g)].map(m => m[1]))
}

const registeredIds = () => {
	const src = read('../component/editor/monaco-highlight.ts')
	const ids = [...src.matchAll(/\bensure\('([a-z]+)'/g)].map(m => m[1])
	// Ces deux-là passent par un module dédié plutôt que par ensure().
	if (/registerPythonLanguage\(languages\)/.test(src)) ids.push('python')
	if (/registerLeekScriptLanguage\(languages\)/.test(src)) ids.push('leekscript')
	return new Set(ids)
}

describe('langages de coloration', () => {
	it('chaque alias pointe vers une grammaire enregistrée', () => {
		const registered = registeredIds()
		const manquants = [...declaredIds()].filter(id => !registered.has(id))
		expect(manquants).toEqual([])
	})

	it('les langages demandés sur le forum sont couverts', () => {
		const ids = declaredIds()
		for (const lang of ['sql', 'shell', 'java', 'php', 'html', 'css', 'xml', 'yaml']) {
			expect(ids.has(lang), lang).toBe(true)
		}
	})

	it('aucune grammaire enregistrée sans alias pour l\'écrire', () => {
		const declared = declaredIds()
		const orphelines = [...registeredIds()].filter(id => !declared.has(id))
		expect(orphelines).toEqual([])
	})
})
