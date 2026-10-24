import { Copy, Key, Loader2, Lock, Pencil } from 'lucide-react';
import { useSecret } from '@/api/modules/secrets';
import { notify } from '@/api/core';
import type { TSecret } from '@/types/secret.type';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import { primaryBtn, secondaryBtn } from '@/pages/settings/_shared/buttons';

const fmtDateTime = (value: string | null) =>
	value
		? new Date(value).toLocaleString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
				hour: 'numeric',
				minute: '2-digit',
			})
		: 'Never';

const copy = (value: string, what: string) => {
	if (!navigator.clipboard) {
		notify.error('Clipboard copy failed');
		return;
	}
	navigator.clipboard.writeText(value);
	notify.success(`${what} copied`);
};

/**
 * One secret on its own. The list has no room for the two things you need
 * when wiring a node: the `{{ secrets.KEY }}` reference to paste, and when it
 * was last used. A secret's value is write-only, so it is never shown here.
 */
const SecretDetailModal = ({
	ws,
	secretId,
	onClose,
	onEdit,
}: {
	ws: string;
	/** `null` closes the modal. */
	secretId: string | null;
	onClose: () => void;
	onEdit: (secret: TSecret) => void;
}) => {
	const { data: secret, isLoading } = useSecret(ws, secretId ?? '');

	return (
		<Modal isOpen={!!secretId} setIsOpen={(open) => !open && onClose()} size='sm'>
			<ModalHeader setIsOpen={() => onClose()}>
				<div className='flex min-w-0 items-center gap-3'>
					<div className='bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl'>
						<Key size={16} />
					</div>
					<span className='truncate font-mono text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						{secret?.key ?? 'Secret'}
					</span>
					{secret?.is_secret && (
						<span className='inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'>
							<Lock size={9} />
							secret
						</span>
					)}
				</div>
			</ModalHeader>
			<ModalBody>
				{isLoading || !secret ? (
					<div className='flex items-center justify-center gap-2 py-10 text-sm font-semibold text-zinc-400'>
						<Loader2 size={16} className='animate-spin' />
						Loading…
					</div>
				) : (
					<div className='space-y-4 pt-2'>
						<div>
							<p className='mb-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300'>
								Use it in a node
							</p>
							<div className='flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900'>
								<code className='min-w-0 flex-1 truncate text-xs font-bold text-zinc-700 dark:text-zinc-200'>
									{secret.reference}
								</code>
								<button
									type='button'
									onClick={() => copy(secret.reference, 'Reference')}
									aria-label='Copy reference'
									className='shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200'>
									<Copy size={14} />
								</button>
							</div>
						</div>

						<div>
							<p className='mb-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300'>
								Value
							</p>
							{secret.is_secret || secret.value === null ? (
								<p className='text-xs font-semibold text-zinc-400'>
									Encrypted and write-only. Edit the secret to replace it.
								</p>
							) : (
								<div className='flex items-start gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800'>
									<code className='min-w-0 flex-1 text-xs font-semibold break-all whitespace-pre-wrap text-zinc-700 dark:text-zinc-200'>
										{secret.value}
									</code>
									<button
										type='button'
										onClick={() => copy(secret.value!, 'Value')}
										aria-label='Copy value'
										className='shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200'>
										<Copy size={14} />
									</button>
								</div>
							)}
						</div>

						<div>
							<p className='mb-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300'>
								Description
							</p>
							<p className='text-sm font-medium text-zinc-500 dark:text-zinc-400'>
								{secret.description || 'No description'}
							</p>
						</div>

						<dl className='grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800'>
							{[
								['Last used', fmtDateTime(secret.last_used_at)],
								['Created', fmtDateTime(secret.created_at)],
								['Updated', fmtDateTime(secret.updated_at)],
							].map(([label, value]) => (
								<div key={label}>
									<dt className='text-[10px] font-black tracking-wider text-zinc-400 uppercase'>
										{label}
									</dt>
									<dd className='mt-0.5 text-xs font-bold text-zinc-700 dark:text-zinc-300'>
										{value}
									</dd>
								</div>
							))}
						</dl>
					</div>
				)}
			</ModalBody>
			<ModalFooter>
				<ModalFooterChild className='flex w-full justify-end gap-3'>
					<button type='button' onClick={onClose} className={secondaryBtn}>
						Close
					</button>
					<button
						type='button'
						disabled={!secret}
						onClick={() => secret && onEdit(secret)}
						className={primaryBtn}>
						<Pencil size={14} />
						Edit
					</button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default SecretDetailModal;
