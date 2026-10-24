import { useState } from 'react';
import { useBrand } from '@/context/brand';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { useUpdateMeetingPrep } from '@/api/modules/assistant';
import type { TMeetingPrepReport, TMeetingPrepSettings } from '@/types/assistant.type';

const PREP_SCOPES: Record<TMeetingPrepSettings['scope'], string> = {
	external_only: 'external meetings',
	all: 'all meetings',
};

interface IMeetingPrepSettingsModalProps {
	workspaceId: string;
	isOpen: boolean;
	onClose: () => void;
	config: TMeetingPrepReport['config'];
}

/** Whether meetings are prepped automatically, how early, which ones, and email delivery. */
const MeetingPrepSettingsModalPartial = ({
	workspaceId,
	isOpen,
	onClose,
	config,
}: IMeetingPrepSettingsModalProps) => {
	const brand = useBrand();
	const update = useUpdateMeetingPrep(workspaceId);
	const [form, setForm] = useState(config);

	const [syncedConfig, setSyncedConfig] = useState<typeof config | null>(null);
	if (!isOpen && syncedConfig !== null) setSyncedConfig(null);
	if (isOpen && syncedConfig !== config) {
		setSyncedConfig(config);
		setForm(config);
	}

	const save = () =>
		update.mutate(
			{
				enabled: form.enabled,
				settings: form.settings,
				instructions: form.instructions || null,
				delivery: form.delivery,
			},
			{ onSuccess: onClose },
		);

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && onClose()} size='md'>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<span className='text-lg font-semibold text-zinc-950 dark:text-white'>
					{brand.features.meeting_prep} settings
				</span>
			</ModalHeader>
			<ModalBody>
				<div className='flex flex-col gap-4 pt-2 text-sm'>
					<label className='flex items-center gap-2'>
						<input
							type='checkbox'
							checked={form.enabled}
							onChange={(event) =>
								setForm({ ...form, enabled: event.target.checked })
							}
						/>
						Turn on {brand.features.meeting_prep}
					</label>
					<label className='flex items-center gap-2'>
						<input
							type='checkbox'
							checked={form.settings.auto}
							onChange={(event) =>
								setForm({
									...form,
									settings: { ...form.settings, auto: event.target.checked },
								})
							}
						/>
						Prep meetings automatically
					</label>
					<label className='flex items-center gap-2'>
						<span className='text-zinc-600 dark:text-zinc-300'>
							Minutes before the meeting
						</span>
						<input
							type='number'
							min={5}
							max={240}
							value={form.settings.minutes_before}
							onChange={(event) =>
								setForm({
									...form,
									settings: {
										...form.settings,
										minutes_before: Number(event.target.value),
									},
								})
							}
							className='w-20 rounded-lg border border-zinc-200 bg-transparent px-2 py-1 dark:border-white/10'
						/>
					</label>
					<div className='flex flex-col gap-1'>
						<span className='text-xs text-zinc-500'>Meetings to prep</span>
						{(['external_only', 'all'] as const).map((scope) => (
							<label key={scope} className='flex items-center gap-2'>
								<input
									type='radio'
									checked={form.settings.scope === scope}
									onChange={() =>
										setForm({ ...form, settings: { ...form.settings, scope } })
									}
								/>
								{PREP_SCOPES[scope]}
							</label>
						))}
					</div>
					<label className='flex flex-col gap-1'>
						<span className='text-xs text-zinc-500'>
							What should briefs focus on? (optional)
						</span>
						<textarea
							rows={3}
							maxLength={4000}
							value={form.instructions ?? ''}
							onChange={(event) =>
								setForm({ ...form, instructions: event.target.value })
							}
							className='rounded-lg border border-zinc-200 bg-transparent p-2 dark:border-white/10'
						/>
					</label>
					<label className='flex items-center gap-2'>
						<input
							type='checkbox'
							checked={form.delivery.email}
							onChange={(event) =>
								setForm({ ...form, delivery: { email: event.target.checked } })
							}
						/>
						Also email it to me
					</label>
					<div className='flex justify-end'>
						<button
							type='button'
							onClick={save}
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

export default MeetingPrepSettingsModalPartial;
