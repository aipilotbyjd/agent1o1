import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { useAssistantApps, useUpdateDailyReport } from '@/api/modules/assistant';
import type { TBriefingConfig } from '@/types/assistant.type';

interface IDailySettingsModalProps {
	workspaceId: string;
	isOpen: boolean;
	onClose: () => void;
	config: TBriefingConfig;
	readableSources: string[];
}

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

const timezones = (): string[] => {
	try {
		return (
			Intl as unknown as { supportedValuesOf: (key: string) => string[] }
		).supportedValuesOf('timeZone');
	} catch {
		return ['UTC'];
	}
};

/** When the Daily report runs, which apps it reads, what to stress, and email delivery. */
const DailySettingsModalPartial = ({
	workspaceId,
	isOpen,
	onClose,
	config,
	readableSources,
}: IDailySettingsModalProps) => {
	const { t } = useTranslation();
	const update = useUpdateDailyReport(workspaceId);
	const { data: apps = [] } = useAssistantApps(workspaceId);
	const [form, setForm] = useState<TBriefingConfig>(config);
	const zones = useMemo(timezones, []);

	useEffect(() => {
		if (!isOpen) return;
		const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		setForm({
			...config,
			// A brand-new report defaults to the owner's own timezone.
			schedule: {
				...config.schedule,
				timezone:
					!config.enabled && config.schedule.timezone === 'UTC'
						? browserZone
						: config.schedule.timezone,
			},
		});
	}, [isOpen, config]);

	const readableApps = apps.filter((app) => app.connected && readableSources.includes(app.key));

	const toggleDay = (day: number) =>
		setForm((current) => {
			const days = current.schedule.days.includes(day)
				? current.schedule.days.filter((entry) => entry !== day)
				: [...current.schedule.days, day].sort();
			return { ...current, schedule: { ...current.schedule, days } };
		});

	const toggleApp = (key: string) =>
		setForm((current) => ({
			...current,
			connector_keys: current.connector_keys.includes(key)
				? current.connector_keys.filter((entry) => entry !== key)
				: [...current.connector_keys, key],
		}));

	const save = () =>
		update.mutate(
			{
				enabled: form.enabled,
				schedule: form.schedule,
				connector_scope: form.connector_scope,
				connector_keys: form.connector_keys,
				instructions: form.instructions || null,
				delivery: form.delivery,
			},
			{ onSuccess: onClose },
		);

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && onClose()} size='lg'>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<span className='text-lg font-semibold text-zinc-950 dark:text-white'>
					{t('assistant.dailySettings')}
				</span>
			</ModalHeader>
			<ModalBody>
				<div className='flex flex-col gap-5 pt-2 text-sm'>
					<label className='flex items-center gap-2'>
						<input
							type='checkbox'
							checked={form.enabled}
							onChange={(event) =>
								setForm({ ...form, enabled: event.target.checked })
							}
						/>
						<span className='text-zinc-800 dark:text-zinc-100'>
							{t('assistant.dailyEnabled')}
						</span>
					</label>

					<div className='flex flex-wrap items-end gap-4'>
						<label className='flex flex-col gap-1'>
							<span className='text-xs text-zinc-500'>{t('assistant.time')}</span>
							<input
								type='time'
								value={form.schedule.time}
								onChange={(event) =>
									setForm({
										...form,
										schedule: { ...form.schedule, time: event.target.value },
									})
								}
								className='rounded-lg border border-zinc-200 bg-transparent px-2 py-1 dark:border-white/10'
							/>
						</label>
						<label className='flex min-w-56 flex-col gap-1'>
							<span className='text-xs text-zinc-500'>{t('assistant.timezone')}</span>
							<select
								value={form.schedule.timezone}
								onChange={(event) =>
									setForm({
										...form,
										schedule: {
											...form.schedule,
											timezone: event.target.value,
										},
									})
								}
								className='rounded-lg border border-zinc-200 bg-transparent px-2 py-1 dark:border-white/10'>
								{zones.map((zone) => (
									<option key={zone} value={zone}>
										{zone}
									</option>
								))}
							</select>
						</label>
					</div>

					<div className='flex flex-col gap-1'>
						<span className='text-xs text-zinc-500'>{t('assistant.days')}</span>
						<div className='flex flex-wrap gap-1'>
							{DAYS.map((day) => (
								<button
									key={day}
									type='button'
									onClick={() => toggleDay(day)}
									className={
										form.schedule.days.includes(day)
											? 'bg-assistant rounded-lg px-2.5 py-1 text-xs font-semibold text-white'
											: 'rounded-lg border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 dark:border-white/10 dark:text-zinc-300'
									}>
									{t(`assistant.weekdays.${day}`)}
								</button>
							))}
						</div>
					</div>

					<div className='flex flex-col gap-2'>
						<span className='text-xs text-zinc-500'>{t('assistant.reportApps')}</span>
						<label className='flex items-center gap-2'>
							<input
								type='radio'
								checked={form.connector_scope === 'all'}
								onChange={() => setForm({ ...form, connector_scope: 'all' })}
							/>
							{t('assistant.allApps')}
						</label>
						<label className='flex items-center gap-2'>
							<input
								type='radio'
								checked={form.connector_scope === 'selected'}
								onChange={() => setForm({ ...form, connector_scope: 'selected' })}
							/>
							{t('assistant.selectedApps')}
						</label>
						{form.connector_scope === 'selected' && (
							<div className='ml-6 flex flex-wrap gap-2'>
								{readableApps.length === 0 && (
									<span className='text-xs text-zinc-500'>
										{t('assistant.noApps')}
									</span>
								)}
								{readableApps.map((app) => (
									<label
										key={app.key}
										className='flex items-center gap-1.5 text-xs'>
										<input
											type='checkbox'
											checked={form.connector_keys.includes(app.key)}
											onChange={() => toggleApp(app.key)}
										/>
										{app.name}
									</label>
								))}
							</div>
						)}
					</div>

					<label className='flex flex-col gap-1'>
						<span className='text-xs text-zinc-500'>
							{t('assistant.reportInstructions')}
						</span>
						<textarea
							rows={3}
							maxLength={4000}
							value={form.instructions ?? ''}
							onChange={(event) =>
								setForm({ ...form, instructions: event.target.value })
							}
							placeholder={t('assistant.reportInstructionsPlaceholder')}
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
						<span>{t('assistant.emailDelivery')}</span>
					</label>

					<div className='flex justify-end'>
						<button
							type='button'
							onClick={save}
							disabled={update.isPending || form.schedule.days.length === 0}
							className='bg-assistant rounded-lg px-4 py-2 font-semibold text-white disabled:opacity-40'>
							{t('assistant.save')}
						</button>
					</div>
				</div>
			</ModalBody>
		</Modal>
	);
};

export default DailySettingsModalPartial;
