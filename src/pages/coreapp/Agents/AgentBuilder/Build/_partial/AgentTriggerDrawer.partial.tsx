import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Clock, Webhook } from 'lucide-react';
import { ApiError, notify } from '@/api/core';
import { useCreateAgentTrigger, useUpdateAgentTrigger } from '@/api/modules/agents';
import TimezoneSelectPart from '@/parts/TimezoneSelect.part';
import TriggerEventsPart from '@/parts/TriggerEvents.part';
import { AUTONOMY_MODES, AUTONOMY_MODE_META } from '@/types/agent-action.type';
import type { TTrigger } from '@/types/trigger.type';
import FieldInput from '@/pages/coreapp/Playbooks/WorkflowEditor/_partial/canvas/nodes/FieldInput.partial';
import NodeIcon from '@/pages/coreapp/Playbooks/WorkflowEditor/_partial/library/NodeIcon.partial';
import TriggerDetails from '@/pages/coreapp/Playbooks/WorkflowEditor/_partial/canvas/nodes/TriggerDetails.partial';
import { isValidCron } from '@/pages/coreapp/Playbooks/WorkflowEditor/_helper/trigger.helper';
import type { TNodeDefinition } from '@/pages/coreapp/Playbooks/WorkflowEditor/_types/node.type';
import AgentSideDrawer from './AgentSideDrawer.partial';
import {
	APP_TRIGGER_KEYS,
	DEFAULT_SCHEDULE,
	FREQUENCIES,
	MINUTE_STEPS,
	WEBHOOK_AUTH,
	WEEKDAYS,
	appEventFor,
	cronToSchedule,
	describeCron,
	scheduleToCron,
	splitEventName,
	triggerTitle,
	type TSchedule,
} from '../_helper/agentTriggers.helper';

export type TTriggerKind = 'schedule' | 'webhook' | 'app';

/** What the drawer opens on: the picker, a kind to configure, or a trigger to edit. */
export type TTriggerDrawerTarget =
	| { mode: 'pick' }
	| { mode: 'create'; kind: TTriggerKind; appType?: string }
	| { mode: 'edit'; trigger: TTrigger };

type TDraft = {
	kind: TTriggerKind;
	appType: string;
	schedule: TSchedule;
	timezone: string;
	authentication: string;
	headerName: string;
	secret: string;
	credentialId: string;
	nodeConfig: Record<string, unknown>;
	pollMinutes: number | undefined;
	message: string;
	autonomyMode: string;
	ifAlreadyRunning: string;
	maxFailures: number | undefined;
};

const inputClass =
	'focus:border-primary-500/50 min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-base font-semibold text-zinc-800 outline-none md:min-h-0 md:text-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200';

const labelClass = 'pl-1 text-[10px] font-black tracking-widest text-zinc-400 uppercase';

const str = (value: unknown) => (typeof value === 'string' ? value : '');
const num = (value: unknown) => (typeof value === 'number' ? value : undefined);

const generateToken = () =>
	Array.from(crypto.getRandomValues(new Uint8Array(24)), (byte) =>
		byte.toString(16).padStart(2, '0'),
	).join('');

const pollDefault = (event?: TNodeDefinition) => {
	const value = event?.fields.find((field) => field.key === 'poll_interval_minutes')?.default;
	return typeof value === 'number' ? value : undefined;
};

const draftFor = (target: TTriggerDrawerTarget, appEvents: TNodeDefinition[]): TDraft => {
	const blank: TDraft = {
		kind: 'schedule',
		appType: '',
		schedule: DEFAULT_SCHEDULE,
		timezone: '',
		authentication: 'none',
		headerName: '',
		secret: '',
		credentialId: '',
		nodeConfig: {},
		pollMinutes: undefined,
		message: '',
		autonomyMode: '',
		ifAlreadyRunning: '',
		maxFailures: undefined,
	};
	if (target.mode === 'create') {
		const event = appEvents.find((item) => item.key === target.appType);
		return {
			...blank,
			kind: target.kind,
			appType: target.appType ?? '',
			pollMinutes: pollDefault(event),
		};
	}
	if (target.mode !== 'edit') return blank;
	const { trigger } = target;
	const config = trigger.config ?? {};
	return {
		...blank,
		kind:
			trigger.type === 'polling'
				? 'app'
				: trigger.type === 'webhook'
					? 'webhook'
					: 'schedule',
		appType: str(config.node_type),
		credentialId: trigger.credential_id ?? '',
		schedule: cronToSchedule(str(config.cron) || DEFAULT_SCHEDULE.cron),
		timezone: str(config.timezone),
		authentication: str(config.authentication) || 'none',
		headerName: str(config.header_name),
		nodeConfig: (config.node_config as Record<string, unknown> | undefined) ?? {},
		pollMinutes: num(config.poll_interval_minutes),
		message: str(config.message),
		autonomyMode: str(config.autonomy_mode),
		ifAlreadyRunning: str(config.if_already_running),
		maxFailures: num(config.max_failures),
	};
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
	<section className='space-y-3 rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900/40'>
		<h4 className='text-[11px] font-black text-zinc-900 dark:text-white'>{title}</h4>
		{children}
	</section>
);

