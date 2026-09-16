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

// Crash né DANS une extension de navigateur : les frames ne citent que des scripts d'extension
// (chrome-extension:// sur Chromium, moz-extension:// sur Firefox, safari-web-extension:// sur
// Safari, qui masque en webkit-masked-url:// l'URL des scripts qu'il injecte depuis 16.4) et
// aucun script de la page. Cas réel : une extension qui wrappe XMLHttpRequest crashe dans son
// propre onreadystatechange et le rejet remonte en unhandledrejection dans la page (`reading
// 'M_ID'`, 342 rapports d'un seul joueur, erreur #11832526 / issue #4787). Rien d'actionnable
// côté app → rapport masqué, le seul canal où ça se décide étant reportVueError. Le pendant
// serveur, modifiable à chaud si le volume dérape avant que les builds périmés ne tournent,
// est ErrorController::shouldIgnoreClientError, qui reçoit message ET stack.
// On raisonne sur les FRAMES (URL suivie de :ligne:colonne) des DEUX côtés, jamais sur la ligne
// de message où une URL citée ne prouve rien : un message d'extension mentionne très souvent une
// URL du site (« Failed to fetch https://leekwars.com/api/… ») et sur V8 une stack sans frames
// N'EST que cette ligne de message. Une seule frame de la page rend le rapport visible : une
// stack MIXTE est un bug applicatif simplement traversé par un wrapper d'extension.
const EXTENSION_FRAME = /\b(?:(?:chrome|moz|safari-web)-extension|webkit-masked-url):\/\/\S*:\d+:\d+/i
const PAGE_FRAME = /\bhttps?:\/\/\S*:\d+:\d+/i

export function isBrowserExtensionCrash(stack: string): boolean {
	// Frame de page d'abord : elle tranche dès la première frame sur un crash applicatif, alors
	// que l'alternation d'extensions, elle, parcourt toute la stack avant d'échouer.
	return !PAGE_FRAME.test(stack) && EXTENSION_FRAME.test(stack)
}

// Échec de chargement de chunk/CSS (Chrome: "Failed to fetch...", Firefox: "error loading...").
// Prédicat partagé entre le canal Vue (reportVueError) et le handler unhandledrejection,
// pour qu'un même échec d'import() soit classé pareil quel que soit le canal d'arrivée.
export function isChunkLoadError(m: string): boolean {
	return m.includes('Failed to fetch dynamically imported module') ||
		m.includes('error loading dynamically imported module') ||
		m.includes('Loading chunk') ||
		m.includes('Loading CSS chunk') ||
		m.includes('Unable to preload CSS')
}
