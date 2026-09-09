// Génère `public/image/menu/<nom>.svg` : les glyphes mdi du menu v3 redessinés en
// « assets » colorés, comme une arme ou une puce — un contour noir, des aplats de la
// palette du design system, et une couleur par pièce du glyphe.
//
// Décisions de Pierre (2026-09-03, planche `docs/specs/menu-icons/planche.html`) :
// multicolore, aplat pur (ni ombre ni reflet), contour de 2 unités, et les MÊMES
// couleurs vives dans les deux thèmes (le contour noir porte le contraste, l'icône
// est une image et non une encre — voir ICONS.md).
//
// Technique : le path mdi est découpé en sous-tracés (tous absolus chez mdi, un `M`
// chacun), dessinés du plus grand au plus petit pour que les détails (porte, cadenas,
// « ? ») passent au-dessus de la pièce qui les porte. Chaque pièce porte son aplat et
// un trait noir SOUS l'aplat (`paint-order: stroke`) : il ne dépasse qu'à l'extérieur
// de la pièce, sur la silhouette et sur la pièce voisine, ce qui trace la séparation.
// Les vrais trous (anses de la coupe) rejoignent la plus grande pièce en `evenodd`.
// Un glyphe d'un seul tenant (maison, blason) est coupé par une « zone » polygonale
// pour recevoir une seconde couleur.
//
// Usage : `node scripts/generate-menu-icons.mjs`, puis committer les SVG produits.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as mdi from '@mdi/js'

// Palette « vive » du design system (valeurs du thème sombre, `src/redesign/tokens.scss`)
// + deux neutres fixes pour les détails.
const COLORS = {
	green: '#7CFF6B',
	lime: '#D4FF3A',
	cyan: '#5CE0FF',
	magenta: '#FF3D7F',
	amber: '#FFB23A',
	red: '#FF5040',
	gold: '#FFD23A',
	ink: '#A8B4A4',
	cream: '#FBF7E8',
	dark: '#1B2226',
}
const STROKE = 2

// `parts` : une couleur par sous-tracé, dans l'ordre du path mdi ; `null` = trou.
// `zones` : [polygone, couleur] appliqués par-dessus, découpés au glyphe.
const ICONS = {
	'home':       { glyph: 'mdiHome',          parts: ['amber'], zones: [['-2,-2 26,-2 26,12.2 -2,12.2', 'red']] },
	'add-leek':   { glyph: 'mdiPlus',          parts: ['ink'] },
	'editor':     { glyph: 'mdiCodeBraces',    parts: ['cyan', 'lime'] },
	'garden':     { glyph: 'mdiSwordCross',    parts: ['red', 'gold', 'gold'] },
	'market':     { glyph: 'mdiStore',         parts: ['dark', 'amber', 'red'] },
	'inventory':  { glyph: 'mdiTreasureChest', parts: ['gold', 'dark', 'amber'] },
	'team':       { glyph: 'mdiShield',        parts: ['magenta'], zones: [['12,-2 26,-2 26,26 12,26', 'cyan']] },
	'trophies':   { glyph: 'mdiTrophy',        parts: ['gold', null, null] },
	'ranking':    { glyph: 'mdiPodium',        parts: ['gold', 'amber', 'ink', 'lime', 'lime', 'lime'] },
	'help':       { glyph: 'mdiHelpCircle',    parts: ['cream', 'cream', 'cyan'] },
	'forum':      { glyph: 'mdiForum',         parts: ['green', 'cyan'] },
	'console':    { glyph: 'mdiConsole',       parts: ['dark', 'ink', 'green', 'green'] },
	'group':      { glyph: 'mdiAccountGroup',  parts: ['magenta', 'cyan', 'amber', 'magenta', 'cyan', 'amber'] },
	'moderation': { glyph: 'mdiGavel',         parts: ['amber', 'ink'] },
	'admin':      { glyph: 'mdiSecurity',      parts: ['cream', 'red'] },
	'arena':      { glyph: 'mdiStadium',       parts: ['red', 'red', 'gold', 'green', 'lime'] },
	'boss':       { glyph: 'mdiCrown',         parts: ['gold', 'amber'] },
	// Icônes de titre de page qui n'ont pas d'entrée de menu (barre de page en
	// couleur, demande de Pierre du 2026-09-07 : « celui en couleur au lieu de
	// juste vert »).
	'settings':   { glyph: 'mdiCog',           parts: [null, 'ink'] },
	'messages':   { glyph: 'mdiEmailOutline',  parts: ['cyan', null, null] },
	'tournament': { glyph: 'mdiTournament',    parts: ['lime'] },
	'fight':      { glyph: 'mdiSword',         parts: ['red', 'ink'] },
}

