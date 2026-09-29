import type { FC, ReactNode } from 'react';
import classNames from 'classnames';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import type { TPaginationMeta } from '@/api/core';
import { TONE_PILL, type TTone } from '../_helper/referral.helper';

// Small building blocks shared by the "Refer & earn" page and the admin
// referral screens, so both read as one feature.

export const Pill: FC<{ tone: TTone; children: ReactNode }> = ({ tone, children }) => (
	<span
		className={classNames(
			'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black whitespace-nowrap',
			TONE_PILL[tone],
		)}>
		{children}
	</span>
);

export const StatTile: FC<{ label: string; value: ReactNode; hint?: ReactNode }> = ({
	label,
	value,
	hint,
}) => (
	<div className='rounded-2xl border border-zinc-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/60'>
		<p className='text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
			{label}
		</p>
		<p className='mt-2 text-2xl font-black tracking-tight text-zinc-950 tabular-nums dark:text-zinc-50'>
			{value}
		</p>
		{hint && <p className='mt-1 text-xs font-semibold text-zinc-400'>{hint}</p>}
	</div>
);

export const SectionCard: FC<{
	title: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
	children: ReactNode;
	className?: string;
}> = ({ title, description, actions, children, className }) => (
	<section
		className={classNames(
			'rounded-2xl border border-zinc-100 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/60',
			className,
		)}>
		<div className='mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start'>
			<div>
				<h2 className='text-lg font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
					{title}
				</h2>
				{description && (
					<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
						{description}
					</p>
				)}
			</div>
			{actions && <div className='flex shrink-0 flex-wrap gap-2'>{actions}</div>}
		</div>
		{children}
	</section>
);

export const LoadingBlock: FC<{ label?: string }> = ({ label = 'Loading…' }) => (
	<div className='flex flex-col items-center justify-center py-14'>
		<Spinner color='primary' className='size-7' />
		<p className='mt-2.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400'>{label}</p>
	</div>
);

export const EmptyBlock: FC<{ children: ReactNode }> = ({ children }) => (
	<p className='rounded-2xl border border-dashed border-zinc-200 py-10 text-center text-sm font-semibold text-zinc-400 dark:border-zinc-800'>
		{children}
	</p>
);

export const Pager: FC<{ meta?: TPaginationMeta; onPage: (page: number) => void }> = ({
	meta,
	onPage,
}) => {
	if (!meta || meta.last_page <= 1) return null;

	return (
		<div className='mt-4 flex items-center justify-between text-xs font-bold text-zinc-500'>
			<span>
				Page {meta.current_page} of {meta.last_page} · {meta.total} total
			</span>
			<div className='flex gap-2'>
				<button
					type='button'
					aria-label='Previous page'
					disabled={meta.current_page <= 1}
					onClick={() => onPage(meta.current_page - 1)}
					className='flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 transition hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800'>
					<ChevronLeft size={14} />
				</button>
				<button
					type='button'
					aria-label='Next page'
					disabled={meta.current_page >= meta.last_page}
					onClick={() => onPage(meta.current_page + 1)}
					className='flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 transition hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800'>
					<ChevronRight size={14} />
				</button>
			</div>
		</div>
	);
};

/** Matches the settings pages' hand-rolled inputs (see the Tags search box). */
export const fieldClass =
	'focus:border-primary-500 focus:ring-primary-500/25 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 shadow-xs outline-none focus:ring-2 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';

export const Field: FC<{
	label: string;
	hint?: ReactNode;
	error?: string | null;
	children: ReactNode;
}> = ({ label, hint, error, children }) => (
	<label className='block'>
		<span className='mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
			{label}
		</span>
		{children}
		{hint && !error && (
			<span className='mt-1 block text-[11px] font-medium text-zinc-400'>{hint}</span>
		)}
		{error && <span className='mt-1 block text-xs font-semibold text-red-500'>{error}</span>}
	</label>
);

export const TableShell: FC<{ head: string[]; children: ReactNode }> = ({ head, children }) => (
	<div className='overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800'>
		<table className='w-full min-w-[640px] text-left text-sm'>
			<thead className='bg-zinc-50 text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:bg-zinc-900/60'>
				<tr>
					{head.map((cell) => (
						<th key={cell} className='px-4 py-2.5'>
							{cell}
						</th>
					))}
				</tr>
			</thead>
			<tbody className='divide-y divide-zinc-100 dark:divide-zinc-800'>{children}</tbody>
		</table>
	</div>
);

export const Td: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
	<td className={classNames('px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300', className)}>
		{children}
	</td>
);
