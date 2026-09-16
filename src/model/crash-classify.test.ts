import { describe, it, expect } from 'vitest'
import { createRepeatLimiter, isBrowserExtensionCrash, isChunkLoadError, isDeadObjectCrash, isDomCorruptionCrash, isInitOrderCrash } from './crash-classify'

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

	// Une frame de la page = bug applicatif potentiel, simplement traversé par un wrapper
	// d'extension : le rapport doit rester visible.
	it('laisse passer une stack mixte ou applicative', () => {
		expect(isBrowserExtensionCrash(`TypeError: boom
    at k (https://leekwars.com/assets/index-a1b2.js:9:1)
    at wrap (chrome-extension://abc/hook.js:1:1)`)).toBe(false)
		expect(isBrowserExtensionCrash('TypeError: boom\n    at k (https://leekwars.com/assets/index-a1b2.js:9:1)')).toBe(false)
		// Dev local en http:// : c'est aussi une frame de la page.
		expect(isBrowserExtensionCrash('at k (http://localhost:8080/src/model/vue.ts:9:1)\nat w (chrome-extension://abc/hook.js:1:1)')).toBe(false)
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
	// visible, exactement comme pour isBrowserExtensionCrash.
	it('laisse visible un objet mort dont la stack cite la page', () => {
		expect(isDeadObjectCrash("can't access dead object", 'f@https://leekwars.com/assets/x.js:2:9')).toBe(false)
	})

	it('ignore les messages d\'autres familles', () => {
		expect(isDeadObjectCrash("can't access property \"leeks\", t is null", '')).toBe(false)
		expect(isDeadObjectCrash('', '')).toBe(false)
	})
})
