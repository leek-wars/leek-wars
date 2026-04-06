#!/usr/bin/env node
/**
 * Leek Wars — Translation checker (all languages vs FR reference)
 *
 * Usage:
 *   node scripts/translations.mjs check [options]          Audit des traductions
 *   node scripts/translations.mjs compare <file> [options] Comparaison côte-à-côte
 *
 * Options de check:
 *   --lang <code>                   Langue cible (défaut: toutes). Ex: en, de, it
 *   --severity error|warning|info   Sévérité minimum (défaut: info)
 *   --category <cat>                Filtrer par catégorie
 *   --file <name>                   Vérifier un seul fichier (ex: main.json)
 *   --json                          Sortie JSON
 *
 * Options de compare:
 *   --lang <code>                   Langue cible (défaut: en)
 *   --tsv                           Sortie TSV (pour tableur)
 *   --only-identical                Seulement les valeurs identiques
 *   --only-different                Seulement les valeurs différentes
 *
 * Exemples:
 *   node scripts/translations.mjs check                          Toutes les langues
 *   node scripts/translations.mjs check --lang en                Anglais seulement
 *   node scripts/translations.mjs check --lang de --severity error
 *   node scripts/translations.mjs check --category missing_key
 *   node scripts/translations.mjs compare main.json --lang it
 *   node scripts/translations.mjs compare trophy.json --lang es --tsv > review.tsv
 */

import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parseArgs } from 'util'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LANG_DIR = join(__dirname, '..', 'src', 'lang')
const FR_DIR = join(LANG_DIR, 'fr')

const ALL_LANGS = readdirSync(LANG_DIR, { withFileTypes: true })
	.filter(d => d.isDirectory() && d.name !== 'fr' && d.name !== 'locale')
	.map(d => d.name).sort()

const LANG_NAMES = {
	da: 'Danish', de: 'German', en: 'English', es: 'Spanish', fi: 'Finnish',
	hi: 'Hindi', id: 'Indonesian', it: 'Italian', ja: 'Japanese', ko: 'Korean',
	nl: 'Dutch', no: 'Norwegian', pl: 'Polish', pt: 'Portuguese', ru: 'Russian',
	sv: 'Swedish', zh: 'Chinese',
}

// ─── Allowlist (mots identiques FR/langue cible attendus) ───────────────────

