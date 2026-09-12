// Classification des crashs JS par famille, d'après leur message ou leur stack. Prédicats purs
// (pas d'accès au DOM ni à l'app) : extraits de model/vue.ts, qui importe une vingtaine de
// composants et ne peut donc pas être chargé dans un test. Ils pilotent le diagnostic et la
// récupération dans reportVueError — leur donner un test évite qu'un motif disparaisse en silence.

// Corruption de l'arbre de vnodes de Vue (el/anchor/instance devenus null pendant le patch,
// cause probable moteur de traduction/extension qui mute le DOM). Une seule définition,
// partagée par le diagnostic ET la récupération par hard reload, pour éviter que les deux
// listes de motifs divergent.
export function isDomCorruptionCrash(m: string): boolean {
	return m.includes('parentNode') || m.includes('nextSibling') ||
		m.includes("reading 'style'") || m.includes('property "style"') || m.includes("reading 'el'") ||
		m.includes("reading 'insertBefore'") || m.includes('"insertBefore"') || m.includes('emitsOptions')
}

// Crash d'ordre d'initialisation (TDZ) : accès à une liaison `const`/import avant son
// initialisation. Un message par moteur — V8 et Firefox nomment la liaison, JSC (donc Safari
// et TOUS les navigateurs iOS, Chrome/CriOS compris) émet un message générique sans nom.
// Le rendu d'une page référence un import statique de composant (ex. <Conversation> dans
// messages.vue) qui remonte TDZ. Or nos bundles n'ont pas de cycle d'import inter-chunks : un
// import statique ne PEUT donc pas être en TDZ pour un moteur conforme sur un graphe sain.
// Quand ça arrive quand même (observé sur Safari iOS), la cause est probablement externe — un
// moteur de traduction / une extension qui réévalue ou mute le contexte de la page. Traité
// comme la famille corruption DOM : diagnostic d'interférence attaché, masqué si traduction
// active (voir reportVueError). Attention, le motif JSC étant générique, il matche aussi un
// vrai TDZ applicatif (cycle d'import intra-chunk, `this` avant `super()`) : un rapport iOS
// sans marqueur de traduction reste donc à prendre au sérieux. #11820505
export function isInitOrderCrash(m: string): boolean {
	return m.includes('before initialization') || m.includes('uninitialized variable')
}

// Crash né DANS une extension de navigateur, reconnu à ses scripts (chrome-extension:// sur
// Chromium, moz-extension:// sur Firefox, safari-web-extension:// sur Safari, qui masque en
// webkit-masked-url:// l'URL des scripts qu'il injecte depuis 16.4).
// Cas réel : une extension qui wrappe XMLHttpRequest crashe dans son
// propre onreadystatechange et le rejet remonte en unhandledrejection dans la page (`reading
// 'M_ID'`, 342 rapports d'un seul joueur, erreur #11832526 / issue #4787). Rien d'actionnable
// côté app → rapport masqué, le seul canal où ça se décide étant reportVueError. Le pendant
// serveur, modifiable à chaud si le volume dérape avant que les builds périmés ne tournent,
// est ErrorController::shouldIgnoreClientError, qui reçoit message ET stack.
// On raisonne sur les FRAMES (URL suivie de :ligne:colonne) des DEUX côtés, jamais sur la ligne
// de message où une URL citée ne prouve rien : un message d'extension mentionne très souvent une
// URL du site (« Failed to fetch https://leekwars.com/api/… ») et sur V8 une stack sans frames
// N'EST que cette ligne de message.
const EXTENSION_FRAME = /\b(?:(?:chrome|moz|safari-web)-extension|webkit-masked-url):\/\/\S*:\d+:\d+/i
const PAGE_FRAME = /\bhttps?:\/\/\S*:\d+:\d+/i

