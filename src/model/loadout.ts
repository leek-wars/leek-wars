export type ComponentStats = { [carac: string]: number }

export interface LoadoutComponent {
	index: number   // 0..7
	template: number
	/**
	 * Stats (delta d'altération) de la PIÈCE choisie par le joueur, null pour une pièce de
	 * base. L'ensemble ne mémorise jamais une instance, seulement ses stats.
	 */
	stats?: ComponentStats | null
}

export type LoadoutStats = { [stat: string]: number }   // capital dépensé par stat

export class Loadout {
	id!: number
	name!: string
	icon!: string   // emoji unicode OU nom de caractéristique ("strength", "agility", ...)
	weapons!: number[]                  // template ids — armes non-oubliées, équipées telles quelles
	forgotten_weapons!: number[]        // template ids — candidates ordonnées, première dispo gagne
	chips!: number[]                    // template ids
	components!: LoadoutComponent[]
	stats!: LoadoutStats
	order!: number
}

/** Clé canonique d'un delta d'altération : '' pour une pièce de base, sinon les caracs triées. */
export function componentStatsKey(stats?: ComponentStats | null): string {
	if (!stats) return ''
	const entries = Object.entries(stats).filter(([, v]) => v).sort(([a], [b]) => a.localeCompare(b))
	return entries.length ? entries.map(([k, v]) => k + ':' + v).join(',') : ''
}

/** Deux choix de composant désignent la même pièce : même template, mêmes stats. */
export function sameComponentChoice(a: { template: number, stats?: ComponentStats | null }, b: { template: number, stats?: ComponentStats | null }): boolean {
	return a.template === b.template && componentStatsKey(a.stats) === componentStatsKey(b.stats)
}

/** Apport d'un composant d'ensemble sur une carac : stats de base du template plus le delta mémorisé. */
export function loadoutComponentStat(baseStats: [string, number][] | undefined, delta: ComponentStats | null | undefined, stat: string): number {
	let total = 0
	if (baseStats) for (const [s, v] of baseStats) if (s === stat) total += v
	if (delta && delta[stat]) total += delta[stat]
	return total
}

// ---------------------------------------------------------------------------
// Import / export d'un ensemble (#12079)
//
// Format d'échange : du JSON qui ne désigne les items que par leur NOM
// (`weapon_m_laser`, `chip_mutation`, `core3`), jamais par un id de template —
// un outil externe (restator…) ou un joueur qui écrit son build à la main n'a
// pas la table des templates, et les ids ne veulent rien dire à la lecture.
// L'import accepte quand même un id numérique, et un nom d'arme ou de puce
// sans son préfixe (`m_laser` pour `weapon_m_laser`).
// ---------------------------------------------------------------------------

export const LOADOUT_EXPORT_VERSION = 1
export const LOADOUT_EXPORT_TYPE = 'leek-wars-loadout'
export const LOADOUT_EXPORT_TYPE_MANY = 'leek-wars-loadouts'

/** Caractéristiques allouables par un ensemble. */
export const LOADOUT_STATS = ['life', 'strength', 'wisdom', 'agility', 'resistance', 'science', 'magic', 'frequency', 'tp', 'mp', 'cores', 'ram']

const MAX_LOADOUT_COMPONENTS = 8
const NAME_MAX_LENGTH = 60
const ICON_MAX_LENGTH = 32

// Types d'item, comme ItemType côté modèle (on ne l'importe pas : item.ts tire
// toute la chaîne leek/farmer, qui repasse par ce fichier).
const TYPE_WEAPON = 1
const TYPE_CHIP = 2
const TYPE_COMPONENT = 8

/** Le minimum dont l'import/export a besoin d'un template d'item. */
export interface LoadoutExportItem {
	name: string
	type: number
}
export type LoadoutExportItems = { [template: string]: LoadoutExportItem }

export interface LoadoutExportComponent {
	slot: number
	item: string
	stats?: ComponentStats
}

export interface LoadoutExportBody {
	name: string
	icon?: string
	weapons: string[]
	forgotten_weapons?: string[]
	chips: string[]
	components?: LoadoutExportComponent[]
	stats: LoadoutStats
}

export interface LoadoutExport extends LoadoutExportBody {
	type: string
	version: number
}

/** Un ensemble lu depuis du JSON : templates résolus, prêt pour l'éditeur. */
export interface ParsedLoadout {
	name: string
	icon: string
	/** Armes fixes puis oubliées, dans l'ordre : l'appelant sépare (il connaît le flag `forgotten`). */
	weapons: number[]
	chips: number[]
	components: LoadoutComponent[]
	stats: LoadoutStats
}

export interface LoadoutParseResult {
	loadouts: ParsedLoadout[]
	/** Entrées laissées de côté : item inconnu, ou nom qui ne désigne pas le bon type. */
	ignored: string[]
}

