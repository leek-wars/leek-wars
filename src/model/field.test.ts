import { describe, it, expect, vi } from 'vitest'
import { Area } from '@/model/area'

// field.ts crée de vraies cellules (new Cell), donc on garde Cell réel. Mais cell.ts
// importe le moteur de jeu (Game/Obstacle/FightEntity, graphe lourd canvas) uniquement
// pour des types / une méthode non testée ici. On stub ces 3 modules composants pour que
// Cell se charge sans tirer le moteur. effect.ts/area.ts/entity.ts sont légers (pas de mock).
vi.mock('@/component/player/game/game', () => ({ Game: class {} }))
vi.mock('@/component/player/game/obstacle', () => ({ Obstacle: class {} }))
vi.mock('@/component/player/game/entity', () => ({ FightEntity: class {} }))

import { Field } from '@/model/field'

// Taille réelle du terrain de jeu (cf ground.ts : new Field(18, 18)).
// NB : Field n'est pas correct pour de très petites tailles (collision du sentinel -1
// dans le calcul de min/max), donc on teste à la taille réelle, jamais < 3.
const SIZE = 18

describe('Field - construction de la grille (losange)', () => {
	it('nombre de cellules = (2T-1)*T - (T-1)', () => {
		const f = new Field(SIZE, SIZE)
		expect(f.nb_cells).toBe((SIZE * 2 - 1) * SIZE - (SIZE - 1)) // 613
		expect(f.cells.length).toBe(f.nb_cells)
	})
	it('la cellule centrale existe, les coins du losange non', () => {
		const f = new Field(SIZE, SIZE)
		expect(f.getCell(0, 0)).toBeTruthy()
		expect(f.getCell(0, 0).id).toBe(SIZE * (SIZE - 1)) // 306
		expect(f.getCell(SIZE - 1, 1)).toBeNull() // |17|+|1| >= 18 → hors losange
	})
})

describe('Field - conversions de coordonnées', () => {
	it('cellToXY de la cellule centrale = centre visuel', () => {
		const f = new Field(SIZE, SIZE)
		expect(f.cellToXY(f.getCell(0, 0))).toEqual({ x: 17, y: 17 })
	})
	it('xyToCell est l\'inverse de cellToXY pour TOUTE cellule', () => {
		const f = new Field(SIZE, SIZE)
		for (const cell of f.cells) {
			expect(cell).toBeTruthy()
			const { x, y } = f.cellToXY(cell)
			expect(f.xyToCell(x, y)).toBe(cell)
		}
	})
})

describe('Field - real_distance', () => {
	it('distance nulle à soi-même', () => {
		const f = new Field(SIZE, SIZE)
		const c = f.getCell(0, 0)
		expect(f.real_distance(c, c)).toBe(0)
	})
	it('symétrique', () => {
		const f = new Field(SIZE, SIZE)
		const a = f.getCell(0, 0)
		const b = f.getCell(3, -2)
		expect(f.real_distance(a, b)).toBe(f.real_distance(b, a))
	})
	it('voisin direct = sqrt(1.25) (1 en x, 0.5 en y/2)', () => {
		const f = new Field(SIZE, SIZE)
		expect(f.real_distance(f.getCell(0, 0), f.getCell(1, 0))).toBeCloseTo(Math.sqrt(1.25), 10)
	})
	it('croît avec l\'éloignement le long d\'une ligne', () => {
		const f = new Field(SIZE, SIZE)
		const center = f.getCell(0, 0)
		expect(f.real_distance(center, f.getCell(1, 0)))
			.toBeLessThan(f.real_distance(center, f.getCell(5, 0)))
	})
})

describe('Field - next_cell', () => {
	it('voisin valide', () => {
		const f = new Field(SIZE, SIZE)
		expect(f.next_cell(f.getCell(0, 0), 1, 0)).toBe(f.getCell(1, 0))
		expect(f.next_cell(f.getCell(0, 0), -1, 0)).toBe(f.getCell(-1, 0))
	})
	it('hors limites → null', () => {
		const f = new Field(SIZE, SIZE)
		expect(f.next_cell(f.getCell(SIZE - 1, 0), 1, 0)).toBeNull()
	})
	it('case inexistante du losange → null', () => {
		const f = new Field(SIZE, SIZE)
		expect(f.next_cell(f.getCell(SIZE - 1, 0), 0, 1)).toBeNull()
	})
})

describe('Field - getAreaCells (au centre, toutes les cases existent)', () => {
	it('SINGLE_CELL = la cellule centrale seule', () => {
		const f = new Field(SIZE, SIZE)
		const center = f.getCell(0, 0)
		expect(f.getAreaCells(center, Area.SINGLE_CELL)).toEqual([center])
	})
	it('CIRCLE1 = centre + 4 voisins', () => {
		const f = new Field(SIZE, SIZE)
		const center = f.getCell(0, 0)
		const cells = f.getAreaCells(center, Area.CIRCLE1)
		expect(cells).toHaveLength(5)
		expect(cells).toContain(center)
		expect(cells).toContain(f.getCell(1, 0))
	})
	it('CIRCLE2 = 13 cases, SQUARE_1 = 9 cases', () => {
		const f = new Field(SIZE, SIZE)
		const center = f.getCell(0, 0)
		expect(f.getAreaCells(center, Area.CIRCLE2)).toHaveLength(13)
		expect(f.getAreaCells(center, Area.SQUARE_1)).toHaveLength(9)
	})
})