// Forme d'une ligne de frame : `at <fn> (<url>:l:c)` sur V8, `<fn>@<url>:l:c` sur Firefox et
// WebKit. Exigée pour que la ligne de MESSAGE reste hors du raisonnement même quand elle cite une
// URL suivie de :ligne:colonne — Monaco relance ses erreurs en `new Error(message + '\n\n' +
// stack)`, la stack d'origine se retrouvant alors dans le message de celle qui remonte.
const FRAME_LINE = /^\s*at\s|@\S*:\d+:\d+/

// Le throw a-t-il eu lieu DANS un script d'extension ? On cherche le SITE DU THROW, c'est-à-dire
// la frame identifiable la plus haute — les suivantes ne sont que ses appelants, et les frames
// sans script nommé (`at Array.forEach (<anonymous>)`, marqueurs asynchrones Firefox `promise
// callback*`) ne désignent personne. Une stack mixte ne dit rien par sa seule composition :
// l'extension peut envelopper notre code (page → wrapper → notre code qui casse : bug à nous,
// rapport visible) comme être appelée par lui (notre dispatch de websocket → listener d'extension
// qui casse : rien d'actionnable). Seule la position tranche. Cas réel de la 2e forme : le
// userscript Better-LeekWars, branché sur nos événements, construit un PointerEvent avec un `view`
// d'un autre realm — Firefox refuse, en boucle sur un onglet du Potager laissé ouvert (erreur
// #11884235 / issue #5049). Perte assumée de la règle : une extension qui monkeypatche une API
// native et casse sur un argument que NOUS lui passons mal est désormais masquée — le site du
// throw est chez elle, et l'app ne peut de toute façon pas corriger son code.
export function isBrowserExtensionCrash(stack: string): boolean {
	for (const line of stack.split('\n')) {
		if (!FRAME_LINE.test(line)) continue
		if (EXTENSION_FRAME.test(line)) return true
		if (PAGE_FRAME.test(line)) return false
	}
	return false
}

// Firefox : accès à un wrapper d'objet MORT (objet d'un compartiment détruit — document ou
// fenêtre disparus). Arrive par window.onerror avec un Error dont la `stack` est vide, en
// boucle d'une fois par seconde pendant des heures sur un onglet oublié (1411 rapports en deux
// jours pour deux joueurs, erreur #11847400 / issue #4856). Aucun code de la page ne peut
// détenir un objet mort — le site n'a pas d'iframe de même origine — donc la source est un
// script injecté ; sans stack, isBrowserExtensionCrash ne peut pas le prouver. On classe donc
// sur le message, et seulement tant que la stack ne cite AUCUNE frame de la page : une seule
// suffirait à faire de ce rapport un bug applicatif, à voir. Règle propre à cette famille — sans
// stack, il n'y a pas de site du throw à opposer comme le fait isBrowserExtensionCrash.
export function isDeadObjectCrash(m: string, stack: string): boolean {
	return m.includes('access dead object') && !PAGE_FRAME.test(stack)
}

// Échec de chargement de chunk/CSS (Chrome: "Failed to fetch...", Firefox: "error loading...",
// WebKit: "Importing a module script failed." — donc Safari et TOUS les navigateurs iOS, dont
// Chrome/CriOS ; sa formulation manquait, ces échecs remontaient en rapport visible sans stack
// ni route exploitables au lieu d'être masqués comme les autres, erreur #11849252 / issue #4862).
// Prédicat partagé entre le canal Vue (reportVueError) et le handler unhandledrejection,
// pour qu'un même échec d'import() soit classé pareil quel que soit le canal d'arrivée.
export function isChunkLoadError(m: string): boolean {
	return m.includes('Failed to fetch dynamically imported module') ||
		m.includes('error loading dynamically imported module') ||
		m.includes('Importing a module script failed') ||
		m.includes('Loading chunk') ||
		m.includes('Loading CSS chunk') ||
		m.includes('Unable to preload CSS')
}