const Field = ({
	label,
	hint,
	children,
}: {
	label: string;
	hint?: ReactNode;
	children: ReactNode;
}) => (
	<label className='block space-y-1.5'>
		<span className={labelClass}>{label}</span>
		{children}
		{hint && (
			<span className='block pl-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
				{hint}
			</span>
		)}
	</label>
);

export const KindIcon = ({
	kind,
	event,
	size = 'md',
}: {
	kind: TTriggerKind;
	event?: TNodeDefinition;
	size?: 'sm' | 'md';
}) => {
	const box = size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-xl';
	if (kind === 'app' && event)
		return (
			<span
				className={`${box} flex shrink-0 items-center justify-center text-white ring-1 ring-black/5 ring-inset dark:ring-white/15`}
				style={{ backgroundColor: event.colorHex ?? '#52525b' }}>
				<NodeIcon icon={event.icon} size={size === 'sm' ? 15 : 18} />
			</span>
		);
	const Icon = kind === 'webhook' ? Webhook : Clock;
	const tone =
		kind === 'webhook'
			? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
			: 'bg-sky-500/10 text-sky-600 dark:text-sky-400';
	return (
		<span className={`${box} ${tone} flex shrink-0 items-center justify-center`}>
			<Icon size={size === 'sm' ? 15 : 18} />
		</span>
	);
};

const PickRow = ({
	icon,
	title,
	subtitle,
	onClick,
}: {
	icon: ReactNode;
	title: string;
	subtitle: string;
	onClick: () => void;
}) => (
	<button
		type='button'
		onClick={onClick}
		className='hover:border-primary-400/60 group flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-left transition hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40'>
		{icon}
		<span className='min-w-0 flex-1'>
			<span className='block truncate text-xs font-black text-zinc-900 dark:text-white'>
				{title}
			</span>
			<span className='mt-0.5 block truncate text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
				{subtitle}
			</span>
		</span>
		<ChevronRight
			size={14}
			className='shrink-0 text-zinc-300 transition group-hover:text-zinc-500 dark:text-zinc-600'
		/>
	</button>
);

