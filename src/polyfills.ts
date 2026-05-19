// Polyfills for ES2022/ES2023 Array methods used by Vuetify and app code.
// browserslist target is `last 5 years`, but Vuetify ripple uses Array.findLast
// (Chrome 97+) and Vuetify VDateInput/VCalendar use Array.toSorted (Chrome 110+),
// which fails on older mobile browsers (e.g. Chrome 95 on PULP 4G — issue #3495).
// Native impls are non-enumerable; preserve that with defineProperty.

if (!Array.prototype.findLast) {
	Object.defineProperty(Array.prototype, 'findLast', {
		configurable: true, writable: true,
		value(this: any[], predicate: (v: any, i: number, a: any[]) => unknown, thisArg?: unknown) {
			for (let i = this.length - 1; i >= 0; i--) {
				if (predicate.call(thisArg, this[i], i, this)) return this[i]
			}
			return undefined
		},
	})
}

if (!Array.prototype.findLastIndex) {
	Object.defineProperty(Array.prototype, 'findLastIndex', {
		configurable: true, writable: true,
		value(this: any[], predicate: (v: any, i: number, a: any[]) => unknown, thisArg?: unknown) {
			for (let i = this.length - 1; i >= 0; i--) {
				if (predicate.call(thisArg, this[i], i, this)) return i
			}
			return -1
		},
	})
}

if (!Array.prototype.toSorted) {
	Object.defineProperty(Array.prototype, 'toSorted', {
		configurable: true, writable: true,
		value(this: any[], compareFn?: (a: any, b: any) => number) {
			return this.slice().sort(compareFn)
		},
	})
}
