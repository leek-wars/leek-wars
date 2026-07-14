// Façade PARESSEUSE devant pyright-client : ce dernier importe statiquement le worker Pyright (~2 Mo),
// donc on ne le charge (import dynamique -> chunk séparé) qu'à la première ouverture d'une IA .py.
// monaco.ts et ai-view-monaco.vue n'importent QUE ce module léger (reste dans le bundle principal).

type Client = typeof import('./pyright-client')

let mod: Promise<Client> | null = null
let pendingStub: string | null = null

function load(): Promise<Client> {
	return (mod ||= import('./pyright-client').then((m) => {
		if (pendingStub !== null) m.updatePyStub(pendingStub)
		return m
	}))
}

// Stub de l'API (.pyi) : mémorisé même avant chargement du client (monaco.ts l'émet au chargement des
// game data, bien avant qu'un .py soit ouvert), puis appliqué quand le client se charge.
export function pySetStub(text: string): void {
	pendingStub = text
	if (mod) void mod.then((m) => m.updatePyStub(text))
}

// Ouvre un .py auprès de Pyright (démarre le worker au 1er appel).
export function pyOpen(model: import('monaco-editor').editor.ITextModel): void {
	void load().then((m) => m.openPy(model))
}

export function pyChange(model: import('monaco-editor').editor.ITextModel): void {
	void load().then((m) => m.changePy(model))
}

// N'a de sens que si le client est déjà chargé (sinon rien à fermer).
export function pyClose(uri: string): void {
	if (mod) void mod.then((m) => m.closePy(uri))
}
