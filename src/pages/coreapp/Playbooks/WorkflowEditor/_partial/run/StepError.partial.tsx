import { useState } from 'react';
import { Check, CircleAlert, Copy } from 'lucide-react';
import { notify } from '@/api/core';

const StepError = ({ message, title = 'Error' }: { message?: string; title?: string }) => {
	const [copied, setCopied] = useState(false);
	const text = message?.trim() || 'The step failed without an error message.';

	return (
		<div className='overflow-hidden rounded-lg border border-rose-200 dark:border-rose-500/25'>
			<div className='flex items-center justify-between gap-2 bg-rose-50 px-3 py-2 dark:bg-rose-500/10'>
				<span className='flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300'>
					<CircleAlert size={13} />
					{title}
				</span>
				<button
					type='button'
					title='Copy error'
					aria-label='Copy error'
					onClick={async () => {
						try {
							await navigator.clipboard.writeText(text);
							setCopied(true);
							setTimeout(() => setCopied(false), 1400);
						} catch {
							notify.error('Could not copy the error');
						}
					}}
					className='flex h-6 w-6 items-center justify-center rounded-md text-rose-400 transition hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-500/15 dark:hover:text-rose-200'>
					{copied ? <Check size={12} /> : <Copy size={12} />}
				</button>
			</div>
			<pre className='max-h-48 overflow-auto bg-white px-3 py-2.5 font-mono text-[11.5px] leading-relaxed break-words whitespace-pre-wrap text-rose-700 dark:bg-transparent dark:text-rose-300'>
				{text}
			</pre>
		</div>
	);
};

export default StepError;
