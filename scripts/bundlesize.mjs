#!/usr/bin/env node
// Vérifie la taille gzippée des chunks de build clés contre des budgets.
// Remplace l'ancien `bundlesize` (jamais installé + glob `dist/js/*.js` mort).
// Les budgets sont déclarés dans la clé "bundlesize" de package.json :
//   [{ "path": "./dist/assets/main-*.js", "maxSize": "5kB" }, ...]
// Sans dépendance : utilise zlib + fs. Exit 1 si un chunk dépasse son budget.
import { readFileSync, readdirSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { basename, dirname } from 'node:path'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)))
const budgets = pkg.bundlesize ?? []

function parseSize(s) {
	const m = String(s).trim().match(/^([\d.]+)\s*([kKmM]?)[bB]?$/)
	if (!m) throw new Error(`Taille invalide: ${s}`)
	const n = parseFloat(m[1])
	const unit = m[2].toLowerCase()
	return Math.round(n * (unit === 'm' ? 1024 * 1024 : unit === 'k' ? 1024 : 1))
}

// Glob minimal : seul `*` est supporté dans le nom de fichier (suffit aux hashes).
function matchFiles(globPath) {
	const dir = dirname(globPath)
	const pattern = basename(globPath)
	const re = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$')
	let entries
	try {
		entries = readdirSync(dir)
	} catch {
		return []
	}
	return entries.filter(f => re.test(f)).map(f => `${dir}/${f}`)
}

const fmt = n => (n / 1024).toFixed(2) + 'kB'
let failed = false
let checked = 0
for (const { path, maxSize } of budgets) {
	const limit = parseSize(maxSize)
	const files = matchFiles(path)
	if (!files.length) {
		console.error(`✗ ${path} : aucun fichier (build manquant ?)`)
		failed = true
		continue
	}
	for (const file of files) {
		const gz = gzipSync(readFileSync(file)).length
		checked++
		const ok = gz <= limit
		console.log(`${ok ? '✓' : '✗'} ${file} : ${fmt(gz)} (max ${fmt(limit)})`)
		if (!ok) failed = true
	}
}

if (!checked && !failed) {
	console.error('Aucun budget configuré.')
	process.exit(1)
}
process.exit(failed ? 1 : 0)
