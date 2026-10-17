import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, OctagonAlert, X } from 'lucide-react';
import type { TPageIssue } from '@/types/workflow-page.type';
import { usePageBuilder } from '../_context/PageBuilder.context';
import { usePageBuilderStore } from '../_store/pageBuilder.store';

export const IssueList = ({ issues, onPick }: { issues: TPageIssue[]; onPick?: () => void }) => {
	const select = usePageBuilderStore((store) => store.select);
	return (
		<ul className='space-y-1.5'>
			{issues.map((issue, index) => {
				const Icon = issue.severity === 'error' ? OctagonAlert : AlertTriangle;
				const content = (
					<>
						<Icon
							size={13}
							className={`mt-0.5 shrink-0 ${issue.severity === 'error' ? 'text-rose-500' : 'text-amber-500'}`}
						/>
						<span>{issue.message}</span>
					</>
				);
				return (
					<li key={`${issue.code}-${index}`}>
						{issue.block_id ? (
							<button
								type='button'
								onClick={() => {
									select(issue.block_id);
									onPick?.();
								}}
								className='flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] leading-snug text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.05]'>
								{content}
							</button>
						) : (
							<div className='flex items-start gap-2 px-2 py-1.5 text-[11px] leading-snug text-zinc-700 dark:text-zinc-300'>
								{content}
							</div>
						)}
					</li>
				);
			})}
		</ul>
	);
};

/** The canvas's corner badge: what the last save found wrong with the page. */
const IssuesChip = () => {
	const { page, saveState } = usePageBuilder();
	const [open, setOpen] = useState(false);
	const errors = page.issues.filter((issue) => issue.severity === 'error').length;
	const warnings = page.issues.length - errors;
	const stale = saveState === 'dirty' || saveState === 'saving';

	return (
		<div className='absolute bottom-4 left-4 z-30' onClick={(event) => event.stopPropagation()}>
			<AnimatePresence>
				{open && page.issues.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 6 }}
						className='absolute bottom-11 left-0 w-80 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-zinc-950'>
						<div className='flex items-center justify-between px-2 pt-1 pb-2'>
							<p className='text-xs font-bold text-zinc-900 dark:text-zinc-100'>Before you publish</p>
							<button type='button' aria-label='Close' onClick={() => setOpen(false)} className='text-zinc-400 hover:text-zinc-700'>
								<X size={14} />
							</button>
						</div>
						<IssueList issues={page.issues} onPick={() => setOpen(false)} />
					</motion.div>
				)}
			</AnimatePresence>
			<button
				type='button'
				onClick={() => setOpen((value) => !value)}
				disabled={page.issues.length === 0}
				className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-bold shadow-md backdrop-blur transition ${
					errors > 0
						? 'border-rose-200 bg-rose-50/95 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300'
						: warnings > 0
							? 'border-amber-200 bg-amber-50/95 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300'
							: 'border-emerald-200 bg-emerald-50/95 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300'
				} ${stale ? 'opacity-70' : ''}`}>
				{errors > 0 ? <OctagonAlert size={14} /> : warnings > 0 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
				{errors > 0
					? `${errors} to fix${warnings ? ` · ${warnings} warning${warnings > 1 ? 's' : ''}` : ''}`
					: warnings > 0
						? `${warnings} warning${warnings > 1 ? 's' : ''}`
						: 'Ready to publish'}
			</button>
		</div>
	);
};

export default IssuesChip;
