const MACROS = {
	"\\R": "\\mathbb{R}",
	"\\Q": "\\mathbb{Q}",
	"\\N": "\\mathbb{N}",
	"\\Z": "\\mathbb{Z}",
	"\\C": "\\mathbb{C}",
	"\\E": "\\mathbb{E}",
	"\\H": "\\mathbb{H}",
	"\\iff": "\\Leftrightarrow",
	"\\implies": "\\Rightarrow",
	"\\inj": "\\hookrightarrow",
	"\\surj": "\\twoheadrightarrow",
	"\\qed": "\\Box"
}

class Latex {
	static latexify(html: string) {
		// Lazy-load both the JS and the CSS together — the CSS used to be
		// statically imported from chat-message-text.vue (~50 kB up-front for
		// every chat consumer, even if no message contains LaTeX).
		return Promise.all([
			import("katex"),
			import("katex/dist/katex.min.css"),
		]).then(([katex]) => {
			return html.replace(/\$(.*?)\$/gi, (m, f) => {
				try {
					return '<span title="' + f + '">' + katex.renderToString(f, {macros: MACROS}) + '</span>'
				} catch {
					return m
				}
			})
		})
	}
}

export { Latex }