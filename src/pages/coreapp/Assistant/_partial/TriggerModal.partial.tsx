import { useEffect, useState } from 'react';
import { useBrand } from '@/context/brand';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { useCreateTrigger } from '@/api/modules/assistant';
import type { TAssistantTrigger } from '@/types/assistant.type';

interface ITriggerModalProps {
	workspaceId: string;
	isOpen: boolean;
	onClose: () => void;
}

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
const WEEKDAYS: Record<(typeof DAYS)[number], string> = {
	1: 'Mon',
	2: 'Tue',
	3: 'Wed',
	4: 'Thu',
	5: 'Fri',
	6: 'Sat',
	7: 'Sun',
};

const TYPE_LABELS: Record<TAssistantTrigger['type'], string> = {
	schedule: 'Schedule',
	once: 'One time',
	webhook: 'Webhook',
};

/** ISO weekday (Mon = 1 … Sun = 7) → cron weekday (Sun = 0). */
const cronDay = (day: number) => day % 7;

/** "Every [days] at [time]" as a cron expression. */
const toCron = (time: string, days: number[]) => {
	const [hours, minutes] = time.split(':').map(Number);
	const dayPart =
		days.length === 7
			? '*'
			: days
					.map(cronDay)
					.sort((a, b) => a - b)
					.join(',');
	return `${minutes} ${hours} * * ${dayPart}`;
};

/** A new schedule, one-time run, or webhook for the assistant. */
const TriggerModalPartial = ({ workspaceId, isOpen, onClose }: ITriggerModalProps) => {
	const brand = useBrand();
	const create = useCreateTrigger(workspaceId);
	const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const [type, setType] = useState<TAssistantTrigger['type']>('schedule');
	const [name, setName] = useState('');
	const [prompt, setPrompt] = useState('');
	const [time, setTime] = useState('09:00');
	const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
	const [advanced, setAdvanced] = useState(false);
	const [cron, setCron] = useState('');
	const [runAt, setRunAt] = useState('');

	useEffect(() => {
		if (!isOpen) return;
		setType('schedule');
		setName('');
		setPrompt('');
		setAdvanced(false);
		setCron('');
		setRunAt('');
	}, [isOpen]);

	const save = () =>
		create.mutate(
			{
				type,
				name: name.trim(),
				prompt: prompt.trim(),
				timezone,
				cron: type === 'schedule' ? (advanced ? cron.trim() : toCron(time, days)) : null,
				run_at: type === 'once' ? runAt : null,
			},
			{ onSuccess: onClose },
		);

	const valid =
		name.trim() !== '' &&
		prompt.trim() !== '' &&
		(type !== 'schedule' || (advanced ? cron.trim() !== '' : days.length > 0)) &&
		(type !== 'once' || runAt !== '');

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && onClose()} size='md'>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<span className='text-lg font-semibold text-zinc-950 dark:text-white'>
					New trigger
				</span>
			</ModalHeader>
			<ModalBody>
				<div className='flex flex-col gap-4 pt-2 text-sm'>
					<div className='flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-white/5'>
						{(['schedule', 'once', 'webhook'] as const).map((entry) => (
							<button
								key={entry}
								type='button'
								onClick={() => setType(entry)}
								className={
									entry === type
										? 'flex-1 rounded-md bg-white px-3 py-1.5 font-semibold text-zinc-900 shadow-sm dark:bg-white/10 dark:text-white'
										: 'flex-1 rounded-md px-3 py-1.5 text-zinc-500'
								}>
								{TYPE_LABELS[entry]}
							</button>
						))}
					</div>

					<label className='flex flex-col gap-1'>
						<span className='text-xs text-zinc-500'>Name</span>
						<input
							value={name}
							onChange={(event) => setName(event.target.value)}
							maxLength={120}
							className='rounded-lg border border-zinc-200 bg-transparent px-2 py-1.5 dark:border-white/10'
						/>
					</label>

					<label className='flex flex-col gap-1'>
						<span className='text-xs text-zinc-500'>What should {brand.name} do?</span>
						<textarea
							rows={3}
							value={prompt}
							onChange={(event) => setPrompt(event.target.value)}
							placeholder={
								type === 'webhook'
									? 'e.g. A new lead came in: {{payload}} — add them to my list.'
									: 'e.g. Summarise my unread email and flag anything urgent.'
							}
							className='rounded-lg border border-zinc-200 bg-transparent p-2 dark:border-white/10'
						/>
					</label>

					{type === 'schedule' &&
						(advanced ? (
							<label className='flex flex-col gap-1'>
								<span className='text-xs text-zinc-500'>Cron expression</span>
								<input
									value={cron}
									onChange={(event) => setCron(event.target.value)}
									placeholder='0 9 * * 1-5'
									className='rounded-lg border border-zinc-200 bg-transparent px-2 py-1.5 font-mono dark:border-white/10'
								/>
							</label>
						) : (
							<div className='flex flex-col gap-2'>
								<label className='flex items-center gap-2'>
									<span className='text-xs text-zinc-500'>Time</span>
									<input
										type='time'
										value={time}
										onChange={(event) => setTime(event.target.value)}
										className='rounded-lg border border-zinc-200 bg-transparent px-2 py-1 dark:border-white/10'
									/>
								</label>
								<div className='flex flex-wrap gap-1'>
									{DAYS.map((day) => (
										<button
											key={day}
											type='button'
											onClick={() =>
												setDays((current) =>
													current.includes(day)
														? current.filter((entry) => entry !== day)
														: [...current, day],
												)
											}
											className={
												days.includes(day)
													? 'bg-assistant rounded-lg px-2.5 py-1 text-xs font-semibold text-white'
													: 'rounded-lg border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 dark:border-white/10 dark:text-zinc-300'
											}>
											{WEEKDAYS[day]}
										</button>
									))}
								</div>
							</div>
						))}

					{type === 'schedule' && (
						<button
							type='button'
							onClick={() => setAdvanced(!advanced)}
							className='self-start text-xs text-zinc-500 underline'>
							{advanced ? 'Use the simple schedule' : 'Use a cron expression instead'}
						</button>
					)}

					{type === 'once' && (
						<label className='flex flex-col gap-1'>
							<span className='text-xs text-zinc-500'>Run at</span>
							<input
								type='datetime-local'
								value={runAt}
								onChange={(event) => setRunAt(event.target.value)}
								className='rounded-lg border border-zinc-200 bg-transparent px-2 py-1.5 dark:border-white/10'
							/>
						</label>
					)}

					{type !== 'webhook' && (
						<p className='text-xs text-zinc-500'>Times are in {timezone}.</p>
					)}
					{type === 'webhook' && (
						<p className='text-xs text-zinc-500'>
							After you create it you'll get a URL. Anything POSTed to it is passed to{' '}
							{brand.name} where you write {'{{payload}}'}. Treat the URL like a
							password.
						</p>
					)}

					<div className='flex justify-end'>
						<button
							type='button'
							onClick={save}
							disabled={!valid || create.isPending}
							className='bg-assistant rounded-lg px-4 py-2 font-semibold text-white disabled:opacity-40'>
							Create trigger
						</button>
					</div>
				</div>
			</ModalBody>
		</Modal>
	);
};

export default TriggerModalPartial;
