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
		return import(/* webpackChunkName: "katex" */ "katex").then((katex) => {
			return html.replace(/\$(.*?)\$/gi, (m, f) => {
				try {
					return '<span title="' + f + '">' + katex.renderToString(f, {macros: MACROS}) + '</span>'
				} catch (e) {
					return m
				}
			})
		})
	}
}

export { Latex }