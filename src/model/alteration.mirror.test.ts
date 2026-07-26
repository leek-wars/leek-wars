import { describe, expect, it } from 'vitest'
import { planAttempt } from './alteration'
import type { AlterationData, Stats } from './alteration'
import fixture from './alteration.mirror.json'

/**
 * Contrôle croisé du miroir client contre le moteur serveur (#622).
 *
 * Les 200 cas de `alteration.mirror.json` ont été calculés PAR LE SERVEUR
 * (api/test/unit/generate-mirror-fixture.php) sur des pièces réelles, dans tous les états :
 * neuve, montée, creusée par la casse, et les deux à la fois. Le client rejoue chacun d'eux
 * et doit retrouver les mêmes chiffres au neuvième chiffre après la virgule.
 *
 * C'est le seul test qui attrape une dérive entre les deux implémentations, et cette dérive
 * est la famille de bugs la plus coûteuse de la feature : le miroir a déjà annoncé une charge
 * d'arrivée qui n'arrivait jamais, puis un risque de casse que le serveur ne jouait pas.
 *
 * La fixture embarque aussi les données de jeu, donc elle attrape en prime une dérive du
 * registre : la table de test écrite à la main pouvait vieillir sans que rien ne le signale.
 *
 * Si ce test casse après une modification du moteur serveur, c'est le rappel qu'il faut
 * porter la même modification ici, puis régénérer la fixture.
 */

const data = fixture.data as unknown as AlterationData

describe('miroir client / moteur serveur', () => {
	it('rejoue les 200 cas du serveur sans dériver', () => {
		expect(fixture.cases.length).toBeGreaterThanOrEqual(200)

		const divergences: string[] = []
		for (const [index, c] of fixture.cases.entries()) {
			const plan = planAttempt(data, c.base as [string, number][], c.added as Stats,
				c.level, c.family, c.recipe as unknown as { [id: number]: number }, c.capacity)
			const expected = c.expected

			// Un seul message par cas, avec de quoi le rejouer à la main.
			const check = (field: string, got: number | boolean, want: number | boolean) => {
				const same = typeof got === 'number' && typeof want === 'number'
					? Math.abs(got - want) < 1e-9
					: got === want
				if (!same) {
					divergences.push(`cas ${index} (${c.component}) ${field} : client ${got}, serveur ${want}`
						+ ` | added=${JSON.stringify(c.added)} recette=${JSON.stringify(c.recipe)}`)
				}
			}
			check('dose', plan.dose, expected.dose)
			check('items', plan.items, expected.items)
			check('power', plan.power, expected.power)
			check('fits', plan.fits, expected.fits)
			check('overfilled', plan.overfilled, expected.overfilled)
			check('probability', plan.probability, expected.probability)
			check('breakProbability', plan.breakProbability, expected.breakProbability)
			check('breakRisk', plan.breakRisk, expected.breakRisk)
			check('ratioBefore', plan.ratioBefore, expected.ratioBefore)
			check('ratioAfter', plan.ratioAfter, expected.ratioAfter)
			check('habsCost', plan.habsCost, expected.habsCost)
		}
		expect(divergences.slice(0, 8)).toEqual([])
	})

	it('couvre bien tous les états de pièce, sinon le test ne prouve pas grand-chose', () => {
		const états = { neuve: 0, montée: 0, creusée: 0, mixte: 0 }
		for (const c of fixture.cases) {
			const values = Object.values(c.added as Stats)
			if (!values.length) états.neuve++
			else if (values.every(v => v > 0)) états.montée++
			else if (values.every(v => v < 0)) états.creusée++
			else états.mixte++
		}
		for (const [état, n] of Object.entries(états)) {
			expect(n, `aucun cas ${état} dans la fixture`).toBeGreaterThan(0)
		}
		// Et des tentatives refusées comme acceptées : le gate doit être exercé.
		expect(fixture.cases.some(c => c.expected.fits)).toBe(true)
		expect(fixture.cases.some(c => !c.expected.fits)).toBe(true)
	})
})
