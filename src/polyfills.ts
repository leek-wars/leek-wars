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

// Rend Vue résilient aux extensions/moteurs de traduction (Firefox Translations,
// Google Translate...) qui déplacent les nœuds texte de l'app dans des <font>,
// désynchronisant le DOM réel de l'arbre de vnodes de Vue. Le patcher de Vue appelle
// alors removeChild/insertBefore sur un parent qui n'est plus le bon → TypeError sur
// null, ce qui laisse l'arbre à moitié patché (el/anchor devenus null) et provoque en
// cascade les crashes nextSibling(null)/parentNode(null)/emitsOptions(null) du render
// suivant (gros cluster d'issues #4266+ dans vue-vendor). En neutralisant l'opération
// cross-parent au lieu de laisser Vue jeter, le cycle de patch se termine et l'état
// interne reste sain. Un removeChild/insertBefore cross-parent est toujours un artefact
// externe (jamais émis par du code applicatif légitime), donc l'avaler est sans risque.
// Correctif recommandé par l'équipe Vue pour ce cas.
// Firefox va plus loin que le cas cross-parent : quand le document d'où vient un nœud a été
// détruit (iframe retirée, compartiment d'extension déchargé), son wrapper devient un « dead
// object » et TOUT accès jette « can't access dead object » — y compris la lecture de
// .parentNode ci-dessous et l'appel natif lui-même. Le garde cross-parent ne suffisait donc
// pas : il jetait à son tour depuis polyfills.ts et laissait l'arbre à moitié patché, soit
// exactement la cascade qu'il est censé éviter. Un nœud mort ne peut de toute façon plus être
// inséré ni retiré : on neutralise, comme le cas cross-parent. Toute autre erreur est relancée.
function isDeadNode(node: Node | null | undefined): boolean {
	if (!node) { return false }
	try {
		void node.nodeType
		return false
	} catch {
		return true
	}
}

if (typeof Node === 'function' && Node.prototype) {
	const originalRemoveChild = Node.prototype.removeChild
	Node.prototype.removeChild = function<T extends Node>(this: Node, child: T): T {
		try {
			if (child.parentNode !== this) {
				return child
			}
			return originalRemoveChild.call(this, child) as T
		} catch (e) {
			if (isDeadNode(this) || isDeadNode(child)) { return child }
			throw e
		}
	}
	const originalInsertBefore = Node.prototype.insertBefore
	Node.prototype.insertBefore = function<T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
		try {
			if (referenceNode && referenceNode.parentNode !== this) {
				return newNode
			}
			return originalInsertBefore.call(this, newNode, referenceNode) as T
		} catch (e) {
			if (isDeadNode(this) || isDeadNode(newNode) || isDeadNode(referenceNode)) { return newNode }
			throw e
		}
	}
}

// Fait de ce fichier un module ES : il n'a que des effets de bord, mais `import(...)` (et donc
// polyfills.test.ts) exige un module.
export {}
