import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'

// Le panneau des mois LW+ (banque) vit dans son propre namespace lwplus-packs.* :
// les avantages qu'il résume ne peuvent pas être lus dans lwplus.*, qui n'est
// chargé que sur la page /lwplus. Une locale oubliée afficherait la clé brute
// (pas de fallbackLocale, cf. model/i18n.ts).
const DIR = 'src/component/lwplus'
const LOCALES = readdirSync(DIR)
	.map(f => /^lwplus-packs\.([a-z]{2})\.i18n$/.exec(f)?.[1])
	.filter((l): l is string => !!l)
	.sort()

const REFERENCE = JSON.parse(readFileSync(`${DIR}/lwplus-packs.fr.i18n`, 'utf8')) as Record<string, string>
const KEYS = Object.keys(REFERENCE)

describe('traductions du panneau des mois LW+', () => {
	it('trouve bien tous les fichiers de locale', () => {
		expect(LOCALES.length).toBeGreaterThanOrEqual(17)
		expect(LOCALES).toContain('fr')
	})

	it.each(LOCALES)('%s : mêmes clés que le français, toutes non vides', (locale) => {
		const messages = JSON.parse(readFileSync(`${DIR}/lwplus-packs.${locale}.i18n`, 'utf8')) as Record<string, string>
		expect(KEYS.filter(k => !(k in messages))).toEqual([])
		expect(Object.keys(messages).filter(k => !(k in REFERENCE))).toEqual([])
		expect(KEYS.filter(k => !messages[k]?.trim())).toEqual([])
	})

	it.each(LOCALES)('%s : les placeholders sont conservés', (locale) => {
		const messages = JSON.parse(readFileSync(`${DIR}/lwplus-packs.${locale}.i18n`, 'utf8')) as Record<string, string>
		for (const key of ['active_until', 'months_one', 'months_other', 'save', 'pay_for', 'bought']) {
			expect(messages[key], key).toContain('{0}')
		}
	})
})
