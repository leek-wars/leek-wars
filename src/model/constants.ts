import { LeekWars } from '@/model/leekwars'

export const CONSTANTS = new Proxy([] as never[], {
	get(_, prop) { return (LeekWars.constants as never[])[prop as never] },
	has(_, prop) { return prop in LeekWars.constants },
})
