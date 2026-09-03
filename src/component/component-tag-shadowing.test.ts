import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { compileScript, compileTemplate, parse } from 'vue/compiler-sfc'

// Dans un `<script setup>`, une balise de template est résolue D'ABORD contre les liaisons du
// script, et seulement ensuite contre les composants enregistrés. Une liaison qui porte le nom
// d'un composant le masque donc — silencieusement :
//
//     <error v-if="error" />        +      const error = ref(false)
//     -> _createBlock($setup["error"], { key: 0, … })
//
// Le `type` du vnode est alors le BOOLÉEN déréférencé. Vue ne le reconnaît ni comme élément ni
// comme composant : `patch` tombe dans un `switch` sans branche et ne fait RIEN. Aucun warning
// en prod, aucune exception — mais le vnode reste dans les `dynamicChildren` du bloc avec
// `el === null`, et il y reste. La bascule suivante de la branche v-if appelle alors
// `getNextHostNode` dessus (« nextSibling of null ») ou `shouldUpdateComponent`
// (« emitsOptions of null »), et la session est morte jusqu'au rechargement.
//
// C'était la cause du plus gros cluster de crashs client de l'été 2026 (leek.vue, team.vue,
// trophy.vue — les trois pages avec `<error v-if="error">` ET `const error = ref(false)`), plus
// help.vue où le ref `didactitiel` masquait le composant `Didactitiel`. Le symptôme visible en
// amont du crash : la page 404 ne s'affichait pas du tout, .page restait vide.
//
// Ce test relit le rendu compilé de chaque SFC et refuse toute balise résolue vers une liaison
// qui ne PEUT PAS être un composant (ref / let / reactive). Les `setup-const` et
// `setup-maybe-ref` sont laissés passer : ce sont les imports et les `defineAsyncComponent`.
const SRC = path.resolve(__dirname, '..')

// Liaisons qu'aucun composant ne peut être. Cf. BindingTypes de @vue/compiler-core.
const NEVER_A_COMPONENT = new Set(['setup-ref', 'setup-let', 'setup-reactive-const'])

// `_createBlock($setup["x"], …)` / `_createVNode($setup.x, …)` : une balise résolue vers le script.
const SETUP_TAG = /_create(?:Block|VNode)\(\s*\$setup(?:\["([^"]+)"\]|\.([A-Za-z_$][\w$]*))/g

function vueFiles(dir: string): string[] {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
		const full = path.join(dir, entry.name)
		if (entry.isDirectory()) return vueFiles(full)
		return entry.name.endsWith('.vue') ? [full] : []
	})
}

function shadowedTags(file: string): string[] {
	const source = fs.readFileSync(file, 'utf8')
	const { descriptor } = parse(source, { filename: file })
	if (!descriptor.scriptSetup || !descriptor.template) return []
	const script = compileScript(descriptor, { id: file, inlineTemplate: false })
	const { code } = compileTemplate({
		source: descriptor.template.content,
		filename: file,
		id: file,
		compilerOptions: { bindingMetadata: script.bindings, prefixIdentifiers: true },
	})
	const shadowed: string[] = []
	for (const match of code.matchAll(SETUP_TAG)) {
		const name = match[1] ?? match[2]
		if (NEVER_A_COMPONENT.has(script.bindings?.[name] as string)) {
			shadowed.push(path.relative(SRC, file) + ' : <' + name + '> résout vers la liaison `' + name + '` (' + script.bindings?.[name] + ')')
		}
	}
	return shadowed
}

describe('balises de template masquées par une liaison de <script setup>', () => {
	it('aucune balise ne résout vers un ref / let / reactive', () => {
		const shadowed = vueFiles(SRC).flatMap(shadowedTags)
		expect(shadowed).toEqual([])
	})
})
