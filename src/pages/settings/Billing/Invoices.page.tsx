import { useState } from 'react';
import { useParams } from 'react-router';
import { CalendarClock, Download, ExternalLink, FileText, ShieldCheck } from 'lucide-react';
import { useWorkspace } from '@/api/modules/workspaces';
import { useInvoices, useUpcomingInvoice } from '@/api/modules/billing';
import type { TInvoice } from '@/types/billing.type';

const PER_PAGE = 12;

const STATUS_STYLES: Record<string, string> = {
	paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
	open: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
	draft: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
	void: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
	uncollectible: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
};

const fmtDate = (value: string | null) =>
	value
		? new Date(value).toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			})
		: '—';

const linkBtn =
	'inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700';

const InvoiceLinks = ({ invoice }: { invoice: TInvoice }) => (
	<div className='flex items-center gap-2'>
		{invoice.hosted_invoice_url && (
			<a
				href={invoice.hosted_invoice_url}
				target='_blank'
				rel='noopener noreferrer'
				className={linkBtn}>
				<ExternalLink size={12} />
				View
			</a>
		)}
		{invoice.invoice_pdf && (
			<a
				href={invoice.invoice_pdf}
				target='_blank'
				rel='noopener noreferrer'
				className={linkBtn}>
				<Download size={12} />
				PDF
			</a>
		)}
	</div>
);

/**
 * Stripe invoice history. The list is cursor-paginated (Stripe has no offset
 * or total), so paging keeps the trail of cursors it walked to go back.
 */
const BillingInvoicesPage = () => {
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { data: workspace } = useWorkspace(workspaceId!);
	const canManage = workspace?.role === 'admin' || workspace?.role === 'owner';

	const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
	const cursor = cursors[cursors.length - 1];

	const { data: upcoming } = useUpcomingInvoice(canManage ? workspaceId! : '');
	const { data, isLoading, isError, isFetching, refetch } = useInvoices(
		canManage ? workspaceId! : '',
		{ per_page: PER_PAGE, cursor },
	);
	const invoices = data?.invoices ?? [];
	const nextCursor = data?.meta?.next_cursor ?? null;

	if (workspace && !canManage) {
		return (
			<div className='flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center'>
				<ShieldCheck size={40} className='text-zinc-300 dark:text-zinc-600' />
				<h2 className='text-xl font-black text-zinc-950 dark:text-zinc-50'>
					Access Restricted
				</h2>
				<p className='max-w-sm text-sm text-zinc-500 dark:text-zinc-400'>
					Only workspace admins and owners can view invoices.
				</p>
			</div>
		);
	}

	return (
		<div className='space-y-8 text-zinc-950 dark:text-zinc-50'>
			<div>
				<h1 className='text-3xl font-black tracking-tight'>Invoices</h1>
				<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
					Every charge for this workspace, with receipts you can download.
				</p>
			</div>

			{upcoming && (
				<div className='flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950/60'>
					<div className='flex items-start gap-3'>
						<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400'>
							<CalendarClock size={16} />
						</div>
						<div>
							<p className='text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
								Next invoice
							</p>
							<p className='mt-1 text-2xl font-black tracking-tight'>
								{upcoming.amount_due}
							</p>
							<p className='mt-0.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
								Expected {fmtDate(upcoming.due_date ?? upcoming.date)}
								{upcoming.tax && upcoming.tax !== upcoming.total
									? ` · includes ${upcoming.tax} tax`
									: ''}
							</p>
						</div>
					</div>
				</div>
			)}

			<div className='overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-950/60'>
				{isLoading ? (
					<div className='space-y-3 p-6'>
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className='h-10 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900'
							/>
						))}
					</div>
				) : isError ? (
					<div className='flex flex-col items-center gap-3 px-6 py-14 text-center'>
						<p className='text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
							Invoices could not be loaded.
						</p>
						<button type='button' onClick={() => refetch()} className={linkBtn}>
							Retry
						</button>
					</div>
				) : invoices.length === 0 ? (
					<div className='flex flex-col items-center gap-2 px-6 py-14 text-center'>
						<div className='bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 flex h-12 w-12 items-center justify-center rounded-2xl'>
							<FileText size={22} />
						</div>
						<p className='text-sm font-bold'>No invoices yet</p>
						<p className='text-xs font-semibold text-zinc-400'>
							Invoices appear here after your first payment.
						</p>
					</div>
				) : (
					<ul
						className={`divide-y divide-zinc-100 transition-opacity dark:divide-zinc-800 ${isFetching ? 'opacity-60' : ''}`}>
						{invoices.map((invoice) => (
							<li
								key={invoice.id}
								className='flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between'>
								<div className='flex min-w-0 items-center gap-4'>
									<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>
										<FileText size={16} />
									</div>
									<div className='min-w-0'>
										<p className='truncate text-sm font-black'>
											{invoice.number ?? invoice.id}
										</p>
										<p className='text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
											{fmtDate(invoice.date)}
										</p>
									</div>
								</div>
								<div className='flex items-center gap-4 pl-13 sm:pl-0'>
									<span className='text-sm font-black'>{invoice.total}</span>
									{invoice.status && (
										<span
											className={`rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase ${STATUS_STYLES[invoice.status] ?? STATUS_STYLES.draft}`}>
											{invoice.status}
										</span>
									)}
									<InvoiceLinks invoice={invoice} />
								</div>
							</li>
						))}
					</ul>
				)}

				{(cursors.length > 1 || nextCursor) && (
					<div className='flex items-center justify-end gap-2 border-t border-zinc-100 px-6 py-3 dark:border-zinc-800'>
						<button
							type='button'
							disabled={cursors.length <= 1 || isFetching}
							onClick={() => setCursors((prev) => prev.slice(0, -1))}
							className={`${linkBtn} disabled:opacity-50`}>
							Newer
						</button>
						<button
							type='button'
							disabled={!nextCursor || isFetching}
							onClick={() =>
								nextCursor && setCursors((prev) => [...prev, nextCursor])
							}
							className={`${linkBtn} disabled:opacity-50`}>
							Older
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default BillingInvoicesPage;
