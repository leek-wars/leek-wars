import type { DocLanguage } from '@/model/doc-language'

/**
 * Équivalents de la bibliothèque STANDARD dans les langages polyglot.
 *
 * L'API objet du runtime (`objects.js`) ne couvre que l'API de JEU — `Entity`, `Cell`,
 * `Field`, `Fight`… La stdlib en est volontairement absente : en JS/TS et en Python le moteur
 * expose celle du langage hôte. `abs(x)` n'existe donc pas en TypeScript, on y écrit
 * `Math.abs(x)` ; en Python c'est le `abs()` natif.
 *
 * Sans cette table, la doc affichait la signature plate LeekScript avec un badge
 * « LeekScript uniquement » — faux, et trompeur pour qui lit en TS ou en Python.
 *
 * Source : les guides de portage `ia-js/TRANSLATION.md` et `ia-py/TRANSLATION.md`, qui
 * recensent ces correspondances pour la traduction de l'IA Quantum.
 *
 * Une entrée absente signifie « pas d'équivalent direct » : la fiche retombe alors sur la
 * forme LeekScript avec son badge, et cette fois c'est exact — les utilitaires de bits
 * (`bitCount`, `rotateLeft`…) et les tirages entiers (`randInt`) n'ont effectivement pas de
 * contrepartie native.
 */

export interface StdlibForm {
	/** Nom court affiché dans la liste : `Math.abs`, `s.length`. */
	path: string
	/** Forme complète affichée sur la fiche, avec ses arguments. */
	signature: string
}

export interface StdlibEquivalent {
	typescript?: StdlibForm
	python?: StdlibForm
}

/** `[nom LeekScript, chemin TS, signature TS, chemin Python, signature Python]`. */
type Row = [string, string | null, string | null, string | null, string | null]

