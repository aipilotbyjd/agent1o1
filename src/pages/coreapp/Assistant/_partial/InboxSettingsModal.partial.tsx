import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { useToggleInbox, useUpdateInboxSettings } from '@/api/modules/assistant';
import type { TInboxSettings } from '@/types/assistant.type';

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
	const { t } = useTranslation();
	const update = useUpdateInboxSettings(workspaceId);
	const toggle = useToggleInbox(workspaceId);
	const [form, setForm] = useState<TInboxSettings>(settings);

	useEffect(() => {
		if (isOpen) setForm(settings);
	}, [isOpen, settings]);

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && onClose()} size='md'>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<span className='text-lg font-semibold text-zinc-950 dark:text-white'>
					{t('assistant.inboxSettings')}
				</span>
			</ModalHeader>
			<ModalBody>
				<div className='flex flex-col gap-4 pt-2 text-sm'>
					<div className='flex flex-col gap-1'>
						<span className='text-xs text-zinc-500'>{t('assistant.draftReplies')}</span>
						{(['confident', 'off'] as const).map((mode) => (
							<label key={mode} className='flex items-center gap-2'>
								<input
									type='radio'
									checked={form.draft_mode === mode}
									onChange={() => setForm({ ...form, draft_mode: mode })}
								/>
								{t(`assistant.draftModes.${mode}`)}
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
						{t('assistant.knownSendersOnly')}
					</label>
					<label className='flex items-center gap-2'>
						<input
							type='checkbox'
							checked={form.skip_existing_labels}
							onChange={(event) =>
								setForm({ ...form, skip_existing_labels: event.target.checked })
							}
						/>
						{t('assistant.skipExistingLabels')}
					</label>
					<label className='flex flex-col gap-1'>
						<span className='text-xs text-zinc-500'>
							{t('assistant.draftingInstructions')}
						</span>
						<textarea
							rows={3}
							maxLength={2000}
							value={form.drafting_instructions ?? ''}
							onChange={(event) =>
								setForm({ ...form, drafting_instructions: event.target.value })
							}
							placeholder={t('assistant.draftingInstructionsPlaceholder')}
							className='rounded-lg border border-zinc-200 bg-transparent p-2 dark:border-white/10'
						/>
					</label>
					<div className='flex items-center justify-between'>
						<button
							type='button'
							onClick={() => toggle.mutate(false, { onSuccess: onClose })}
							className='text-sm text-red-600 hover:underline dark:text-red-400'>
							{t('assistant.disableInbox')}
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
							{t('assistant.save')}
						</button>
					</div>
				</div>
			</ModalBody>
		</Modal>
	);
};

export default InboxSettingsModalPartial;
