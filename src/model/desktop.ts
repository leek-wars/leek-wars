import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'

// Intégration du client de bureau. Quand le site tourne dans l'application de bureau,
// celle-ci expose `window.desktop` (pont vers le processus natif). Tout ce qui suit est
// inactif dans un navigateur : chaque fonction vérifie d'abord la présence du pont.

export interface DesktopUser {
	id: string
	accountId: number
	name: string
	level: number
	country: string
}

export interface DesktopBridge {
	wrapper: true
	version: string
	platform: string
	info(): Promise<{ available: boolean, appId?: number, handheld?: boolean, language?: string, buildId?: number, error?: string }>
	user(): Promise<DesktopUser | null>
	/** Ticket d'authentification en hexadécimal, null si le service de la plateforme est absent. */
	authTicket(identity?: string): Promise<string | null>
	cancelAuthTicket(): Promise<void>
	achievement: {
		activate(name: string): Promise<boolean>
		isActivated(name: string): Promise<boolean>
		sync(names: string[]): Promise<string[]>
	}
	setRichPresence(key: string, value: string | null): Promise<void>
	app: {
		openExternal(url: string): Promise<void>
		toggleFullscreen(): Promise<void>
		setZoom(factor: number): Promise<void>
		quit(): Promise<void>
	}
}

declare global {
	interface Window { desktop?: DesktopBridge }
}

export function desktop(): DesktopBridge | null {
	return typeof window !== 'undefined' && window.desktop?.wrapper === true ? window.desktop : null
}

export const isDesktop = () => desktop() !== null

/** Nom de succès associé à un trophée : son code en majuscules. */
export function achievementName(code: string) {
	return code.toUpperCase()
}

/** Un ticket frais, ou null (pont absent, plateforme indisponible, erreur). */
export async function desktopTicket(): Promise<string | null> {
	const d = desktop()
	if (!d) { return null }
	try {
		const info = await d.info()
		if (!info.available) { return null }
		return await d.authTicket()
	} catch {
		return null
	}
}

/**
 * Connexion automatique au lancement quand aucun compte n'est connecté. Rend true si
 * un éleveur a été connecté. Compte inconnu (`no_such_farmer`) : on laisse la page
 * d'accueil proposer l'inscription, qui passera par `register-desktop`.
 */
export async function desktopAutoLogin(): Promise<boolean> {
	const ticket = await desktopTicket()
	if (!ticket) { return false }
	return new Promise(resolve => {
		LeekWars.post('farmer/login-desktop', { ticket }).then(data => {
			if (data && data.farmer) {
				store.commit('connect', { ...data, token: '$' })
				store.commit('connected', '$')
				resolve(true)
			} else {
				resolve(false)
			}
		}).error(() => resolve(false))
	})
}

/** Débloque côté plateforme les succès des trophées déjà obtenus par l'éleveur. */
export function desktopSyncTrophies() {
	const d = desktop()
	if (!d || !store.state.connected) { return }
	LeekWars.get('trophy/my-trophies/' + (i18n.locale || 'en')).then(data => {
		const names = (data.trophies as { code: string, unlocked: boolean }[])
			.filter(t => t.unlocked && t.code)
			.map(t => achievementName(t.code))
		if (names.length) {
			d.achievement.sync(names).catch(() => { /* plateforme indisponible */ })
		}
	})
}

/** Un trophée vient d'être débloqué (notification temps réel). */
export function desktopTrophyUnlocked(trophyId: number) {
	const d = desktop()
	if (!d) { return }
	const trophy = LeekWars.trophies[trophyId - 1]
	if (!trophy || !trophy.code) { return }
	d.achievement.activate(achievementName(trophy.code)).catch(() => { /* plateforme indisponible */ })
}

/**
 * À appeler une fois au démarrage : synchronise les succès à chaque changement
 * d'éleveur connecté (connexion, bascule de compte). Certains trophées sont attribués
 * sans notification temps réel, la synchro complète les rattrape.
 */
export function initDesktop() {
	if (!isDesktop()) { return }
	document.documentElement.classList.add('desktop-app')
	let lastFarmer: number | null = null
	store.watch(state => state.farmer?.id ?? null, id => {
		if (id !== null && id !== lastFarmer) {
			lastFarmer = id
			desktopSyncTrophies()
		}
	}, { immediate: true })
}
