module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: [
		'@typescript-eslint',
	],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
	],
	"ignorePatterns": ["*.js"],
	"overrides": [
		{
			"files": ["*.ts"],
			"rules": {
				"@typescript-eslint/no-inferrable-types": "off",
				"@typescript-eslint/explicit-module-boundary-types": "off"
			}
		}
	]
};