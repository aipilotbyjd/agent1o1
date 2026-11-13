type Props = {
	title: string;
	values: Record<string, unknown>;
	tone?: 'neutral' | 'success';
};

const display = (value: unknown) =>
	value === null || value === undefined
		? '-'
		: typeof value === 'string'
			? value
			: JSON.stringify(value, null, 2);

const RunValues = ({ title, values, tone = 'neutral' }: Props) => {
	const entries = Object.entries(values);

	return (
		<section
			aria-label={title}
			className={`mb-6 rounded-lg border p-3.5 ${tone === 'success' ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/15 dark:bg-emerald-500/[0.04]' : 'border-zinc-200 bg-zinc-50/60 dark:border-white/10 dark:bg-white/[0.02]'}`}>
			<h3 className='text-xs font-semibold'>{title}</h3>
			{entries.length === 0 ? (
				<p className='mt-2 text-xs text-zinc-500 dark:text-zinc-400'>Nothing returned.</p>
			) : (
				<dl className='mt-2.5 space-y-2.5'>
					{entries.map(([key, value]) => (
						<div key={key} className='min-w-0'>
							<dt className='text-[11px] font-medium text-zinc-500 dark:text-zinc-400'>
								{key}
							</dt>
							<dd className='mt-0.5 text-xs leading-relaxed break-words whitespace-pre-wrap text-zinc-800 dark:text-zinc-200'>
								{display(value)}
							</dd>
						</div>
					))}
				</dl>
			)}
		</section>
	);
};

export default RunValues;
