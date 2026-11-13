import { useState } from 'react';
import { ChevronRight, Copy, Loader2, RefreshCw } from 'lucide-react';
import { copyWithNotice } from '@/pages/coreapp/Playbooks/WorkflowEditor/_helper/trigger.helper';
import { useTriggerSample } from '@/api/modules/triggers';
import type { TTriggerSampleItem } from '@/types/trigger.type';

const SampleItem = ({ item }: { item: TTriggerSampleItem }) => {
	const [open, setOpen] = useState(false);
	const json = JSON.stringify(item.payload, null, 2);
	const preview =
		typeof item.payload.text === 'string'
			? item.payload.text
			: typeof item.payload.subject === 'string'
				? item.payload.subject
				: typeof item.payload.name === 'string'
					? item.payload.name
					: item.id;

	return (
		<li className='rounded-md bg-white/70 dark:bg-zinc-900/70'>
			<div className='flex items-center gap-1.5 px-1.5 py-1'>
				<button
					type='button'
					aria-expanded={open}
					onClick={() => setOpen((value) => !value)}
					className='flex min-w-0 flex-1 cursor-pointer items-center gap-1 text-left text-[9px]'>
					<ChevronRight
						size={10}
						className={`shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-90' : ''}`}
					/>
					<span className='truncate font-semibold text-zinc-700 dark:text-zinc-300'>
						{preview}
					</span>
				</button>
				<button
					type='button'
					title='Copy this item as JSON'
					onClick={() => void copyWithNotice(json, 'Sample')}
					className='hover:text-primary-900 dark:hover:text-primary-400 shrink-0 cursor-pointer text-zinc-400 transition'>
					<Copy size={10} />
				</button>
			</div>
			{open && (
				<pre className='max-h-48 overflow-auto rounded-b-md bg-zinc-50 p-2 font-mono text-[9px] leading-relaxed text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300'>
					{json}
				</pre>
			)}
		</li>
	);
};

type TProps = {
	ws: string;
	triggerId: string;
};

/**
 * Shows what the trigger sees right now, so fields can be mapped from real
 * data before the first event arrives. Reads the connected app only when
 * asked, and records and starts nothing.
 */
const TriggerSample = ({ ws, triggerId }: TProps) => {
	const sample = useTriggerSample(ws);

	return (
		<div className='flex flex-col gap-1'>
			<div className='flex items-center justify-between'>
				<span className='text-[10px] font-semibold text-zinc-500 dark:text-zinc-400'>
					Sample data
				</span>
				<button
					type='button'
					disabled={sample.isPending}
					onClick={() => sample.mutate(triggerId)}
					className='hover:border-primary-300 hover:text-primary-900 dark:hover:text-primary-400 flex cursor-pointer items-center gap-1 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-zinc-600 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'>
					{sample.isPending ? (
						<Loader2 size={9} className='animate-spin' />
					) : (
						<RefreshCw size={9} />
					)}
					{sample.data ? 'Fetch again' : 'Fetch sample'}
				</button>
			</div>
			{sample.isError && (
				<span className='text-[9px] text-rose-500'>
					Couldn’t read a sample. Check the connected account and try again.
				</span>
			)}
			{sample.data && sample.data.length === 0 && (
				<span className='text-[9px] text-zinc-400'>
					Nothing to show yet. Items appear here once the app has some.
				</span>
			)}
			{sample.data && sample.data.length > 0 && (
				<ul className='flex flex-col gap-1'>
					{sample.data.map((item) => (
						<SampleItem key={item.id} item={item} />
					))}
				</ul>
			)}
		</div>
	);
};

export default TriggerSample;
