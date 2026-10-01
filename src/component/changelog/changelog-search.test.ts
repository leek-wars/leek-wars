import { describe, it, expect } from 'vitest'
import { changeHtml, changeImages, highlight, matches, searchTerms, searchVersion, versionSections } from './changelog-search'

const VERSION = {
	title: 'Nouveau design',
	added: [
		"Les altérations de composants. #img_300_alterations",
		"#ai La méthode `getWeapon()` renvoie l'arme équipée.",
	],
	fixed: [
		"L'infobulle des altérations s'ouvre vers le haut (merci à FdHP).",
	],
}

const count = (sections: { changes: string[] }[] | null) => sections ? sections.reduce((n, s) => n + s.changes.length, 0) : null

describe('searchTerms', () => {
	it('découpe la requête et retire casse et accents', () => {
		expect(searchTerms('  Altération   Composant ')).toEqual(['alteration', 'composant'])
	})
	it('rend une liste vide sur une requête vide', () => {
		expect(searchTerms('   ')).toEqual([])
	})
})

describe('matches', () => {
	it('exige tous les termes, dans n\'importe quel ordre', () => {
		expect(matches('Les altérations de composants', searchTerms('composant alteration'))).toBe(true)
		expect(matches('Les altérations de composants', searchTerms('composant puce'))).toBe(false)
	})
	it('ne correspond à rien sans terme', () => {
		expect(matches('Les altérations', [])).toBe(false)
	})
})

describe('changeHtml', () => {
	it('retire les marqueurs et rend le code', () => {
		expect(changeHtml('Les altérations. #img_300_alterations', 'IA')).toBe('Les altérations. ')
		expect(changeHtml('#ai La méthode `getWeapon()`.', 'IA')).toBe('<span class="ai" title="IA">AI</span> La méthode <code>getWeapon()</code>.')
	})
})

describe('changeImages', () => {
	it('récupère les captures attachées à la ligne', () => {
		expect(changeImages('Deux vues. #img_300_a #img_300_b')).toEqual(['300_a', '300_b'])
		expect(changeImages('Sans image.')).toEqual([])
	})
})

describe('versionSections', () => {
	it('garde les sections dans l\'ordre du fichier, sans le titre', () => {
		expect(versionSections(VERSION).map(section => section.changes.length)).toEqual([2, 1])
	})
	it('accepte une version réduite à une liste de lignes', () => {
		expect(versionSections(['Une ligne'])).toEqual([{ index: 0, changes: ['Une ligne'] }])
	})
	it('accepte une version absente', () => {
		expect(versionSections(null)).toEqual([])
	})
})

describe('searchVersion', () => {
	it('ne garde que les lignes trouvées, de toutes les sections', () => {
		expect(count(searchVersion(VERSION, searchTerms('alteration')))).toBe(2)
		expect(count(searchVersion(VERSION, searchTerms('arme')))).toBe(1)
	})
	it('garde l\'index d\'origine des sections gardées', () => {
		expect(searchVersion(VERSION, searchTerms('infobulle'))?.map(section => section.index)).toEqual([1])
	})
	it('ne cherche ni dans les marqueurs, ni dans le titre', () => {
		expect(searchVersion(VERSION, searchTerms('img'))).toBe(null)
		expect(searchVersion(VERSION, searchTerms('design'))).toBe(null)
	})
	it('rend null quand rien ne répond, ou sans terme', () => {
		expect(searchVersion(VERSION, searchTerms('tournoi'))).toBe(null)
		expect(searchVersion(VERSION, [])).toBe(null)
	})
})

describe('highlight', () => {
	it('encadre les occurrences en gardant le texte d\'origine', () => {
		expect(highlight('Les altérations', searchTerms('alteration'))).toBe('Les <mark>altération</mark>s')
	})
	it('ne surligne pas dans les balises ni dans les entités', () => {
		expect(highlight('<a href="/market">le marché</a>', searchTerms('market'))).toBe('<a href="/market">le marché</a>')
		expect(highlight('Tom &amp; Jerry', searchTerms('amp'))).toBe('Tom &amp; Jerry')
	})
	it('fusionne les occurrences qui se chevauchent', () => {
		expect(highlight('poireau', searchTerms('poire oire'))).toBe('<mark>poire</mark>au')
	})
	it('laisse le texte intact sans terme', () => {
		expect(highlight('poireau', [])).toBe('poireau')
	})
})
