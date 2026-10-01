import { afterEach, describe, expect, it } from 'vitest'
import { isTyping } from '@/model/keyboard'

function keyup(target: EventTarget): KeyboardEvent {
	const event = new KeyboardEvent('keyup', { key: 'Delete', bubbles: true })
	target.dispatchEvent(event)
	return event
}

function element(html: string, selector: string): Element {
	document.body.innerHTML = html
	return document.querySelector(selector)!
}

describe('keyboard', () => {

	afterEach(() => {
		document.body.innerHTML = ''
	})

	it('reconnaît une frappe dans un champ de saisie', () => {
		expect(isTyping(keyup(element('<input type="text">', 'input')))).toBe(true)
		expect(isTyping(keyup(element('<textarea></textarea>', 'textarea')))).toBe(true)
		expect(isTyping(keyup(element('<select></select>', 'select')))).toBe(true)
		expect(isTyping(keyup(element('<div contenteditable="true"></div>', 'div')))).toBe(true)
	})

	it('reconnaît une frappe dans Monaco, zone de code comme recherche', () => {
		expect(isTyping(keyup(element('<div class="monaco-editor"><div class="native-edit-context"></div></div>', '.native-edit-context')))).toBe(true)
		expect(isTyping(keyup(element('<div class="monaco-editor"><div class="find-widget"><textarea class="input"></textarea></div></div>', 'textarea')))).toBe(true)
	})

	it('laisse passer les raccourcis hors des champs', () => {
		expect(isTyping(keyup(document.body))).toBe(false)
		expect(isTyping(keyup(element('<div class="item"><span class="label">IA</span></div>', '.label')))).toBe(false)
		expect(isTyping(keyup(element('<button>OK</button>', 'button')))).toBe(false)
		expect(isTyping(keyup(window))).toBe(false)
	})
})