// Boîte englobante approchée d'un sous-tracé : tous les points de contrôle (pour les
// arcs, seulement l'extrémité). Suffisant pour ordonner les pièces par taille.
function bboxArea(d) {
	let x = 0, y = 0, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
	const add = (px, py) => { minX = Math.min(minX, px); minY = Math.min(minY, py); maxX = Math.max(maxX, px); maxY = Math.max(maxY, py) }
	for (const [, cmd, rest] of d.matchAll(/([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/g)) {
		const n = (rest.match(/-?\d*\.?\d+(?:e-?\d+)?/g) || []).map(Number)
		switch (cmd) {
			case 'H': for (const v of n) { x = v; add(x, y) } break
			case 'V': for (const v of n) { y = v; add(x, y) } break
			case 'A': for (let i = 0; i + 6 < n.length; i += 7) { x = n[i + 5]; y = n[i + 6]; add(x, y) } break
			case 'Z': break
			default: for (let i = 0; i + 1 < n.length; i += 2) { x = n[i]; y = n[i + 1]; add(x, y) }
		}
	}
	return (maxX - minX) * (maxY - minY)
}

function render(name, { glyph, parts, zones = [] }) {
	const d = mdi[glyph]
	if (!d) throw new Error(`${name} : glyphe ${glyph} inconnu`)
	const subs = d.split(/(?=M)/)
	if (subs.length !== parts.length) throw new Error(`${name} : ${subs.length} sous-tracés, ${parts.length} couleurs`)
	const order = subs.map((_, i) => i).sort((a, b) => bboxArea(subs[b]) - bboxArea(subs[a]))
	const holes = order.filter(i => parts[i] === null)
	const line = `stroke="#000" stroke-width="${STROKE}" stroke-linejoin="round" stroke-linecap="round"`
	let out = ''
	for (const i of order) {
		if (parts[i] === null) continue
		let dd = subs[i], rule = ''
		if (i === order[0] && holes.length) { dd += holes.map(h => subs[h]).join(''); rule = ' fill-rule="evenodd"' }
		out += `<path d="${dd}"${rule} fill="${COLORS[parts[i]]}" ${line} paint-order="stroke"/>`
	}
	if (zones.length) {
		out += `<clipPath id="g"><path d="${d}"/></clipPath><g clip-path="url(#g)">`
		for (const [poly, color] of zones) out += `<polygon points="${poly}" fill="${COLORS[color]}" ${line.replace(`stroke-width="${STROKE}"`, `stroke-width="${STROKE / 2}"`)}/>`
		out += '</g>'
	}
	// Le contour déborde d'une unité (moitié du trait) : le viewBox l'inclut.
	const m = STROKE / 2
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-m} ${-m} ${24 + 2 * m} ${24 + 2 * m}">${out}</svg>\n`
}

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'image', 'menu')
mkdirSync(dir, { recursive: true })
for (const [name, icon] of Object.entries(ICONS)) {
	writeFileSync(join(dir, `${name}.svg`), render(name, icon))
}
console.log(`${Object.keys(ICONS).length} icônes écrites dans ${dir}`)
