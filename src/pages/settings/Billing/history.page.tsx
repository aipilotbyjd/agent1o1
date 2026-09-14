import { useState } from 'react';
import { useWorkspaceContext } from '@/context/workspaceContext';
import { useCreditTransactions } from '../_shared/billing.helper';
import type { TCreditTransactionType } from '../_shared/billing.types';

const TX_LABELS: Record<TCreditTransactionType, { label: string; color: string }> = {
	node_run: {
		label: 'Workflow Run',
		color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
	},
	agent_step: {
		label: 'Agent Step',
		color: 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-400',
	},
	eval_case: {
		label: 'Evaluation',
		color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
	},
	session_evaluation: {
		label: 'Session Review',
		color: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
	},
};

const HistoryPage = () => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const [typeFilter, setTypeFilter] = useState<TCreditTransactionType | ''>('');
	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');
	const [page, setPage] = useState(1);

	// GET /billing/credits takes only `page` — type and date range are
	// applied to the fetched page here.
	const { data, isLoading } = useCreditTransactions(activeWorkspaceId, { page });

	const transactions = (data?.data ?? []).filter((tx) => {
		if (typeFilter && tx.type !== typeFilter) return false;
		const at = new Date(tx.created_at).getTime();
		if (from && at < new Date(from).getTime()) return false;
		if (to && at > new Date(`${to}T23:59:59`).getTime()) return false;
		return true;
	});
	const meta = data?.meta;
	const lastPage = meta?.last_page ?? 1;

	return (
		<div className='space-y-6 text-zinc-950 dark:text-zinc-50'>
			{/* Header */}
			<div>
				<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>History</h1>
				<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
					Full credit transaction log for this workspace.
				</p>
			</div>

			{/* Filters */}
			<div className='flex flex-wrap items-center gap-3'>
				<select
					value={typeFilter}
					onChange={(e) => {
						setTypeFilter(e.target.value as TCreditTransactionType | '');
						setPage(1);
					}}
					className='rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
					<option value=''>All types</option>
					{(Object.keys(TX_LABELS) as TCreditTransactionType[]).map((t) => (
						<option key={t} value={t}>
							{TX_LABELS[t].label}
						</option>
					))}
				</select>

				<input
					type='date'
					value={from}
					onChange={(e) => {
						setFrom(e.target.value);
						setPage(1);
					}}
					className='rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
					placeholder='From'
				/>
				<input
					type='date'
					value={to}
					onChange={(e) => {
						setTo(e.target.value);
						setPage(1);
					}}
					className='rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
					placeholder='To'
				/>

				{(typeFilter || from || to) && (
					<button
						type='button'
						onClick={() => {
							setTypeFilter('');
							setFrom('');
							setTo('');
							setPage(1);
						}}
						className='rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-500 shadow-sm hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:text-zinc-100'>
						Clear
					</button>
				)}
			</div>

			{/* Table */}
			{isLoading ? (
				<div className='space-y-2'>
					{[...Array(8)].map((_, i) => (
						<div
							key={i}
							className='h-12 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800'
						/>
					))}
				</div>
			) : transactions.length === 0 ? (
				<div className='rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900'>
					<p className='text-sm font-semibold text-zinc-400'>No transactions found.</p>
				</div>
			) : (
				<div className='overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900'>
					{/* Column headers */}
					<div className='grid grid-cols-[1fr_2fr_auto_auto] gap-4 border-b border-zinc-100 px-5 py-3 dark:border-zinc-800'>
						<span className='text-xs font-bold tracking-widest text-zinc-400 uppercase'>
							Type
						</span>
						<span className='text-xs font-bold tracking-widest text-zinc-400 uppercase'>
							Description
						</span>
						<span className='text-xs font-bold tracking-widest text-zinc-400 uppercase'>
							Credits
						</span>
						<span className='text-xs font-bold tracking-widest text-zinc-400 uppercase'>
							Date
						</span>
					</div>

					{transactions.map((tx, i) => {
						const cfg = TX_LABELS[tx.type] ?? {
							label: tx.type,
							color: 'bg-zinc-100 text-zinc-600',
						};
						const isNeg = tx.credits < 0;
						return (
							<div
								key={tx.id}
								className={`grid grid-cols-[1fr_2fr_auto_auto] items-center gap-4 px-5 py-3.5 ${i > 0 ? 'border-t border-zinc-100 dark:border-zinc-800' : ''}`}>
								<span
									className={`w-fit rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg.color}`}>
									{cfg.label}
								</span>
								<span className='truncate text-sm text-zinc-600 dark:text-zinc-400'>
									{tx.description || '—'}
								</span>
								<span
									className={`text-sm font-black ${isNeg ? 'text-red-500' : 'text-emerald-500'}`}>
									{isNeg ? '' : '+'}
									{tx.credits.toLocaleString()}
								</span>
								<span className='text-xs text-zinc-400'>
									{new Date(tx.created_at).toLocaleDateString(undefined, {
										month: 'short',
										day: 'numeric',
										year: 'numeric',
									})}
								</span>
							</div>
						);
					})}
				</div>
			)}

			{/* Pagination */}
			{lastPage > 1 && (
				<div className='flex items-center justify-between'>
					<button
						type='button'
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page === 1}
						className='rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
						← Previous
					</button>
					<span className='text-sm font-semibold text-zinc-400'>
						Page {page} of {lastPage}
					</span>
					<button
						type='button'
						onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
						disabled={page === lastPage}
						className='rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
						Next →
					</button>
				</div>
			)}
		</div>
	);
};

export default HistoryPage;
