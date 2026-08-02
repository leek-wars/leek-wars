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
	['round', 'Math.round', 'Math.round(x: number): number', 'round', 'round(x) — arrondi bancaire, diffère de LeekScript'],
	['signum', 'Math.sign', 'Math.sign(x: number): number', null, null],
	['sin', 'Math.sin', 'Math.sin(x: number): number', 'math.sin', 'math.sin(x: float) -> float'],
	['sqrt', 'Math.sqrt', 'Math.sqrt(x: number): number', 'math.sqrt', 'math.sqrt(x: float) -> float'],
	['tan', 'Math.tan', 'Math.tan(x: number): number', 'math.tan', 'math.tan(x: float) -> float'],
	['toDegrees', null, null, 'math.degrees', 'math.degrees(rad: float) -> float'],
	['toRadians', null, null, 'math.radians', 'math.radians(deg: float) -> float'],
	['rand', 'Math.random', 'Math.random(): number', 'random.random', 'random.random() -> float'],
	['isNaN', 'Number.isNaN', 'Number.isNaN(x: number): boolean', 'math.isnan', 'math.isnan(x: float) -> bool'],
	['isFinite', 'Number.isFinite', 'Number.isFinite(x: number): boolean', 'math.isfinite', 'math.isfinite(x: float) -> bool'],
	['isInfinite', null, null, 'math.isinf', 'math.isinf(x: float) -> bool'],
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
]

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