const ScheduleFields = ({
	schedule,
	onChange,
}: {
	schedule: TSchedule;
	onChange: (schedule: TSchedule) => void;
}) => {
	const set = (patch: Partial<TSchedule>) => onChange({ ...schedule, ...patch });
	const timeValue = `${String(schedule.hour).padStart(2, '0')}:${String(schedule.minute).padStart(2, '0')}`;
	const timed = !['minutes', 'hourly', 'custom'].includes(schedule.frequency);

	return (
		<>
			<Field label='Repeat'>
				<select
					aria-label='Repeat'
					value={schedule.frequency}
					onChange={(event) =>
						set({
							frequency: event.target.value as TSchedule['frequency'],
							cron: scheduleToCron(schedule),
						})
					}
					className={inputClass}>
					{FREQUENCIES.map((item) => (
						<option key={item.value} value={item.value}>
							{item.label}
						</option>
					))}
				</select>
			</Field>

			{schedule.frequency === 'minutes' && (
				<Field label='Every'>
					<div className='grid grid-cols-4 gap-1 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-950/45'>
						{MINUTE_STEPS.map((step) => (
							<button
								key={step}
								type='button'
								aria-pressed={schedule.every === step}
								onClick={() => set({ every: step })}
								className={`min-h-11 rounded-md text-[10px] font-black transition md:min-h-7 ${
									schedule.every === step
										? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-white'
										: 'text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300'
								}`}>
								{step} min
							</button>
						))}
					</div>
				</Field>
			)}

			{schedule.frequency === 'hourly' && (
				<Field label='Minutes past the hour'>
					<input
						type='number'
						min={0}
						max={59}
						aria-label='Minutes past the hour'
						value={schedule.minute}
						onChange={(event) =>
							set({
								minute: Math.min(59, Math.max(0, Number(event.target.value) || 0)),
							})
						}
						className={inputClass}
					/>
				</Field>
			)}

			{(schedule.frequency === 'weekly' || schedule.frequency === 'monthly') && (
				<Field label={schedule.frequency === 'weekly' ? 'On' : 'Day of the month'}>
					{schedule.frequency === 'weekly' ? (
						<select
							aria-label='Day of the week'
							value={schedule.weekday}
							onChange={(event) => set({ weekday: Number(event.target.value) })}
							className={inputClass}>
							{WEEKDAYS.map((day, index) => (
								<option key={day} value={index}>
									{day}
								</option>
							))}
						</select>
					) : (
						<input
							type='number'
							min={1}
							max={31}
							aria-label='Day of the month'
							value={schedule.day}
							onChange={(event) =>
								set({
									day: Math.min(31, Math.max(1, Number(event.target.value) || 1)),
								})
							}
							className={inputClass}
						/>
					)}
				</Field>
			)}

			{timed && (
				<Field label='At'>
					<input
						type='time'
						aria-label='Time'
						value={timeValue}
						onChange={(event) => {
							const [hour, minute] = event.target.value.split(':').map(Number);
							if (Number.isFinite(hour) && Number.isFinite(minute))
								set({ hour, minute });
						}}
						className={inputClass}
					/>
				</Field>
			)}

			{schedule.frequency === 'custom' && (
				<Field
					label='Cron expression'
					hint='Minute, hour, day of month, month, day of week.'>
					<input
						type='text'
						aria-label='Cron expression'
						value={schedule.cron}
						onChange={(event) => set({ cron: event.target.value })}
						placeholder='0 9 * * 1-5'
						className={`${inputClass} font-mono`}
					/>
				</Field>
			)}
		</>
	);
};

type TProps = {
	ws: string;
	agentId: string;
	target: TTriggerDrawerTarget | null;
	appEvents: TNodeDefinition[];
	isLoadingApps: boolean;
	onNavigate: (target: TTriggerDrawerTarget) => void;
	onClose: () => void;
};

const FORM_ID = 'agent-trigger-form';

