import { LeekWars } from '@/model/leekwars'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FUNCTIONS = new Proxy([] as any[], {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	get(_, prop) { return (LeekWars.functions as any)[prop as string] },
	has(_, prop) { return prop in LeekWars.functions },
})