/** Coupe en CARACTÈRES et non en unités UTF-16 (un emoji compte pour un). */
function truncate(text: string, length: number): string {
	const chars = [...text]
	return chars.length > length ? chars.slice(0, length).join('') : text
}

function itemName(items: LoadoutExportItems, template: number): string | null {
	return items[template]?.name ?? null
}

function exportItems(items: LoadoutExportItems, templates: number[] | undefined): string[] {
	const out: string[] = []
	for (const tpl of templates || []) {
		const name = itemName(items, tpl)
		if (name) out.push(name)
	}
	return out
}

/** Un ensemble dans le format d'échange. Les items inconnus du client sont omis. */
export function exportLoadout(loadout: Loadout, items: LoadoutExportItems): LoadoutExport {
	return { type: LOADOUT_EXPORT_TYPE, version: LOADOUT_EXPORT_VERSION, ...exportLoadoutBody(loadout, items) }
}

function exportLoadoutBody(loadout: Loadout, items: LoadoutExportItems): LoadoutExportBody {
	const forgotten = exportItems(items, loadout.forgotten_weapons)
	const components: LoadoutExportComponent[] = []
	for (const c of loadout.components || []) {
		const name = itemName(items, c.template)
		if (!name) continue
		const entry: LoadoutExportComponent = { slot: c.index, item: name }
		if (c.stats && Object.keys(c.stats).length) entry.stats = { ...c.stats }
		components.push(entry)
	}
	const stats: LoadoutStats = {}
	for (const stat of LOADOUT_STATS) {
		const capital = loadout.stats?.[stat] || 0
		if (capital > 0) stats[stat] = capital
	}
	// Ordre des clés = ordre de lecture d'un build : ce JSON est fait pour être lu.
	return {
		name: loadout.name,
		...(loadout.icon ? { icon: loadout.icon } : {}),
		weapons: exportItems(items, loadout.weapons),
		...(forgotten.length ? { forgotten_weapons: forgotten } : {}),
		chips: exportItems(items, loadout.chips),
		...(components.length ? { components } : {}),
		stats,
	}
}

/** Texte à copier : un objet pour un seul ensemble, une enveloppe `loadouts` pour plusieurs. */
export function serializeLoadouts(loadouts: Loadout[], items: LoadoutExportItems): string {
	if (loadouts.length === 1) return JSON.stringify(exportLoadout(loadouts[0], items), null, '\t')
	return JSON.stringify({
		type: LOADOUT_EXPORT_TYPE_MANY,
		version: LOADOUT_EXPORT_VERSION,
		loadouts: loadouts.map(l => exportLoadoutBody(l, items)),
	}, null, '\t')
}

function buildNameIndex(items: LoadoutExportItems) {
	const byName: { [name: string]: number } = {}
	for (const template in items) {
		const name = items[template]?.name
		if (name) byName[name] = +template
	}
	return byName
}

/**
 * Nom (ou id) → template du bon type. `null` si l'item est inconnu ou n'est pas
 * du type attendu : un ensemble ne doit pas se retrouver avec une puce dans la
 * liste des armes parce que le JSON était bancal.
 */
function resolveItem(raw: unknown, type: number, items: LoadoutExportItems, byName: { [name: string]: number }): number | null {
	const candidates: number[] = []
	if (typeof raw === 'number' && Number.isInteger(raw)) {
		candidates.push(raw)
	} else if (typeof raw === 'string') {
		const name = raw.trim()
		if (!name) return null
		if (/^\d+$/.test(name)) {
			candidates.push(+name)
		} else {
			// Le nom nu et le nom préfixé sont deux candidats, pas un défaut et un
			// repli : `rock` et `pebble` sont à la fois des ressources et des puces
			// (`chip_rock`, `chip_pebble`). Le premier qui a le type attendu gagne,
			// sinon la forme courte de ces deux-là ne désignerait jamais la puce.
			const prefix = type === TYPE_WEAPON ? 'weapon_' : type === TYPE_CHIP ? 'chip_' : ''
			const direct = byName[name]
			if (direct !== undefined) candidates.push(direct)
			const prefixed = prefix ? byName[prefix + name] : undefined
			if (prefixed !== undefined) candidates.push(prefixed)
		}
	}
	for (const template of candidates) {
		if (items[template]?.type === type) return template
	}
	return null
}

function parseStats(raw: unknown): LoadoutStats {
	const out: LoadoutStats = {}
	if (!raw || typeof raw !== 'object') return out
	const source = raw as { [k: string]: unknown }
	for (const stat of LOADOUT_STATS) {
		const value = Math.floor(Number(source[stat]))
		if (Number.isFinite(value) && value > 0) out[stat] = value
	}
	return out
}

