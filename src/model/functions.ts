import { LeekWars } from '@/model/leekwars'

export const FUNCTIONS = new Proxy([] as never[], {
	get(_, prop) { return (LeekWars.functions as never[])[prop as never] },
	has(_, prop) { return prop in LeekWars.functions },
})
