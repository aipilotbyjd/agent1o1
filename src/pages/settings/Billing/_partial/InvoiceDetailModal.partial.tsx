import { Download, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { useInvoice } from '@/api/modules/billing';
import Modal, { ModalHeader, ModalBody } from '@/components/ui/Modal';
import { INVOICE_STATUS_STYLES, fmtInvoiceDate } from '../_helper/invoices.helper';

const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
	<div className='flex items-center justify-between gap-4 py-2.5'>
		<span className='text-sm font-semibold text-zinc-500 dark:text-zinc-400'>{label}</span>
		<span
			className={`text-right text-sm ${strong ? 'font-black text-zinc-950 dark:text-white' : 'font-bold text-zinc-700 dark:text-zinc-200'}`}>
			{value}
		</span>
	</div>
);

/**
 * One invoice, fetched on its own (`GET billing/invoices/{id}`) so the
 * figures are Stripe's current ones, not the page the list was loaded on.
 * The list row only has room for the total; this shows the breakdown,
 * the amount still due and the due date.
 */
const InvoiceDetailModal = ({
	ws,
	invoiceId,
	onClose,
}: {
	ws: string;
	/** `null` closes the modal. */
	invoiceId: string | null;
	onClose: () => void;
}) => {
	const { data: invoice, isLoading, isError } = useInvoice(ws, invoiceId ?? '');

	return (
		<Modal isOpen={!!invoiceId} setIsOpen={(open) => !open && onClose()} size='sm'>
			<ModalHeader setIsOpen={() => onClose()}>
				<div className='flex items-center gap-3'>
					<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>
						<FileText size={16} />
					</div>
					<div className='flex min-w-0 flex-col'>
						<span className='truncate text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							{invoice?.number ?? 'Invoice'}
						</span>
						{invoice && (
							<span className='mt-1 text-xs font-semibold text-zinc-400'>
								Issued {fmtInvoiceDate(invoice.date)}
							</span>
						)}
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				{isLoading ? (
					<div className='flex items-center justify-center gap-2 py-10 text-sm font-semibold text-zinc-400'>
						<Loader2 size={16} className='animate-spin' />
						Loading invoice…
					</div>
				) : isError || !invoice ? (
					<p className='py-10 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
						This invoice could not be loaded.
					</p>
				) : (
					<div className='space-y-5 pb-2'>
						<div className='flex items-center justify-between'>
							<span className='text-3xl font-black tracking-tight text-zinc-950 dark:text-white'>
								{invoice.total}
							</span>
							{invoice.status && (
								<span
									className={`rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase ${INVOICE_STATUS_STYLES[invoice.status] ?? INVOICE_STATUS_STYLES.draft}`}>
									{invoice.status}
								</span>
							)}
						</div>

						<div className='divide-y divide-zinc-100 rounded-2xl border border-zinc-100 px-4 dark:divide-zinc-800 dark:border-zinc-800'>
							<Row label='Subtotal' value={invoice.subtotal} />
							<Row label='Tax' value={invoice.tax} />
							<Row label='Total' value={invoice.total} strong />
							<Row label='Amount due' value={invoice.amount_due} strong />
							<Row label='Due date' value={fmtInvoiceDate(invoice.due_date)} />
							<Row label='Currency' value={invoice.currency.toUpperCase()} />
							<Row label='Invoice ID' value={invoice.id} />
						</div>

						{(invoice.hosted_invoice_url || invoice.invoice_pdf) && (
							<div className='grid grid-cols-2 gap-2'>
								{invoice.hosted_invoice_url && (
									<a
										href={invoice.hosted_invoice_url}
										target='_blank'
										rel='noopener noreferrer'
										className='inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white'>
										<ExternalLink size={13} />
										View on Stripe
									</a>
								)}
								{invoice.invoice_pdf && (
									<a
										href={invoice.invoice_pdf}
										target='_blank'
										rel='noopener noreferrer'
										className='bg-primary-400 text-primary-950 hover:bg-primary-500 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition'>
										<Download size={13} />
										Download PDF
									</a>
								)}
							</div>
						)}
					</div>
				)}
			</ModalBody>
		</Modal>
	);
};

export default InvoiceDetailModal;