const ALLOWLIST = {
	"chip.json": [
		"antidote", "apocalypse", "arsenic", "bandage", "carapace",
		"fracture", "iceberg", "inversion", "motivation", "mutation",
		"plasma", "rage", "solidification", "stalactite", "transmutation"
	],
	"weapon.json": [
		"b_laser", "bazooka", "destroyer", "double_gun", "excalibur",
		"j_laser", "katana", "laser", "m_laser", "machine_gun", "magnum",
		"neutrino", "odachi", "pistol", "revolver", "rhino",
		"shotgun", "submachine_gun", "taser"
	],
	"component.json": [
		"chiyembekezo", "hokajin", "hylocereus", "kirabo", "kiwi",
		"limbani", "morus", "nephelium", "orange", "ram2", "ram3",
		"switch", "switch2", "thokozani", "uzoma"
	],
	"trophy.json": [
		"10_years_f", "9_34", "agoraphile", "antidote", "baron",
		"binge_watcher", "blitzkrieg", "blitzkrieg_f", "boss", "boss_f",
		"botaniste", "brillant", "carapace", "cardinal", "category_bonus",
		"category_boss", "category_code", "category_fun", "category_social",
		"centurion", "chaman", "chaman_f", "challenger", "champion",
		"chief", "chic", "colossus", "colossus_f", "combo", "combo_f",
		"comrade", "concise_f", "courteous", "crusher", "daimyo",
		"destroyer", "destroyer_f", "diabolique", "diplomat",
		"duelist", "expert", "fan_club", "fatal", "fertile",
		"flamboyant", "flamer_f", "fratricide", "fulminant", "geek",
		"glacial", "generalist", "generalist_f", "gladiator",
		"gladiator_f", "guru", "guru_f", "hardcore",
		"herbicide", "honorable", "hyperactive_f",
		"imperator", "inclusive_f", "indestructible", "infernal",
		"intelligent", "invincible",
		"kamikaze", "kamikaze_f", "kleptomane", "knight", "knight_f", "konami",
		"lucky", "lynx", "maestro", "magus", "major", "merlin", "miracle",
		"necromancien", "ninja", "nyctalope", "o_o", "overdose",
		"paladin", "paladin_f", "paparazzi", "passive_f", "patient",
		"perfectionist", "perfectionist_f",
		"philanthrope", "pillage", "pillage_f", "plural",
		"prompt", "provocateur", "provocateur_f", "puncher",
		"quidam", "rambo", "resurrection", "rocky", "ronin", "roxxor", "rusher",
		"saboteur", "saboteur_f", "secret", "serge", "shogun",
		"slayer", "slayer_f", "sniper", "social",
		"solitaire", "spartacus", "speedrunner",
		"strategist", "strategist_f", "tank",
		"terminator", "terminator_f", "titan", "titan_f",
		"top1", "top10", "top100", "top1000", "top3",
		"torrent", "turbulent", "unique", "valiant", "versatile",
		"veteran", "veteran_f"
	],
	"potion.json": [
		"christmas_star", "skin_5", "skin_6", "skin_7",
		"skin_13", "skin_18", "skin_30", "skin_36",
		"skin_42", "skin_43", "skin_black_desc", "skin_rasta_desc", "star"
	],
	"entity.json": [
		"bulb_fire", "bulb_ice", "bulb_lightning", "bulb_puny",
		"hubbard", "nasu_ronin"
	],
	"main.json": [
		"active", "contact", "dev-blog", "difficulty_1", "grade",
		"habs", "map", "mobile", "notifications", "pause",
		"potions", "rare", "ratio", "resume", "roadmap",
		"smiley_group_nature", "stats", "time_format_hhmm",
		"total", "talent", "trophies",
		"n_capital", "n_compositions", "n_hour", "n_messages",
		"n_minute", "n_second", "x_habs"
	],
	"characteristic.json": ["base", "boost", "science", "variables"],
	"effect.json": [
		"area_10", "area_6", "area_7", "area_8", "area_9",
		"effect_type_6", "irreductible", "state_1", "state_3", "state_6"
	],
	"country.json": [
		"af", "ao", "bd", "bf", "bi", "bs", "bw", "bz", "ca", "cr",
		"cu", "dj", "fr", "ga", "gh", "gm", "gn", "gt", "gw", "gy",
		"hn", "ht", "ir", "jm", "ke", "kg", "ki", "kz", "la", "li",
		"lk", "lr", "ls", "lu", "mc", "mg", "ml", "mr", "mu", "mv",
		"mw", "mz", "na", "ne", "ng", "ni", "np", "nr", "om", "pa",
		"pg", "ph", "pk", "ps", "pt", "py", "qa", "rw", "sc", "sg",
		"sl", "sn", "sr", "ss", "sz", "td", "tg", "tl", "to", "tt",
		"tv", "tz", "ua", "ug", "uy", "va", "ve", "vu", "ws", "za",
		"zm", "zw"
	],
	"changelog.json": ["popup_ok", "version_n"],
	"resource.json": ["amazonite", "aragonite", "hab", "inro", "statuette"],
	"hat.json": ["fedora", "panama", "sombrero"],
	"flag.json": ["anti", "flag_2", "flag_4", "white"],
	"leekscript.json": [
		"argument", "error_76", "example_code_v2", "expert",
		"lambda", "leekscript", "lstype_boolean", "normal", "variable"
	],
	"notification.json": ["category_6"],
	"tutorial.json": ["editor_items"],
}

const IGNORE_IDENTICAL = new Set([
	'admin', 'chat', 'capital', 'bank', 'forum', 'wiki',
	'battle_royale', 'ok', 'level', 'tp', 'mp', 'pm',
	'github', 'discord', 'documentation', 'email',
])

