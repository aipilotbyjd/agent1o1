export const INVOICE_STATUS_STYLES: Record<string, string> = {
	paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
	open: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
	draft: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
	void: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
	uncollectible: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
};

export const fmtInvoiceDate = (value: string | null) =>
	value
		? new Date(value).toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			})
		: '—';
