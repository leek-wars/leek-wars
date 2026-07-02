import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LwType from '@/component/type.vue'

// type.vue (LwType) rend récursivement une signature de type LeekScript. Zéro dépendance :
// montage direct. Cinq branches mutuellement exclusives dans l'ORDRE : fonction, tableau JS
// (union |), array[...], objet (name + <key : element>), scalaire. On normalise les espaces
// (le template contient des retours à la ligne signifiants) puis on assère le texte rendu.
const txt = (type: unknown) => mount(LwType, { props: { type } }).text().replace(/\s+/g, ' ').trim()

describe('type.vue', () => {
	it('type scalaire', () => expect(txt('int')).toBe('int'))
	it('objet nommé sans élément', () => expect(txt({ name: 'Cell' })).toBe('Cell'))
	it('map (clé : élément)', () => expect(txt({ name: 'map', element: 'int', key: 'string' })).toBe('map<string : int>'))
	it('list (élément seul, sans clé)', () => expect(txt({ name: 'list', element: 'int' })).toBe('list<int>'))
	it('union de types (tableau JS joint par |)', () => expect(txt(['int', 'string'])).toBe('int | string'))
	it('array[...] via elements', () => expect(txt({ name: 'array', elements: ['int', 'real'] })).toBe('array[int, real]'))
	it('fonction : (args) → retour', () => expect(txt({ name: 'function', args: ['int', 'real'], return: 'bool' })).toBe('(int, real) → bool'))
	it('fonction sans argument', () => expect(txt({ name: 'function', args: [], return: 'void' })).toBe('() → void'))
	it('ordre des branches : name=array SANS elements retombe sur la branche objet', () => {
		expect(txt({ name: 'array', args: [] })).toBe('array')
	})
})
