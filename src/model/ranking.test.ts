import { describe, it, expect } from 'vitest'
import { rankingAnchor, rankingAnchorId } from '@/model/ranking'

// L'ancre posée par goToRanking désigne l'entité et non son rang : un rang lu dans
// l'autre mode du classement (tous les comptes ou non) surlignait la ligne d'un autre.
describe('ancre de ligne du classement', () => {
	it('désigne l\'entité, relue sur une page du même type', () => {
		expect(rankingAnchor('farmer', 42)).toBe('#farmer-42')
		expect(rankingAnchorId(rankingAnchor('farmer', 42), 'farmer')).toBe(42)
		expect(rankingAnchorId(rankingAnchor('leek', 7), 'leek')).toBe(7)
		expect(rankingAnchorId(rankingAnchor('composition', 3), 'composition')).toBe(3)
	})

	it('ne désigne rien sur une page d\'un autre type', () => {
		expect(rankingAnchorId('#leek-42', 'farmer')).toBeNull()
		expect(rankingAnchorId('#farmer-42', 'team')).toBeNull()
		expect(rankingAnchorId('#farmer-42', 'boss-1')).toBeNull()
	})

	it('ignore une ancre qui ne désigne pas d\'entité', () => {
		expect(rankingAnchorId('', 'farmer')).toBeNull()
		// L'ancien format, un rang : relu comme un identifiant, il surlignerait n'importe qui.
		expect(rankingAnchorId('#rank-12', 'farmer')).toBeNull()
		expect(rankingAnchorId('#farmer-', 'farmer')).toBeNull()
		expect(rankingAnchorId('#farmer-12a', 'farmer')).toBeNull()
	})
})