const TriggerForm = ({
	ws,
	agentId,
	target,
	appEvents,
	onNavigate,
	onClose,
	onSavingChange,
}: Omit<TProps, 'target' | 'isLoadingApps'> & {
	target: Exclude<TTriggerDrawerTarget, { mode: 'pick' }>;
	onSavingChange: (isSaving: boolean) => void;
}) => {
	const createTrigger = useCreateAgentTrigger(ws, agentId);
	const updateTrigger = useUpdateAgentTrigger(ws, agentId);
	const [draft, setDraft] = useState(() => draftFor(target, appEvents));
	const [showMore, setShowMore] = useState(false);
	const [showEventOptions, setShowEventOptions] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const set = (patch: Partial<TDraft>) => setDraft((current) => ({ ...current, ...patch }));

	const editing = target.mode === 'edit' ? target.trigger : null;
	const event = editing
		? appEventFor(editing, appEvents)
		: appEvents.find((item) => item.key === draft.appType);
	const credentialField = event?.fields.find((field) => field.kind === 'credential');
	const eventFields = (event?.fields ?? []).filter(
		(field) => field.kind !== 'credential' && !APP_TRIGGER_KEYS.includes(field.key),
	);
	const mainFields = eventFields.filter((field) => !field.advanced);
	const optionalFields = eventFields.filter((field) => field.advanced);
	const host = event
		? {
				type: event.key,
				values: { ...draft.nodeConfig, credential_id: draft.credentialId },
				fields: event.fields,
			}
		: undefined;
	const cron = scheduleToCron(draft.schedule);
	const isSaving = createTrigger.isPending || updateTrigger.isPending;
	useEffect(() => onSavingChange(isSaving), [isSaving, onSavingChange]);

	const title = editing
		? triggerTitle(editing, appEvents)
		: draft.kind === 'app'
			? (event?.label ?? 'App event')
			: draft.kind === 'webhook'
				? 'Webhook'
				: 'Schedule';

	const validate = () => {
		const next: Record<string, string> = {};
		if (draft.kind === 'schedule' && !isValidCron(cron))
			next.cron = 'That schedule isn’t a valid cron expression.';
		if (draft.kind === 'app') {
			if (credentialField && !draft.credentialId) next.credential_id = 'Choose an account.';
			for (const field of mainFields)
				if (field.required && (draft.nodeConfig[field.key] ?? '') === '')
					next[field.key] = `${field.label} is required.`;
		}
		if (
			draft.kind === 'webhook' &&
			!editing &&
			draft.authentication !== 'none' &&
			!draft.secret.trim()
		)
			next.secret = 'Add the token or secret the sender will use.';
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const buildConfig = () => {
		const common = {
			message: draft.message.trim() || undefined,
			autonomy_mode: draft.autonomyMode || undefined,
			if_already_running: draft.ifAlreadyRunning || undefined,
			max_failures: draft.maxFailures,
		};
		const specific =
			draft.kind === 'schedule'
				? { cron, timezone: draft.timezone || undefined }
				: draft.kind === 'webhook'
					? {
							authentication: draft.authentication,
							header_name:
								draft.authentication === 'header_token'
									? draft.headerName.trim() || undefined
									: undefined,
						}
					: {
							node_type: event?.key ?? draft.appType,
							node_config: draft.nodeConfig,
							poll_interval_minutes: draft.pollMinutes,
						};
		return Object.fromEntries(
			Object.entries({ ...specific, ...common }).filter(([, value]) => value !== undefined),
		);
	};

	const save = async () => {
		if (!validate()) return;
		const config = buildConfig();
		try {
			if (editing) {
				await updateTrigger.mutateAsync({
					triggerId: editing.id,
					body: {
						config,
						...(draft.kind === 'app' &&
						draft.credentialId &&
						draft.credentialId !== editing.credential_id
							? { credential_id: draft.credentialId }
							: {}),
					},
				});
				notify.success('Trigger saved.');
			} else {
				const created = await createTrigger.mutateAsync({
					type: draft.kind === 'app' ? 'polling' : draft.kind,
					config,
					is_active: true,
					...(draft.kind === 'app' && draft.credentialId
						? { credential_id: draft.credentialId }
						: {}),
					...(draft.kind === 'webhook' && draft.authentication !== 'none'
						? { signing_secret: draft.secret.trim() }
						: {}),
				});
				// A webhook is only useful once its URL is copied: stay on it.
				if (created.type === 'webhook') {
					notify.success('Webhook added. Copy its URL below.');
					onNavigate({ mode: 'edit', trigger: created });
					return;
				}
				notify.success('Trigger added.');
			}
			onClose();
		} catch (error) {
			if (ApiError.is(error)) {
				const fields = error.fieldErrors();
				setErrors(
					Object.fromEntries(
						Object.entries(fields).map(([key, message]) => [
							key === 'signing_secret'
								? 'secret'
								: key.replace(/^config\.(node_config\.)?/, ''),
							message,
						]),
					),
				);
			}
		}
	};

	const errorText = (key: string) =>
		errors[key] ? (
			<p className='pl-1 text-[10px] font-semibold text-rose-500'>{errors[key]}</p>
		) : null;

	return (
		<form
			id={FORM_ID}
			onSubmit={(formEvent) => {
				formEvent.preventDefault();
				void save();
			}}
			className='space-y-3'>
			<div className='flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/30'>
				<KindIcon kind={draft.kind} event={event} />
				<div className='min-w-0 flex-1'>
					<p className='truncate text-xs font-black text-zinc-900 dark:text-white'>
						{title}
					</p>
					<p className='mt-0.5 truncate text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
						{draft.kind === 'schedule'
							? isValidCron(cron)
								? describeCron(cron)
								: 'Pick when it runs'
							: draft.kind === 'webhook'
								? 'Starts the agent when a request arrives'
								: (event?.description ?? 'Starts the agent for each new item')}
					</p>
				</div>
				{!editing && (
					<button
						type='button'
						onClick={() => onNavigate({ mode: 'pick' })}
						className='text-primary-600 dark:text-primary-400 flex shrink-0 items-center gap-0.5 text-[10px] font-black hover:underline'>
						<ChevronLeft size={12} />
						Change
					</button>
				)}
			</div>

			{editing && (
				<>
					<Section title='Activity'>
						<TriggerDetails workspaceId={ws} trigger={editing} showEvents={false} />
					</Section>
					<Section title='Events'>
						<TriggerEventsPart ws={ws} triggerId={editing.id} />
					</Section>
				</>
			)}

			<Section title='When'>
				{draft.kind === 'schedule' && (
					<>
						<ScheduleFields
							schedule={draft.schedule}
							onChange={(schedule) => set({ schedule })}
						/>
						{errorText('cron')}
						<Field label='Timezone'>
							<TimezoneSelectPart
								aria-label='Timezone'
								value={draft.timezone}
								onChange={(timezone) => set({ timezone })}
								emptyLabel='Workspace timezone'
								className={inputClass}
							/>
						</Field>
					</>
				)}

				{draft.kind === 'webhook' && (
					<>
						<Field
							label='Authentication'
							hint={
								WEBHOOK_AUTH.find((item) => item.value === draft.authentication)
									?.hint
							}>
							<select
								aria-label='Authentication'
								value={draft.authentication}
								onChange={(event) => set({ authentication: event.target.value })}
								className={inputClass}>
								{WEBHOOK_AUTH.map((item) => (
									<option key={item.value} value={item.value}>
										{item.label}
									</option>
								))}
							</select>
						</Field>
						{draft.authentication === 'header_token' && (
							<Field label='Header name'>
								<input
									type='text'
									aria-label='Header name'
									value={draft.headerName}
									onChange={(event) => set({ headerName: event.target.value })}
									placeholder='X-Webhook-Token'
									className={`${inputClass} font-mono`}
								/>
							</Field>
						)}
						{!editing && draft.authentication !== 'none' && (
							<div className='space-y-1.5'>
								<span className={labelClass}>
									{draft.authentication === 'header_token'
										? 'Token'
										: 'Signing secret'}
								</span>
								<div className='flex gap-2'>
									<input
										type={
											draft.authentication === 'header_token'
												? 'text'
												: 'password'
										}
										aria-label='Secret'
										value={draft.secret}
										onChange={(event) => set({ secret: event.target.value })}
										className={`${inputClass} font-mono`}
									/>
									{draft.authentication === 'header_token' && (
										<button
											type='button'
											onClick={() => set({ secret: generateToken() })}
											className='shrink-0 rounded-lg border border-zinc-200 px-3 text-[10px] font-black text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800'>
											Generate
										</button>
									)}
								</div>
								{errorText('secret')}
							</div>
						)}
						{!editing && (
							<p className='pl-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
								You’ll get the URL to send requests to once the trigger is added.
							</p>
						)}
					</>
				)}

				{draft.kind === 'app' && event && (
					<>
						{credentialField && (
							<div className='space-y-1.5'>
								<span className={labelClass}>Account</span>
								<FieldInput
									field={credentialField}
									value={draft.credentialId || undefined}
									onChange={(value) => set({ credentialId: String(value ?? '') })}
								/>
								{errorText('credential_id')}
							</div>
						)}
						{mainFields.map((field) => (
							<div key={field.key} className='space-y-1.5'>
								<span className={labelClass}>{field.label}</span>
								<FieldInput
									field={field}
									host={host}
									value={draft.nodeConfig[field.key] ?? field.default}
									onChange={(value) =>
										set({
											nodeConfig: { ...draft.nodeConfig, [field.key]: value },
										})
									}
								/>
								{field.help && (
									<p className='pl-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
										{field.help}
									</p>
								)}
								{errorText(field.key)}
							</div>
						))}
						{optionalFields.length > 0 && (
							<>
								<button
									type='button'
									onClick={() => setShowEventOptions((open) => !open)}
									className='flex items-center gap-1 pl-1 text-[10px] font-black text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'>
									<ChevronDown
										size={12}
										className={`transition-transform ${showEventOptions ? '' : '-rotate-90'}`}
									/>
									Filters
								</button>
								{showEventOptions &&
									optionalFields.map((field) => (
										<div key={field.key} className='space-y-1.5'>
											<span className={labelClass}>{field.label}</span>
											<FieldInput
												field={field}
												host={host}
												value={draft.nodeConfig[field.key] ?? field.default}
												onChange={(value) =>
													set({
														nodeConfig: {
															...draft.nodeConfig,
															[field.key]: value,
														},
													})
												}
											/>
										</div>
									))}
							</>
						)}
						<Field
							label='Check every (minutes)'
							hint='Only items that arrive after the trigger is turned on start the agent.'>
							<input
								type='number'
								min={1}
								max={1440}
								aria-label='Check every (minutes)'
								value={draft.pollMinutes ?? ''}
								onChange={(event) =>
									set({
										pollMinutes:
											event.target.value === ''
												? undefined
												: Number(event.target.value),
									})
								}
								className={inputClass}
							/>
						</Field>
						{errorText('poll_interval_minutes')}
					</>
				)}
			</Section>

			<Section title='Then the agent'>
				<Field
					label='Instructions'
					hint={
						<>
							Use <code className='font-mono'>{'{{ payload.field }}'}</code> to
							include data from the event. Leave it empty and the agent gets the raw
							event.
						</>
					}>
					<textarea
						aria-label='Instructions'
						rows={4}
						value={draft.message}
						onChange={(event) => set({ message: event.target.value })}
						placeholder={
							draft.kind === 'schedule'
								? 'Check yesterday’s signups and post a summary to #growth'
								: draft.kind === 'webhook'
									? 'Handle this request: {{ payload.message }}'
									: 'Read this and tell me if it needs a reply'
						}
						className={`${inputClass} resize-y`}
					/>
				</Field>
				{errorText('message')}
			</Section>

			<div>
				<button
					type='button'
					onClick={() => setShowMore((open) => !open)}
					className='flex items-center gap-1 pl-1 text-[10px] font-black text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'>
					<ChevronDown
						size={12}
						className={`transition-transform ${showMore ? '' : '-rotate-90'}`}
					/>
					More options
				</button>
				{showMore && (
					<div className='mt-3 space-y-3'>
						<Field
							label='Autonomy'
							hint='Nobody is watching a triggered run, so a stricter mode is often safer.'>
							<select
								aria-label='Autonomy'
								value={draft.autonomyMode}
								onChange={(event) => set({ autonomyMode: event.target.value })}
								className={inputClass}>
								<option value=''>Same as the agent</option>
								{AUTONOMY_MODES.map((mode) => (
									<option key={mode} value={mode}>
										{AUTONOMY_MODE_META[mode].label}:{' '}
										{AUTONOMY_MODE_META[mode].description}
									</option>
								))}
							</select>
						</Field>
						<Field label='If the last run is still going'>
							<select
								aria-label='If the last run is still going'
								value={draft.ifAlreadyRunning}
								onChange={(event) => set({ ifAlreadyRunning: event.target.value })}
								className={inputClass}>
								<option value=''>Start another run</option>
								<option value='skip'>Skip this one</option>
							</select>
						</Field>
						<Field
							label='Switch off after failures in a row'
							hint='Leave empty for the default (3).'>
							<input
								type='number'
								min={1}
								max={20}
								aria-label='Switch off after failures in a row'
								value={draft.maxFailures ?? ''}
								onChange={(event) =>
									set({
										maxFailures:
											event.target.value === ''
												? undefined
												: Number(event.target.value),
									})
								}
								className={inputClass}
							/>
						</Field>
						{errorText('max_failures')}
					</div>
				)}
			</div>
		</form>
	);
};

const TriggerPicker = ({
	query,
	appEvents,
	isLoadingApps,
	onNavigate,
}: Pick<TProps, 'appEvents' | 'isLoadingApps' | 'onNavigate'> & { query: string }) => {
	const q = query.trim().toLowerCase();
	const matches = (text: string) => !q || text.toLowerCase().includes(q);

	const builtIns = [
		{
			kind: 'schedule' as const,
			title: 'Schedule',
			subtitle: 'Every hour, every morning, every Monday…',
		},
		{
			kind: 'webhook' as const,
			title: 'Webhook',
			subtitle: 'When another app sends a request to a URL',
		},
	].filter((item) => matches(`${item.title} ${item.subtitle}`));

	const apps = useMemo(() => {
		const groups = new Map<string, TNodeDefinition[]>();
		for (const event of appEvents) {
			if (!matches(`${event.label} ${event.description}`)) continue;
			const { app } = splitEventName(event.label);
			groups.set(app, [...(groups.get(app) ?? []), event]);
		}
		return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [appEvents, q]);

	return (
		<>
			<p className='px-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400'>
				Choose what starts this agent. Each time it fires, the agent gets a fresh chat with
				your instructions.
			</p>

			{builtIns.length > 0 && (
				<div className='space-y-2'>
					<span className={labelClass}>Built-in</span>
					{builtIns.map((item) => (
						<PickRow
							key={item.kind}
							icon={<KindIcon kind={item.kind} />}
							title={item.title}
							subtitle={item.subtitle}
							onClick={() => onNavigate({ mode: 'create', kind: item.kind })}
						/>
					))}
				</div>
			)}

			{(apps.length > 0 || isLoadingApps) && (
				<div className='space-y-2 pt-1'>
					<span className={labelClass}>App events</span>
					{isLoadingApps && (
						<div className='space-y-2'>
							{[0, 1, 2].map((index) => (
								<div
									key={index}
									className='h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800/60'
								/>
							))}
						</div>
					)}
					{apps.map(([app, events]) => (
						<div key={app} className='space-y-2'>
							{events.map((event) => (
								<PickRow
									key={event.key}
									icon={<KindIcon kind='app' event={event} />}
									title={splitEventName(event.label).event}
									subtitle={`${app} · ${event.description}`}
									onClick={() =>
										onNavigate({
											mode: 'create',
											kind: 'app',
											appType: event.key,
										})
									}
								/>
							))}
						</div>
					))}
				</div>
			)}

			{!isLoadingApps && builtIns.length === 0 && apps.length === 0 && (
				<p className='py-10 text-center text-xs font-semibold text-zinc-400'>
					Nothing matches “{query}”.
				</p>
			)}
		</>
	);
};

/**
 * One drawer for the whole flow: the picker and the form swap inside it, so
 * moving between them doesn't replay the slide-in. The last target stays
 * rendered while the drawer slides out.
 */
const AgentTriggerDrawer = ({
	ws,
	agentId,
	target,
	appEvents,
	isLoadingApps,
	onNavigate,
	onClose,
}: TProps) => {
	const [shown, setShown] = useState(target);
	const [query, setQuery] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	if (target && target !== shown) {
		setShown(target);
		if (target.mode === 'pick') setQuery('');
	}

	const editing = shown?.mode === 'edit';
	const footer =
		shown && shown.mode !== 'pick' ? (
			<div className='flex items-center justify-end gap-2'>
				<button
					type='button'
					onClick={onClose}
					className='min-h-11 rounded-lg px-4 py-1.5 text-xs font-bold text-zinc-500 hover:bg-zinc-100 md:min-h-0 dark:hover:bg-zinc-800'>
					Cancel
				</button>
				<button
					type='submit'
					form={FORM_ID}
					disabled={isSaving}
					className='bg-primary-400 text-primary-950 hover:bg-primary-500 min-h-11 rounded-lg px-4 py-1.5 text-xs font-black disabled:opacity-60 md:min-h-0'>
					{isSaving ? 'Saving…' : editing ? 'Save changes' : 'Add trigger'}
				</button>
			</div>
		) : undefined;

	return (
		<AgentSideDrawer
			isOpen={!!target}
			title={editing ? 'Edit trigger' : 'Add a trigger'}
			onClose={onClose}
			footer={footer}
			search={
				shown?.mode === 'pick'
					? { value: query, onChange: setQuery, placeholder: 'Search triggers or apps…' }
					: undefined
			}>
			{shown?.mode === 'pick' && (
				<TriggerPicker
					query={query}
					appEvents={appEvents}
					isLoadingApps={isLoadingApps}
					onNavigate={onNavigate}
				/>
			)}
			{shown && shown.mode !== 'pick' && (
				<TriggerForm
					key={
						shown.mode === 'edit'
							? shown.trigger.id
							: `${shown.kind}:${shown.appType ?? ''}`
					}
					ws={ws}
					agentId={agentId}
					appEvents={appEvents}
					onNavigate={onNavigate}
					onClose={onClose}
					target={shown}
					onSavingChange={setIsSaving}
				/>
			)}
		</AgentSideDrawer>
	);
};

export default AgentTriggerDrawer;
