// Génération d'exemples d'appel de l'API Leek Wars pour la page de doc.
// À partir de la définition d'un service (module, fonction, méthode, paramètres),
// produit un snippet cURL / JavaScript / Python / HTTP prêt à copier.

export const API_BASE = 'https://leekwars.com/api'

export const LANGS = ['curl', 'javascript', 'python', 'http'] as const
export type Lang = typeof LANGS[number]

export const LANG_LABELS: Record<Lang, string> = {
	curl: 'cURL',
	javascript: 'JavaScript',
	python: 'Python',
	http: 'HTTP',
}

// Icônes MDI par langage (noms littéraux pour que generate-mdi-icons.mjs les détecte).
export const LANG_ICONS: Record<Lang, string> = {
	curl: 'mdi-console',
	javascript: 'mdi-language-javascript',
	python: 'mdi-language-python',
	http: 'mdi-web',
}

export interface ServiceDef {
	module: string
	function: string
	method: string // get | post | put | delete (minuscule)
	parameters: string[]
	parameters_types: string[]
	auth: boolean
}

const KEY_PLACEHOLDER = 'lwk_your_key'

/** Valeur d'exemple d'un paramètre, formatée pour un langage donné. */
function value(type: string, lang: 'json' | 'js' | 'py'): string {
	switch (type) {
		case 'number': return '42'
		case 'boolean': return lang === 'py' ? 'True' : 'true'
		case 'array': return '[]'
		case 'json':
		case 'object': return '{}'
		default: return '"…"' // string et inconnus
	}
}

/** Placeholder d'un paramètre positionnel dans un chemin GET. */
function pathValue(type: string): string {
	if (type === 'number') return '123'
	if (type === 'boolean') return 'true'
	return 'value'
}

function isGet(s: ServiceDef): boolean {
	return s.method.toLowerCase() === 'get'
}

/** URL complète, avec les paramètres GET positionnés dans le chemin. */
export function buildUrl(s: ServiceDef): string {
	const base = `${API_BASE}/${s.module}/${s.function}`
	if (isGet(s) && s.parameters.length) {
		return base + '/' + s.parameters.map((_, i) => pathValue(s.parameters_types[i])).join('/')
	}
	return base
}

/** Corps JSON (ou objet JS/Python) : { "p1": v1, "p2": v2 }. */
function body(s: ServiceDef, lang: 'json' | 'js' | 'py'): string {
	if (isGet(s) || !s.parameters.length) return ''
	const quote = (name: string) => lang === 'js' ? name : `"${name}"`
	const entries = s.parameters.map((p, i) => `${quote(p)}: ${value(s.parameters_types[i], lang)}`)
	return `{ ${entries.join(', ')} }`
}

function method(s: ServiceDef): string {
	return s.method.toUpperCase()
}

function curl(s: ServiceDef): string {
	const url = buildUrl(s)
	const lines: string[] = []
	if (isGet(s)) {
		lines.push(`curl "${url}"`)
		if (s.auth) lines.push(`  -H "Authorization: Bearer ${KEY_PLACEHOLDER}"`)
	} else {
		lines.push(`curl -X ${method(s)} "${url}"`)
		if (s.auth) lines.push(`  -H "Authorization: Bearer ${KEY_PLACEHOLDER}"`)
		lines.push('  -H "Content-Type: application/json"')
		const b = body(s, 'json')
		if (b) lines.push(`  -d '${b}'`)
	}
	return lines.join(' \\\n')
}

function javascript(s: ServiceDef): string {
	const url = buildUrl(s)
	const opts: string[] = []
	if (!isGet(s)) opts.push(`  method: "${method(s)}"`)
	const headers: string[] = []
	if (s.auth) headers.push(`    "Authorization": "Bearer ${KEY_PLACEHOLDER}"`)
	if (!isGet(s)) headers.push('    "Content-Type": "application/json"')
	if (headers.length) opts.push(`  headers: {\n${headers.join(',\n')}\n  }`)
	const b = body(s, 'js')
	if (b) opts.push(`  body: JSON.stringify(${b})`)

	const optsStr = opts.length ? `, {\n${opts.join(',\n')}\n}` : ''
	return `const response = await fetch("${url}"${optsStr})\nconst data = await response.json()`
}

function python(s: ServiceDef): string {
	const url = buildUrl(s)
	const fn = s.method.toLowerCase()
	const args: string[] = [`    "${url}"`]
	if (s.auth) args.push(`    headers={"Authorization": "Bearer ${KEY_PLACEHOLDER}"}`)
	const b = body(s, 'py')
	if (b) args.push(`    json=${b}`)
	return `import requests\n\nresponse = requests.${fn}(\n${args.join(',\n')}\n)\ndata = response.json()`
}

function http(s: ServiceDef): string {
	const url = buildUrl(s)
	const path = url.replace('https://leekwars.com', '')
	const lines = [`${method(s)} ${path} HTTP/1.1`, 'Host: leekwars.com']
	if (s.auth) lines.push(`Authorization: Bearer ${KEY_PLACEHOLDER}`)
	if (!isGet(s)) {
		lines.push('Content-Type: application/json')
		const b = body(s, 'json')
		if (b) { lines.push(''); lines.push(b) }
	}
	return lines.join('\n')
}

export function buildSnippet(s: ServiceDef, lang: Lang): string {
	switch (lang) {
		case 'curl': return curl(s)
		case 'javascript': return javascript(s)
		case 'python': return python(s)
		case 'http': return http(s)
	}
}
