#!/usr/bin/env node
// Génère les variantes sombres des icônes de trophée.
//
// Les icônes (public/image/trophy/*.svg) ont une structure en gris #444444,
// illisible sur fond sombre. Pour chaque icône on écrit un <code>_dark.svg où
// le gris est éclairci, les couleurs d'accent (difficulté) restant intactes.
// Le composant trophy-icon.vue bascule le src selon le thème.
//
// Couleur cible paramétrable (défaut #cccccc, la couleur retenue) :
//   node scripts/generate-trophy-dark.mjs          # #cccccc
//   node scripts/generate-trophy-dark.mjs '#999'   # plus sombre

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIR = join(ROOT, 'public/image/trophy')

const DARK_SUFFIX = '_dark.svg'
// Couleur cible (argument optionnel), normalisée en 6 chiffres hex.
let target = (process.argv[2] || '#cccccc').replace('#', '').toLowerCase()
if (target.length === 3) target = target.split('').map(c => c + c).join('')
const COLOR = '#' + target
// Gris structurel -> gris clair, sous toutes les formes rencontrées dans les SVG :
// fill ou stroke, en style (`prop:#444`) ou en attribut (`prop="#444"`). Certaines
// icônes (ex: imperator) dessinent leur structure en stroke. Les accents de
// couleur (autres que #444) restent intacts (le séparateur capturé est ré-émis).
const LIGHTEN = /(fill|stroke)(\s*:\s*|=")#444(?:444)?/gi

let generated = 0
for (const file of readdirSync(DIR)) {
	if (!file.endsWith('.svg') || file.endsWith(DARK_SUFFIX)) continue
	const source = readFileSync(join(DIR, file), 'utf8')
	const dark = source.replace(LIGHTEN, (_match, prop, separator) => prop + separator + COLOR)
	// On écrit toujours la variante (même identique) pour que le src _dark ne 404 jamais.
	writeFileSync(join(DIR, file.replace(/\.svg$/, DARK_SUFFIX)), dark)
	generated++
}

console.log(`Generated ${generated} dark trophy icons (${COLOR}) in ${DIR}`)
