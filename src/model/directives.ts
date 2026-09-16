import Code from '@/component/app/code.vue'
import { LeekWars } from '@/model/leekwars'
import { emitter } from './emitter'
import { createSubApp } from './sub-app'

// Langage d'un bloc de code, à la Markdown, depuis deux sources possibles :
//  - une classe `language-<lang>` posée par un rendu Markdown (HTML stocké : anciens messages
//    du forum, articles du dev blog) ;
//  - à défaut, un jeton sur la 1re ligne (```js, ```python...), comme dans le chat.
// On ne retire la 1re ligne que si le jeton correspond à un langage CONNU, pour ne jamais avaler
// une vraie ligne de code. Langage inconnu/absent => undefined (LeekScript par défaut, comme avant).
export function splitCodeLanguage(code: string, el?: Element): { code: string, language: string | undefined } {
	const cls = el && Array.from(el.classList).find((c) => c.startsWith('language-'))
	if (cls) {
		const lang = cls.slice('language-'.length)
		if (LeekWars.codeLanguageMode(lang)) { return { code, language: lang } }
	}
	const firstBreak = code.indexOf("\n")
	if (firstBreak > 0) {
		const firstLine = code.slice(0, firstBreak).trim()
		if (LeekWars.codeLanguageMode(firstLine)) {
			return { code: code.slice(firstBreak + 1), language: firstLine }
		}
	}
	return { code, language: undefined }
}

export const code = {
	mounted: (el: HTMLElement) => {
		el.querySelectorAll('code').forEach((c: Element) => {
			const { code: text, language } = splitCodeLanguage((c as HTMLElement).innerText, c)
			createSubApp(Code, { code: text, language }, 'v-code').mount(c)
		})
	}
}

export const dochash = {
	mounted: (el: HTMLElement) => {
		el.innerHTML = el.innerHTML.replace(/#(\w+)/g, (a: string, b: string) => {
			return "<a href='/help/documentation/" + b + "'>" + b + "</a>"
		})
		el.querySelectorAll('a').forEach((a: HTMLAnchorElement) => {
			a.onclick = (e: Event) => {
				e.stopPropagation()
				e.preventDefault()
				emitter.emit('doc-navigate', a.innerText)
				return false
			}
		})
	}
}
