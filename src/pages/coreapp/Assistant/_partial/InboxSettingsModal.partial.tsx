import { useState } from 'react';
import { useBrand } from '@/context/brand';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { useToggleInbox, useUpdateInboxSettings } from '@/api/modules/assistant';
import type { TInboxSettings } from '@/types/assistant.type';

const DRAFT_MODES = {
	confident: 'When confident — otherwise suggest one here',
	off: 'Off',
} as const;

interface IInboxSettingsModalProps {
	workspaceId: string;
	isOpen: boolean;
	onClose: () => void;
	settings: TInboxSettings;
}

/** How Smart Inbox drafts replies, and turning it off. */
const InboxSettingsModalPartial = ({
	workspaceId,
	isOpen,
	onClose,
	settings,
}: IInboxSettingsModalProps) => {
	const brand = useBrand();
	const update = useUpdateInboxSettings(workspaceId);
	const toggle = useToggleInbox(workspaceId);
	const [form, setForm] = useState<TInboxSettings>(settings);

	const [syncedSettings, setSyncedSettings] = useState<TInboxSettings | null>(null);
	if (!isOpen && syncedSettings !== null) setSyncedSettings(null);
	if (isOpen && syncedSettings !== settings) {
		setSyncedSettings(settings);
		setForm(settings);
	}

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && onClose()} size='md'>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<span className='text-lg font-semibold text-zinc-950 dark:text-white'>
					{brand.features.inbox} settings
				</span>
			</ModalHeader>
			<ModalBody>
				<div className='flex flex-col gap-4 pt-2 text-sm'>
					<div className='flex flex-col gap-1'>
						<span className='text-xs text-zinc-500'>Draft replies</span>
						{(Object.keys(DRAFT_MODES) as (keyof typeof DRAFT_MODES)[]).map((mode) => (
							<label key={mode} className='flex items-center gap-2'>
								<input
									type='radio'
									checked={form.draft_mode === mode}
									onChange={() => setForm({ ...form, draft_mode: mode })}
								/>
								{DRAFT_MODES[mode]}
							</label>
						))}
					</div>
					<label className='flex items-center gap-2'>
						<input
							type='checkbox'
							checked={form.known_senders_only}
							onChange={(event) =>
								setForm({ ...form, known_senders_only: event.target.checked })
							}
						/>
						{"Only draft for people I've emailed or my own domain"}
					</label>
					<label className='flex items-center gap-2'>
						<input
							type='checkbox'
							checked={form.skip_existing_labels}
							onChange={(event) =>
								setForm({ ...form, skip_existing_labels: event.target.checked })
							}
						/>
						{"Leave mail I've already labelled alone"}
					</label>
					<label className='flex flex-col gap-1'>
						<span className='text-xs text-zinc-500'>
							Drafting instructions (optional)
						</span>
						<textarea
							rows={3}
							maxLength={2000}
							value={form.drafting_instructions ?? ''}
							onChange={(event) =>
								setForm({ ...form, drafting_instructions: event.target.value })
							}
							placeholder='e.g. Sign off with my first name. Never commit to dates.'
							className='rounded-lg border border-zinc-200 bg-transparent p-2 dark:border-white/10'
						/>
					</label>
					<div className='flex items-center justify-between'>
						<button
							type='button'
							onClick={() => toggle.mutate(false, { onSuccess: onClose })}
							className='text-sm text-red-600 hover:underline dark:text-red-400'>
							Turn off {brand.features.inbox}
						</button>
						<button
							type='button'
							onClick={() =>
								update.mutate(
									{
										...form,
										drafting_instructions: form.drafting_instructions || null,
									},
									{ onSuccess: onClose },
								)
							}
							disabled={update.isPending}
							className='bg-assistant rounded-lg px-4 py-2 font-semibold text-white disabled:opacity-40'>
							Save
						</button>
					</div>
				</div>
			</ModalBody>
		</Modal>
	);
};

export default InboxSettingsModalPartial;
