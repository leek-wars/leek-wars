// Grammaire Monarch LeekScript construite par une FABRIQUE plutôt qu'exportée en objet
// statique : les listes de constantes/fonctions (jadis lues via des imports statiques de
// `@/model/leekwars` + `@/model/functions`) sont désormais INJECTÉES à l'enregistrement.
// Objectif : que le chunk de coloration des aperçus (monaco-highlight) n'importe AUCUN
// module applicatif. L'ancienne chaîne monarch -> leekwars -> @/router introduisait un
// cycle d'import : quand le chunk d'aperçu était le premier à évaluer ce cycle (ex. HMR d'un
// module du boot), il plantait sur un TDZ (`Cannot access 'router' before initialization`),
// l'import échouait et les blocs de code restaient sans coloration. Les données sont fournies
// au runtime par `leekwars.ts` (createCodeArea) et par `monaco.ts` (éditeur).
export function buildLeekScriptMonarch({ constants = [], functions = [], deprecatedFunctions = [] } = {}) {

	// Un identifiant qui porte le nom d'une fonction native n'en est pas forcément une : une
	// méthode ou une variable du joueur peut reprendre ce nom (une méthode maison
	// `getDistance` s'est retrouvée barrée le jour où la native l'est devenue). Monarch ne connaît
	// pas les symboles du fichier, mais certains CONTEXTES où le nom est forcément celui du joueur
	// se lisent sur la ligne : un membre d'un objet à lui, ou un nom qui suit un déclarateur.
	// Pas de lookbehind possible : Monarch teste chaque règle sur le reste de la ligne à partir de
	// la position courante, le texte qui précède est hors de portée. On reconnaît donc le contexte
	// et le nom d'un seul bloc, avec une action par groupe capturant.

	// ⚠️ Un point ne suffit PAS à dire « ce n'est pas une native » : les natives sont des méthodes
	// de classes standard (`Array.push`, `Number.sqrt`, `Field.getDistance`, et la même chose sur
	// une valeur : `a.push(x)`, `n.sqrt()`). Seul un receveur qui n'est PAS une classe standard
	// désigne à coup sûr du code du joueur. Liste = les classes déclarées par le compilateur
	// (MainLeekBlock.addClass) plus celles du jeu (les `method(…, "Classe", …)` de FightFunctions) ;
	// une classe standard oubliée ici ne coûte que l'italique de ses méthodes en notation pointée.
	const standardClasses = ['Array', 'BigInteger', 'Boolean', 'Chip', 'Class', 'Color', 'Entity',
		'Field', 'Fight', 'Function', 'Integer', 'Interval', 'JSON', 'Json', 'Map', 'Network', 'Null',
		'Number', 'Object', 'Real', 'Set', 'String', 'System', 'Util', 'Value', 'Weapon']
	// Types qui peuvent précéder un nom déclaré, modificateurs compris.
	const declarators = ['function', 'var', 'global', 'private', 'public', 'protected', 'static', 'final',
		'any', 'boolean', 'number', 'object', 'string', 'undefined', 'integer', 'real', 'array', 'map', 'void']
	const types = declarators.slice(8)

	// Le lookahead négatif empêche un déclarateur d'en avaler un autre : dans
	// `public static integer getDistance(`, `public` ne consomme pas `static`, si bien que la règle
	// finit par s'appliquer à la dernière paire, `integer getDistance`.
	const declaration = new RegExp(`(${declarators.join('|')})(\\s+)(?!(?:${declarators.join('|')})\\b)([a-z_$][\\w$]*)`)
	// `=> real randReal(…)` : le type de retour d'une lambda ressemble à une déclaration, mais ce
	// qui suit est un APPEL. On consomme l'annotation pour que la règle ci-dessus ne la voie pas.
	const lambdaReturnType = new RegExp(`(=>)(\\s*)(${types.join('|')})(?=\\s)`)
	// Membre d'un objet du joueur : `Cell.getDistance(…)`, mais pas `Field.getDistance(…)`.
	const userMember = new RegExp(`(?!(?:${standardClasses.join('|')})\\.)([A-Z][\\w$]*)(\\.)([a-z_$][\\w$]*)`)
	// `Array<Cell> getDistance(…)` : le lookahead valide toute la forme (type générique non imbriqué,
	// puis un nom et une parenthèse) AVANT d'entrer dans l'état, qui est donc certain d'en sortir sur
	// la même ligne. L'intérieur du générique garde sa coloration normale (`include: common`).
	const genericDeclaration = new RegExp(`[A-Z][\\w$]*(?=<[^<>]*>\\s+[a-z_$][\\w$]*\\s*\\()`)

	// Le nom déclaré garde sa couleur si c'est en fait un mot-clé ou un atome (`CHIP_BANDAGE in
	// chips`, `Cell instanceof x`) : seule la coloration « native » est neutralisée.
	const declaredName = (next) => ({
		cases: {
			'@typeKeywords': next ? { token: 'keyword', next } : 'keyword',
			'@keywords': next ? { token: 'keyword', next } : 'keyword',
			'@atom': next ? { token: 'atom', next } : 'atom',
			'@default': next ? { token: 'identifier', next } : 'identifier'
		}
	})
	// Un nom en majuscule en position de type : une constante reste une constante.
	const typeOrConstant = { cases: { '@lsConstants': 'lsconstant', '@default': 'type.identifier' } }
	const declaratorToken = { cases: { '@typeKeywords': 'keyword', '@keywords': 'keyword', '@default': 'identifier' } }

	return {

	defaultToken: 'invalid',
	tokenPostfix: '.js',

	keywords: [
		'break', 'case', 'class', 'continue',
		'constructor', 'default', 'do', 'else',
		'extends', 'for', 'function',
		'if', 'in', 'new',
		'return', 'super', 'switch', 'this',
		'var', 'void', 'while',
		'private', 'public', 'protected', 'static',
		'not', 'global', 'and', 'or', 'xor', 'instanceof',
		'as', 'final'
	],

	atom: [
		'true', 'false', 'null', 'NaN', 'Infinity'
	],

	lsConstants: constants,
	lsFunctions: functions,
	lsFunctionsDeprecated: deprecatedFunctions,

	typeKeywords: [
		'any', 'boolean', 'number', 'object', 'string', 'undefined',
		'integer', 'real'
	],

	operators: [
		'<=', '>=', '==', '!=', '===', '!==', '=>', '+', '-', '**',
		'*', '/', '\\', '%', '++', '--', '<<', '</', '>>', '>>>', '&',
		'|', '^', '!', '~', '&&', '||', '?', ':', '=', '+=', '-=',
		'*=', '**=', '/=', '\\=', '%=', '<<=', '>>=', '>>>=', '&=', '|=',
		'^=', '@'
	],

	// we include these common regular expressions
	// La suite d'opérateurs s'arrête net devant un `//` ou un `/*` : sans ce garde-fou elle
	// avalait le début du commentaire (`!/**/` tokenisé d'un seul bloc, donc pas de gris),
	// alors que `! /**/` passait grâce à l'espace qui coupait la suite.
	symbols: /(?:(?!\/[/*])[=><!~?:&|+\-*/^%\\])+/,
	escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
	digits: /\d+(_+\d+)*/,
	octaldigits: /[0-7]+(_+[0-7]+)*/,
	binarydigits: /[0-1]+(_+[0-1]+)*/,
	hexdigits: /[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,

	regexpctl: /[(){}[\]$^|\-*+?.]/,
	regexpesc: /\\(?:[bBdDfnrstvwWn0\\/]|@regexpctl|c[A-Z]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/,

	// The main tokenizer for our languages
	tokenizer: {
		root: [
			[/[{}]/, 'delimiter.bracket'],
			{ include: 'common' }
		],

		common: [
			// Annotation de type de retour d'une lambda : PAS une déclaration (cf. lambdaReturnType).
			[lambdaReturnType, ['delimiter', '', 'keyword']],
			// Membre d'un objet du joueur : `Cell.getDistance(…)`, `this.getDistance(…)`.
			[userMember, [typeOrConstant, 'delimiter', declaredName()]],
			[/(this|super)(\.)([a-z_$][\w$]*)/, ['keyword', 'delimiter', declaredName()]],
			// Nom déclaré : `function getDistance(…)`, `var getDistance = …`,
			// `public static integer getDistance(…)`.
			[declaration, [declaratorToken, '', declaredName()]],
			// Nom déclaré précédé d'un type objet : `Cell getDistance(…)`.
			[/([A-Z][\w$]*)(\s+)([a-z_$][\w$]*)/, [typeOrConstant, '', declaredName()]],
			// Nom déclaré précédé d'un type générique : `Array<Cell> getDistance(…)`.
			[genericDeclaration, { token: 'type.identifier', next: '@genericDeclaration' }],

			// identifiers and keywords
			[/[a-z_$][\w$]*/, {
				cases: {
					'@typeKeywords': 'keyword',
					'@keywords': 'keyword',
					'@lsFunctions': 'lsfunction',
					'@lsFunctionsDeprecated': 'lsfunction-deprecated',
					'@atom': 'atom',
					'@default': 'identifier'
				}
			}],
			[/[A-Z][\w$]*/, {
				cases: {
					'@lsConstants': 'lsconstant',
					'@default': 'type.identifier'
				}
			}],  // to show class names nicely
			// [/[A-Z][\w\$]*/, 'identifier'],

			// whitespace
			{ include: '@whitespace' },

			// regular expression: ensure it is terminated before beginning (otherwise it is an opeator)
			// [/\/(?=([^\\\/]|\\.)+\/([gimsuy]*)(\s*)(\.|;|\/|,|\)|\]|\}|$))/, { token: 'regexp', bracket: '@open', next: '@regexp' }],

			// delimiters and operators
			[/[()[\]]/, '@brackets'],
			[/[<>](?!@symbols)/, '@brackets'],
			[/@symbols/, {
				cases: {
					'@operators': 'delimiter',
					'@default': ''
				}
			}],

			// numbers
			[/(@digits)[eE]([-+]?(@digits))?/, 'number.float'],
			[/(@digits)\.(@digits)([eE][-+]?(@digits))?/, 'number.float'],
			[/0[xX](@hexdigits)/, 'number.hex'],
			[/0[oO]?(@octaldigits)/, 'number.octal'],
			[/0[bB](@binarydigits)/, 'number.binary'],
			[/(@digits)/, 'number'],

			// delimiter: after number because of .\d floats
			[/[;,.]/, 'delimiter'],

			// strings
			[/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
			[/'([^'\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
			[/"/, 'string', '@string_double'],
			[/'/, 'string', '@string_single'],
			// [/`/, 'string', '@string_backtick'],
		],

		// Intérieur d'un type générique en position de déclaration (cf. genericDeclaration) : on
		// colorie normalement jusqu'au `>`, qui rend la main en neutralisant le nom déclaré.
		genericDeclaration: [
			[/(>)(\s+)([a-z_$][\w$]*)/, ['delimiter.angle', '', declaredName('@pop')]],
			{ include: 'common' }
		],

		whitespace: [
			[/[ \t\r\n]+/, ''],
			[/\/\*\*(?!\/)/, 'comment.doc', '@jsdoc'],
			[/\/\*/, 'comment', '@comment'],
			[/\/\/.*$/, 'comment'],
		],

		comment: [
			[/[^/*]+/, 'comment'],
			[/\*\//, 'comment', '@pop'],
			[/[/*]/, 'comment']
		],

		jsdoc: [
			[/[^/*]+/, 'comment.doc'],
			[/\*\//, 'comment.doc', '@pop'],
			[/[/*]/, 'comment.doc']
		],

		// We match regular expression quite precisely
		// regexp: [
		// 	[/(\{)(\d+(?:,\d*)?)(\})/, ['regexp.escape.control', 'regexp.escape.control', 'regexp.escape.control']],
		// 	[/(\[)(\^?)(?=(?:[^\]\\\/]|\\.)+)/, ['regexp.escape.control', { token: 'regexp.escape.control', next: '@regexrange' }]],
		// 	[/(\()(\?:|\?=|\?!)/, ['regexp.escape.control', 'regexp.escape.control']],
		// 	[/[()]/, 'regexp.escape.control'],
		// 	[/@regexpctl/, 'regexp.escape.control'],
		// 	[/[^\\\/]/, 'regexp'],
		// 	[/@regexpesc/, 'regexp.escape'],
		// 	[/\\\./, 'regexp.invalid'],
		// 	[/(\/)([gimsuy]*)/, [{ token: 'regexp', bracket: '@close', next: '@pop' }, 'keyword.other']],
		// ],

		// regexrange: [
		// 	[/-/, 'regexp.escape.control'],
		// 	[/\^/, 'regexp.invalid'],
		// 	[/@regexpesc/, 'regexp.escape'],
		// 	[/[^\]]/, 'regexp'],
		// 	[/\]/, { token: 'regexp.escape.control', next: '@pop', bracket: '@close' }],
		// ],

		string_double: [
			[/[^\\"]+/, 'string'],
			[/@escapes/, 'string.escape'],
			[/\\./, 'string.escape.invalid'],
			[/"/, 'string', '@pop']
		],

		string_single: [
			[/[^\\']+/, 'string'],
			[/@escapes/, 'string.escape'],
			[/\\./, 'string.escape.invalid'],
			[/'/, 'string', '@pop']
		],

		// string_backtick: [
		// 	[/\$\{/, { token: 'delimiter.bracket', next: '@bracketCounting' }],
		// 	[/[^\\`$]+/, 'string'],
		// 	[/@escapes/, 'string.escape'],
		// 	[/\\./, 'string.escape.invalid'],
		// 	[/`/, 'string', '@pop']
		// ],

		bracketCounting: [
			[/\{/, 'delimiter.bracket', '@bracketCounting'],
			[/\}/, 'delimiter.bracket', '@pop'],
			{ include: 'common' }
		],
	},
	}
}