// Un événement du DOM lancé ou rejeté à la place d'une Error. Monaco fait exactement ça : quand un
// de ses workers échoue (chargement du chunk du worker, crash interne), webWorkerFactory transmet
// l'ErrorEvent BRUT à onUnexpectedError, dont le handler par défaut le relance tel quel depuis un
// setTimeout dès qu'il n'a pas de `.stack` — un Event n'en a jamais. Un Event n'a pas non plus de
// `.message`, et ses champs sont des accesseurs de prototype que JSON.stringify ignore : le rapport
// se réduisait à `Error: {"isTrusted":true}`, sans stack ni rien d'exploitable (#4985). Reconnu par
// sa FORME plutôt que par `instanceof Event`, qui échoue sur un événement venu d'un autre realm —
// et sur `type` + les méthodes de l'interface, pas sur `isTrusted` que tous les moteurs n'exposent
// pas, pour ne pas confondre avec un objet métier qui aurait lui aussi un champ `type`.
// Un Event lancé n'est jamais un bug de l'app — c'est un échec de ressource (worker, script, média)
// relayé tel quel : on le masque, là où un autre non-Error (une string lancée par notre code) garde
// le rapport complet et sa trace de navigation.
interface EventLike { type: string, target?: unknown, message?: unknown, filename?: unknown, lineno?: unknown, colno?: unknown }
export function isDomEvent(value: unknown): value is EventLike {
	if (!value || typeof value !== 'object') return false
	const ev = value as { type?: unknown, preventDefault?: unknown, stopPropagation?: unknown }
	return typeof ev.type === 'string' && typeof ev.preventDefault === 'function' && typeof ev.stopPropagation === 'function'
}

// Nom de classe : `ErrorEvent` plutôt qu'`Event` pour l'événement, `Worker` pour sa cible.
function className(value: unknown): string | undefined {
	return (value as { constructor?: { name?: string } } | null)?.constructor?.name
}

// Décrit une valeur lancée ou rejetée qui n'est PAS une Error, pour un rapport lisible : un Event
// est nommé explicitement (type, classe de la cible, message/fichier s'il en porte comme un
// ErrorEvent), tout le reste retombe sur JSON.stringify. Borné à 200 caractères des deux côtés, le
// message que porte un ErrorEvent étant celui d'une exception quelconque, donc de longueur libre.
export function describeNonError(value: unknown): string {
	try {
		if (isDomEvent(value)) {
			const parts = [value.type]
			// La cible nomme le sous-système fautif : `on Worker` pour un worker Monaco.
			const target = className(value.target)
			if (target) parts.push('on ' + target)
			if (typeof value.message === 'string' && value.message) parts.push(value.message)
			if (typeof value.filename === 'string' && value.filename) parts.push(value.filename + ':' + value.lineno + ':' + value.colno)
			return ((className(value) || 'Event') + '(' + parts.join(' ') + ')').slice(0, 200)
		}
		return JSON.stringify(value)?.slice(0, 200) ?? String(value)
	} catch {
		return '(unserializable)'
	}
}

/**
 * Limiteur d'un même message répété. Une session bloquée sur une erreur qui se
 * relance en boucle inonde #admin/errors sans rien apprendre de plus : une session
 * Firefox coincée sur « can't access dead object » (un crash toutes les ~1000 ms,
 * donc juste au-dessus du throttle global de 1 s) a produit à elle seule ~1300
 * rapports. On garde les occurrences dont le rang est une puissance de 2 — 1re, 2e,
 * 4e, 8e… — ce qui préserve le signal « ça recommence » en coupant le volume. Le
 * compte réel reste visible via « Dropped since last report » dans le rapport.
 *
 * Fabrique plutôt que singleton : les tests ont besoin d'un état neuf.
 */
export function createRepeatLimiter(maxDistinctMessages = 200) {
	const counts = new Map<string, number>()
	return {
		shouldReport(message: string): boolean {
			const key = (message || '').slice(0, 120)
			const count = (counts.get(key) ?? 0) + 1
			counts.set(key, count)
			// Garde-fou mémoire : une session très longue peut voir beaucoup de messages distincts
			if (counts.size > maxDistinctMessages) counts.clear()
			return (count & (count - 1)) === 0
		}
	}
}
