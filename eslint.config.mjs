import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
	{
		ignores: ['dist/**', 'node_modules/**', '**/*.js'],
	},

	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
		},
	},

	eslint.configs.recommended,

	...tseslint.configs.recommended,

	...pluginVue.configs['flat/essential'],

	{
		files: ['**/*.vue'],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser,
			},
		},
	},

	{
		files: ['**/*.ts', '**/*.vue'],
		rules: {
			'@typescript-eslint/no-inferrable-types': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
		},
	},

	{
		files: ['**/*.vue'],
		rules: {
			// In <script setup>, component imports (PascalCase) are used in the
			// template but neither no-unused-vars nor @typescript-eslint/no-unused-vars
			// can detect template usage (known ecosystem limitation).
			'@typescript-eslint/no-unused-vars': ['error', {
				varsIgnorePattern: '^[A-Z]',
				argsIgnorePattern: '^_',
			}],
			'vue/attribute-hyphenation': 'error',
			'vue/html-end-tags': 'error',
			'vue/mustache-interpolation-spacing': 'error',
			'vue/component-definition-name-casing': 'error',
			'vue/no-multi-spaces': 'error',
			'vue/require-default-prop': 'error',
			'vue/require-prop-types': 'error',
			'vue/v-bind-style': 'error',
			'vue/v-on-style': 'error',
			'vue/attributes-order': 'error',
			'vue/html-quotes': 'error',
			'vue/html-indent': ['error', 'tab', {
				'attribute': 1,
				'closeBracket': 0,
				'alignAttributesVertically': true,
			}],
			'vue/html-self-closing': ['error', {
				'html': {
					'normal': 'never',
					'component': 'always',
				},
				'svg': 'always',
			}],
			'vue/this-in-template': ['error', 'never'],
			'vue/html-closing-bracket-spacing': ['error', {
				'startTag': 'never',
				'endTag': 'never',
				'selfClosingTag': 'always',
			}],
			'vue/no-use-v-if-with-v-for': 'off',
			'vue/multi-word-component-names': 'off',
		},
	},

	eslintConfigPrettier,
)
