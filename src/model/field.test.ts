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

// Régression : avant le fix du sentinel -1, construire une petite grille (qui contient
// des coordonnées -1) corrompait min/max et faisait crasher le constructeur (coord[-1]).
describe('Field - régression petite grille (sentinel -1)', () => {
	it('Field(2,2) se construit (5 cellules en losange)', () => {
		const f = new Field(2, 2)
		expect(f.nb_cells).toBe(5)
		expect(f.cells.length).toBe(5)
		expect(f.getCell(0, 0)).toBeTruthy()
		expect(f.getCell(1, 1)).toBeNull() // coin du losange
	})
	it('Field(2,2) conversions exactes', () => {
		const f = new Field(2, 2)
		expect(f.cellToXY(f.getCell(-1, 0))).toEqual({ x: 0, y: 0 })
		expect(f.cellToXY(f.getCell(0, 0))).toEqual({ x: 1, y: 1 })
		expect(f.cellToXY(f.getCell(1, 0))).toEqual({ x: 2, y: 2 })
		expect(f.xyToCell(1, 1)).toBe(f.getCell(0, 0))
	})
	it('Field(2,2) voisinage', () => {
		const f = new Field(2, 2)
		expect(f.next_cell(f.getCell(0, 0), 1, 0)).toBe(f.getCell(1, 0))
		expect(f.next_cell(f.getCell(1, 0), 1, 0)).toBeNull() // hors limites
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

// Miroir des tests du générateur (TestFightMap.repelDistanceTest / repelStopsOnObstacleTest) :
// le client recalcule le déplacement d'EFFECT_REPEL pendant le replay, il doit donner
// exactement les mêmes cellules que Map.getRepelLastAvailableCell côté serveur.
describe('Field - computeRepelCell (EFFECT_REPEL)', () => {
	it('repousse d\'exactement `distance` cases en s\'éloignant du lanceur', () => {
		const f = new Field(SIZE, SIZE)
		const caster = f.getCell(0, 0)
		const entity = f.getCell(1, 0) // juste à côté, direction +x
		expect(f.computeRepelCell(caster, entity, 3)).toBe(f.getCell(4, 0))
	})
	it('distance 0 : aucun déplacement', () => {
		const f = new Field(SIZE, SIZE)
		expect(f.computeRepelCell(f.getCell(0, 0), f.getCell(1, 0), 0)).toBe(f.getCell(1, 0))
	})
	it('même case que le lanceur : pas de direction, aucun déplacement', () => {
		const f = new Field(SIZE, SIZE)
		const cell = f.getCell(0, 0)
		expect(f.computeRepelCell(cell, cell, 3)).toBe(cell)
	})
	it('s\'arrête net devant un obstacle', () => {
		const f = new Field(SIZE, SIZE)
		f.getCell(3, 0).obstacle = {} as never
		expect(f.computeRepelCell(f.getCell(0, 0), f.getCell(1, 0), 3)).toBe(f.getCell(2, 0))
	})
	it('s\'arrête net devant une autre entité', () => {
		const f = new Field(SIZE, SIZE)
		f.getCell(3, 0).entity = {} as never
		expect(f.computeRepelCell(f.getCell(0, 0), f.getCell(1, 0), 3)).toBe(f.getCell(2, 0))
	})
	it('s\'arrête au bord de la carte', () => {
		const f = new Field(SIZE, SIZE)
		const caster = f.getCell(SIZE - 3, 0)
		const entity = f.getCell(SIZE - 2, 0)
		expect(f.computeRepelCell(caster, entity, 3)).toBe(f.getCell(SIZE - 1, 0))
	})
	it('direction -y', () => {
		const f = new Field(SIZE, SIZE)
		expect(f.computeRepelCell(f.getCell(0, 0), f.getCell(0, -1), 2)).toBe(f.getCell(0, -3))
	})
})
