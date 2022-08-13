import { ChipTemplate } from "./chip"
import { CHIPS } from "./chips"
import { EffectTypeMarket } from "./effect"

const ORDERED_CHIPS = orderChips(CHIPS)
const CHIP_BY_NAME = chipByName(CHIPS)

function chipByName(chips: {[key: string]: ChipTemplate}) {
	const result: { [key: string]: ChipTemplate } = {}
	for (const c in chips) {
		const chip = chips[c]
		result[chip.name] = chip
	}
	return result
}

function orderChips(chips: { [key: number]: ChipTemplate }): { [key: number]: number } {
	// Regroup chips by effects type
	const chipsByType: { [key: number]: ChipTemplate[] } = {}
	for (const i in chips) {
		const chip = chips[i]
		const type = chip.effects[0].type
		if (chipsByType[type] === undefined) { chipsByType[type] = [] }
		chipsByType[type].push(chip)
	}
	// Order chips by level and associates each chips with his position
	const orderedChips: { [key: number]: number } = {}
	let position = 0
	for (const type in EffectTypeMarket) {
		if (chipsByType[type] !== undefined) {
			chipsByType[type]
				.sort((chipA, chipB) => {
					return chipA.level - chipB.level
				})
				.forEach((chip) => {
					orderedChips[chip.id] = position++
				})
		}
	}
	return orderedChips
}

export { ORDERED_CHIPS, CHIP_BY_NAME }