import { History } from 'lucide-react';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { useTriggerEvents } from '@/api/modules/triggers';
import { EVENT_STATUS_META, formatDateTime } from '../_helper/triggers.constants';

// ============================================================
// Trigger delivery log
// ------------------------------------------------------------
// GET .../triggers/{trigger}/events — one row per delivery the
// trigger accepted, skipped, processed or failed.
// ============================================================

interface ITriggerEventsModalProps {
	ws: string;
	triggerId: string | null;
	onClose: () => void;
}

const TriggerEventsModal = ({ ws, triggerId, onClose }: ITriggerEventsModalProps) => {
	const { data, isLoading } = useTriggerEvents(ws, triggerId ?? '');
	const events = data ?? [];

	return (
		<Modal isOpen={!!triggerId} setIsOpen={(open) => !open && onClose()} size='lg' isScrollable>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<div className='flex items-center gap-3'>
					<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'>
						<History size={16} />
					</div>
					<div className='flex flex-col'>
						<span className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							Delivery log
						</span>
						<span className='mt-1 text-xs leading-normal font-semibold text-zinc-400 dark:text-zinc-500'>
							Every time this trigger fired, and what happened.
						</span>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				{isLoading ? (
					<div className='space-y-2 pt-2'>
						{[...Array(4)].map((_, i) => (
							<div
								key={i}
								className='h-14 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800'
							/>
						))}
					</div>
				) : events.length === 0 ? (
					<p className='py-10 text-center text-sm font-semibold text-zinc-400 dark:text-zinc-500'>
						This trigger has not fired yet.
					</p>
				) : (
					<div className='overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800'>
						{events.map((event, index) => {
							const status = EVENT_STATUS_META[event.status];
							return (
								<div
									key={event.id}
									className={`flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 ${
										index > 0
											? 'border-t border-zinc-100 dark:border-zinc-800'
											: ''
									}`}>
									<div className='min-w-0'>
										<div className='flex flex-wrap items-center gap-2'>
											<span
												className={`rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase ${status.className}`}>
												{status.label}
											</span>
											<span className='text-xs font-bold text-zinc-700 capitalize dark:text-zinc-300'>
												{event.source}
											</span>
											{event.duplicate_count > 0 && (
												<span className='text-[10px] font-bold text-zinc-400'>
													{event.duplicate_count} duplicate
													{event.duplicate_count === 1 ? '' : 's'}
												</span>
											)}
										</div>
										{event.error && (
											<p className='mt-1 text-xs font-semibold text-red-500'>
												{event.error}
											</p>
										)}
										<p className='mt-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500'>
											{formatDateTime(event.created_at)}
											{event.attempts > 1 ? ` · ${event.attempts} attempts` : ''}
										</p>
									</div>

									{event.run_id && (
										<span className='shrink-0 rounded-lg bg-zinc-100 px-2.5 py-1 font-mono text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>
											run #{event.run_id}
										</span>
									)}
								</div>
							);
						})}
					</div>
				)}
			</ModalBody>
		</Modal>
	);
};

export default TriggerEventsModal;
