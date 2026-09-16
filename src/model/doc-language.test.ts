import { describe, expect, it } from 'vitest'
import { docLanguage, findCodeBlockGroups, matchesDocLanguage, normalizeDocLanguage, SELECTABLE_DOC_LANGUAGES, setDocLanguage, toSelectableDocLanguage } from '@/model/doc-language'

function render(html: string): Element {
	const root = document.createElement('div')
	root.innerHTML = html
	return root
}

/** Une fence markdown telle que markdown-it la rend : <pre><code class="language-x">. */
function fence(language: string | null, code: string): string {
	const cls = language ? ` class="language-${language}"` : ''
	return `<pre><code${cls}>${code}</code></pre>`
}

describe('normalizeDocLanguage', () => {
	it('accepte les alias utilisés dans les pages existantes', () => {
		expect(normalizeDocLanguage('js')).toBe('javascript')
		expect(normalizeDocLanguage('py')).toBe('python')
		expect(normalizeDocLanguage('ts')).toBe('typescript')
		expect(normalizeDocLanguage('leek')).toBe('leekscript')
		expect(normalizeDocLanguage('LeekScript')).toBe('leekscript')
	})
	it('rejette ce qui n’est pas un langage d’IA', () => {
		// Les pages contiennent aussi des blocs json/bash/html : ils ne doivent jamais
		// devenir un onglet de langage.
		expect(normalizeDocLanguage('json')).toBeNull()
		expect(normalizeDocLanguage('bash')).toBeNull()
		expect(normalizeDocLanguage(null)).toBeNull()
		expect(normalizeDocLanguage('')).toBeNull()
	})
})

describe('matchesDocLanguage', () => {
	it('rend TypeScript et JavaScript interchangeables', () => {
		// Même API objet, même runtime (le TS est transpilé au build) : dupliquer chaque
		// exemple en trois n'aurait aucun sens.
		expect(matchesDocLanguage('js', 'typescript')).toBe(true)
		expect(matchesDocLanguage('ts', 'javascript')).toBe(true)
	})
	it('ne confond pas LeekScript et Python', () => {
		expect(matchesDocLanguage('leekscript', 'python')).toBe(false)
		expect(matchesDocLanguage('python', 'leekscript')).toBe(false)
	})
})

describe('findCodeBlockGroups', () => {
	it('regroupe des fences consécutives de langages différents', () => {
		const root = render(fence('leekscript', 'getLife()') + fence('js', 'entity.life') + fence('python', 'entity.life'))
		const groups = findCodeBlockGroups(root)
		expect(groups).toHaveLength(1)
		expect(groups[0].blocks.map(b => b.language)).toEqual(['leekscript', 'javascript', 'python'])
		expect(groups[0].blocks[0].code).toBe('getLife()')
	})

	it('ne groupe pas un bloc isolé', () => {
		// Le cas de l'immense majorité des pages : elles doivent rester rendues à l'identique.
		const root = render(fence('leekscript', 'getLife()'))
		expect(findCodeBlockGroups(root)).toHaveLength(0)
	})

	it('ne groupe pas deux exemples du MÊME langage qui se suivent', () => {
		// Deux exemples LeekScript successifs sont deux exemples, pas deux onglets.
		const root = render(fence('leekscript', 'a') + fence('leekscript', 'b'))
		expect(findCodeBlockGroups(root)).toHaveLength(0)
	})

	it('coupe le groupe sur un paragraphe intercalé', () => {
		const root = render(fence('leekscript', 'a') + '<p>texte</p>' + fence('python', 'b'))
		expect(findCodeBlockGroups(root)).toHaveLength(0)
	})

	it('ignore les fences sans langage et les langages non-IA', () => {
		// Les 317 pages fr sans tag de langage ne doivent surtout pas se coller à la suivante.
		const root = render(fence(null, 'a') + fence('json', '{}') + fence('python', 'b'))
		expect(findCodeBlockGroups(root)).toHaveLength(0)
	})

	it('trouve plusieurs groupes indépendants dans une page', () => {
		const root = render(
			fence('leekscript', 'a1') + fence('python', 'a2')
			+ '<p>séparation</p>'
			+ fence('leekscript', 'b1') + fence('js', 'b2'),
		)
		const groups = findCodeBlockGroups(root)
		expect(groups).toHaveLength(2)
		expect(groups[1].blocks.map(b => b.code)).toEqual(['b1', 'b2'])
	})

	it('expose les éléments d’origine pour pouvoir les remplacer', () => {
		const root = render(fence('leekscript', 'a') + fence('py', 'b'))
		const groups = findCodeBlockGroups(root)
		expect(groups[0].elements).toHaveLength(2)
		expect(groups[0].elements.every(e => e.tagName === 'PRE')).toBe(true)
	})
})

describe('langages proposés au sélecteur', () => {
	it('n’offre pas JavaScript séparément de TypeScript', () => {
		// Même API objet, même runtime : un quatrième choix ne ferait que doubler une entrée.
		expect(SELECTABLE_DOC_LANGUAGES).toEqual(['leekscript', 'typescript', 'python'])
	})

	it('ramène JavaScript sur TypeScript', () => {
		expect(toSelectableDocLanguage('javascript')).toBe('typescript')
		expect(toSelectableDocLanguage('python')).toBe('python')
		expect(toSelectableDocLanguage('leekscript')).toBe('leekscript')
	})

	it('n’enregistre jamais javascript comme préférence', () => {
		// Un joueur qui code en JS, un `?lang=js`, une préférence d'avant ce changement :
		// tous doivent atterrir sur un choix qui existe dans le menu.
		setDocLanguage('javascript')
		expect(docLanguage.value).toBe('typescript')
		expect(localStorage.getItem('doc/language')).toBe('typescript')
	})

	it('affiche toujours un bloc ```js au lecteur en TypeScript', () => {
		// La restriction porte sur le CHOIX, pas sur la reconnaissance du contenu.
		expect(matchesDocLanguage('js', 'typescript')).toBe(true)
	})
})
