// Les fichiers sans extension sont du LeekScript (convention historique).

export function getLanguageForPath(path: string): string {
	const lower = path.substring(path.lastIndexOf('/') + 1).toLowerCase()

	if (lower === '.gitignore' || lower === '.gitattributes' || lower === '.gitmodules') return 'plaintext'

	const dot = lower.lastIndexOf('.')
	if (dot < 0) return 'leekscript'

	switch (lower.substring(dot + 1)) {
		case 'leek': return 'leekscript'
		case 'js':
		case 'mjs': return 'javascript' // IA polyglot (GraalVM JS) : coloration Monaco native
		case 'ts':
		case 'mts': return 'typescript' // IA polyglot (transpilée en JS au build) : coloration Monaco
		case 'py': return 'python'      // IA polyglot (GraalPy) : coloration Monaco native
		case 'md': return 'markdown'
		case 'txt': return 'plaintext'
		case 'json': return 'json'
		case 'yml':
		case 'yaml': return 'yaml'
		default: return 'leekscript'
	}
}

export function isLeekScript(path: string): boolean {
	return getLanguageForPath(path) === 'leekscript'
}

// Logo de langage (petit badge) pour un fichier d'IA, ou null pour les fichiers non-IA
// (markdown, json, yaml, txt...). Sert dans l'arbre de l'éditeur et sur la page du poireau.
export function getLanguageLogo(path: string): string | null {
	switch (getLanguageForPath(path)) {
		case 'leekscript': return '/image/language/leekscript.svg'
		case 'javascript': return '/image/language/javascript.svg'
		case 'typescript': return '/image/language/typescript.svg'
		case 'python': return '/image/language/python.svg'
		default: return null
	}
}

// Version du langage pour les IA polyglot : une seule par langage, imposée par le runtime
// du generator. `pragma` est la valeur écrite dans le fichier (`// @version:2026`,
// `# @version:3.12`) : déclarative aujourd'hui, elle épinglera la version des IA existantes
// le jour où plusieurs versions coexisteront (même rôle que `// @version:N` en LeekScript).
// À tenir en phase avec les montées de version du generator : GraalVM 25.1.3 → GraalJS
// ECMAScript 2026 et GraalPy Python 3.12 ; TypeScript = tsc embarqué (typescript.js.gz),
// et le starter serveur (AIController::polyglotStarterCode) qui écrit le même pragma.
// `short` = étiquette courte pour la puce (le langage est déjà affiché à côté) : `ES2026`, `5.8`, `3.12`.
export interface LanguageVersion { label: string, short: string, pragma: string, comment: '//' | '#' }
// Versions disponibles par langage, la 1re étant la version par défaut/actuelle. Une seule aujourd'hui
// (le runtime du generator impose la version) ; la structure en liste anticipe la coexistence de
// plusieurs versions, comme `// @version:N` en LeekScript.
const LANGUAGE_VERSIONS: { [language: string]: LanguageVersion[] } = {
	javascript: [{ label: 'JavaScript ES2026', short: 'ES2026', pragma: '2026', comment: '//' }],
	typescript: [{ label: 'TypeScript 5.8', short: '5.8', pragma: '5.8', comment: '//' }],
	python: [{ label: 'Python 3.12', short: '3.12', pragma: '3.12', comment: '#' }],
}
// Toutes les versions disponibles pour un langage (id : `javascript` / `typescript` / `python`).
export function getLanguageVersions(language: string): LanguageVersion[] {
	return LANGUAGE_VERSIONS[language] ?? []
}
export function getLanguageVersion(path: string): LanguageVersion | null {
	return LANGUAGE_VERSIONS[getLanguageForPath(path)]?.[0] ?? null
}
export function getLanguageVersionLabel(path: string): string | null {
	return getLanguageVersion(path)?.label ?? null
}

// Langages d'IA proposés à la création (nouveau fichier) et comme langage par défaut à
// l'inscription. LeekScript = extension vide (convention historique : fichier sans extension).
export const AI_LANGUAGES = [
	{ id: 'leekscript', label: 'LeekScript', extension: '', logo: '/image/language/leekscript.svg' },
	{ id: 'javascript', label: 'JavaScript', extension: '.js', logo: '/image/language/javascript.svg' },
	{ id: 'typescript', label: 'TypeScript', extension: '.ts', logo: '/image/language/typescript.svg' },
	{ id: 'python', label: 'Python', extension: '.py', logo: '/image/language/python.svg' },
] as const