const FRENCH_COMMON = new Set([
	'est', 'sont', 'les', 'des', 'une', 'dans', 'pour', 'avec', 'sur',
	'mais', 'pas', 'qui', 'que', 'cette', 'ces', 'vous', 'nous', 'ils',
	'elles', 'leur', 'votre', 'notre', 'mon', 'ton', 'son', 'aux',
	'elle', 'ne', 'se', 'si', 'peut', 'fait', 'être', 'avoir',
	'aussi', 'comme', 'tout', 'tous', 'toutes', 'très', 'plus', 'moins',
	'ici', 'là', 'donc', 'car', 'puis', 'chez', 'sans', 'sous', 'vers',
	'entre', 'encore', 'même', 'autre', 'autres', 'après', 'avant',
	'chaque', 'pendant', 'depuis', 'contre', 'aucun', 'aucune',
])

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isAllowlisted(file, key) {
	const list = ALLOWLIST[file]
	return Array.isArray(list) && list.includes(key)
}

function extractPlaceholders(text, { includeCrossRefs = true } = {}) {
	const patterns = [/\{\d+\}/g, /%(\d+\$)?[sdfu]/g]
	if (includeCrossRefs) patterns.push(/#img_\w+/g)
	const matches = []
	for (const p of patterns) for (const m of text.matchAll(p)) matches.push(m[0])
	return matches.sort()
}

function extractHtmlTags(text) {
	return [...text.matchAll(/<\/?[a-zA-Z][^>]*>/g)].map(m => m[0])
}

function loadJson(path) {
	return JSON.parse(readFileSync(path, 'utf-8'))
}

function parseLangFile(path) {
	if (!existsSync(path)) return null
	try { return JSON.parse(readFileSync(path, 'utf-8')) }
	catch { /* fallback key=value */ }
	const dict = {}
	for (const line of readFileSync(path, 'utf-8').split('\n')) {
		const idx = line.indexOf('=')
		if (idx !== -1) dict[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
	}
	return dict
}

// ─── Issue class ─────────────────────────────────────────────────────────────

class Issue {
	constructor(lang, file, key, severity, category, message, frVal = '', tgtVal = '') {
		Object.assign(this, { lang, file, key, severity, category, message, frVal, tgtVal })
	}
	toString() {
		const sev = `[${this.severity.toUpperCase().padEnd(7)}]`
		let s = `${sev} ${this.file}:${this.key} — ${this.message}`
		if (this.frVal) s += `\n         FR: ${this.frVal.slice(0, 120)}`
		if (this.tgtVal) s += `\n         ${this.lang.toUpperCase()}: ${this.tgtVal.slice(0, 120)}`
		return s
	}
	toJSON() {
		const d = { lang: this.lang, file: this.file, key: this.key, severity: this.severity, category: this.category, message: this.message }
		if (this.frVal) d.fr = this.frVal
		if (this.tgtVal) d[this.lang] = this.tgtVal
		return d
	}
}

// ─── Check logic ─────────────────────────────────────────────────────────────

function checkJsonFile(lang, filename, issues) {
	const frPath = join(FR_DIR, filename)
	const tgtDir = join(LANG_DIR, lang)
	const tgtPath = join(tgtDir, filename)
	if (!existsSync(frPath)) return
	if (!existsSync(tgtPath)) { issues.push(new Issue(lang, filename, '', 'error', 'missing_file', `${lang.toUpperCase()} file missing`)); return }

	const frData = loadJson(frPath), tgtData = loadJson(tgtPath)
	const frKeys = new Set(Object.keys(frData)), tgtKeys = new Set(Object.keys(tgtData))

	for (const key of [...frKeys].filter(k => !tgtKeys.has(k)).sort())
		issues.push(new Issue(lang, filename, key, 'error', 'missing_key', `Key missing in ${lang.toUpperCase()}`, String(frData[key])))
	for (const key of [...tgtKeys].filter(k => !frKeys.has(k)).sort())
		issues.push(new Issue(lang, filename, key, 'warning', 'extra_key', `Key in ${lang.toUpperCase()} but not in FR`, '', String(tgtData[key])))

	for (const key of [...frKeys].filter(k => tgtKeys.has(k)).sort()) {
		const frVal = String(frData[key]), tgtVal = String(tgtData[key])

		if (tgtVal.trim() === '' && frVal.trim() !== '') {
			issues.push(new Issue(lang, filename, key, 'error', 'empty_value', `${lang.toUpperCase()} value is empty`, frVal)); continue
		}
		if (frVal === tgtVal && !IGNORE_IDENTICAL.has(key) && !isAllowlisted(filename, key))
			if (frVal.length > 2 && !/^\d+$/.test(frVal) && !/^https?:\/\//.test(frVal) && !/^[A-Z_]+$/.test(frVal))
				issues.push(new Issue(lang, filename, key, 'warning', 'untranslated', `${lang.toUpperCase()} identical to FR (possibly untranslated)`, frVal, tgtVal))

		const frPh = extractPlaceholders(frVal), tgtPh = extractPlaceholders(tgtVal)
		if (frPh.join(',') !== tgtPh.join(','))
			issues.push(new Issue(lang, filename, key, 'error', 'placeholder_mismatch', `Placeholder mismatch: FR=[${frPh}] ${lang.toUpperCase()}=[${tgtPh}]`, frVal, tgtVal))

		const frTags = extractHtmlTags(frVal), tgtTags = extractHtmlTags(tgtVal)
		if (frTags.join(',') !== tgtTags.join(','))
			issues.push(new Issue(lang, filename, key, 'warning', 'html_mismatch', 'HTML structure differs', frVal, tgtVal))

		if (tgtVal !== tgtVal.trim() && frVal === frVal.trim())
			issues.push(new Issue(lang, filename, key, 'info', 'whitespace', `${lang.toUpperCase()} has unexpected leading/trailing whitespace`, '', JSON.stringify(tgtVal)))
	}
}

function checkLangFile(lang, prefix, issues) {
	const frDict = parseLangFile(join(LANG_DIR, `${prefix}.fr.lang`))
	const tgtDict = parseLangFile(join(LANG_DIR, `${prefix}.${lang}.lang`))
	const filename = `${prefix}.lang`
	if (!frDict || !tgtDict) { if (!tgtDict) issues.push(new Issue(lang, `${prefix}.${lang}.lang`, '', 'error', 'missing_file', `${lang.toUpperCase()} .lang file missing`)); return }

	const frKeys = new Set(Object.keys(frDict)), tgtKeys = new Set(Object.keys(tgtDict))
	for (const key of [...frKeys].filter(k => !tgtKeys.has(k)).sort())
		issues.push(new Issue(lang, filename, key, 'error', 'missing_key', `Key missing in ${lang.toUpperCase()} .lang`, frDict[key]))
	for (const key of [...tgtKeys].filter(k => !frKeys.has(k)).sort())
		issues.push(new Issue(lang, filename, key, 'warning', 'extra_key', `Key in ${lang.toUpperCase()} but not in FR .lang`, '', tgtDict[key]))

	for (const key of [...frKeys].filter(k => tgtKeys.has(k)).sort()) {
		const frVal = frDict[key], tgtVal = tgtDict[key]
		if (tgtVal.trim() === '' && frVal.trim() !== '')
			issues.push(new Issue(lang, filename, key, 'error', 'empty_value', `${lang.toUpperCase()} value is empty`, frVal))
		if (frVal === tgtVal && frVal.length > 3 && !/^https?:\/\//.test(frVal))
			issues.push(new Issue(lang, filename, key, 'warning', 'untranslated', `${lang.toUpperCase()} identical to FR (possibly untranslated)`, frVal, tgtVal))

		const opts = { includeCrossRefs: false }
		const frPh = extractPlaceholders(frVal, opts), tgtPh = extractPlaceholders(tgtVal, opts)
		if (frPh.join(',') !== tgtPh.join(','))
			issues.push(new Issue(lang, filename, key, 'error', 'placeholder_mismatch', `Placeholder mismatch: FR=[${frPh}] ${lang.toUpperCase()}=[${tgtPh}]`, frVal, tgtVal))
	}
}

function qualityCheckFrench(lang, issues) {
	const tgtDir = join(LANG_DIR, lang)
	for (const filename of readdirSync(tgtDir).filter(f => f.endsWith('.json')).sort()) {
		const data = loadJson(join(tgtDir, filename))
		for (const [key, rawVal] of Object.entries(data)) {
			const val = String(rawVal)
			const words = val.split(/\s+/)
			if (val.length < 8 || words.length < 4) continue
			let frenchCount = 0
			for (const w of words) if (FRENCH_COMMON.has(w.toLowerCase().replace(/[.,!?:;'"()]/g, ''))) frenchCount++
			if (frenchCount / words.length > 0.3)
				issues.push(new Issue(lang, filename, key, 'error', 'french_in_translation', `Likely untranslated French text (${frenchCount}/${words.length} French words)`, '', val))
		}
	}
}

// ─── Commands ────────────────────────────────────────────────────────────────

function cmdCheck(args) {
	const minSeverity = SEVERITY_ORDER[args.severity] ?? 2
	const langs = args.lang ? [args.lang] : ALL_LANGS

	const frJsonFiles = readdirSync(FR_DIR).filter(f => f.endsWith('.json')).sort()
	let totalFrKeys = 0
	for (const f of frJsonFiles) totalFrKeys += Object.keys(loadJson(join(FR_DIR, f))).length

	const allIssues = []
	const langStats = {}

	for (const lang of langs) {
		const issues = []
		for (const f of frJsonFiles) { if (args.file && f !== args.file) continue; checkJsonFile(lang, f, issues) }
		if (!args.file) {
			for (const prefix of ['doc', 'fight']) checkLangFile(lang, prefix, issues)
			qualityCheckFrench(lang, issues)
		}

		let tgtKeys = 0
		const tgtDir = join(LANG_DIR, lang)
		if (existsSync(tgtDir)) {
			for (const f of frJsonFiles) {
				const p = join(tgtDir, f)
				if (existsSync(p)) tgtKeys += Object.keys(loadJson(p)).length
			}
		}

		let filtered = issues.filter(i => SEVERITY_ORDER[i.severity] <= minSeverity)
		if (args.category) filtered = filtered.filter(i => i.category === args.category)

		const counts = { error: 0, warning: 0, info: 0 }
		for (const i of filtered) counts[i.severity]++
		langStats[lang] = { keys: tgtKeys, ...counts, total: filtered.length }

		allIssues.push(...filtered)
	}

	allIssues.sort((a, b) => a.lang.localeCompare(b.lang) || SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.file.localeCompare(b.file) || a.key.localeCompare(b.key))

	if (args.json) { console.log(JSON.stringify(allIssues.map(i => i.toJSON()), null, 2)); return }

	console.log('='.repeat(70))
	console.log('LEEK WARS TRANSLATION AUDIT — all languages vs FR (reference)')
	console.log('='.repeat(70))
	console.log(`\nFR reference: ${totalFrKeys} keys\n`)

	// Summary table
	console.log('LANG  NAME            KEYS    ERRORS  WARNINGS  INFO    TOTAL')
	console.log('─'.repeat(65))
	for (const lang of langs) {
		const s = langStats[lang]
		const name = (LANG_NAMES[lang] || lang).padEnd(15)
		const keys = String(s.keys).padStart(5)
		const errors = s.error ? `\x1b[31m${String(s.error).padStart(6)}\x1b[0m` : String(0).padStart(6)
		const warnings = s.warning ? `\x1b[33m${String(s.warning).padStart(8)}\x1b[0m` : String(0).padStart(8)
		const info = String(s.info).padStart(6)
		const total = String(s.total).padStart(7)
		console.log(`${lang.toUpperCase().padEnd(4)}  ${name} ${keys}  ${errors}  ${warnings}  ${info}  ${total}`)
	}

	// Detail per lang
	for (const lang of langs) {
		const langIssues = allIssues.filter(i => i.lang === lang)
		if (langIssues.length === 0) continue

		console.log(`\n${'━'.repeat(70)}`)
		console.log(`  ${lang.toUpperCase()} — ${LANG_NAMES[lang] || lang} (${langIssues.length} issues)`)
		console.log('━'.repeat(70))

		let currentFile = null
		for (const issue of langIssues) {
			if (issue.file !== currentFile) { currentFile = issue.file; console.log(`\n  ${currentFile}\n  ${'─'.repeat(40)}`) }
			console.log(issue.toString() + '\n')
		}
	}
}

function cmdCompare(args, filename) {
	const lang = args.lang || 'en'
	if (!filename) {
		console.error(`Usage: node scripts/translations.mjs compare <file.json> [--lang ${lang}] [--tsv] [--only-identical] [--only-different]\n`)
		console.error('Available files:')
		for (const f of readdirSync(FR_DIR).filter(f => f.endsWith('.json')).sort()) console.error(`  ${f}`)
		process.exit(1)
	}
	const frPath = join(FR_DIR, filename)
	const tgtPath = join(LANG_DIR, lang, filename)
	if (!existsSync(frPath)) { console.error(`FR file not found: ${frPath}`); process.exit(1) }
	if (!existsSync(tgtPath)) { console.error(`${lang.toUpperCase()} file not found: ${tgtPath}`); process.exit(1) }

	const frData = loadJson(frPath), tgtData = loadJson(tgtPath)
	const allKeys = new Set([...Object.keys(frData), ...Object.keys(tgtData)])
	const rows = []

	for (const key of [...allKeys].sort()) {
		const fr = frData[key] !== undefined ? String(frData[key]) : '⚠ MISSING'
		const tgt = tgtData[key] !== undefined ? String(tgtData[key]) : '⚠ MISSING'
		const identical = fr === tgt
		if (args['only-different'] && identical) continue
		if (args['only-identical'] && !identical) continue
		rows.push({ key, fr, tgt, identical })
	}

	const TGT = lang.toUpperCase()
	if (args.tsv) {
		console.log(`key\tfr\t${lang}\tstatus`)
		for (const r of rows) {
			const status = r.fr === '⚠ MISSING' ? 'MISSING_FR' : r.tgt === '⚠ MISSING' ? `MISSING_${TGT}` : r.identical ? 'IDENTICAL' : 'OK'
			console.log(`${r.key}\t${r.fr.replace(/\t/g, ' ')}\t${r.tgt.replace(/\t/g, ' ')}\t${status}`)
		}
	} else {
		const maxKey = Math.min(30, Math.max(...rows.map(r => r.key.length)))
		const maxFr = Math.min(50, Math.max(...rows.map(r => r.fr.length)))
		console.log(`${'KEY'.padEnd(maxKey)}  ${'FR'.padEnd(maxFr)}  ${TGT}`)
		console.log('─'.repeat(maxKey + maxFr + 50))
		for (const r of rows) {
			const marker = r.identical ? ' =' : r.fr === '⚠ MISSING' || r.tgt === '⚠ MISSING' ? ' !' : '  '
			const frTrunc = r.fr.length > maxFr ? r.fr.slice(0, maxFr - 3) + '...' : r.fr.padEnd(maxFr)
			const tgtTrunc = r.tgt.length > 80 ? r.tgt.slice(0, 77) + '...' : r.tgt
			console.log(`${r.key.padEnd(maxKey)}${marker}${frTrunc}  ${tgtTrunc}`)
		}
		console.log(`\nTotal: ${rows.length} keys | Identical: ${rows.filter(r => r.identical).length} | Missing ${TGT}: ${rows.filter(r => r.tgt === '⚠ MISSING').length} | Missing FR: ${rows.filter(r => r.fr === '⚠ MISSING').length}`)
	}
}

// ─── Main ────────────────────────────────────────────────────────────────────

const { values: args, positionals } = parseArgs({
	options: {
		json: { type: 'boolean', default: false },
		tsv: { type: 'boolean', default: false },
		lang: { type: 'string' },
		file: { type: 'string' },
		severity: { type: 'string', default: 'info' },
		category: { type: 'string' },
		'only-different': { type: 'boolean', default: false },
		'only-identical': { type: 'boolean', default: false },
	},
	allowPositionals: true,
})

const command = positionals[0] || 'check'

if (command === 'check') {
	cmdCheck(args)
} else if (command === 'compare') {
	cmdCompare(args, positionals[1])
} else {
	console.error(`Usage:
  node scripts/translations.mjs check [--lang <code>] [--severity error|warning|info] [--category <cat>] [--file <name>] [--json]
  node scripts/translations.mjs compare <file.json> [--lang <code>] [--tsv] [--only-identical] [--only-different]

Available languages: ${ALL_LANGS.join(', ')}`)
	process.exit(1)
}
