import { LeekWars } from '@/model/leekwars'

export const FUNCTIONS = new Proxy([] as any[], {
	get(_, prop) { return (LeekWars.functions as any)[prop as any] },
	has(_, prop) { return prop in LeekWars.functions },
})
