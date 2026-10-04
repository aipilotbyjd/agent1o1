const suggestions = [
	'Add an Output node to every production workflow.',
	'Use Extract Data when downstream steps need structured JSON.',
	'Keep credentials in integration nodes instead of plain text fields.',
];

const AiSuggestions = () => (
	<div className='space-y-2'>
		<div className='text-xs font-black tracking-widest text-zinc-500 uppercase dark:text-zinc-400'>
			Suggestions
		</div>
		{suggestions.map((suggestion) => (
			<div
				key={suggestion}
				className='rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300'>
				{suggestion}
			</div>
		))}
	</div>
);

export default AiSuggestions;
