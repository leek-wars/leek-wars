import type * as Monaco from 'monaco-editor'
import { LeekWars } from '@/model/leekwars'
import { watch } from 'vue'

/*
 * Les deux thèmes de coloration maison, sortis de monaco.ts pour que les pages
 * qui importent monaco-editor SANS toute l'infra de l'éditeur (l'encyclopédie
 * en mode édition) puissent les définir aussi — sans quoi elles retombaient sur
 * les gris génériques vs / vs-dark et ne suivaient pas le thème du site.
 *
 * « Leek Wars » (clair) : aux couleurs du thème v3 clair — mots-clés au vert de
 * marque en encre, types en gras, chaînes chaudes, nombres et atomes en violet,
 * annotations à l'or en encre (--rank-first), commentaires éteints. Fond =
 * surface de panneau. Encres mesurées sur le fond de page #EFE9D6 (la pire
 * surface claire, pour que les aperçus transparents tiennent aussi) : 6,2 le
 * vert, 5,1 le bleu, 5,3 l'orange, 6,5 le violet, 4,5 l'or, 4,9 les
 * commentaires — toutes ≥ 4,5. En v2 le thème garde sa peau historique (fond
 * blanc, bleu marine) : la définition suit le design et se rejoue à la bascule.
 *
 * « Leek Wars Dark » : thème par défaut en mode sombre, à la place de Monokai —
 * qui reste proposé. Il transpose le thème clair plutôt que d'inventer une
 * sémantique. Le vert de marque prend la place du bleu marine des mots-clés, et
 * les nombres passent au violet, le vert étant désormais pris. Toutes les
 * encres sont mesurées sur le fond #0E1316 : 14,6 pour le vert, 12,1 le cyan,
 * 11,0 l'orange, 8,1 le violet, 12,9 l'or, 5,2 les commentaires (le plus bas,
 * volontairement discret mais au-dessus de 4,5:1).
 */

let installed = false

function defineLightTheme(monaco: typeof Monaco) {
	if (LeekWars.legacyTheme) {
		monaco.editor.defineTheme("leek-wars", {
			base: "vs",
			inherit: true,
			rules: [
				{ token: "comment", foreground: "999999" },
				{ token: "string", foreground: "ff781e" },
				{ token: "keyword", foreground: "00007f", fontStyle: 'bold' },
				{ token: "type", foreground: "0000D0", fontStyle: 'bold' },
				{ token: "lsconstant", fontStyle: 'bold' },
				{ token: "lsfunction", fontStyle: 'italic' },
				{ token: "lsfunction-deprecated", foreground: '777777', fontStyle: 'italic' },
				{ token: "atom", foreground: '0086bc', fontStyle: 'bold' },
				{ token: "number", foreground: '007f00' },
				{ token: "annotation", foreground: 'aa5500', fontStyle: 'bold' },
			],
			colors: {
				"editor.foreground": "#000000",
				"editor.background": "#ffffff",
				"editor.hoverHighlightBackground": "#00aeff33"
			},
		})
	} else {
		monaco.editor.defineTheme("leek-wars", {
			base: "vs",
			inherit: true,
			rules: [
				{ token: "comment", foreground: "5c6854" },
				{ token: "string", foreground: "9c4508" },
				{ token: "keyword", foreground: "146128", fontStyle: 'bold' },
				{ token: "type", foreground: "16688a", fontStyle: 'bold' },
				{ token: "lsconstant", foreground: "0e1410", fontStyle: 'bold' },
				{ token: "lsfunction", foreground: "0e1410", fontStyle: 'italic' },
				{ token: "lsfunction-deprecated", foreground: '6e7b69', fontStyle: 'italic' },
				{ token: "atom", foreground: '5f35b5', fontStyle: 'bold' },
				{ token: "number", foreground: '5f35b5' },
				{ token: "annotation", foreground: '8a6200', fontStyle: 'bold' },
			],
			colors: {
				"editor.foreground": "#0E1410",
				"editor.background": "#FBF7E8",
				"editor.lineHighlightBackground": "#F3EDD8",
				"editor.selectionBackground": "#2E9E4B40",
				"editorCursor.foreground": "#146128",
				"editorLineNumber.foreground": "#6E7B69",
				"editorLineNumber.activeForeground": "#146128",
				"editor.hoverHighlightBackground": "#00aeff33"
			},
		})
	}
}

export function defineLeekWarsThemes(monaco: typeof Monaco) {
	// Monaco est un singleton : une seule installation suffit, même si
	// l'éditeur et l'encyclopédie demandent tous les deux les thèmes.
	if (installed) { return }
	installed = true

	defineLightTheme(monaco)
	// À la bascule Ancien design ↔ v3, la peau du thème clair suit. Les
	// éditeurs ouverts la prendront à la prochaine application du thème (le
	// réglage de design vit dans une autre page que l'éditeur).
	watch(() => LeekWars.legacyTheme, () => defineLightTheme(monaco))

	monaco.editor.defineTheme("leek-wars-dark", {
		base: "vs-dark",
		inherit: true,
		rules: [
			{ token: "comment", foreground: "7c8b76" },
			{ token: "string", foreground: "ffb86b" },
			{ token: "keyword", foreground: "7cff6b", fontStyle: 'bold' },
			{ token: "type", foreground: "5ce0ff", fontStyle: 'bold' },
			{ token: "lsconstant", foreground: "e8f0e6", fontStyle: 'bold' },
			{ token: "lsfunction", foreground: "e8f0e6", fontStyle: 'italic' },
			{ token: "lsfunction-deprecated", foreground: '6b7a66', fontStyle: 'italic' },
			{ token: "atom", foreground: 'b79bff', fontStyle: 'bold' },
			{ token: "number", foreground: 'b79bff' },
			{ token: "annotation", foreground: 'ffd23a', fontStyle: 'bold' },
		],
		colors: {
			"editor.foreground": "#E8F0E6",
			"editor.background": "#0E1316",
			"editor.lineHighlightBackground": "#131A1E",
			"editor.selectionBackground": "#7CFF6B33",
			"editorCursor.foreground": "#7CFF6B",
			"editorLineNumber.foreground": "#6B7A66",
			"editorLineNumber.activeForeground": "#7CFF6B",
			"editor.hoverHighlightBackground": "#00aeff33"
		},
	})
}
