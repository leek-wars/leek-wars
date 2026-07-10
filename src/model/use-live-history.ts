import { onMounted, onUnmounted, ref, watch } from 'vue'
import { emitter } from '@/model/vue'
import { LeekWars } from '@/model/leekwars'
import { SocketMessage } from '@/model/socket'
import type { Fight } from '@/model/fight'

const HISTORY_TYPE: Record<string, number> = { farmer: 0, leek: 1, team: 2 }

// Comptage de références PARTAGÉ entre toutes les instances du composable.
// Indispensable : lors d'une navigation (ex. poireau -> historique), Vue exécute
// le setup de la nouvelle page (qui s'abonne) AVANT de démonter l'ancienne (qui se
// désabonne). Sans compteur, le UNREGISTER du composant démonté annulerait
// l'abonnement que la nouvelle page vient de poser pour la même entité. On
// n'envoie donc REGISTER qu'au passage 0->1 et UNREGISTER qu'au passage 1->0.
const historyRefs = new Map<string, number>()
const fightRefs = new Map<number, number>()

function historyRef(type: string, id: number, on: boolean) {
	const code = HISTORY_TYPE[type]
	if (code === undefined) return
	const key = type + ':' + id
	const n = (historyRefs.get(key) || 0) + (on ? 1 : -1)
	if (n <= 0) {
		historyRefs.delete(key)
		if (!on) LeekWars.socket.send([SocketMessage.HISTORY_UNREGISTER, code, id])
	} else {
		historyRefs.set(key, n)
		if (on && n === 1) LeekWars.socket.send([SocketMessage.HISTORY_REGISTER, code, id])
	}
}

function fightRef(fightId: number, on: boolean) {
	const n = (fightRefs.get(fightId) || 0) + (on ? 1 : -1)
	if (n <= 0) {
		fightRefs.delete(fightId)
		if (!on) LeekWars.socket.send([SocketMessage.FIGHT_PROGRESS_UNREGISTER, fightId])
	} else {
		fightRefs.set(fightId, n)
		if (on && n === 1) LeekWars.socket.send([SocketMessage.FIGHT_PROGRESS_REGISTER, fightId])
	}
}

/**
 * Met à jour en direct un historique de combats (page d'historique complète OU
 * petit historique des pages poireau/farmer/team).
 *
 * - S'abonne aux combats de l'entité regardée (HISTORY_REGISTER) : le serveur
 *   pousse 'history-update' dès qu'un combat impliquant l'entité apparaît ou se
 *   termine (même les combats d'un autre joueur).
 * - Anime la barre de progression des combats en génération (FIGHT_PROGRESS).
 * - Recharge (débouncé) via `reload` à chaque changement, avec un poll de
 *   secours tant qu'il reste des combats en génération.
 *
 * @param options.type   'farmer' | 'leek' | 'team'
 * @param options.id     getter de l'id de l'entité (peut être indéfini tant que chargé)
 * @param options.fights getter de la liste de combats affichée
 * @param options.reload recharge la liste (refetch)
 * @returns `progress` : map fightId -> pourcentage, à passer à <fights-history>
 */
export function useLiveHistory(options: {
	type: string
	id: () => number | undefined
	fights: () => Fight[] | undefined
	reload: () => void
}) {
	const progress = ref<Record<number, number>>({})
	const registered = new Set<number>()
	let currentId: number | undefined
	let reloadTimer: ReturnType<typeof setTimeout> | null = null
	let lastReload = 0
	let wasConnected = false
	let pollTimer: ReturnType<typeof setInterval> | null = null
	let destroyed = false

	// (Ré)abonne quand l'entité regardée change (chargement async, navigation A->B).
	function subscribeTo(id: number | undefined) {
		if (id === currentId) return
		if (currentId !== undefined) historyRef(options.type, currentId, false)
		currentId = id
		if (currentId !== undefined) historyRef(options.type, currentId, true)
	}

	// Abonne FIGHT_PROGRESS pour les combats en génération, désabonne les autres,
	// et (dé)marre le poll de secours.
	function syncProgress() {
		const fights = options.fights() || []
		const generating = new Set<number>()
		for (const f of fights) {
			if (f.status === 0) {
				generating.add(f.id)
				if (!registered.has(f.id)) {
					registered.add(f.id)
					if (!(f.id in progress.value)) progress.value[f.id] = 0
					fightRef(f.id, true)
				}
			}
		}
		for (const fid of registered) {
			if (!generating.has(fid)) {
				fightRef(fid, false)
				registered.delete(fid)
				delete progress.value[fid]
			}
		}
		if (generating.size > 0 && !pollTimer) {
			pollTimer = setInterval(() => { if (!destroyed) options.reload() }, 12000)
		} else if (generating.size === 0 && pollTimer) {
			clearInterval(pollTimer)
			pollTimer = null
		}
	}

	// Recharge immédiatement au premier événement (la génération peut être plus courte
	// que le debounce : sans ça la ligne "en génération" n'apparaîtrait jamais), puis
	// débounce la rafale suivante.
	function scheduleReload() {
		if (!reloadTimer && Date.now() - lastReload > 800) {
			lastReload = Date.now()
			options.reload()
			return
		}
		if (reloadTimer) clearTimeout(reloadTimer)
		reloadTimer = setTimeout(() => {
			reloadTimer = null
			lastReload = Date.now()
			if (!destroyed) options.reload()
		}, 800)
	}

	function onFightProgress(data: unknown[]) {
		const fightId = data[0] as number
		if (!registered.has(fightId)) return
		const percent = data[1] as number
		progress.value[fightId] = percent
		if (percent >= 100) scheduleReload()
	}

	function onHistoryUpdate() {
		scheduleReload()
	}

	// Reconnexion WS : le daemon a perdu nos abonnements, on les rétablit (envoi
	// brut idempotent côté daemon, sans toucher au comptage de références), et on
	// recharge la liste : des combats ont pu apparaître/finir pendant la coupure.
	// Pas de reload sur la connexion initiale (loadHistory est déjà en vol).
	function onWsConnected() {
		const code = HISTORY_TYPE[options.type]
		if (code !== undefined && currentId !== undefined) {
			LeekWars.socket.send([SocketMessage.HISTORY_REGISTER, code, currentId])
		}
		for (const fid of registered) {
			LeekWars.socket.send([SocketMessage.FIGHT_PROGRESS_REGISTER, fid])
		}
		if (wasConnected) scheduleReload()
		wasConnected = true
	}

	watch(options.id, subscribeTo, { immediate: true })
	watch(options.fights, syncProgress, { immediate: true })

	onMounted(() => {
		emitter.on('fight-progress', onFightProgress)
		emitter.on('history-update', onHistoryUpdate)
		emitter.on('wsconnected', onWsConnected)
	})
	onUnmounted(() => {
		destroyed = true
		emitter.off('fight-progress', onFightProgress)
		emitter.off('history-update', onHistoryUpdate)
		emitter.off('wsconnected', onWsConnected)
		if (currentId !== undefined) historyRef(options.type, currentId, false)
		if (reloadTimer) clearTimeout(reloadTimer)
		if (pollTimer) clearInterval(pollTimer)
		for (const fid of registered) fightRef(fid, false)
		registered.clear()
	})

	return { progress }
}
