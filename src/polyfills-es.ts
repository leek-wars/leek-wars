// Polyfills for ES2022/ES2023 methods used by Vuetify, Monaco and app code.
// browserslist target is `last 5 years`, but Vuetify ripple uses Array.findLast
// (Chrome 97+) and Vuetify VDateInput/VCalendar use Array.toSorted (Chrome 110+),
// which fails on older mobile browsers (e.g. Chrome 95 on PULP 4G).
// Native impls are non-enumerable; preserve that with defineProperty.
// Sans DOM : la page les charge via polyfills.ts, le worker éditeur de Monaco directement
// (editor/editor.worker.ts), puisqu'un worker ne passe pas par main.ts.

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

// Object.hasOwn (Chrome 93+) : Monaco s'en sert pour sa table de caractères ambigus.
if (!Object.hasOwn) {
	Object.defineProperty(Object, 'hasOwn', {
		configurable: true, writable: true,
		value(object: object, key: PropertyKey) {
			return Object.prototype.hasOwnProperty.call(object, key)
		},
	})
}

// Fait de ce fichier un module ES : il n'a que des effets de bord, mais `import(...)` exige un module.
export {}
