import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startTouchDrag } from '@/model/touch-drag'

// Événement tactile minimal : happy-dom n'a pas TouchEvent, et seules les
// propriétés lues par touch-drag (touches/changedTouches) comptent ici.
function touchEvent(type: string, x: number, y: number, identifier = 1) {
	const event = new Event(type, { bubbles: true, cancelable: true })
	const touches = [{ identifier, clientX: x, clientY: y }]
	const ended = type === 'touchend' || type === 'touchcancel'
	Object.defineProperty(event, 'touches', { value: ended ? [] : touches })
	Object.defineProperty(event, 'changedTouches', { value: touches })
	return event
}

describe('touch-drag', () => {

	let element: HTMLElement
	let zoneA: HTMLElement
	let zoneB: HTMLElement
	let start: ReturnType<typeof vi.fn>
	let end: ReturnType<typeof vi.fn>
	let finger: { x: number, y: number }

	// Élément à déplacer + deux zones de dépôt, l'une sous le doigt à la fois.
	beforeEach(() => {
		vi.useFakeTimers()
		document.body.innerHTML = '<div class="zone" id="a"><div class="item"></div></div><div class="zone" id="b"></div>'
		zoneA = document.getElementById('a')!
		zoneB = document.getElementById('b')!
		element = document.querySelector('.item')!
		start = vi.fn()
		end = vi.fn()
		finger = { x: 0, y: 0 }
		document.elementFromPoint = () => (finger.y < 100 ? zoneA : zoneB)
	})

	afterEach(() => {
		vi.useRealTimers()
		document.body.innerHTML = ''
	})

	function press(x: number, y: number, options: Parameters<typeof startTouchDrag>[1] = { drop: '.zone', start, end }) {
		finger = { x, y }
		element.addEventListener('touchstart', (e) => startTouchDrag(e as TouchEvent, options), { once: true })
		element.dispatchEvent(touchEvent('touchstart', x, y))
	}

	function move(x: number, y: number) {
		finger = { x, y }
		const event = touchEvent('touchmove', x, y)
		document.dispatchEvent(event)
		return event
	}

	function ghost() {
		return document.querySelector('body > .item')
	}

	it('un défilement pendant l\'appui annule le glisser', () => {
		press(50, 50)
		move(50, 90) // le doigt part avant l'appui long : c'est un scroll
		vi.advanceTimersByTime(1000)

		expect(start).not.toHaveBeenCalled()
		expect(ghost()).toBe(null)

		document.dispatchEvent(touchEvent('touchend', 50, 90))
		expect(end).not.toHaveBeenCalled()
	})

	it('un tap ne déclenche pas de glisser', () => {
		press(50, 50)
		vi.advanceTimersByTime(100)
		const event = touchEvent('touchend', 50, 50)
		document.dispatchEvent(event)

		expect(start).not.toHaveBeenCalled()
		expect(end).not.toHaveBeenCalled()
		expect(event.defaultPrevented).toBe(false) // le clic de navigation passe
	})

	it('l\'appui long attrape l\'élément et le dépose sur la zone visée', () => {
		press(50, 50)
		vi.advanceTimersByTime(300)

		expect(start).toHaveBeenCalledOnce()
		expect(ghost()).not.toBe(null)

		const moved = move(50, 200) // vers la zone B
		expect(moved.defaultPrevented).toBe(true) // la page ne défile pas
		expect(zoneB.classList.contains('drop-hover')).toBe(true)
		expect(zoneA.classList.contains('drop-hover')).toBe(false)

		const released = touchEvent('touchend', 50, 200)
		document.dispatchEvent(released)

		expect(end).toHaveBeenCalledWith(zoneB)
		expect(released.defaultPrevented).toBe(true) // pas de clic après un glisser
		expect(ghost()).toBe(null)
		expect(zoneB.classList.contains('drop-hover')).toBe(false)
	})

	it('une zone refusée n\'est ni surlignée ni acceptée', () => {
		press(50, 50, { drop: '.zone', accept: (zone) => zone !== zoneB, start, end })
		vi.advanceTimersByTime(300)
		move(50, 200)

		expect(zoneB.classList.contains('drop-hover')).toBe(false)

		document.dispatchEvent(touchEvent('touchend', 50, 200))
		expect(end).toHaveBeenCalledWith(null)
	})

	it('le menu contextuel de l\'appui long est neutralisé, puis rendu', () => {
		press(50, 50)
		vi.advanceTimersByTime(300)

		const menu = new Event('contextmenu', { bubbles: true, cancelable: true })
		element.dispatchEvent(menu)
		expect(menu.defaultPrevented).toBe(true)

		document.dispatchEvent(touchEvent('touchend', 50, 50))

		const after = new Event('contextmenu', { bubbles: true, cancelable: true })
		element.dispatchEvent(after)
		expect(after.defaultPrevented).toBe(false)
	})

	it('le glisser-déposer natif (iPad) reprend la main sans dépôt en double', () => {
		press(50, 50)
		vi.advanceTimersByTime(300)
		element.dispatchEvent(new Event('dragstart', { bubbles: true }))

		expect(ghost()).toBe(null)

		document.dispatchEvent(touchEvent('touchcancel', 50, 50))
		expect(end).not.toHaveBeenCalled() // c'est le dragend natif qui conclut
	})

	it('un geste interrompu ne dépose rien et nettoie tout', () => {
		press(50, 50)
		vi.advanceTimersByTime(300)
		move(50, 200)
		document.dispatchEvent(touchEvent('touchcancel', 50, 200))

		expect(end).toHaveBeenCalledWith(null)
		expect(ghost()).toBe(null)
		expect(zoneB.classList.contains('drop-hover')).toBe(false)

		// plus aucun écouteur : un touchmove tardif ne bloque plus le défilement
		expect(move(50, 300).defaultPrevented).toBe(false)
	})
})
