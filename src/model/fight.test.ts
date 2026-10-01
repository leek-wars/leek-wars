import { describe, expect, it } from 'vitest'
import { Farmer } from '@/model/farmer'
import { isOwnLogs } from '@/model/fight'

const me = { id: 19070, team: { id: 6485 } } as unknown as Farmer

describe('isOwnLogs', () => {
	it("les logs de l'éleveur sont les siens", () => {
		expect(isOwnLogs('19070', me)).toBe(true)
	})

	it("ceux d'une tourelle, si c'est son IA qui la jouait", () => {
		expect(isOwnLogs('-6485', me, { 6485: 19070 })).toBe(true)
	})

	it("pas ceux de la tourelle de son équipe jouée par l'IA d'un autre membre", () => {
		expect(isOwnLogs('-6485', me, { 6485: 50580 })).toBe(false)
		// Combat d'avant l'information : la tourelle reste un allié.
		expect(isOwnLogs('-6485', me)).toBe(false)
	})

	it("ni ceux d'un allié ou des bots", () => {
		expect(isOwnLogs('50580', me, { 6485: 19070 })).toBe(false)
		expect(isOwnLogs('0', me)).toBe(false)
	})

	it('sans éleveur connecté, rien', () => {
		expect(isOwnLogs('19070', null)).toBe(false)
	})
})
