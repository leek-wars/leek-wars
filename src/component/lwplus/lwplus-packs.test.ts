import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'

// Le panneau des formules LW+ (banque) vit dans son propre namespace lwplus-packs.* :
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
		for (const key of ['active_until', 'months_one', 'months_other', 'save', 'subscribe_for', 'cadence_months', 'bought', 'confirm_question']) {
			expect(messages[key], key).toContain('{0}')
		}
	})
})

// Même garde pour le remerciement d'achat : son namespace est distinct, et il
// n'est chargé qu'après un paiement — une clé manquante ne se verrait pas en
// navigation normale.
const THANKS_REF = JSON.parse(readFileSync(`${DIR}/lwplus-thanks.fr.i18n`, 'utf8')) as Record<string, string>
const THANKS_KEYS = Object.keys(THANKS_REF)
const THANKS_LOCALES = readdirSync(DIR)
	.map(f => /^lwplus-thanks\.([a-z]{2})\.i18n$/.exec(f)?.[1])
	.filter((l): l is string => !!l)
	.sort()

describe('traductions du remerciement LW+', () => {
	it('trouve bien tous les fichiers de locale', () => {
		expect(THANKS_LOCALES.length).toBeGreaterThanOrEqual(17)
		expect(THANKS_LOCALES).toEqual(LOCALES)
	})

	it.each(THANKS_LOCALES)('%s : mêmes clés que le français, toutes non vides', (locale) => {
		const messages = JSON.parse(readFileSync(`${DIR}/lwplus-thanks.${locale}.i18n`, 'utf8')) as Record<string, string>
		expect(THANKS_KEYS.filter(k => !(k in messages))).toEqual([])
		expect(Object.keys(messages).filter(k => !(k in THANKS_REF))).toEqual([])
		expect(THANKS_KEYS.filter(k => !messages[k]?.trim())).toEqual([])
	})

	it.each(THANKS_LOCALES)('%s : le nombre de mois garde son placeholder', (locale) => {
		const messages = JSON.parse(readFileSync(`${DIR}/lwplus-thanks.${locale}.i18n`, 'utf8')) as Record<string, string>
		expect(messages.intro_months).toContain('{0}')
	})
})