const ROWS: Row[] = [
	// --- Mathématiques ---------------------------------------------------------------------
	// Côté Python on montre les formes NATIVES (`math.sqrt`, `round`, `random.randrange`) : le
	// conteneur `Math` du prélude ne reprend que ce que le langage n'a pas. Doubler la stdlib
	// aurait fait cohabiter `Math` et `math` à une majuscule près, et surtout une IA Python doit
	// se comporter comme du Python — `round(2.5)` y vaut 2, et c'est ce que son auteur attend.
	// L'écart avec LeekScript et JS est réel : la doc le SIGNALE au lieu de le masquer.
	['abs', 'Math.abs', 'Math.abs(x: number): number', 'abs', 'abs(x: int | float) -> int | float'],
	['acos', 'Math.acos', 'Math.acos(x: number): number', 'math.acos', 'math.acos(x: float) -> float'],
	['asin', 'Math.asin', 'Math.asin(x: number): number', 'math.asin', 'math.asin(x: float) -> float'],
	['atan', 'Math.atan', 'Math.atan(x: number): number', 'math.atan', 'math.atan(x: float) -> float'],
	['atan2', 'Math.atan2', 'Math.atan2(y: number, x: number): number', 'math.atan2', 'math.atan2(y: float, x: float) -> float'],
	['cbrt', 'Math.cbrt', 'Math.cbrt(x: number): number', 'math.cbrt', 'math.cbrt(x: float) -> float'],
	['ceil', 'Math.ceil', 'Math.ceil(x: number): number', 'math.ceil', 'math.ceil(x: float) -> int'],
	['cos', 'Math.cos', 'Math.cos(x: number): number', 'math.cos', 'math.cos(x: float) -> float'],
	['exp', 'Math.exp', 'Math.exp(x: number): number', 'math.exp', 'math.exp(x: float) -> float'],
	['floor', 'Math.floor', 'Math.floor(x: number): number', 'math.floor', 'math.floor(x: float) -> int'],
	['hypot', 'Math.hypot', 'Math.hypot(x: number, y: number): number', 'math.hypot', 'math.hypot(x: float, y: float) -> float'],
	['log', 'Math.log', 'Math.log(x: number): number', 'math.log', 'math.log(x: float) -> float'],
	['log2', 'Math.log2', 'Math.log2(x: number): number', 'math.log2', 'math.log2(x: float) -> float'],
	['log10', 'Math.log10', 'Math.log10(x: number): number', 'math.log10', 'math.log10(x: float) -> float'],
	['max', 'Math.max', 'Math.max(a: number, b: number): number', 'max', 'max(a, b)'],
	['min', 'Math.min', 'Math.min(a: number, b: number): number', 'min', 'min(a, b)'],
	['pow', 'Math.pow', 'Math.pow(base: number, exp: number): number', 'pow', 'pow(base, exp)'],
	// `round` Python fait de l'arrondi bancaire (2.5 -> 2), contrairement à Math.round et au
	// round de LeekScript : c'est un piège signalé dans ia-py/TRANSLATION.md.
	['round', 'Math.round', 'Math.round(x: number): number', 'round', 'round(x) -> int — arrondi BANCAIRE : round(2.5) vaut 2, LeekScript et JS donnent 3'],
	['signum', 'Math.sign', 'Math.sign(x: number): number', 'Math.signum', 'Math.signum(x: float) -> int'],
	['sin', 'Math.sin', 'Math.sin(x: number): number', 'math.sin', 'math.sin(x: float) -> float'],
	['sqrt', 'Math.sqrt', 'Math.sqrt(x: number): number', 'math.sqrt', 'math.sqrt(x: float) -> float'],
	['tan', 'Math.tan', 'Math.tan(x: number): number', 'math.tan', 'math.tan(x: float) -> float'],
	['toDegrees', 'Math.toDegrees', 'Math.toDegrees(radians: number): number', 'math.degrees', 'math.degrees(radians: float) -> float'],
	['toRadians', 'Math.toRadians', 'Math.toRadians(degrees: number): number', 'math.radians', 'math.radians(degrees: float) -> float'],
	['rand', 'Math.random', 'Math.random(): number', 'random.random', 'random.random() -> float'],
	['isNaN', 'Number.isNaN', 'Number.isNaN(x: number): boolean', 'math.isnan', 'math.isnan(x: float) -> bool'],
	['isFinite', 'Number.isFinite', 'Number.isFinite(x: number): boolean', 'math.isfinite', 'math.isfinite(x: float) -> bool'],
	['isInfinite', 'Math.isInfinite', 'Math.isInfinite(x: number): boolean', 'math.isinf', 'math.isinf(x: float) -> bool'],
	['binString', 'x.toString(2)', 'x.toString(2): string', 'bin', 'bin(x: int) -> str'],
	['hexString', 'x.toString(16)', 'x.toString(16): string', 'hex', 'hex(x: int) -> str'],
	['number', 'Number', 'Number(value): number', 'float', 'float(value) / int(value)'],

	// --- Chaînes ---------------------------------------------------------------------------
	['length', 's.length', 's.length: number', 'len', 'len(s: str) -> int'],
	['charAt', 's.charAt', 's.charAt(index: number): string', 's[index]', 's[index] -> str'],
	['codePointAt', 's.codePointAt', 's.codePointAt(index: number): number', 'ord', 'ord(s[index]) -> int'],
	['contains', 's.includes', 's.includes(search: string): boolean', 'search in s', 'search in s -> bool'],
	['startsWith', 's.startsWith', 's.startsWith(prefix: string): boolean', 's.startswith', 's.startswith(prefix: str) -> bool'],
	['endsWith', 's.endsWith', 's.endsWith(suffix: string): boolean', 's.endswith', 's.endswith(suffix: str) -> bool'],
	['indexOf', 's.indexOf', 's.indexOf(search: string, from?: number): number', 's.find', 's.find(search: str, start?: int) -> int'],
	['replace', 's.replaceAll', 's.replaceAll(search: string, by: string): string', 's.replace', 's.replace(search: str, by: str) -> str'],
	['split', 's.split', 's.split(separator: string): string[]', 's.split', 's.split(separator: str) -> list[str]'],
	// substring(s, start, length) en LeekScript : le 2e argument est une LONGUEUR, pas un index
	// de fin — d'où `start + length` en JS et la tranche en Python.
	['substring', 's.substring', 's.substring(start: number, start + length: number): string', 's[start:start + length]', 's[start:start + length] -> str'],
	['toLower', 's.toLowerCase', 's.toLowerCase(): string', 's.lower', 's.lower() -> str'],
	['toUpper', 's.toUpperCase', 's.toUpperCase(): string', 's.upper', 's.upper() -> str'],
	['string', 'String', 'String(value): string', 'str', 'str(value) -> str'],

	// --- JSON, types, copie ------------------------------------------------------------------
	['jsonEncode', 'JSON.stringify', 'JSON.stringify(value): string', 'json.dumps', 'json.dumps(value) -> str'],
	['jsonDecode', 'JSON.parse', 'JSON.parse(json: string): any', 'json.loads', 'json.loads(json: str) -> Any'],
	['typeOf', 'typeof', 'typeof value: string', 'type', 'type(value) -> type'],
	['clone', 'structuredClone', 'structuredClone(value)', 'copy.deepcopy', 'copy.deepcopy(value)'],

	// --- Listes ------------------------------------------------------------------------------
	['count', 'a.length', 'a.length: number', 'len', 'len(a) -> int'],
	['push', 'a.push', 'a.push(value): void', 'a.append', 'a.append(value) -> None'],
	['pop', 'a.pop', 'a.pop(): any', 'a.pop', 'a.pop() -> Any'],
	['shift', 'a.shift', 'a.shift(): any', 'a.pop', 'a.pop(0) -> Any'],
	['unshift', 'a.unshift', 'a.unshift(value): void', 'a.insert', 'a.insert(0, value) -> None'],
	['inArray', 'a.includes', 'a.includes(value): boolean', 'value in a', 'value in a -> bool'],
	['arrayMap', 'a.map', 'a.map(callback): any[]', '[f(x) for x in a]', '[f(x) for x in a]'],
	['arrayFilter', 'a.filter', 'a.filter(callback): any[]', '[x for x in a if f(x)]', '[x for x in a if f(x)]'],
	['removeElement', 'a.splice', 'a.splice(a.indexOf(value), 1): void', 'a.remove', 'a.remove(value) -> None'],
	['reverse', 'a.reverse', 'a.reverse(): void', 'a.reverse', 'a.reverse() -> None'],
	['sort', 'a.sort', 'a.sort((x, y) => x - y): void', 'a.sort', 'a.sort() -> None'],
	['sum', 'a.reduce', 'a.reduce((acc, x) => acc + x, 0): number', 'sum', 'sum(a) -> int | float'],
	['join', 'a.join', 'a.join(separator: string): string', 'sep.join(a)', 'separator.join(str(x) for x in a) -> str'],

	// --- Tables ------------------------------------------------------------------------------
	['mapSize', 'm.size', 'm.size: number', 'len', 'len(m) -> int'],
	['mapGet', 'm.get', 'm.get(key): any', 'm.get', 'm.get(key) -> Any'],
	['mapPut', 'm.set', 'm.set(key, value): Map', 'm[key] = value', 'm[key] = value'],
	['mapKeys', 'm.keys', '[...m.keys()]: any[]', 'm.keys', 'list(m.keys()) -> list'],
	['mapValues', 'm.values', '[...m.values()]: any[]', 'm.values', 'list(m.values()) -> list'],
	['mapRemove', 'm.delete', 'm.delete(key): boolean', 'del m[key]', 'del m[key]'],
	['mapContainsKey', 'm.has', 'm.has(key): boolean', 'key in m', 'key in m -> bool'],

	// --- Bits et aléatoire -------------------------------------------------------------------
	// Seuls les cas à contrepartie NATIVE sont listés. bitReverse, byteReverse, rotateLeft,
	// rotateRight, isPermutation, realBits et bitsToReal demandent une vraie implémentation
	// dans les deux langages : les laisser absents affiche la forme LeekScript, ce qui est
	// honnête, plutôt qu'un pseudo-équivalent que le joueur recopierait faux.
	['bitCount', 'Math.bitCount', 'Math.bitCount(x: number): number', 'x.bit_count()', 'x.bit_count() -> int'],
	['bitLength', 'Math.bitLength', 'Math.bitLength(x: number): number', 'x.bit_length()', 'x.bit_length() -> int'],
	['testBit', 'Math.testBit', 'Math.testBit(x: number, bit: number): boolean', 'Math.testBit', 'Math.testBit(x: int, bit: int) -> bool'],
	// randInt est [a, b) en LeekScript, comme randrange : randint de Python serait FAUX (inclusif).
	['randInt', 'Math.randInt', 'Math.randInt(a: number, b: number): number — borne haute exclue', 'random.randrange', 'random.randrange(a, b) -> int — borne haute exclue, comme LeekScript'],
	['randReal', 'Math.randReal', 'Math.randReal(a: number, b: number): number', 'random.uniform', 'random.uniform(a, b) -> float'],

	// Exposées sous `Math` par le prélude polyglot depuis qu'on a comblé le trou : elles n'ont
	// pas d'équivalent natif, et passer par l'hôte est la seule façon d'opérer sur 64 bits — les
	// opérateurs bitwise de JS travaillent sur 32.
	['isPermutation', 'Math.isPermutation', 'Math.isPermutation(a: number, b: number): boolean', 'Math.isPermutation', 'Math.isPermutation(a: int, b: int) -> bool'],
	['setBit', 'Math.setBit', 'Math.setBit(x: number, bit: number, value?: boolean): number', 'Math.setBit', 'Math.setBit(x: int, bit: int, value: bool = True) -> int'],
	['bitReverse', 'Math.bitReverse', 'Math.bitReverse(x: number): number', 'Math.bitReverse', 'Math.bitReverse(x: int) -> int'],
	['byteReverse', 'Math.byteReverse', 'Math.byteReverse(x: number): number', 'Math.byteReverse', 'Math.byteReverse(x: int) -> int'],
	['rotateLeft', 'Math.rotateLeft', 'Math.rotateLeft(x: number, count: number): number', 'Math.rotateLeft', 'Math.rotateLeft(x: int, count: int) -> int'],
	['rotateRight', 'Math.rotateRight', 'Math.rotateRight(x: number, count: number): number', 'Math.rotateRight', 'Math.rotateRight(x: int, count: int) -> int'],
	['leadingZeros', 'Math.leadingZeros', 'Math.leadingZeros(x: number): number', 'Math.leadingZeros', 'Math.leadingZeros(x: int) -> int'],
	['trailingZeros', 'Math.trailingZeros', 'Math.trailingZeros(x: number): number', 'Math.trailingZeros', 'Math.trailingZeros(x: int) -> int'],
	['realBits', 'Math.realBits', 'Math.realBits(x: number): number', 'Math.realBits', 'Math.realBits(x: float) -> int'],
	['bitsToReal', 'Math.bitsToReal', 'Math.bitsToReal(bits: number): number', 'Math.bitsToReal', 'Math.bitsToReal(bits: int) -> float'],

	// --- Listes (suite) ----------------------------------------------------------------------
	['arrayMin', 'Math.min', 'Math.min(...a): number', 'min', 'min(a)'],
	['arrayMax', 'Math.max', 'Math.max(...a): number', 'max', 'max(a)'],
	['average', 'a.reduce', 'a.reduce((s, x) => s + x, 0) / a.length', 'statistics.mean', 'statistics.mean(a) -> float'],
	['arrayConcat', 'a.concat', 'a.concat(b): any[]', 'a + b', 'a + b -> list'],
	['arrayEvery', 'a.every', 'a.every(callback): boolean', 'all', 'all(f(x) for x in a) -> bool'],
	['arraySome', 'a.some', 'a.some(callback): boolean', 'any', 'any(f(x) for x in a) -> bool'],
	['arrayFind', 'a.find', 'a.find(callback): any', 'next', 'next((x for x in a if f(x)), None)'],
	['arrayFlatten', 'a.flat', 'a.flat(depth?): any[]', 'itertools.chain', 'list(itertools.chain.from_iterable(a))'],
	['arrayFoldLeft', 'a.reduce', 'a.reduce(callback, initial): any', 'functools.reduce', 'functools.reduce(f, a, initial)'],
	['arrayFoldRight', 'a.reduceRight', 'a.reduceRight(callback, initial): any', 'functools.reduce', 'functools.reduce(f, reversed(a), initial)'],
	['arrayIter', 'a.forEach', 'a.forEach(callback): void', 'for x in a', 'for x in a: f(x)'],
	['arraySlice', 'a.slice', 'a.slice(start?, end?): any[]', 'a[start:end]', 'a[start:end] -> list'],
	['subArray', 'a.slice', 'a.slice(start, end + 1): any[]', 'a[start:end + 1]', 'a[start:end + 1] -> list'],
	// arraySort renvoie un NOUVEAU tableau : `[...a]` et `sorted` plutôt que `a.sort` / `a.sort()`.
	['arraySort', '[...a].sort', '[...a].sort(comparator?): any[]', 'sorted', 'sorted(a, key=...) -> list'],
	['arrayToSet', 'new Set', 'new Set(a): Set', 'set', 'set(a) -> set'],
	['arrayUnique', '[...new Set(a)]', '[...new Set(a)]: any[]', 'dict.fromkeys', 'list(dict.fromkeys(a)) -> list'],
	['arrayClear', 'a.length = 0', 'a.length = 0', 'a.clear', 'a.clear() -> None'],
	['arrayFrequencies', null, null, 'collections.Counter', 'collections.Counter(a) -> Counter'],
	['arrayRemoveAll', 'a.filter', 'a.filter(x => x !== value): any[]', '[x for x in a if x != value]', '[x for x in a if x != value]'],
	['arrayGet', 'a.at', 'a.at(index) ?? fallback', 'a[index]', 'a[index] if -len(a) <= index < len(a) else fallback'],
	['fill', 'a.fill', 'a.fill(value): any[]', 'a[:] = [value] * n', 'a[:] = [value] * n'],
	['insert', 'a.splice', 'a.splice(index, 0, value): void', 'a.insert', 'a.insert(index, value) -> None'],
	['isEmpty', 'a.length === 0', 'a.length === 0: boolean', 'not a', 'not a -> bool'],
	['pushAll', 'a.push', 'a.push(...b): void', 'a.extend', 'a.extend(b) -> None'],
	['remove', 'a.splice', 'a.splice(index, 1): any[]', 'del a[index]', 'del a[index]'],
	['search', 'a.indexOf', 'a.indexOf(value, from?): number', 'a.index', 'a.index(value) -> int'],
	['shuffle', null, null, 'random.shuffle', 'random.shuffle(a) -> None'],
	// GraalPy est en Python 3.12 : itertools.batched (3.12) et random.sample existent. Côté JS
	// il n'y a pas d'équivalent natif, d'où l'entrée à moitié remplie — la fiche affichera la
	// forme LeekScript en TypeScript et l'équivalent en Python.
	['arrayChunk', null, null, 'itertools.batched', 'list(itertools.batched(a, size)) -> list'],
	['arrayRandom', null, null, 'random.sample', 'random.sample(a, count) -> list'],

	// --- Tables (suite) ----------------------------------------------------------------------
	['mapClear', 'm.clear', 'm.clear(): void', 'm.clear', 'm.clear() -> None'],
	['mapIsEmpty', 'm.size === 0', 'm.size === 0: boolean', 'not m', 'not m -> bool'],
	['mapContains', '[...m.values()].includes', '[...m.values()].includes(value): boolean', 'in m.values()', 'value in m.values() -> bool'],
	['mapSum', '[...m.values()].reduce', '[...m.values()].reduce((s, x) => s + x, 0)', 'sum', 'sum(m.values())'],
	['mapAverage', '[...m.values()]', '[...m.values()].reduce((s, x) => s + x, 0) / m.size', 'statistics.mean', 'statistics.mean(m.values()) -> float'],
	['mapMin', 'Math.min', 'Math.min(...m.values()): number', 'min', 'min(m.values())'],
	['mapMax', 'Math.max', 'Math.max(...m.values()): number', 'max', 'max(m.values())'],
	['mapIter', 'm.forEach', 'm.forEach(callback): void', 'for k, v in m.items()', 'for key, value in m.items(): f(key, value)'],
	['mapMap', 'new Map', 'new Map([...m].map(([k, v]) => [k, f(v)]))', 'dict comprehension', '{k: f(v) for k, v in m.items()}'],
	['mapFilter', 'new Map', 'new Map([...m].filter(([k, v]) => f(k, v)))', 'dict comprehension', '{k: v for k, v in m.items() if f(k, v)}'],
	['mapEvery', 'all', '[...m].every(([k, v]) => f(k, v)): boolean', 'all', 'all(f(k, v) for k, v in m.items()) -> bool'],
	['mapSome', 'any', '[...m].some(([k, v]) => f(k, v)): boolean', 'any', 'any(f(k, v) for k, v in m.items()) -> bool'],
	['mapFold', '[...m].reduce', '[...m].reduce(callback, initial)', 'functools.reduce', 'functools.reduce(f, m.items(), initial)'],
	['mapMerge', 'new Map', 'new Map([...a, ...b]): Map', '{**a, **b}', '{**a, **b} -> dict'],
	['mapPutAll', 'b.forEach', 'b.forEach((v, k) => a.set(k, v)): void', 'a.update', 'a.update(b) -> None'],
	['mapReplace', 'm.set', 'm.set(key, value): Map', 'm[key] = value', 'm[key] = value'],
	['mapReplaceAll', 'a.forEach', 'b.forEach((v, k) => a.has(k) && a.set(k, v))', 'a.update', 'a.update(b) -> None'],
	['mapSearch', '[...m].find', '[...m].find(([k, v]) => v === value)?.[0]', 'next', 'next((k for k, v in m.items() if v == value), None)'],
	['mapRemoveAll', '[...m].forEach', '[...m].forEach(([k, v]) => v === value && m.delete(k))', 'dict comprehension', '{k: v for k, v in m.items() if v != value}'],
	['mapFill', 'm.set', 'for (const k of m.keys()) m.set(k, value)', 'dict.fromkeys', 'dict.fromkeys(m, value)'],
	['removeKey', 'm.delete', 'm.delete(key): boolean', 'del m[key]', 'del m[key]'],

	// --- Ensembles ---------------------------------------------------------------------------
	// Formes par étalement (`[...s, ...t]`) plutôt que les méthodes natives `s.union(t)` : ces
	// dernières sont ES2025 et je n'ai pas pu vérifier qu'elles sont bien exposées par GraalJS.
	// L'étalement, lui, fonctionne partout — mieux vaut une forme sûre dans une doc qu'on recopie.
	['setPut', 's.add', 's.add(value): Set', 's.add', 's.add(value) -> None'],
	['setRemove', 's.delete', 's.delete(value): boolean', 's.discard', 's.discard(value) -> None'],
	['setClear', 's.clear', 's.clear(): void', 's.clear', 's.clear() -> None'],
	['setContains', 's.has', 's.has(value): boolean', 'value in s', 'value in s -> bool'],
	['setSize', 's.size', 's.size: number', 'len', 'len(s) -> int'],
	['setIsEmpty', 's.size === 0', 's.size === 0: boolean', 'not s', 'not s -> bool'],
	['setIsSubsetOf', '[...s].every', '[...s].every(x => t.has(x)): boolean', 's <= t', 's <= t -> bool'],
	['setUnion', 'new Set', 'new Set([...s, ...t]): Set', 's | t', 's | t -> set'],
	['setIntersection', 'new Set', 'new Set([...s].filter(x => t.has(x))): Set', 's & t', 's & t -> set'],
	['setDifference', 'new Set', 'new Set([...s].filter(x => !t.has(x))): Set', 's - t', 's - t -> set'],
	['setDisjunction', 'new Set', 'new Set([...s, ...t].filter(x => !(s.has(x) && t.has(x))))', 's ^ t', 's ^ t -> set'],
	['setFilter', 'new Set', 'new Set([...s].filter(callback)): Set', 'set comprehension', '{x for x in s if f(x)}'],
	['setToArray', '[...s]', '[...s]: any[]', 'list', 'list(s) -> list'],

	// --- Journal et modules ------------------------------------------------------------------
	['debugC', 'Debug.log', 'Debug.log(value, color): void', 'Debug.log', 'Debug.log(value, color) -> None'],
	['debugW', 'console.warn', 'console.warn(value): void', null, null],
	['debugE', 'console.error', 'console.error(value): void', null, null],
	['include', 'import', "import { x } from './fichier.js'", 'import', 'from fichier import x'],
]

