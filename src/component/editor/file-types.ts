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

// Langages d'IA proposés à la création (nouveau fichier) et comme langage par défaut à
// l'inscription. LeekScript = extension vide (convention historique : fichier sans extension).
export const AI_LANGUAGES = [
	{ id: 'leekscript', label: 'LeekScript', extension: '', logo: '/image/language/leekscript.svg' },
	{ id: 'javascript', label: 'JavaScript', extension: '.js', logo: '/image/language/javascript.svg' },
	{ id: 'typescript', label: 'TypeScript', extension: '.ts', logo: '/image/language/typescript.svg' },
	{ id: 'python', label: 'Python', extension: '.py', logo: '/image/language/python.svg' },
] as const
