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
