export class Boss {
	id!: number
	name!: string
	level!: number
	weapon!: number | null
	hat!: number | null
	type!: string
	scale!: number
	difficulty!: number
}

export const BOSSES = {
	1: { id: 1, name: "nasu_samurai", level: 50, weapon: 408, hat: null, type: 'boss', scale: 0.85, difficulty: 1 },
	2: { id: 2, name: "fennel_king", level: 100, weapon: 409, hat: 5, type: 'boss', scale: 0.95, difficulty: 2 },
	3: { id: 3, name: "evil_pumpkin", level: 200, weapon: 410, hat: null, type: 'boss', scale: 0.8, difficulty: 3 },
} as {[key: number]: Boss}