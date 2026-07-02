import { describe, it, expect } from 'vitest'
import { mountComponent } from '@/test/harness'
import AreaView from '@/component/market/area-view.vue'

// area-view mappe l'enum Area -> un rayon (width) et choisit QUELLE range-view rendre (et son
// type). On assère sur la grille rendue par range-view (lignes/cases/cases pleines), ce qui est
// indépendant de l'i18n. Les branches sans grille (cellule unique, ligne laser, inconnu) ne
// rendent aucune <table>.
const grid = (area: number) => {
	const w = mountComponent(AreaView, { props: { area } }, {})
	return {
		tables: w.findAll('table').length,
		tr: w.findAll('tr').length,
		td: w.findAll('td').length,
		full: w.findAll('td.full').length,
		text: w.text().replace(/\s+/g, ' ').trim(),
	}
}

describe('area-view.vue', () => {
	it('cellule unique (1) : aucune grille', () => expect(grid(1).tables).toBe(0))

	it('cercles (rayon = famille) via range-view type 7', () => {
		expect(grid(3)).toMatchObject({ tables: 1, tr: 3, td: 9, full: 5 })   // CIRCLE1
		expect(grid(4)).toMatchObject({ tr: 5, td: 25, full: 13 })            // CIRCLE2
		expect(grid(5)).toMatchObject({ tr: 7, td: 49, full: 25 })            // CIRCLE3
	})

	it('plus (6/7) via range-view type 1', () => {
		expect(grid(6)).toMatchObject({ tr: 5, td: 25, full: 9 })             // PLUS_2
		expect(grid(7)).toMatchObject({ tr: 7, td: 49, full: 13 })            // PLUS_3
	})

	it('X (8/9/10) via range-view type 9', () => {
		expect(grid(8)).toMatchObject({ tr: 3, td: 9, full: 5 })             // X_1
		expect(grid(9)).toMatchObject({ tr: 5, td: 25, full: 9 })            // X_2
		expect(grid(10)).toMatchObject({ tr: 7, td: 49, full: 13 })          // X_3
	})

	it('carrés (11/12) via range-view type 10 : toutes les cases pleines', () => {
		expect(grid(11)).toMatchObject({ tr: 3, td: 9, full: 9 })           // SQUARE_1
		expect(grid(12)).toMatchObject({ tr: 5, td: 25, full: 25 })         // SQUARE_2
	})

	it('ligne laser (2) : pas de grille', () => expect(grid(2).tables).toBe(0))

	it('aire inconnue : pas de grille, texte "?"', () => {
		const g = grid(99)
		expect(g.tables).toBe(0)
		expect(g.text).toBe('?')
	})
})
