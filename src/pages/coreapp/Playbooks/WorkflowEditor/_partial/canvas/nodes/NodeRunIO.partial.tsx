import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ChevronDown, ChevronRight, Pin } from 'lucide-react';

const preview = (value: unknown) => {
	if (value === undefined) return '';
	const json = JSON.stringify(value);
	if (json === undefined) return String(value);
	return json.length > 42 ? `${json.slice(0, 42)}…` : json;
};

const Section = ({
	label,
	icon,
	value,
	defaultOpen,
}: {
	label: string;
	icon: React.ReactNode;
	value: unknown;
	defaultOpen: boolean;
}) => {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<div className='rounded-md border border-zinc-200 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/40'>
			<button
				type='button'
				title={open ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
				onClick={(e) => {
					e.stopPropagation();
					setOpen((prev) => !prev);
				}}
				className='flex w-full items-center gap-1.5 px-2 py-1.5 text-left'>
				<span className='shrink-0 text-zinc-400'>
					{open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
				</span>
				<span className='shrink-0 text-zinc-400'>{icon}</span>
				<span className='shrink-0 text-[10px] font-bold tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
					{label}
				</span>
				{!open && (
					<span className='truncate font-mono text-[10px] text-zinc-400 dark:text-zinc-500'>
						{preview(value)}
					</span>
				)}
			</button>
			{open && (
				<pre className='nowheel max-h-28 overflow-auto border-t border-zinc-200 px-2 py-1.5 font-mono text-[10px] leading-snug whitespace-pre-wrap text-zinc-600 dark:border-zinc-800 dark:text-zinc-400'>
					{JSON.stringify(value, null, 2)}
				</pre>
			)}
		</div>
	);
};

/**
 * Resolved input and output for the node's most recent run, shown on the card
 * itself so data flow is visible without opening the run panel.
 */
const NodeRunIO = ({
	inputPreview,
	outputPreview,
	pinned,
	pinnedOutput,
}: {
	inputPreview?: unknown;
	outputPreview?: unknown;
	pinned?: boolean;
	pinnedOutput?: unknown;
}) => {
	const shownOutput = pinned ? pinnedOutput : outputPreview;
	const hasInput = inputPreview !== undefined;
	const hasOutput = shownOutput !== undefined;

	if (!hasInput && !hasOutput) return null;

	return (
		<div className='mt-3 space-y-1.5'>
			{hasInput && (
				<Section
					label='Input'
					icon={<ArrowDownToLine size={9} />}
					value={inputPreview}
					defaultOpen={false}
				/>
			)}
			{hasOutput && (
				<Section
					label={pinned ? 'Output (pinned)' : 'Output'}
					icon={pinned ? <Pin size={9} /> : <ArrowUpFromLine size={9} />}
					value={shownOutput}
					defaultOpen
				/>
			)}
		</div>
	);
};

export default NodeRunIO;
