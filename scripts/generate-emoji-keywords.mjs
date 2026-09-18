// Génère `src/model/emoji-keywords/<langue>.json` : le nom et les mots-clés de
// chaque emoji du catalogue, dans les 17 langues du site, pour la recherche du
// panneau emoji.
//
// Usage : `node scripts/generate-emoji-keywords.mjs`, à relancer après
// `generate-emojis.mjs` (les fichiers sont des tableaux alignés sur l'ordre du
// catalogue, un test vérifie que les longueurs correspondent).
//
// Source : les annotations CLDR d'Unicode, en deux morceaux — `annotations`
// pour les emojis simples, `annotationsDerived` pour ce qui se déduit d'une
// séquence (familles, teintes de peau, drapeaux). Chaque entrée devient
// "nom|mot-clé|mot-clé…", en minuscules, le nom en premier pour que la
// recherche puisse le privilégier.
//
// Poids : environ 100 Ko par langue, mais un seul fichier est chargé, et
// seulement quand le joueur ouvre la recherche (import dynamique).

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT = join(root, 'src/model/emoji-keywords')
const CATALOGUE = join(root, 'src/model/emoji-list.ts')

// Les langues du site (src/lang/), avec leur code CLDR quand il diffère.
const LANGUAGES = {
	da: 'da', de: 'de', en: 'en', es: 'es', fi: 'fi', fr: 'fr', id: 'id',
	it: 'it', ja: 'ja', ko: 'ko', nl: 'nl', no: 'no', pl: 'pl', pt: 'pt',
	ru: 'ru', sv: 'sv', zh: 'zh',
}

const CLDR = 'https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json'

async function annotations(cldrLanguage) {
	const sources = [
		[`${CLDR}/cldr-annotations-full/annotations/${cldrLanguage}/annotations.json`, 'annotations'],
		[`${CLDR}/cldr-annotations-derived-full/annotationsDerived/${cldrLanguage}/annotations.json`, 'annotationsDerived'],
	]
	// Les deux fichiers d'une langue partent ensemble. On s'arrête là et on garde les
	// langues en série : les 34 requêtes d'un coup sur raw.githubusercontent tomberaient
	// sous la limitation de débit, et ce script tourne deux fois par an.
	const parts = await Promise.all(sources.map(async ([url, key]) => {
		const response = await fetch(url)
		if (!response.ok) { throw new Error(`${url} : HTTP ${response.status}`) }
		return (await response.json())[key].annotations
	}))
	return Object.assign({}, ...parts)
}

// Le `icon:` n'est pas décoratif : `RecentEmojis`, dans le même fichier, porte lui
// aussi un champ `emojis: [...]`, mais ses entrées sont clés par `version`. Sans cet
// ancrage, ses 165 emojis rentreraient dans le catalogue et décaleraient les
// tableaux parallèles d'autant.
const catalogue = [...readFileSync(CATALOGUE, 'utf8').matchAll(/icon: "[^"]*", emojis: \[(.*?)\]/g)]
	.flatMap(group => [...group[1].matchAll(/"([^"]*)"/g)].map(m => m[1]))

mkdirSync(OUTPUT, { recursive: true })

for (const [language, cldrLanguage] of Object.entries(LANGUAGES)) {
	const dictionary = await annotations(cldrLanguage)
	let missing = 0
	const entries = catalogue.map(emoji => {
		// CLDR annote parfois la forme sans U+FE0F (❤ pour ❤️).
		const entry = dictionary[emoji] ?? dictionary[emoji.replaceAll('️', '')]
		if (!entry) { missing++ ; return '' }
		const name = entry.tts?.[0] ?? ''
		const keywords = (entry.default ?? []).filter(keyword => keyword !== name)
		return [name, ...keywords].join('|').toLowerCase()
	})
	const json = JSON.stringify(entries)
	writeFileSync(join(OUTPUT, `${language}.json`), json)
	const size = Math.round(json.length / 1024)
	console.log(`${language} : ${catalogue.length - missing}/${catalogue.length} emojis nommés, ${size} Ko`)
}
