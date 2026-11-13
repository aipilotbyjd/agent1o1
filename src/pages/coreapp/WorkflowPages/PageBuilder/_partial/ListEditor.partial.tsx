import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

type Props<T> = {
	items: T[];
	onChange: (items: T[]) => void;
	/** A fresh item for the Add button. */
	create: () => T;
	max: number;
	addLabel: string;
	title: (item: T, index: number) => string;
	children: (item: T, update: (patch: Partial<T>) => void) => ReactNode;
};

/** Edits a block's list of items (questions, numbers, logos, tabs) in place. */
const ListEditor = <T extends object>({
	items,
	onChange,
	create,
	max,
	addLabel,
	title,
	children,
}: Props<T>) => {
	const update = (index: number, patch: Partial<T>) =>
		onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
	const move = (index: number, by: -1 | 1) => {
		const next = [...items];
		const [moved] = next.splice(index, 1);
		next.splice(index + by, 0, moved);
		onChange(next);
	};

	return (
		<div className='space-y-2'>
			{items.map((item, index) => (
				<div
					key={index}
					className='space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/60 p-2.5 dark:border-white/10 dark:bg-white/[0.02]'>
					<div className='flex items-center gap-1'>
						<span className='min-w-0 flex-1 truncate text-[11px] font-bold text-zinc-600 dark:text-zinc-300'>
							{title(item, index)}
						</span>
						<button
							type='button'
							aria-label='Move up'
							disabled={index === 0}
							onClick={() => move(index, -1)}
							className='rounded p-1 text-zinc-400 transition hover:bg-zinc-200/60 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-white/10'>
							<ArrowUp size={11} />
						</button>
						<button
							type='button'
							aria-label='Move down'
							disabled={index === items.length - 1}
							onClick={() => move(index, 1)}
							className='rounded p-1 text-zinc-400 transition hover:bg-zinc-200/60 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-white/10'>
							<ArrowDown size={11} />
						</button>
						<button
							type='button'
							aria-label='Remove'
							onClick={() => onChange(items.filter((_, i) => i !== index))}
							className='rounded p-1 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10'>
							<Trash2 size={11} />
						</button>
					</div>
					{children(item, (patch) => update(index, patch))}
				</div>
			))}
			{items.length < max && (
				<button
					type='button'
					onClick={() => onChange([...items, create()])}
					className='hover:border-primary-400 hover:text-primary-700 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 text-[11px] font-semibold text-zinc-500 transition dark:border-white/15 dark:text-zinc-400'>
					<Plus size={12} /> {addLabel}
				</button>
			)}
		</div>
	);
};

export default ListEditor;
