import { describe, it, expect } from 'vitest'
import { createRepeatLimiter, describeNonError, isBrowserExtensionCrash, isChunkLoadError, isDeadObjectCrash, isDomCorruptionCrash, isDomEvent, isInitOrderCrash } from './crash-classify'

describe('isInitOrderCrash', () => {

	// Un message par moteur : la formulation JSC est la seule sans nom de liaison, et c'est
	// aussi la seule plateforme où la famille a réellement été observée (#11820505).
	it('reconnaît le TDZ de chaque moteur', () => {
		expect(isInitOrderCrash("Cannot access 'Ge' before initialization")).toBe(true)
		expect(isInitOrderCrash("can't access lexical declaration 'x' before initialization")).toBe(true)
		expect(isInitOrderCrash('Cannot access uninitialized variable.')).toBe(true)
	})

	it('ignore les messages d\'autres familles', () => {
		expect(isInitOrderCrash('Cannot read properties of null (reading \'parentNode\')')).toBe(false)
		expect(isInitOrderCrash('Failed to fetch dynamically imported module')).toBe(false)
		expect(isInitOrderCrash('')).toBe(false)
	})
})

describe('isDomCorruptionCrash', () => {

	it('reconnaît les crashs de patch sur un vnode corrompu', () => {
		expect(isDomCorruptionCrash("Cannot read properties of null (reading 'parentNode')")).toBe(true)
		expect(isDomCorruptionCrash("null is not an object (evaluating 'e.nextSibling')")).toBe(true)
		expect(isDomCorruptionCrash("Cannot read properties of null (reading 'insertBefore')")).toBe(true)
		expect(isDomCorruptionCrash('emitsOptions')).toBe(true)
	})

	it('ne confond pas avec un TDZ', () => {
		expect(isDomCorruptionCrash('Cannot access uninitialized variable.')).toBe(false)
	})
})

describe('isChunkLoadError', () => {

	it('reconnaît les échecs de chargement de chunk/CSS', () => {
		expect(isChunkLoadError('Failed to fetch dynamically imported module: https://leekwars.com/assets/x.js')).toBe(true)
		expect(isChunkLoadError('error loading dynamically imported module')).toBe(true)
		expect(isChunkLoadError('Importing a module script failed.')).toBe(true)
		expect(isChunkLoadError('Unable to preload CSS for /assets/x.css')).toBe(true)
	})

	// Les trois familles pilotent des branches différentes de reportVueError : un message ne
	// doit jamais matcher deux prédicats, sinon l'ordre des branches décide seul du traitement.
	it('ne recouvre pas les autres familles', () => {
		expect(isChunkLoadError('Cannot access uninitialized variable.')).toBe(false)
		expect(isChunkLoadError("Cannot read properties of null (reading 'parentNode')")).toBe(false)
	})
})