/**
 * Constantes LeekScript SANS famille objet (cf `routeConstant`) qui existent quand même dans la
 * stdlib du langage hôte. `[nom LeekScript, chemin TS, chemin Python]`.
 *
 * Volontairement court : seules les correspondances EXACTES y sont. `SORT_ASC` et les `TYPE_*`
 * n'ont pas de constante équivalente — on trie avec un comparateur en JS, on compare des `type`
 * en Python — donc leur fiche garde la forme LeekScript et son badge, ce qui est exact.
 */
const CONST_ROWS: [string, string | null, string | null][] = [
	['PI', 'Math.PI', 'math.pi'],
	['E', 'Math.E', 'math.e'],
	['Infinity', 'Infinity', 'math.inf'],
	['NaN', 'NaN', 'math.nan'],
]

const CONST_BY_NAME: { [flat: string]: { typescript?: string, python?: string } } = {}
for (const [flat, ts, py] of CONST_ROWS) {
	CONST_BY_NAME[flat] = { typescript: ts ?? undefined, python: py ?? undefined }
}

/** Équivalent stdlib d'une CONSTANTE LeekScript dans le langage demandé, ou null. */
export function stdlibConstant(name: string, language: DocLanguage): string | null {
	const entry = CONST_BY_NAME[name]
	if (!entry) return null
	if (language === 'python') return entry.python ?? null
	if (language === 'typescript' || language === 'javascript') return entry.typescript ?? null
	return null
}

const BY_NAME: { [flat: string]: StdlibEquivalent } = {}
for (const [flat, tsPath, tsSignature, pyPath, pySignature] of ROWS) {
	const entry: StdlibEquivalent = {}
	if (tsPath && tsSignature) entry.typescript = { path: tsPath, signature: tsSignature }
	if (pyPath && pySignature) entry.python = { path: pyPath, signature: pySignature }
	BY_NAME[flat] = entry
}

/**
 * Équivalent stdlib d'une fonction LeekScript dans le langage demandé, ou null s'il n'y en a
 * pas de direct. JavaScript et TypeScript partagent la même entrée.
 */
export function stdlibEquivalent(flatName: string, language: DocLanguage): StdlibForm | null {
	const entry = BY_NAME[flatName]
	if (!entry) return null
	if (language === 'python') return entry.python ?? null
	if (language === 'typescript' || language === 'javascript') return entry.typescript ?? null
	return null
}
