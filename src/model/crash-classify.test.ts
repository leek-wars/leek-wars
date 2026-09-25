import { describe, it, expect } from 'vitest'
import { isChunkLoadError, isDomCorruptionCrash, isInitOrderCrash } from './crash-classify'

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
		expect(isChunkLoadError('Unable to preload CSS for /assets/x.css')).toBe(true)
	})

	// Les trois familles pilotent des branches différentes de reportVueError : un message ne
	// doit jamais matcher deux prédicats, sinon l'ordre des branches décide seul du traitement.
	it('ne recouvre pas les autres familles', () => {
		expect(isChunkLoadError('Cannot access uninitialized variable.')).toBe(false)
		expect(isChunkLoadError("Cannot read properties of null (reading 'parentNode')")).toBe(false)
	})
})
