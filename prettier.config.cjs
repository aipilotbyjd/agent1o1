const config = {
	plugins: ['prettier-plugin-tailwindcss'],
	printWidth: 100,
	tabWidth: 4,
	useTabs: true,
	semi: true,
	singleQuote: true,
	jsxSingleQuote: true,
	trailingComma: 'all',
	bracketSameLine: true,
	arrowParens: 'always',
	endOfLine: 'lf',
	overrides: [{ files: ['*.yml', '*.yaml'], options: { tabWidth: 2 } }],
};

module.exports = config;