function parseComponentStats(raw: unknown): ComponentStats | null {
	if (!raw || typeof raw !== 'object') return null
	const out: ComponentStats = {}
	for (const [carac, value] of Object.entries(raw as { [k: string]: unknown })) {
		const v = Math.round(Number(value))
		if (Number.isFinite(v) && v !== 0) out[carac] = v
	}
	return Object.keys(out).length ? out : null
}

function parseOne(raw: unknown, items: LoadoutExportItems, byName: { [name: string]: number }, ignored: string[]): ParsedLoadout | null {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
	const source = raw as { [k: string]: unknown }
	const hasContent = ['weapons', 'chips', 'components', 'stats'].some(k => k in source)
	if (!hasContent) return null

	const collect = (list: unknown, type: number): number[] => {
		const out: number[] = []
		if (!Array.isArray(list)) return out
		for (const entry of list) {
			const template = resolveItem(entry, type, items, byName)
			if (template === null) { ignored.push(String(entry)); continue }
			if (!out.includes(template)) out.push(template)
		}
		return out
	}

	// Les deux listes sont concaténées : l'appelant re-sépare fixes et oubliées
	// avec le flag `forgotten` du template, comme à la sauvegarde.
	const weapons = collect(source.weapons, TYPE_WEAPON)
	for (const tpl of collect(source.forgotten_weapons, TYPE_WEAPON)) {
		if (!weapons.includes(tpl)) weapons.push(tpl)
	}

	const components: LoadoutComponent[] = []
	const usedSlots = new Set<number>()
	const usedTemplates = new Set<number>()
	if (Array.isArray(source.components)) {
		for (const entry of source.components) {
			if (!entry || typeof entry !== 'object') continue
			const c = entry as { [k: string]: unknown }
			const template = resolveItem(c.item ?? c.template ?? c.name, TYPE_COMPONENT, items, byName)
			if (template === null) { ignored.push(String(c.item ?? c.template ?? c.name)); continue }
			// Un modèle ne s'équipe qu'une fois, un emplacement ne porte qu'une pièce.
			if (usedTemplates.has(template)) continue
			let slot = Math.floor(Number(c.slot ?? c.index))
			if (!Number.isFinite(slot) || slot < 0 || slot >= MAX_LOADOUT_COMPONENTS || usedSlots.has(slot)) {
				slot = -1
				for (let i = 0; i < MAX_LOADOUT_COMPONENTS; i++) if (!usedSlots.has(i)) { slot = i; break }
				if (slot === -1) continue
			}
			usedSlots.add(slot)
			usedTemplates.add(template)
			components.push({ index: slot, template, stats: parseComponentStats(c.stats) })
		}
	}

	const name = typeof source.name === 'string' ? truncate(source.name.trim(), NAME_MAX_LENGTH) : ''
	// L'icône est un emoji (ou un nom de carac), tronquée à ICON_MAX_LENGTH caractères.
	const icon = typeof source.icon === 'string' ? truncate(source.icon, ICON_MAX_LENGTH) : ''
	return { name, icon, weapons, chips: collect(source.chips, TYPE_CHIP), components, stats: parseStats(source.stats) }
}

/**
 * Lit un ou plusieurs ensembles depuis du texte JSON. Tolère les trois formes :
 * un objet seul, un tableau, ou l'enveloppe `{loadouts: [...]}`.
 * Rend `null` si le texte n'est pas du JSON ou ne décrit aucun ensemble.
 */
export function parseLoadouts(text: string, items: LoadoutExportItems): LoadoutParseResult | null {
	let data: unknown
	try {
		data = JSON.parse(text)
	} catch {
		return null
	}
	if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray((data as { loadouts?: unknown }).loadouts)) {
		data = (data as { loadouts: unknown[] }).loadouts
	}
	const byName = buildNameIndex(items)
	const ignored: string[] = []
	const loadouts: ParsedLoadout[] = []
	for (const entry of Array.isArray(data) ? data : [data]) {
		const parsed = parseOne(entry, items, byName, ignored)
		if (parsed) loadouts.push(parsed)
	}
	if (!loadouts.length) return null
	return { loadouts, ignored }
}

/** Nom libre pour un ensemble importé : « Build », puis « Build (2) », « Build (3) »… */
export function uniqueLoadoutName(name: string, existing: string[], fallback: string): string {
	let base = name.trim() || fallback.trim()
	base = truncate(base, NAME_MAX_LENGTH)
	const taken = new Set(existing)
	if (!taken.has(base)) return base
	for (let i = 2; i < 1000; i++) {
		const suffix = ' (' + i + ')'
		const candidate = truncate(base, NAME_MAX_LENGTH - suffix.length) + suffix
		if (!taken.has(candidate)) return candidate
	}
	return base
}
