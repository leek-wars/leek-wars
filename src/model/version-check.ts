import { LeekWars } from '@/model/leekwars'

// Un onglet ouvert garde l'ancien bundle indéfiniment (SPA, pas de rechargement) : après un
// déploiement, il tourne avec du code potentiellement incompatible avec l'API (#4478). On
// re-télécharge périodiquement index.html (servi en no-cache) et on compare le hash du bundle
// main-*.js référencé avec celui actuellement chargé ; s'ils diffèrent, une nouvelle version
// est en prod et la snackbar d'app.vue invite à recharger.

const CHECK_INTERVAL = 15 * 60 * 1000
const TICK = 60 * 1000
const MAIN_BUNDLE = /\/assets\/main-[\w-]+\.js/

export function extractMainBundle(html: string): string | null {
	const match = html.match(MAIN_BUNDLE)
	return match ? match[0] : null
}

function loadedBundle(): string | null {
	for (const script of Array.from(document.querySelectorAll('script[src]'))) {
		const bundle = extractMainBundle(script.getAttribute('src')!)
		if (bundle) { return bundle }
	}
	return null // dev (vite) : pas de bundle hashé, détection désactivée
}

let lastCheck = 0
let found = false

async function check(current: string) {
	lastCheck = Date.now()
	try {
		// ?no-sw : le service worker laisse la requête aller au réseau (sinon son
		// stale-while-revalidate peut servir un index.html en cache et retarder la détection)
		const response = await fetch('/?no-sw=1', { cache: 'no-store' })
		if (!response.ok) { return }
		const fresh = extractMainBundle(await response.text())
		if (fresh && fresh !== current) {
			found = true
			LeekWars.newVersionPopup = true
		}
	} catch { /* hors-ligne ou erreur réseau : on réessaiera au prochain tick */ }
}

export function startVersionCheck() {
	const current = loadedBundle()
	if (!current) { return }
	lastCheck = Date.now() // le bundle vient d'être chargé, il est à jour
	const tick = () => {
		if (!found && document.visibilityState === 'visible' && Date.now() - lastCheck >= CHECK_INTERVAL) {
			check(current)
		}
	}
	setInterval(tick, TICK)
	// Retour sur un onglet resté longtemps caché : vérifier sans attendre le prochain tick
	document.addEventListener('visibilitychange', tick)
}
