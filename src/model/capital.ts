import { COSTS } from '@/model/leek'

/** Convertit un nombre de capital dépensé en bonus de stat pour une caractéristique donnée. */
export function capitalToStatBonus(charac: string, capital: number): number {
	const steps = COSTS[charac]
	if (!steps || capital <= 0) return 0
	let bonus = 0
	let remaining = capital
	while (remaining > 0) {
		let i = 0
		for (; i < steps.length; i++) { if (steps[i].step > bonus) break }
		i--
		if (remaining < steps[i].capital) break
		remaining -= steps[i].capital
		bonus += steps[i].sup
	}
	return bonus
}

/** Inverse : combien de capital faut-il pour atteindre ce bonus de stat. */
export function statBonusToCapital(charac: string, bonus: number): number {
	const steps = COSTS[charac]
	if (!steps || bonus <= 0) return 0
	let capital = 0
	let total = 0
	while (total < bonus) {
		let i = 0
		for (; i < steps.length; i++) { if (steps[i].step > total) break }
		i--
		capital += steps[i].capital
		total += steps[i].sup
	}
	return capital
}

/** Valeur de base d'une caractéristique pour un leek à un niveau donné (sans allocation ni équipement). */
export function baseStatFor(level: number, stat: string): number {
	switch (stat) {
		case 'life': return 100 + (level - 1) * 3
		case 'frequency': return 100
		case 'cores': return 1
		case 'ram': return 6
		case 'tp': return 10
		case 'mp': return 3
		default: return 0
	}
}

/** Capital total d'un leek à un niveau donné (formule serveur). */
export function totalCapitalForLevel(level: number): number {
	let capital = 50 + (level - 1) * 5 + Math.floor(level / 100) * 45
	if (level === 301) capital += 95
	return capital
}
