import { describe, expect, it } from 'vitest'
import frCategories from '@/lang/fr/forum-category.json'
import { forumCategoryName, forumDisplayLanguage, loadForumCategoryNames } from '@/model/forum-language'
import { i18n } from '@/model/i18n'

// Le module démarre sur la locale vide de @/locale (renseignée au boot par index.html).
i18n.locale = 'fr'
i18n.global.mergeLocaleMessage('fr', { 'forum-category': frCategories })

describe('forumCategoryName', () => {

	it('rend le nom dans la langue de l\'éleveur sans langue de forum', () => {
		expect(forumCategoryName('bug_reports')).toBe('Rapports de bugs')
	})

	it('retombe sur la langue de l\'éleveur tant que le dictionnaire n\'est pas chargé', () => {
		expect(forumCategoryName('bug_reports', 'en')).toBe('Rapports de bugs')
	})

	it('rend le nom et la description dans la langue du forum une fois le dictionnaire chargé', async () => {
		await loadForumCategoryNames('en')
		expect(forumCategoryName('bug_reports', 'en')).toBe('Bug reports')
		expect(forumCategoryName('bug_reports_desc', 'en')).toBe('If you think you\'ve found a bug in the game')
	})

	it('retombe sur la langue de l\'éleveur pour une langue sans dictionnaire', async () => {
		await loadForumCategoryNames('xx')
		expect(forumCategoryName('bug_reports', 'xx')).toBe('Rapports de bugs')
	})

	it('rend une chaîne vide sur une clé vide', () => {
		expect(forumCategoryName('')).toBe('')
		expect(forumCategoryName(undefined, 'en')).toBe('')
	})
})

describe('forumDisplayLanguage', () => {

	it('prend la langue du forum quand une seule est affichée', () => {
		expect(forumDisplayLanguage(['en'])).toBe('en')
	})

	it('préfère la langue de l\'éleveur quand son forum fait partie du lot', () => {
		expect(forumDisplayLanguage(['en', 'fr'])).toBe('fr')
	})

	it('prend la première langue du lot quand celle de l\'éleveur n\'y est pas', () => {
		i18n.locale = 'it'
		expect(forumDisplayLanguage(['en', 'fr'])).toBe('en')
		i18n.locale = 'fr'
	})

	it('ignore les langues absentes et rend null sur un lot vide', () => {
		expect(forumDisplayLanguage([undefined, 'en', null, 'en'])).toBe('en')
		expect(forumDisplayLanguage([])).toBe(null)
		expect(forumDisplayLanguage([undefined, null])).toBe(null)
	})
})
