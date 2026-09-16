// Stripped-down Monaco entry point — replaces the bare `monaco-editor` import via
// `resolve.alias` in vite.config.ts. The default `monaco-editor` pulls 80+
// basic-languages and 4 heavy language services (ts/json/html/css), each with its
// own Worker that triggers a nested Vite build. We keep only the editor core plus
// the basic-languages we use (markdown, yaml, javascript, python); LeekScript is registered in
// `./monaco.ts`; JSON is given a worker-less syntax-only Monarch grammar.
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
// Worker du language service TypeScript (typecheck + autocomplétion des IA polyglot .ts/.js).
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import 'monaco-editor/esm/vs/editor/edcore.main.js'
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'
// javascript/typescript = coloration des IA polyglot (.js / .ts) via grammaire Monarch.
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution.js'
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution.js'
// Python : enregistré explicitement (pas le loader paresseux .contribution) pour poser notre grammaire
// étendue (classes de l'API colorées en `type`) de façon déterministe. Les noms de classes sont
// injectés ensuite par monaco.ts (éditeur) et leekwars.ts (aperçus). Cf. monaco-python-language.ts.
import { registerPythonLanguage } from './monaco-python-language'
// Language service TypeScript : ajoute par-dessus la coloration le typecheck + l'autocomplétion
// (via ts.worker) pour les IA .ts ET .js (checkJs). Configuré dans `./monaco.ts` (lib sans DOM +
// leekwars.d.ts de l'API de combat). C'est le worker "lourd" volontairement évité auparavant.
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution.js'
export * from 'monaco-editor/esm/vs/editor/editor.api.js'

import { languages } from 'monaco-editor/esm/vs/editor/editor.api.js'
import { config as jsonConfig, tokens as jsonTokens } from './json-monarch'
import { cspNonce } from './monaco-csp'

languages.register({
	id: 'json',
	extensions: ['.json', '.babelrc', '.eslintrc', '.har'],
	aliases: ['JSON', 'json'],
	mimetypes: ['application/json'],
})
languages.setLanguageConfiguration('json', jsonConfig)
languages.setMonarchTokensProvider('json', jsonTokens)

// Python (config + grammaire standard) posé de façon déterministe ; monaco.ts injecte ensuite la
// liste des classes de l'API pour les colorer en `type`.
registerPythonLanguage(languages)

// Wire the worker here (not via vite-plugin-monaco-editor) so every entry point
// that imports `monaco-editor` — editor route AND encyclopedia diff viewer —
// gets the same setup. Vite's `?worker` import emits a single chunk under
// `dist/assets/`; the legacy plugin's URL-based getWorkerUrl + dist/monacoeditorwork/
// duplicate were redundant. `nonce` is consumed at runtime for CSP-compliant <style>
// injection (Monaco 0.55 ignores it for stylesheets — see `monaco-csp.ts`).
self.MonacoEnvironment = {
	getWorker: (_workerId: string, label: string) => {
		// Le language service TS/JS réclame son propre worker ; tout le reste utilise le worker éditeur.
		if (label === 'typescript' || label === 'javascript') return new tsWorker()
		return new editorWorker()
	},
	// @ts-expect-error — `nonce` isn't typed on Environment but is consumed at runtime.
	nonce: cspNonce,
}
