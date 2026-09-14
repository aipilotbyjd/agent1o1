// ============================================================
// Dashboard constants
// ------------------------------------------------------------
// Status badge palette keyed by the API's run statuses
// (TRunStatus) rather than the old execution-status vocabulary.
// ============================================================
import type { TRunStatus } from '@/types/run.type';

export const STATUS_BADGE_COLORS: Record<TRunStatus, { bg: string; text: string }> = {
	completed: {
		bg: 'bg-emerald-100 dark:bg-emerald-900/30',
		text: 'text-emerald-600 dark:text-emerald-400',
	},
	failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
	running: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
	pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
	cancelled: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400' },
	awaiting_approval: {
		bg: 'bg-primary-100 dark:bg-primary-900/30',
		text: 'text-primary-600 dark:text-primary-400',
	},
	awaiting_callback: {
		bg: 'bg-violet-100 dark:bg-violet-900/30',
		text: 'text-violet-600 dark:text-violet-400',
	},
};
