import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RangeView from '@/component/market/range-view.vue'

// range-view rend une grille (table de <td class="full"|"">) à partir du computed `cells`,
// qui encode la vraie logique de zones : bitmask type (1=croix, 2=diagonale, 4=spécial),
// types 9/10 (X/carré), portée Manhattan min..max, et le diviseur de taille selon le type.
// On assère sur le DOM rendu (nombre de lignes, de cases, de cases pleines).
const grid = (props: { min: number, max: number, type: number }) => {
	const w = mount(RangeView, { props })
	return {
		rows: w.findAll('tr').length,
		cells: w.findAll('td').length,
		full: w.findAll('td.full').length,
	}
}

describe('range-view.vue', () => {
	it('ne rend rien pour max === 50 (portée infinie)', () => {
		expect(grid({ min: 0, max: 50, type: 1 })).toEqual({ rows: 0, cells: 0, full: 0 })
	})

	it('type 1 (croix) : plein sur les axes dans la portée Manhattan', () => {
		// max=2 → grille 5x5, cases pleines = croix de rayon 2 (9 cases)
		expect(grid({ min: 0, max: 2, type: 1 })).toEqual({ rows: 5, cells: 25, full: 9 })
	})

	it('type 1 respecte la portée minimale (exclut le centre)', () => {
		// min=2,max=3 → grille 7x7, croix mais seulement les cases à distance 2..3 (8 cases)
		expect(grid({ min: 2, max: 3, type: 1 })).toEqual({ rows: 7, cells: 49, full: 8 })
	})

	it('type 2 (diagonale) : grille réduite de moitié (diviseur max/2)', () => {
		// type&1=0, type&4=0 → taille = max/2 = 1 → grille 3x3 ; diagonale = 5 cases
		expect(grid({ min: 0, max: 2, type: 2 })).toEqual({ rows: 3, cells: 9, full: 5 })
	})

	it('type 9 (X) : plein là où |x| === |y|', () => {
		// max=2 → grille 5x5, les deux diagonales complètes = 9 cases
		expect(grid({ min: 0, max: 2, type: 9 })).toEqual({ rows: 5, cells: 25, full: 9 })
	})
})
