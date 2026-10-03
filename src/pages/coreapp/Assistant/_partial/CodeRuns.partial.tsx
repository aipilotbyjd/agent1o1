import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, SquareTerminal } from 'lucide-react';
import type { TAssistantCodeRun } from '@/types/assistant.type';

interface ICodeRunsProps {
	runs: TAssistantCodeRun[];
}

/** Code the assistant ran on its cloud computer, with what it printed — collapsed by default. */
const CodeRunsPartial = ({ runs }: ICodeRunsProps) => {
	const { t } = useTranslation();
	const [open, setOpen] = useState<string | null>(null);

	return (
		<div className='mb-2 flex flex-col gap-1.5'>
			{runs.map((run, index) => {
				const key = run.id ?? String(index);
				const isOpen = open === key;
				const output = [run.output.stdout, ...(run.output.results ?? []), run.output.stderr]
					.filter(Boolean)
					.join('\n');

				return (
					<div
						key={key}
						className='overflow-hidden rounded-xl border border-zinc-200 dark:border-white/10'>
						<button
							type='button'
							onClick={() => setOpen(isOpen ? null : key)}
							aria-expanded={isOpen}
							className='flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/5'>
							{isOpen ? (
								<ChevronDown className='h-3 w-3' />
							) : (
								<ChevronRight className='h-3 w-3' />
							)}
							<SquareTerminal className='h-3.5 w-3.5' />
							<span className='font-medium'>
								{t('assistant.ranCode', { language: run.language })}
							</span>
							{run.output.error && (
								<span className='text-rose-500'>{t('assistant.codeFailed')}</span>
							)}
							{run.output.seconds !== undefined && (
								<span className='ml-auto'>{run.output.seconds}s</span>
							)}
						</button>
						{isOpen && (
							<div className='border-t border-zinc-200 text-[11px] dark:border-white/10'>
								<pre className='max-h-64 overflow-auto bg-zinc-50 p-3 font-mono whitespace-pre text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300'>
									{run.code}
								</pre>
								{run.output.note && (
									<p className='px-3 pt-2 text-amber-600'>{run.output.note}</p>
								)}
								{output && (
									<pre className='max-h-64 overflow-auto p-3 font-mono whitespace-pre-wrap text-zinc-600 dark:text-zinc-400'>
										{output}
									</pre>
								)}
								{run.output.error && (
									<pre className='max-h-48 overflow-auto p-3 font-mono whitespace-pre-wrap text-rose-600'>
										{run.output.error}
									</pre>
								)}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};

export default CodeRunsPartial;
