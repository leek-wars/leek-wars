import { describe, it, expect } from 'vitest'
import { mountComponent } from '@/test/harness'
import ReportStatisticsEntity from '@/component/report/report-statistics-entity.vue'

// report-statistics-entity rend une ligne de stats de combat. Logique : classe {summon} sur
// la ligne, marqueur alive/dead, et par stat un <td> avec classe {best: best[stat] contient
// l'id du leek} + valeur formatée SI truthy (0/undefined -> cellule vide). $filters.number
// est un global de l'app (pas fourni par le harnais) : on l'injecte via global.config.
const mountRow = (props: Record<string, unknown>) => mountComponent(ReportStatisticsEntity, {
	props,
	global: { config: { globalProperties: { $filters: { number: (n: number) => String(n) } } } },
})

describe('report-statistics-entity.vue', () => {
	const base = { alive: true, leek: { id: 5, summon: false }, translatedName: 'Bob', level: 12 }

	it('ligne normale : niveau, marqueur vivant, cellule best formatée', () => {
		const w = mountRow({ entity: { ...base, dmg_out: 1500 }, stats: ['dmg_out'], best: { dmg_out: [5] } })
		expect(w.find('tr').classes()).not.toContain('summon')
		expect(w.find('td.name .alive').exists()).toBe(true)
		const tds = w.findAll('td')
		expect(tds[1].text()).toBe('12') // niveau
		expect(tds[2].classes()).toContain('best') // best[dmg_out] contient l'id 5
		expect(tds[2].text()).toBe('1500')
	})

	it('pas dans le best : la cellule n\'a pas la classe best', () => {
		const w = mountRow({ entity: { ...base, dmg_out: 1500 }, stats: ['dmg_out'], best: { dmg_out: [9] } })
		expect(w.findAll('td')[2].classes()).not.toContain('best')
	})

	it('leek mort : marqueur dead', () => {
		const w = mountRow({ entity: { ...base, alive: false }, stats: [], best: {} })
		expect(w.find('td.name .dead').exists()).toBe(true)
		expect(w.find('td.name .alive').exists()).toBe(false)
	})

	it('invocation : classe summon sur la ligne', () => {
		const w = mountRow({ entity: { ...base, leek: { id: 5, summon: true } }, stats: [], best: {} })
		expect(w.find('tr').classes()).toContain('summon')
	})

	it('valeur falsy (0) : cellule vide mais présente et best appliqué', () => {
		const w = mountRow({ entity: { ...base, dmg_out: 0 }, stats: ['dmg_out'], best: { dmg_out: [5] } })
		const cell = w.findAll('td')[2]
		expect(cell.text()).toBe('') // 0 est falsy -> pas de nombre affiché
		expect(cell.classes()).toContain('best')
	})
})