describe('isBrowserExtensionCrash', () => {

	// La stack réelle de l'erreur #11832526 : les deux frames sont dans l'extension.
	it('reconnaît la stack de l\'extension qui wrappe XMLHttpRequest', () => {
		expect(isBrowserExtensionCrash(`TypeError: Cannot read properties of undefined (reading 'M_ID')
    at F (chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/executors/200.js:1:761)
    at XMLHttpRequest.onreadystatechange (chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/executors/200.js:1:2598)`)).toBe(true)
	})

	// Un schéma par moteur, et sans ligne de message en tête pour Firefox/WebKit, qui n'en
	// mettent pas : chaque alternative de la regex doit être couverte, sinon elle peut
	// disparaître ou se faire mal orthographier sans qu'un test ne tombe.
	it('reconnaît les schémas d\'extension de chaque moteur', () => {
		expect(isBrowserExtensionCrash('f@moz-extension://abc/content.js:2:9')).toBe(true)
		expect(isBrowserExtensionCrash('f@safari-web-extension://abc/injected.js:2:9')).toBe(true)
		// Safari ≥ 16.4 masque l'URL des scripts qu'il injecte.
		expect(isBrowserExtensionCrash('f@webkit-masked-url://hidden/:1:2')).toBe(true)
	})

	// Le cas qui décide de tout pour la famille XHR : le message d'une extension cite très
	// souvent une URL du site. Seules les FRAMES comptent, pas les URL citées.
	it('ignore les URL du site citées dans le message', () => {
		expect(isBrowserExtensionCrash(`TypeError: Failed to fetch https://leekwars.com/api/farmer/get
    at f (chrome-extension://abc/x.js:1:1)`)).toBe(true)
	})

	// La stack réelle de l'erreur #11884235 : le userscript Better-LeekWars, branché sur nos
	// événements, casse dans son propre dispatchClick. Les frames de la page sont ses APPELANTS,
	// elles ne doivent pas rendre le rapport visible — seul le haut de la stack compte.
	it('reconnaît une extension appelée par du code de la page', () => {
		expect(isBrowserExtensionCrash(`dispatchClick@moz-extension://02517779/userscripts/Better-LeekWars.user.js?id=13622d41:1225:31
dispatch@moz-extension://02517779/userscripts/Better-LeekWars.user.js?id=13622d41:3016:36
At@https://leekwars.com/leek/134647:10:91`)).toBe(true)
	})

	// L'autre sens du même mélange : l'extension enveloppe notre code, qui casse. Le site du
	// throw est à nous, le rapport doit rester visible.
	it('laisse passer une stack mixte ou applicative', () => {
		expect(isBrowserExtensionCrash(`TypeError: boom
    at k (https://leekwars.com/assets/index-a1b2.js:9:1)
    at wrap (chrome-extension://abc/hook.js:1:1)`)).toBe(false)
		expect(isBrowserExtensionCrash('TypeError: boom\n    at k (https://leekwars.com/assets/index-a1b2.js:9:1)')).toBe(false)
		// Dev local en http:// : c'est aussi une frame de la page.
		expect(isBrowserExtensionCrash('at k (http://localhost:8080/src/model/vue.ts:9:1)\nat w (chrome-extension://abc/hook.js:1:1)')).toBe(false)
	})

	// Monaco relance ses erreurs en `new Error(message + '\n\n' + stack)` : la ligne de message
	// embarque alors des frames. Seules les lignes de FORME frame comptent, jamais la prose.
	it('ne prend pas une ligne de message pour le site du throw', () => {
		expect(isBrowserExtensionCrash(`Error: refused to load chrome-extension://abc/x.js:1:1

    at k (https://leekwars.com/assets/index-a1b2.js:9:1)`)).toBe(false)
	})

	// Sans :ligne:colonne, une URL d'extension n'est pas une frame mais du texte de message
	// (stack réduite à sa ligne de message sur V8) : la masquer cacherait un vrai bug.
	it('exige une frame, pas une URL citée dans le message', () => {
		expect(isBrowserExtensionCrash('Error: blocked resource chrome-extension://abc/x.js')).toBe(false)
		expect(isBrowserExtensionCrash('(no stack)')).toBe(false)
		expect(isBrowserExtensionCrash('')).toBe(false)
	})
})

describe('createRepeatLimiter', () => {

	it('laisse passer les rangs en puissance de 2', () => {
		const limiter = createRepeatLimiter()
		const passed = []
		for (let i = 1; i <= 16; i++) {
			if (limiter.shouldReport('boom')) passed.push(i)
		}
		expect(passed).toEqual([1, 2, 4, 8, 16])
	})

	it('coupe le flood d une session bloquée', () => {
		// Le cas réel : ~1300 rapports pour un seul message répété
		const limiter = createRepeatLimiter()
		let reported = 0
		for (let i = 0; i < 1300; i++) {
			if (limiter.shouldReport("can't access dead object")) reported++
		}
		expect(reported).toBe(11) // 1,2,4...1024
	})

	it('compte chaque message séparément', () => {
		const limiter = createRepeatLimiter()
		expect(limiter.shouldReport('a')).toBe(true)
		expect(limiter.shouldReport('b')).toBe(true)
		expect(limiter.shouldReport('a')).toBe(true)  // 2e de 'a'
		expect(limiter.shouldReport('a')).toBe(false) // 3e de 'a'
		expect(limiter.shouldReport('b')).toBe(true)  // 2e de 'b'
	})

	it('regroupe les messages qui ne diffèrent qu au-delà de 120 caractères', () => {
		// Même crash, suffixe variable (identifiants, coordonnées) : sans troncature
		// chaque occurrence compterait pour un message neuf et rien ne serait limité
		const limiter = createRepeatLimiter()
		const base = 'x'.repeat(120)
		limiter.shouldReport(base + 'un')
		limiter.shouldReport(base + 'deux')
		expect(limiter.shouldReport(base + 'trois')).toBe(false) // 3e du même préfixe
	})

	it('purge au-delà du plafond de messages distincts', () => {
		const limiter = createRepeatLimiter(3)
		limiter.shouldReport('a'); limiter.shouldReport('b')
		limiter.shouldReport('c'); limiter.shouldReport('d') // purge ici
		// 'a' repart de zéro après purge : on préfère ré-autoriser que fuir en mémoire
		expect(limiter.shouldReport('a')).toBe(true)
	})

	it('tolère un message vide', () => {
		const limiter = createRepeatLimiter()
		expect(limiter.shouldReport('')).toBe(true)
	})
})

