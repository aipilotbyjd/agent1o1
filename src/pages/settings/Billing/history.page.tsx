import { useState } from 'react';
import { useWorkspaceContext } from '@/context/workspace';
import { useCredits } from '@/api/modules/billing';

const SOURCE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
	node_run: {
		label: 'Workflow Run',
		color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
	},
	agent_step: {
		label: 'Agent Step',
		color: 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-400',
	},
	eval_case: {
		label: 'Eval Case',
		color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
	},
	session_evaluation: {
		label: 'Session Evaluation',
		color: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
	},
};

const HistoryPage = () => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const [page, setPage] = useState(1);

	const { data, isLoading } = useCredits(activeWorkspaceId, { page, per_page: 25 });

	const transactions = data?.transactions ?? [];
	const meta = data?.meta;
	const lastPage = meta?.last_page ?? 1;

	return (
		<div className='space-y-6 text-zinc-950 dark:text-zinc-50'>
			{/* Header */}
			<div>
				<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
					History
				</h1>
				<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
					Full credit transaction log for this workspace.
				</p>
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
							Reason
						</span>
						<span className='text-xs font-bold tracking-widest text-zinc-400 uppercase'>
							Credits
						</span>
						<span className='text-xs font-bold tracking-widest text-zinc-400 uppercase'>
							Date
						</span>
					</div>

					{transactions.map((tx, i) => {
						const cfg = SOURCE_TYPE_LABELS[tx.source_type] ?? {
							label: tx.source_type,
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
									{tx.reason || '—'}
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
