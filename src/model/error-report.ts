import { Fragment } from 'vue'
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { createRepeatLimiter, isBrowserExtensionCrash, isChunkLoadError, isDeadObjectCrash, isDomCorruptionCrash, isInitOrderCrash } from './crash-classify'

// Cache-busted reload on Vite asset errors, with a cooldown to break out of
// refresh-on-every-click loops when the new bundle still errors.
const PRELOAD_RELOAD_KEY = 'vite-preload-reload-at'
const RELOAD_COOLDOWN = 60_000

function reloadWithCacheBust() {
	const now = Date.now()
	const last = parseInt(sessionStorage.getItem(PRELOAD_RELOAD_KEY) || '0', 10)
	if (now - last < RELOAD_COOLDOWN) return
	sessionStorage.setItem(PRELOAD_RELOAD_KEY, now.toString())
	const url = new URL(window.location.href)
	url.searchParams.set('_r', now.toString())
	window.location.replace(url.toString())
}

// Enregistre une erreur normalement avalée (bruit navigateur/cache, chunk périmé,
// annulation Monaco) en "masquée" côté serveur : loggée pour mesurer son volume mais
// sans issue GitHub ni notification admin, et exclue de la vue par défaut de #admin/errors.
// Throttle 1s indépendant des vraies erreurs pour ne pas s'auto-étouffer mutuellement.
let lastHiddenSent = 0
export function reportHidden(message: string, stack?: string) {
	if (LeekWars.DEV) return
	const now = Date.now()
	if (now - lastHiddenSent < 1000) return
	lastHiddenSent = now
	try {
		LeekWars.post('error/report', {
			error: message,
			stack: (stack || '(no stack)') + '\n\nOrigin: hidden',
			file: document.location.href,
			locale: i18n.locale,
			user_agent: navigator.userAgent,
			hidden: true,
			build_date: typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : null,
			build_commit: typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : null,
		})
	} catch { /* best effort */ }
}