describe('isDeadObjectCrash', () => {

	// Le rapport réel de l'erreur #11847400 : Firefox n'attache aucune stack au message.
	it('reconnaît l\'objet mort Firefox sans stack', () => {
		expect(isDeadObjectCrash("can't access dead object", '')).toBe(true)
	})

	// Une frame de la page prouve que du code à nous est dans le coup : le rapport doit rester
	// visible. Règle propre à cette famille : sans stack, il n'y a pas de site du throw à opposer
	// comme le fait isBrowserExtensionCrash, la seule présence d'une frame de page suffit.
	it('laisse visible un objet mort dont la stack cite la page', () => {
		expect(isDeadObjectCrash("can't access dead object", 'f@https://leekwars.com/assets/x.js:2:9')).toBe(false)
	})

	it('ignore les messages d\'autres familles', () => {
		expect(isDeadObjectCrash("can't access property \"leeks\", t is null", '')).toBe(false)
		expect(isDeadObjectCrash('', '')).toBe(false)
	})
})

describe('isDomEvent', () => {

	// Le cas réel de l'erreur #11873108 : Monaco relance l'ErrorEvent d'un worker en échec depuis
	// un setTimeout, il arrive dans window.onerror en `event.error` et n'a ni message ni stack.
	it('reconnaît un événement du DOM lancé à la place d\'une Error', () => {
		expect(isDomEvent(new Event('error'))).toBe(true)
		expect(isDomEvent(new ErrorEvent('error', { message: 'boom' }))).toBe(true)
	})

	it('laisse passer les vraies erreurs et les autres valeurs', () => {
		expect(isDomEvent(new Error('boom'))).toBe(false)
		expect(isDomEvent('boom')).toBe(false)
		expect(isDomEvent(null)).toBe(false)
		expect(isDomEvent(undefined)).toBe(false)
		// Un objet métier qui a un `type` mais rien d'un événement : le champ seul ne suffit pas
		expect(isDomEvent({ type: 'weapon', id: 42 })).toBe(false)
	})
})

describe('describeNonError', () => {

	// JSON.stringify d'un Event ne rend que {"isTrusted":true} : ses champs sont des accesseurs
	// de prototype. C'est tout ce que contenait le rapport de #11873108.
	it('nomme un Event que JSON.stringify réduirait à isTrusted', () => {
		expect(describeNonError(new Event('error'))).toBe('Event(error)')
	})

	// Le cas réel : la cible est le Worker Monaco en échec, seul indice du sous-système fautif.
	it('ajoute la classe de la cible et le message porté', () => {
		class Worker extends EventTarget { }
		const worker = new Worker()
		let description = ''
		worker.addEventListener('error', (event) => { description = describeNonError(event) })
		worker.dispatchEvent(new ErrorEvent('error', { message: 'Script load failed' }))
		expect(description).toBe('ErrorEvent(error on Worker Script load failed)')
	})

	it('ajoute la position d\'un ErrorEvent qui en porte une', () => {
		const event = new ErrorEvent('error', { message: 'oops', filename: 'https://leekwars.com/a.js', lineno: 2, colno: 9 })
		expect(describeNonError(event)).toBe('ErrorEvent(error oops https://leekwars.com/a.js:2:9)')
	})

	// Un ErrorEvent porte le message d'une exception quelconque : sans borne, il partirait entier
	// dans le champ `error` du rapport, là où la sérialisation JSON était déjà bornée.
	it('borne la description d\'un Event trop long', () => {
		const event = new ErrorEvent('error', { message: 'x'.repeat(500) })
		expect(describeNonError(event).length).toBe(200)
	})

	it('retombe sur JSON.stringify pour les autres valeurs', () => {
		expect(describeNonError({ code: 429 })).toBe('{"code":429}')
		expect(describeNonError('boom')).toBe('"boom"')
		expect(describeNonError(undefined)).toBe('undefined')
	})

	it('tolère une valeur non sérialisable', () => {
		const cyclic: Record<string, unknown> = {}
		cyclic.self = cyclic
		expect(describeNonError(cyclic)).toBe('(unserializable)')
	})
})
