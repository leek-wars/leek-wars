import { describe, it, expect } from 'vitest'
import { codeMask, findInlineFoldRegions, foldLine, mayHaveInlineFold, unfoldBreakOffsets, type Injection } from './inline-fold'

const numbers = (n: number) => Array.from({ length: n }, (_, i) => (i * 1.5).toFixed(2)).join(', ')
const regionsOf = (line: string, language = 'python') => findInlineFoldRegions(line, codeMask(line, language))
// Masque lisible : « c » pour le code, « . » pour les chaînes et commentaires
const mask = (line: string, language: string) => [...codeMask(line, language)].map((code) => code ? 'c' : '.').join('')

describe('codeMask', () => {
	it('écarte les chaînes, échappements compris', () => {
		expect(mask(`a = "x\\"]" + 'y'`, 'python')).toBe('cccc......ccc...')
	})

	it('suit les commentaires de chaque langage', () => {
		expect(mask('a = 1 # [x]', 'python')).toBe('cccccc.....')
		expect(mask('a = 1 // [x]', 'leekscript')).toBe('cccccc......')
		expect(mask('a /* [ */ = 1', 'leekscript')).toBe('cc.......cccc')
		expect(mask('a = `[${b}]`', 'typescript')).toBe('cccc........')
	})
})

describe('findInlineFoldRegions', () => {
	it('repère un long tableau et compte ses éléments', () => {
		const line = `COEFS = [${numbers(30)}]`
		expect(regionsOf(line)).toEqual([{ open: 8, close: line.length - 1, count: 30 }])
	})

	it('ignore les paires trop courtes', () => {
		expect(regionsOf('var weapons = [WEAPON_PISTOL, WEAPON_MACHINE_GUN]', 'leekscript')).toEqual([])
	})

	it('ne garde que les paires les plus extérieures, jamais les parenthèses', () => {
		const line = `x = np.array([[${numbers(20)}], [${numbers(20)}]])`
		const regions = regionsOf(line)
		expect(regions).toHaveLength(1)
		expect(regions[0].open).toBe(line.indexOf('[['))
		expect(regions[0].count).toBe(2)
	})

	it('rend plusieurs paires sœurs de la même ligne', () => {
		const line = `f([${numbers(20)}], {${numbers(20).replace(/, /g, ': 1, ')}: 1})`
		const regions = regionsOf(line)
		expect(regions.map((r) => line[r.open])).toEqual(['[', '{'])
		expect(regions.map((r) => r.count)).toEqual([20, 20])
	})

	it('ignore les crochets des chaînes et des commentaires', () => {
		const line = `labels = ["[", "(", ${numbers(20)}, "}"] # [`
		const regions = regionsOf(line)
		expect(regions).toHaveLength(1)
		expect(regions[0].open).toBe(9)
		expect(regions[0].count).toBe(23)
	})

	it('compte les dictionnaires et la virgule finale', () => {
		const dict = `names = {${Array.from({ length: 12 }, (_, i) => `${i}: 'buf_${i}'`).join(', ')}}`
		expect(regionsOf(dict)[0].count).toBe(12)
		expect(regionsOf(`t = [${numbers(25)},]`)[0].count).toBe(25)
	})

	it('ignore une fermeture venue d\'une ligne précédente', () => {
		const regions = regionsOf(`], [${numbers(25)}]`)
		expect(regions).toHaveLength(1)
		expect(regions[0].open).toBe(3)
	})

	it('abandonne une ligne aux paires incohérentes', () => {
		expect(regionsOf(`x = [${numbers(25)})`)).toEqual([])
	})
})

describe('mayHaveInlineFold', () => {
	it('filtre sans analyse', () => {
		expect(mayHaveInlineFold(`x = [${numbers(25)}]`)).toBe(true)
		expect(mayHaveInlineFold(`debug(${numbers(25)})`)).toBe(false)
		expect(mayHaveInlineFold('x = [1, 2] // ' + 'commentaire '.repeat(10))).toBe(false)
	})
})

