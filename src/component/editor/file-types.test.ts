import { describe, it, expect } from 'vitest'
import { getLanguageForPath, getLanguageVersion, getLanguageVersionLabel, getLanguageVersions, isLeekScript, AI_LANGUAGES } from './file-types'

// Ancre anti-dérive : la correspondance extension -> langage est dupliquée dans 3 repos
// (client file-types.ts, serveur AIController POLYGLOT/NON_LEEK/LANGUAGE_EXTENSIONS, generator
// PolyglotEntityAI.detectLanguage). Ce test verrouille la vue CLIENT ; si on ajoute/retire une
// extension polyglot, il casse et rappelle de synchroniser les 3 sources.

describe('getLanguageForPath', () => {
	// Extensions polyglot reconnues par le moteur (doit rester alignée sur POLYGLOT_EXTENSIONS PHP
	// = ['js','mjs','ts','mts','py'] et PolyglotEntityAI.detectLanguage côté generator).
	const cases: [string, string][] = [
		['main', 'leekscript'],        // sans extension = LeekScript (convention historique)
		['main.leek', 'leekscript'],
		['bot.js', 'javascript'],
		['bot.mjs', 'javascript'],
		['bot.ts', 'typescript'],
		['bot.mts', 'typescript'],
		['bot.py', 'python'],
		['dir/sub/bot.py', 'python'],  // le langage vient du basename, pas du dossier
		['BOT.JS', 'javascript'],      // insensible à la casse (comme strtolower serveur / detectLanguage)
		['notes.md', 'markdown'],
		['data.json', 'json'],
		['conf.yml', 'yaml'],
		['conf.yaml', 'yaml'],
		['readme.txt', 'plaintext'],
		['.gitignore', 'plaintext'],
		['weird.xyz', 'leekscript'],   // extension inconnue = LeekScript (defaut)
	]
	for (const [path, lang] of cases) {
		it(`${path} -> ${lang}`, () => {
			expect(getLanguageForPath(path)).toBe(lang)
		})
	}

	it('les extensions polyglot sont exactement js/mjs/ts/mts/py', () => {
		const polyglot = new Set(['javascript', 'typescript', 'python'])
		const ext = (p: string) => getLanguageForPath('f.' + p)
		const polyglotExts = ['js', 'mjs', 'ts', 'mts', 'py'].filter(e => polyglot.has(ext(e)))
		expect(polyglotExts).toEqual(['js', 'mjs', 'ts', 'mts', 'py'])
		// et aucune autre extension "courante" ne doit basculer en polyglot
		for (const e of ['leek', 'md', 'json', 'yml', 'yaml', 'txt', 'lsx', 'py2']) {
			expect(polyglot.has(ext(e))).toBe(false)
		}
	})
})

describe('isLeekScript', () => {
	it('vrai pour LeekScript / sans extension, faux pour le polyglot et les docs', () => {
		expect(isLeekScript('main')).toBe(true)
		expect(isLeekScript('main.leek')).toBe(true)
		expect(isLeekScript('bot.js')).toBe(false)
		expect(isLeekScript('bot.ts')).toBe(false)
		expect(isLeekScript('bot.py')).toBe(false)
		expect(isLeekScript('notes.md')).toBe(false)
	})
})

describe('getLanguageVersionLabel', () => {
	it('libellé de version pour les IA polyglot uniquement (LeekScript a son menu, docs rien)', () => {
		expect(getLanguageVersionLabel('bot.js')).toBe('JavaScript ES2026')
		expect(getLanguageVersionLabel('bot.mjs')).toBe('JavaScript ES2026')
		expect(getLanguageVersionLabel('bot.ts')).toBe('TypeScript 5.8')
		expect(getLanguageVersionLabel('bot.py')).toBe('Python 3.12')
		expect(getLanguageVersionLabel('main')).toBeNull()
		expect(getLanguageVersionLabel('main.leek')).toBeNull()
		expect(getLanguageVersionLabel('notes.md')).toBeNull()
	})
})

describe('getLanguageVersion', () => {
	it('pragma et syntaxe de commentaire par langage (alignés sur AIController::polyglotStarterCode)', () => {
		expect(getLanguageVersion('bot.js')).toEqual({label: 'JavaScript ES2026', short: 'ES2026', pragma: '2026', comment: '//'})
		expect(getLanguageVersion('bot.ts')).toEqual({label: 'TypeScript 5.8', short: '5.8', pragma: '5.8', comment: '//'})
		expect(getLanguageVersion('bot.py')).toEqual({label: 'Python 3.12', short: '3.12', pragma: '3.12', comment: '#'})
		expect(getLanguageVersion('main')).toBeNull()
	})
})

describe('getLanguageVersions', () => {
	it('liste des versions par langage (une seule aujourd\'hui), vide pour leekscript/inconnu', () => {
		expect(getLanguageVersions('javascript')).toEqual([{label: 'JavaScript ES2026', short: 'ES2026', pragma: '2026', comment: '//'}])
		expect(getLanguageVersions('typescript').length).toBe(1)
		expect(getLanguageVersions('python')[0].short).toBe('3.12')
		expect(getLanguageVersions('leekscript')).toEqual([])
		expect(getLanguageVersions('unknown')).toEqual([])
	})
})

describe('AI_LANGUAGES', () => {
	it('couvre les 4 langages proposés à la création, extensions cohérentes avec getLanguageForPath', () => {
		expect(AI_LANGUAGES.map(l => l.id)).toEqual(['leekscript', 'javascript', 'typescript', 'python'])
		for (const l of AI_LANGUAGES) {
			// LeekScript = extension vide -> nom sans point ; les autres = leur extension déclarée.
			const sample = l.extension ? 'demo' + l.extension : 'demo'
			expect(getLanguageForPath(sample)).toBe(l.id)
		}
	})
})
