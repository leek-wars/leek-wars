import type { languages } from 'monaco-editor'

// Minimal Monarch grammar for syntax-highlighting only.
// monaco-editor doesn't ship a basic-languages JSON grammar; the full
// `vs/language/json` service drags in a Worker we don't need.

const pairs = [
	{ open: '{', close: '}' },
	{ open: '[', close: ']' },
	{ open: '"', close: '"' },
]

export const config: languages.LanguageConfiguration = {
	comments: { lineComment: '//', blockComment: ['/*', '*/'] },
	brackets: [['{', '}'], ['[', ']']],
	autoClosingPairs: pairs,
	surroundingPairs: pairs,
}

export const tokens: languages.IMonarchLanguage = {
	defaultToken: 'invalid',
	tokenPostfix: '.json',
	tokenizer: {
		root: [
			[/[{}[\],:]/, 'delimiter'],
			[/"(?:[^"\\]|\\.)*"/, 'string'],
			[/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/, 'number'],
			[/\b(?:true|false|null)\b/, 'keyword'],
			[/[ \t\r\n]+/, ''],
			[/\/\/.*$/, 'comment'],
			[/\/\*/, 'comment', '@comment'],
		],
		comment: [
			[/[^/*]+/, 'comment'],
			[/\*\//, 'comment', '@pop'],
			[/[/*]/, 'comment'],
		],
	},
}