// Rejoue ce que fait Monaco : texte + injections, découpé aux coupures.
function viewLines(text: string, injections: { offset: number, content: string }[], breaks: number[]): string[] {
	let withInjections = ''
	let from = 0
	for (const injection of injections) {
		withInjections += text.slice(from, injection.offset) + injection.content
		from = injection.offset
	}
	withInjections += text.slice(from)
	return breaks.map((end, i) => withInjections.slice(i ? breaks[i - 1] : 0, end))
}

const lengths = (injections: { offset: number, content: string }[]): Injection[] =>
	injections.map((injection) => ({ offset: injection.offset, length: injection.content.length }))

describe('foldLine / unfoldBreakOffsets', () => {
	it('retire la plage masquée et la réinsère après le « ⋯ »', () => {
		const text = 'x = [aaaa]'
		const injections = [{ offset: 5, content: '⋯4' }]
		const folded = foldLine(text, lengths(injections), [{ start: 5, length: 4 }])
		expect(folded.text).toBe('x = []')
		expect(folded.kept).toEqual([0])
		expect(folded.offsets).toEqual([5])
		const visibleBreaks = [folded.text.length + 2]
		const breaks = unfoldBreakOffsets(visibleBreaks, folded.insertions)
		expect(viewLines(text, injections, breaks)).toEqual(['x = [⋯4aaaa]'])
	})

	it('garde les coupures calculées sur le texte replié', () => {
		const text = 'values = [0123456789] + other'
		const injections = [{ offset: 10, content: '⋯' }]
		const folded = foldLine(text, lengths(injections), [{ start: 10, length: 10 }])
		expect(folded.text).toBe('values = [] + other')
		// Coupures du texte visible avec injections « values = [⋯] + other » (20 caractères)
		expect(viewLines(text, injections, unfoldBreakOffsets([11, 20], folded.insertions))).toEqual(['values = [⋯0123456789', '] + other'])
		expect(viewLines(text, injections, unfoldBreakOffsets([10, 20], folded.insertions))).toEqual(['values = [', '⋯0123456789] + other'])
	})

	it('conserve les injections hors des plages et retire celles du dedans', () => {
		const text = 'a = [xxxxxxxx] # fin'
		const injections = [
			{ offset: 2, content: '<avant>' },
			{ offset: 5, content: '⋯' },
			{ offset: 8, content: '<dedans>' },
			{ offset: 13, content: '<après>' },
		]
		const folded = foldLine(text, lengths(injections), [{ start: 5, length: 8 }])
		expect(folded.text).toBe('a = [] # fin')
		expect(folded.kept).toEqual([0, 1, 3])
		expect(folded.offsets).toEqual([2, 5, 5])
		const kept = folded.kept.map((k) => injections[k])
		const total = folded.text.length + kept.reduce((sum, injection) => sum + injection.content.length, 0)
		const breaks = unfoldBreakOffsets([total], folded.insertions)
		expect(viewLines(text, kept, breaks)).toEqual(['a <avant>= [⋯xxxxxxxx<après>] # fin'])
	})

	it('replie plusieurs plages de la même ligne', () => {
		const text = 'f([aaaa], [bbbbbb])'
		const injections = [{ offset: 3, content: '⋯' }, { offset: 11, content: '⋯' }]
		const folded = foldLine(text, lengths(injections), [{ start: 11, length: 6 }, { start: 3, length: 4 }])
		expect(folded.text).toBe('f([], [])')
		expect(folded.offsets).toEqual([3, 7])
		const breaks = unfoldBreakOffsets([folded.text.length + 2], folded.insertions)
		expect(viewLines(text, injections, breaks)).toEqual(['f([⋯aaaa], [⋯bbbbbb])'])
	})

	it('borne une plage périmée à la ligne', () => {
		const text = 'x = [ab]'
		const folded = foldLine(text, [{ offset: 5, length: 1 }], [{ start: 5, length: 40 }])
		expect(folded.text).toBe('x = [')
		expect(unfoldBreakOffsets([6], folded.insertions)).toEqual([9])
	})
})
