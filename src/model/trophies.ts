import { LeekWars } from '@/model/leekwars'

// Re-export depuis LeekWars pour compatibilité avec les imports existants
export const TROPHIES = new Proxy([] as any, {
	get(_, prop) { return LeekWars.trophies[prop as any] },
	has(_, prop) { return prop in LeekWars.trophies },
})
