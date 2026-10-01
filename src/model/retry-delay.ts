/*
 * Politique de reprise partagée. Module feuille, SANS import : `gamedata.ts` s'en sert au
 * démarrage et ne peut rien tirer de `leekwars.ts`, qui l'importe lui-même (cycle).
 */

export const RETRY_CONFIG = {
	maxRetries: 3,
	baseDelay: 1000,  // 1s, 2s, 4s
	maxDelay: 10000,
	jitter: 1000,     // étalement aléatoire des reprises
}

// Les requêtes rate-limitées le sont souvent par paquet (un montage de page en tire plusieurs
// d'un coup), et un backoff exact les rejouerait toutes au même instant — donc re-limitées en
// bloc, jusqu'à épuiser les trois essais. L'aléa les étale. Additif et non multiplicatif, pour
// que l'étalement reste constant au lieu de grandir avec le backoff.
// Appliqué AVANT le plafond, sinon maxDelay n'en est plus un.
export function retryDelay(retry: number) {
	const delay = RETRY_CONFIG.baseDelay * Math.pow(2, retry) + Math.random() * RETRY_CONFIG.jitter
	return Math.round(Math.min(delay, RETRY_CONFIG.maxDelay))
}