// Les listeners globaux sont posés explicitement par le bootstrap (model/vue.ts) plutôt
// qu'en effet de bord de l'import : ce module est importé par des composants lazy, et un
// enregistrement au chargement les dupliquerait à chaque nouveau chunk.
export function installGlobalErrorHandlers() {

	window.addEventListener('vite:preloadError', (event) => {
		// Un preloadError pendant une navigation = chunk dynamique annulé par le navigateur
		// (surtout Firefox), PAS forcément un déploiement périmé : l'asset existe souvent
		// encore (HTTP 200). On ne recharge donc toute la page (#_r=) QUE si l'asset a vraiment
		// disparu (404 = vrai chunk périmé) ; sinon on laisse Vite/le routeur réessayer.
		// Le marqueur ":suppressed" mesure les rechargements intempestifs ainsi évités.
		// Le message est soit "...module: https://.../assets/x.js" (URL absolue, erreurs JS),
		// soit "Unable to preload CSS for /assets/x.css" (chemin relatif, erreurs CSS) : capter les deux.
		const message = (event as { payload?: { message?: string } })?.payload?.message || ''
		const assetUrl = message.match(/https?:\/\/\S+|\/[^\s'"]+\.(?:css|m?js)/)?.[0]
		if (!assetUrl) { reloadWithCacheBust(); return }
		fetch(assetUrl, { method: 'HEAD', cache: 'no-store' })
			.then(r => {
				if (r.ok) reportHidden('vite:preloadError:suppressed', message) // asset 200 → reload évité
				else reloadWithCacheBust()                                      // 404 → vrai stale → reload
			})
			.catch(() => reportHidden('vite:preloadError:suppressed', message + ' (head error)'))
	})

	// Erreurs hors canal Vue : throw dans un listener natif, un timer, ou un callback
	// post-flush que le scheduler Vue appelle SANS wrapper d'erreur. Historiquement seul le
	// bruit Monaco était traité ici : tout le reste était INVISIBLE (ni rapport, ni
	// recordEvent, ni récupération). Or la famille corruption-DOM (#4652, erreur 11807081)
	// naît d'un patch interrompu par un throw : l'arbre de vnodes garde des nœuds jamais
	// montés (el=null) et le re-render suivant crashe en nextSibling(null) — le crash
	// VISIBLE est donc le 2e ordre, et son throw racine peut fuir hors du canal Vue.
	// On route désormais tout vers reportVueError : trail de diagnostic complet, throttle,
	// et récupération hard-reload si le message est de la famille corruption-DOM.
	window.addEventListener('error', (event) => {
		// Monaco : survol de markers sur un éditeur disposé, bruit connu → masqué.
		if (event.error?.message?.includes('InstantiationService has been disposed')) {
			reportHidden(event.error.message, event.error.stack)
			event.preventDefault()
			return
		}
		// Erreur cross-origin opaque ("Script error.") ou événement sans Error attaché
		// (erreur de chargement de ressource) : volume mesuré en masqué, pas d'issue.
		if (!event.error) {
			if (event.message) { reportHidden('window: ' + event.message) }
			return
		}
		reportVueError(event.error, null, 'window-error', 'window')
	})

	// Rejets de promesse non gérés. Même logique que le listener 'error' global :
	// avant, seuls deux bruits Monaco étaient traités et tout le reste était invisible.
	window.addEventListener('unhandledrejection', (event) => {
		// Monaco : annulation normale au changement de fichier → masqué.
		if (event.reason?.message === 'Canceled' || event.reason?.message === 'Model not found') {
			reportHidden(event.reason.message, event.reason.stack)
			event.preventDefault()
			return
		}
		// Rejet non-Error (payload API, valeur brute) : mesuré en masqué, sans issue.
		if (!(event.reason instanceof globalThis.Error)) {
			let detail: string
			try { detail = JSON.stringify(event.reason)?.slice(0, 200) ?? String(event.reason) } catch { detail = '(unserializable)' }
			reportHidden('unhandledrejection: ' + detail)
			return
		}
		// Rejet de lecture média (HTMLMediaElement.play() sans catch, cf. model/audio.ts) :
		// autoplay bloqué, codec absent (crawlers headless), lecture interrompue. Attendu,
		// masqué — filet pour les sites d'appel qui n'utilisent pas playAudio (#11807436).
		const name = event.reason.name
		if (name === 'NotAllowedError' || name === 'NotSupportedError' || name === 'AbortError') {
			reportHidden('unhandledrejection: ' + event.reason, event.reason.stack)
			return
		}
		// Échec réseau banal (offline, requête annulée) : masqué, pas d'issue. Les échecs
		// de chunk (import() sans catch) passent au travers : reportVueError les classe
		// avec le même prédicat que le canal Vue (recordEvent 'chunk' + masqué).
		const m = event.reason.message || ''
		if (!isChunkLoadError(m) && (m.includes('NetworkError') || m.includes('Failed to fetch') || m.includes('Load failed'))) {
			reportHidden('unhandledrejection: ' + m, event.reason.stack)
			return
		}
		reportVueError(event.reason, null, 'unhandledrejection', 'window')
	})

}

let lastErrorSent = 0

// Instrumentation #4163 : tracer la SÉQUENCE d'erreurs (chunk/async-loader → cascade parentNode)
// et l'écart depuis le dernier bump routerViewKey (rustine), pour distinguer un PREMIER crash
// organique d'une cascade auto-induite par la rustine. Read-only, aucun changement de comportement.
let droppedSinceLastReport = 0
// Anti-flood par message répété (cf. crash-classify) : distinct du throttle 1 s ci-dessous,
// qui borne la CADENCE ; celui-ci borne un MÊME message qui se relance en boucle.
const repeatLimiter = createRepeatLimiter()
const recentEvents: { t: number, kind: string, msg: string }[] = []
export function recordEvent(kind: string, msg: unknown) {
	recentEvents.push({ t: Date.now(), kind, msg: String(msg ?? '').slice(0, 80) })
	if (recentEvents.length > 14) recentEvents.shift()
}

interface NavSnapshot {
	fullPath: string
	name: string | null
	at: number
}
let previousNav: NavSnapshot | null = null
let currentNav: NavSnapshot | null = null

// Alimenté par router.afterEach (bootstrap) : les deux dernières navigations sont jointes
// à chaque rapport de crash pour révéler les navs rapprochées/interrompues (#4163).
export function recordNavigation(fullPath: string, name: string | null) {
	previousNav = currentNav
	currentNav = { fullPath, name, at: Date.now() }
}

function describeRouteSubtree(instance: unknown): string | null {
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let node = (instance as any)?.subTree
		let depth = 0
		while (node && depth < 20) {
			const child = node.component
			if (child) {
				const t = child.type
				const name = t?.name || t?.__name || t?.__file || 'Anonymous'
				return name
			}
			node = node.children?.[0]
			depth++
		}
	} catch { /* empty */ }
	return null
}

// Pour les erreurs "parentNode is null" pendant un patch in-place de <RouterView>
// (ex. navigation /leek/A → /leek/B, cluster #4050-#4056) : la stack ne contient
// que des frames vendor (flush async du scheduler), donc Vue n'attribue que
// <RouterView> et le composant fautif reste invisible. On parcourt le sous-arbre
// de vnodes APRÈS l'erreur (lecture seule, aucun effet sur le rendu) pour nommer
// le chemin jusqu'au vnode dont `el` est null — le nœud réellement cassé.
function findNullElVnodePath(instance: unknown): string | null {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const label = (vn: any): string => {
		const t = vn?.type
		let base: string
		if (t == null) base = 'vnode'
		else if (typeof t === 'symbol') base = t.description || 'Fragment'
		else if (typeof t === 'string') base = t
		else base = t.name || t.__name || t.__file || 'Component'
		// La clé identifie la BRANCHE d'un v-if/v-else (le compilateur assigne key 0/1/…) :
		// indispensable pour savoir quelle branche du conditionnel est le nœud corrompu.
		return vn?.key != null ? base + '#' + String(vn.key) : base
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const visit = (vn: any, depth: number): string[] | null => {
		if (!vn || typeof vn !== 'object' || depth > 50) return null
		// Descendre dans le sous-arbre rendu d'un composant
		if (vn.component?.subTree) {
			const r = visit(vn.component.subTree, depth + 1)
			if (r) return [label(vn), ...r]
		}
		if (Array.isArray(vn.children)) {
			for (const c of vn.children) {
				if (c && typeof c === 'object' && 'type' in c) {
					const r = visit(c, depth + 1)
					if (r) return [label(vn), ...r]
				}
			}
		}
		// Un patch interrompu (throw pendant unmount/mount d'une branche) laisse dans
		// dynamicChildren des vnodes JAMAIS montés, parfois absents de `children`
		// (blocs optimisés). Même descente que children ; le préfixe dyn: signale que
		// le nœud n'était atteignable que par le bloc optimisé (#4652).
		if (Array.isArray(vn.dynamicChildren)) {
			for (const c of vn.dynamicChildren) {
				if (c && typeof c === 'object' && 'type' in c) {
					const r = visit(c, depth + 1)
					if (r) return [label(vn), 'dyn:' + r[0], ...r.slice(1)]
				}
			}
		}
		// Un vnode élément/composant monté doit porter un `el`. On ignore les
		// Fragment/Text/Comment (type = symbol) qui peuvent légitimement avoir un
		// el null/anchor.
		if (vn.el == null && typeof vn.type !== 'symbol') return [label(vn) + '(el=null)']
		// Un Fragment monté porte el (ancre de début) ET anchor (ancre de fin) : l'un ou
		// l'autre null = corruption, c'est le nœud qui fait crasher nextSibling(anchor || el)
		// au patch (#4623).
		if (vn.type === Fragment && (vn.el == null || vn.anchor == null)) {
			const which = vn.el == null && vn.anchor == null ? 'el+anchor' : vn.el == null ? 'el' : 'anchor'
			return [label(vn) + '(' + which + '=null)']
		}
		return null
	}
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const root = (instance as any)?.subTree
		const path = root ? visit(root, 0) : null
		return path ? path.join(' › ') : null
	} catch { return null }
}

// Crawlers connus (Baiduspider-render, Googlebot… #11807436) : environnements headless
// dégradés, erreurs non actionnables → leurs rapports partent en masqué. Propriété de
// session (UA constant), évaluée une fois. Les génériques spider/crawler couvrent les
// variantes (Baiduspider, Bytespider…) ; pas de /bot/i nu, qui matcherait des UA réels
// (téléphones Cubot). À terme, cette classification aurait sa place côté serveur dans
// ErrorController::shouldIgnoreClientError (couvre tous les canaux, modifiable à chaud).
const IS_BOT = /googlebot|bingbot|yandex|duckduckbot|slurp|sogou|petalbot|semrush|ahrefs|applebot|facebookexternalhit|headlesschrome|crawler|spider/i.test(navigator.userAgent)

// Empreintes DOM d'interférence externe (moteurs de traduction, extensions), collées aux
// rapports de crash de la famille corruption-DOM (nextSibling/parentNode/insertBefore null).
// Les navigateurs interdisent d'énumérer les extensions : on détecte donc leurs artefacts
// injectés. Le but est de CONFIRMER en prod que ce cluster corrèle avec la traduction et de
// quantifier sa part. On dumpe tous les attributs de <html> (capture les marqueurs inconnus,
// ex. Firefox natif) plutôt que de hardcoder une liste.
// `translation` = un moteur de traduction (Google Translate, Firefox Translations…) est
// actif : marqueur qui prouve que le crash de patch est induit de l'extérieur, donc
// irréparable côté app. On s'en sert pour masquer ces rapports (voir reportVueError).
function detectDOMInterference(): { text: string, translation: boolean } {
	try {
		const signals: string[] = []
		let translation = false
		const html = document.documentElement
		// Google Translate : classe translated-ltr/rtl + DOM du widget.
		if (/\btranslated-(ltr|rtl)\b/.test(html.className || '')) { signals.push('google-translate'); translation = true }
		if (document.querySelector('.goog-te-banner-frame, #goog-gt-tt, ins.skiptranslate')) { signals.push('goog-te-dom'); translation = true }
		// <font> dans #app : signature d'un moteur de traduction (l'app n'en rend jamais).
		const app = document.getElementById('app')
		const fonts = app ? app.getElementsByTagName('font').length : 0
		if (fonts) { signals.push('font-nodes=' + fonts); translation = true }
		// Extensions invasives connues qui muteraient le DOM.
		if (document.querySelector('grammarly-extension, grammarly-desktop-integration')) signals.push('grammarly')
		if (document.querySelector('style.darkreader, style#dark-reader-style')) signals.push('darkreader')
		// Attributs bruts de <html> : capte les marqueurs non anticipés (translate, lang forcé, etc.).
		const attrs = Array.from(html.attributes)
			.map(a => a.name + (a.value ? '="' + a.value.substring(0, 60) + '"' : ''))
			.join(' ')
		const text = '\n\nDOM interference: ' + (signals.length ? signals.join(' ') : 'no known marker') + '\nhtml attrs: ' + attrs
		return { text, translation }
	} catch (ex) {
		return { text: '\n\nDOM interference: [detection failed: ' + (ex as Error).message + ']', translation: false }
	}
}

export function reportVueError(err: unknown, vm: unknown, info: unknown, origin: string = 'main') {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const e = err as any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const vmAny = vm as any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const infoAny = info as any

	if (LeekWars.DEV) return

	const message = e?.message || ''
	// Famille corruption-DOM : évaluée une seule fois, sert au diagnostic Null-el path,
	// aux signaux d'interférence externe et à la récupération par hard-reload.
	const isCorruption = isDomCorruptionCrash(message)
	// Familles dont la cause probable est externe (moteur de traduction / extension) :
	// corruption-DOM (patch sur un el null) ET ordre d'init/TDZ (import statique en TDZ alors
	// qu'aucun cycle d'import inter-chunks n'existe → impossible sans réévaluation externe du
	// contexte page).
	const externallyInduced = isCorruption || isInitOrderCrash(message)

	// Familles connues non actionnables : loggées en masqué (volume mesuré, ni issue GitHub ni
	// notification admin), le suffixe nommant la famille dans le rapport.
	const hide = (kind: string, suffix = '') => {
		recordEvent(kind, message)
		reportHidden((message || String(e)) + suffix, e?.stack)
	}

	// Crash entièrement contenu dans une extension du navigateur (cf. crash-classify).
	// Branché AVANT la mémorisation de la première erreur de session : sinon un rejet
	// d'extension prend la place `lw_first_crash` et se fait passer, dans tous les rapports
	// suivants de la session, pour le corrupteur racine que traque l'instrumentation #4163.
	// Exception, les familles à cause externe probable : elles gardent le traitement COMPLET
	// même sur une stack d'extension, car c'est précisément le throw externe qu'elles cherchent
	// et lui seul déclenche le diagnostic d'interférence et la récupération par hard reload.
	// Prédicats de message d'abord : ils tranchent sans scanner la stack.
	if (!externallyInduced && isBrowserExtensionCrash(e?.stack || '')) {
		hide('extension', ' [browser extension]')
		return
	}

	// Objet mort Firefox (cf. crash-classify) : même famille « script injecté », mais sans stack
	// à opposer — donc branché juste après, et pareillement avant la mémorisation du premier
	// crash de session, pour ne pas usurper la place du corrupteur racine dans l'instrumentation.
	if (!externallyInduced && isDeadObjectCrash(message, e?.stack || '')) {
		hide('dead-object', ' [dead object]')
		return
	}

	// Instrumentation v2 (#4163) : mémoriser LA première erreur de la session (corrupteur
	// racine d'un el null) en sessionStorage — le buffer roule et la perd. Capturée pour TOUT
	// type d'erreur (y compris chunk/async-loader) et réinjectée dans chaque rapport complet.
	let firstCrashTrace = ''
	try {
		const stored = sessionStorage.getItem('lw_first_crash')
		if (!stored) {
			sessionStorage.setItem('lw_first_crash', JSON.stringify({
				m: (message || String(e)).slice(0, 100), info: String(infoAny),
				route: currentNav?.fullPath || null, prev: previousNav?.fullPath || null,
				sinceNav: currentNav ? Date.now() - currentNav.at : null, at: Date.now(),
			}))
		} else {
			const f = JSON.parse(stored)
			firstCrashTrace = '\n\nFirst crash this session (' + (Date.now() - f.at) + 'ms ago): ' + f.m +
				' | info=' + f.info + ' | route=' + f.route + ' prev=' + f.prev + ' sinceNav=' + f.sinceNav + 'ms'
		}
	} catch { /* empty */ }

	// Échecs de chargement de chunk/CSS : loggés en masqué SANS recharger, la récupération
	// après déploiement est gérée par le handler `vite:preloadError` (HEAD-checké) qui fire
	// pour le même échec et ne recharge que sur un vrai 404.
	if (isChunkLoadError(message)) {
		hide('chunk')
		return
	}

	// runtime-13 = ASYNC_COMPONENT_LOADER : sur un échec de chunk, le handler vite:preloadError
	// gère déjà la récup ; sur un vrai throw de composant, recharger ne sert à rien (boucle). On logge.
	if (infoAny?.includes?.('runtime-13')) {
		hide('async-loader', ' [' + infoAny + ']')
		return
	}

	if (!repeatLimiter.shouldReport(message)) {
		droppedSinceLastReport++
		recordEvent('repeat', message)
		return
	}

	if (Date.now() - lastErrorSent < 1000) {
		droppedSinceLastReport++
		recordEvent('dropped', message)
		return
	}
	lastErrorSent = Date.now()
	recordEvent('crash', message)

	let errorBody: string
	try {
		errorBody = message || (e && typeof e === 'object' ? JSON.stringify(e) : String(e))
	} catch {
		errorBody = String(e)
	}
	const error = (e?.name || 'Error') + ": " + errorBody
	const file = document.location.href
	const locale = i18n.locale
	const user_agent = navigator.userAgent

	let componentTrace = ''
	let routeSubtree: string | null = null
	let nullElPath: string | null = null
	try {
		if (vmAny) {
			const components: string[] = []
			// errorCaptured passes a public proxy (.$ → internal instance); app.config.errorHandler
			// passes the internal instance directly. Handle both.
			let instance = vmAny.$ || vmAny
			const leafInstance = instance
			while (instance && components.length < 100) {
				const name = instance.type?.name || instance.type?.__name || 'Anonymous'
				const propsDef = instance.type?.props
				let propsStr = ''
				if (propsDef && instance.props) {
					const parts: string[] = []
					const keys = Array.isArray(propsDef) ? propsDef : Object.keys(propsDef)
					for (const key of keys) {
						const val = instance.props[key]
						if (val !== undefined && val !== null && val !== false) {
							let s: string
							if (typeof val === 'object') {
								s = Array.isArray(val) ? '[Array(' + val.length + ')]' : '[Object]'
							} else {
								s = String(val).substring(0, 50)
							}
							parts.push(key + '=' + s)
						}
					}
					if (parts.length) propsStr = ' ' + parts.join(' ')
				}
				components.push('<' + name + propsStr + '>')
				instance = instance.parent
			}
			componentTrace = '\n\nComponent: ' + components[0] + '\nHierarchy: ' + components.join(' → ')
			// For RouterView/Anonymous-rooted errors, expose the actual route component being patched.
			const leafName = leafInstance?.type?.name || leafInstance?.type?.__name
			if (leafName === 'RouterView' || !leafName) {
				routeSubtree = describeRouteSubtree(leafInstance)
			}
			// Erreurs de patch de la famille corruption-DOM (cluster #4050-#4056) : pointer le
			// vnode cassé quel que soit le composant attribué (un crash nextSibling peut être
			// attribué à la page elle-même, ex. <Leek> #4623). « (none found) » = l'arbre semble
			// intact au moment du rapport (corruption transitoire ou ancre de Fragment).
			if (isCorruption) {
				nullElPath = findNullElVnodePath(leafInstance) || '(none found)'
			}
		}
	} catch (ex) {
		componentTrace = '\n\n[Component trace failed: ' + (ex as Error).message + ']'
	}

	let navTrace = ''
	try {
		const lines: string[] = []
		if (currentNav) lines.push('Route: ' + currentNav.fullPath + (currentNav.name ? ' [' + currentNav.name + ']' : ''))
		if (previousNav) lines.push('Previous route: ' + previousNav.fullPath + (previousNav.name ? ' [' + previousNav.name + ']' : ''))
		if (currentNav) lines.push('Since last navigation: ' + (Date.now() - currentNav.at) + 'ms')
		// Écart entre les 2 dernières navs : un gap minuscule = double-nav rapprochée
		// (interruption probable de la nav précédente pendant son démontage).
		if (currentNav && previousNav) lines.push('Gap prev→current nav: ' + (currentNav.at - previousNav.at) + 'ms')
		if (routeSubtree) lines.push('Route subtree: <' + routeSubtree + '>')
		if (nullElPath) lines.push('Null-el path: ' + nullElPath)
		if (lines.length) navTrace = '\n\n' + lines.join('\n')
	} catch { /* empty */ }

	let instrTrace = ''
	try {
		const now = Date.now()
		const lastReload = parseInt(sessionStorage.getItem('parentNode-reload-at') || '0', 10)
		const reloadAge = lastReload ? (now - lastReload) + 'ms' : 'never'
		const seq = recentEvents.map(ev => ev.kind + ' +' + (now - ev.t) + 'ms' + (ev.msg ? ' ' + ev.msg : '')).join('\n  ')
		instrTrace = '\n\nSince last auto-reload: ' + reloadAge +
			'\nDropped since last report: ' + droppedSinceLastReport +
			'\nRecent events (oldest→newest):\n  ' + seq
		droppedSinceLastReport = 0
	} catch { /* empty */ }

	// Signaux d'interférence DOM externe pour les familles à cause externe probable (moteur de
	// traduction / extension) : on leur attache le diagnostic, et on les masque plus bas si une
	// traduction est active.
	const interference = externallyInduced ? detectDOMInterference() : { text: '', translation: false }
	const domInterference = interference.text

	const stack = (e?.stack || '(no stack)') + '\n\nOrigin: ' + origin + '\nVue info: ' + infoAny + componentTrace + navTrace + instrTrace + domInterference + firstCrashTrace
	const build_date = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : null
	const build_commit = typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : null
	// Crash (patch DOM ou TDZ d'import) AVEC un moteur de traduction actif (goog-te-dom, <font>
	// injectés…) : induit de l'extérieur, irréparable côté app. On le logge en MASQUÉ (hidden) pour
	// mesurer son volume sans créer d'issue GitHub ni noyer #admin/errors. Sans marqueur de traduction,
	// on garde le rapport complet : un nextSibling/parentNode null « nu » peut être un vrai bug de
	// patch, un TDZ « nu » une vraie régression de bundling (cycle d'import réintroduit).
	const hidden = (externallyInduced && interference.translation) || IS_BOT
	LeekWars.post('error/report', { error, stack, file, locale, user_agent, build_date, build_commit, hidden })

	// Récupération après corruption de l'arbre de vnodes (un el devenu null : Vue re-render
	// fait alors parentNode/nextSibling/style(null) → crash, et la session crashe en BOUCLE).
	// Le reset par routerViewKey++ (essayé 06/2026) NE RÉCUPÈRE PAS : observé en prod via
	// l'instrumentation #4163, la session crashe en boucle 4+ min malgré les bumps. On revient
	// au HARD RELOAD (le comportement d'avant le 11/06), qui repart d'un arbre Vue sain. Délai
	// court pour laisser le POST error/report partir ; cooldown 30s anti-boucle de reload.
	if (isCorruption) {
		const RELOAD_KEY = 'parentNode-reload-at'
		const last = parseInt(sessionStorage.getItem(RELOAD_KEY) || '0', 10)
		if (Date.now() - last > 30_000) {
			recordEvent('reload', '')
			sessionStorage.setItem(RELOAD_KEY, Date.now().toString())
			setTimeout(() => location.reload(), 400)
		}
	}
}
