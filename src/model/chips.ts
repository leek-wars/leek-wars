import { LeekWars } from '@/model/leekwars'

export const CHIPS = new Proxy({} as Record<string, any>, {
	get(_, prop) { return (LeekWars.chips as Record<string, any>)[prop as string] },
	has(_, prop) { return prop in LeekWars.chips },
	ownKeys() { return Object.keys(LeekWars.chips) },
	getOwnPropertyDescriptor(_, prop) {
		if (prop in LeekWars.chips) return { configurable: true, enumerable: true, value: (LeekWars.chips as Record<string, any>)[prop as string] }
	},
})
