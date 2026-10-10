import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { formatDistanceToNow } from 'date-fns';
import {
	AlertTriangle,
	CalendarClock,
	ChevronRight,
	Copy,
	ExternalLink,
	Hand,
	Loader2,
	Pencil,
	Play,
	Plus,
	RefreshCw,
	Repeat,
	Trash2,
	Webhook,
	X,
} from 'lucide-react';
import { notify } from '@/api/core';
import { useTriggerPresets } from '@/api/modules/catalog';
import {
	useCreateTrigger,
	useDeleteTrigger,
	useRotateTriggerToken,
	useRunTrigger,
	useTriggerEvents,
	useTriggers,
	useUpdateTrigger,
} from '@/api/modules/triggers';
import { useConfirm } from '@/context/confirm';
import paths from '@/Routes/paths';
import type { TTriggerPreset } from '@/types/catalog.type';
import type { TTrigger } from '@/types/trigger.type';
import { useWorkflowEditor } from '../../_hooks/useWorkflowEditor.hook';
import {
	CRON_SHORTCUTS,
	WORKFLOW_TRIGGER_TYPES,
	eventStatusDot,
	isValidCron,
	triggerTitle,
	webhookUrlFor,
} from '../../_helper/trigger.helper';

type TWorkflowTriggerType = (typeof WORKFLOW_TRIGGER_TYPES)[number]['value'];

type TFilterDraft = {
	source: 'payload' | 'header';
	path: string;
	operator: 'equals' | 'not_equals' | 'contains';
	value: string;
};

type TDraft = {
	type: TWorkflowTriggerType;
	presetId: string;
	signingSecret: string;
	cron: string;
	url: string;
	method: 'get' | 'post';
	itemsPath: string;
	idPath: string;
	intervalMinutes: string;
	cursorParam: string;
	cursorPath: string;
	filters: TFilterDraft[];
};

/** Config keys this form owns — anything else already on a trigger is kept as-is on save. */
const OWNED_KEYS = [
	'cron',
	'url',
	'method',
	'items_path',
	'id_path',
	'poll_interval_minutes',
	'cursor_param',
	'cursor_path',
	'filters',
];

const TYPE_ICON: Record<TWorkflowTriggerType, typeof Webhook> = {
	webhook: Webhook,
	schedule: CalendarClock,
	polling: Repeat,
	manual: Hand,
};

const SECRET_HINT: Record<string, string> = {
	github: 'The secret you entered on the GitHub webhook.',
	stripe: 'The endpoint’s signing secret from Stripe (starts with whsec_).',
	slack: 'Your Slack app’s Signing Secret (Basic Information page).',
};

const inputClass =
	'w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 outline-none focus:border-primary-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300';
const labelClass = 'mb-1 block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400';
const primaryButtonClass =
	'flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200';
const ghostButtonClass =
	'flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-white/[0.04]';
const iconButtonClass =
	'flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200';

const str = (value: unknown) =>
	typeof value === 'string' || typeof value === 'number' ? String(value) : '';

const emptyDraft = (type: TWorkflowTriggerType = 'webhook'): TDraft => ({
	type,
	presetId: '',
	signingSecret: '',
	cron: '0 9 * * *',
	url: '',
	method: 'get',
	itemsPath: '',
	idPath: '',
	intervalMinutes: '',
	cursorParam: '',
	cursorPath: '',
	filters: [],
});

const toDraft = (trigger: TTrigger): TDraft => {
	const config = trigger.config ?? {};
	const filters = Array.isArray(config.filters)
		? (config.filters as Record<string, unknown>[])
		: [];
	return {
		...emptyDraft(trigger.type as TWorkflowTriggerType),
		presetId: trigger.preset_id ? String(trigger.preset_id) : '',
		cron: str(config.cron),
		url: str(config.url),
		method: config.method === 'post' ? 'post' : 'get',
		itemsPath: str(config.items_path),
		idPath: str(config.id_path),
		intervalMinutes: str(config.poll_interval_minutes),
		cursorParam: str(config.cursor_param),
		cursorPath: str(config.cursor_path),
		filters: filters.map((filter) => ({
			source: filter.source === 'header' ? 'header' : 'payload',
			path: str(filter.path),
			operator:
				filter.operator === 'not_equals' || filter.operator === 'contains'
					? filter.operator
					: 'equals',
			value: str(filter.value),
		})),
	};
};

const toConfig = (draft: TDraft, previous: Record<string, unknown> | null = null) => {
	const config: Record<string, unknown> = Object.fromEntries(
		Object.entries(previous ?? {}).filter(([key]) => !OWNED_KEYS.includes(key)),
	);
	const set = (key: string, value: string) => {
		if (value.trim()) config[key] = value.trim();
	};
	if (draft.type === 'schedule') set('cron', draft.cron);
	if (draft.type === 'polling') {
		set('url', draft.url);
		config.method = draft.method;
		set('items_path', draft.itemsPath);
		set('id_path', draft.idPath);
		if (draft.intervalMinutes.trim())
			config.poll_interval_minutes = Number(draft.intervalMinutes);
		set('cursor_param', draft.cursorParam);
		set('cursor_path', draft.cursorPath);
	}
	if ((draft.type === 'webhook' || draft.type === 'polling') && draft.filters.length > 0) {
		config.filters = draft.filters.map((filter) => ({
			source: filter.source,
			path: filter.path.trim(),
			operator: filter.operator,
			value: filter.value,
		}));
	}
	return config;
};

const validate = (
	draft: TDraft,
	preset: TTriggerPreset | undefined,
	isEdit: boolean,
): string | null => {
	if (draft.type === 'schedule' && !isValidCron(draft.cron)) {
		return 'Enter a cron with five fields, like 0 9 * * 1-5.';
	}
	if (draft.type === 'polling') {
		if (!/^https?:\/\/\S+$/.test(draft.url.trim()))
			return 'Enter the URL to poll, starting with http:// or https://.';
		const interval = draft.intervalMinutes.trim();
		if (interval && !(Number.isInteger(Number(interval)) && Number(interval) > 0)) {
			return 'The interval must be a whole number of minutes.';
		}
	}
	if (!isEdit && preset?.signature_scheme && !draft.signingSecret.trim()) {
		return 'This preset checks signatures — enter the signing secret, or every delivery is rejected.';
	}
	if (draft.filters.some((filter) => !filter.path.trim())) return 'Every filter needs a path.';
	return null;
};

const describe = (trigger: TTrigger) => {
	const config = trigger.config ?? {};
	switch (trigger.type) {
		case 'schedule':
			return config.cron ? `Cron ${str(config.cron)} (UTC)` : 'No schedule set';
		case 'polling':
			return config.url
				? `${str(config.method || 'get').toUpperCase()} ${str(config.url)} every ${str(config.poll_interval_minutes) || '15'} min`
				: 'No URL set';
		case 'manual':
			return 'Runs only when someone clicks Run now.';
		default:
			return 'Runs when a request is POSTed to the URL below.';
	}
};

// ─── Form ─────────────────────────────────────────────────────

type TTriggerFormProps = {
	initial: TDraft;
	isEdit: boolean;
	presets: TTriggerPreset[];
	isSaving: boolean;
	onCancel: () => void;
	onSubmit: (draft: TDraft) => void;
};

const TriggerForm = ({
	initial,
	isEdit,
	presets,
	isSaving,
	onCancel,
	onSubmit,
}: TTriggerFormProps) => {
	const [draft, setDraft] = useState<TDraft>(initial);
	const [error, setError] = useState<string | null>(null);
	const update = (patch: Partial<TDraft>) => setDraft((current) => ({ ...current, ...patch }));
	const updateFilter = (index: number, patch: Partial<TFilterDraft>) =>
		setDraft((current) => ({
			...current,
			filters: current.filters.map((filter, i) =>
				i === index ? { ...filter, ...patch } : filter,
			),
		}));

	const webhookPresets = presets.filter((preset) => preset.type === 'webhook');
	const preset = presets.find((item) => String(item.id) === draft.presetId);

	const handleSubmit = () => {
		const problem = validate(draft, preset, isEdit);
		setError(problem);
		if (!problem) onSubmit(draft);
	};

	return (
		<div className='space-y-4'>
			{!isEdit && (
				<div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
					{WORKFLOW_TRIGGER_TYPES.map((type) => {
						const Icon = TYPE_ICON[type.value];
						const isActive = draft.type === type.value;
						return (
							<button
								key={type.value}
								type='button'
								title={type.hint}
								onClick={() => {
									setError(null);
									update({ type: type.value, presetId: '', signingSecret: '' });
								}}
								className={`flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition ${
									isActive
										? 'border-primary-400 bg-primary-50 dark:border-primary-600 dark:bg-primary-950/30'
										: 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
								}`}>
								<Icon
									size={14}
									className={
										isActive
											? 'text-primary-700 dark:text-primary-400'
											: 'text-zinc-400'
									}
								/>
								<span className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>
									{type.label}
								</span>
							</button>
						);
					})}
				</div>
			)}

			<p className='text-[11px] text-zinc-500'>
				{WORKFLOW_TRIGGER_TYPES.find((type) => type.value === draft.type)?.hint}
			</p>

			{/* Webhook */}
			{draft.type === 'webhook' && !isEdit && (
				<div className='space-y-3'>
					<div>
						<label htmlFor='trigger-preset' className={labelClass}>
							Source
						</label>
						<select
							id='trigger-preset'
							value={draft.presetId}
							onChange={(e) =>
								update({ presetId: e.target.value, signingSecret: '' })
							}
							className={inputClass}>
							<option value=''>Any sender (no signature check)</option>
							{webhookPresets.map((item) => (
								<option key={item.id} value={String(item.id)}>
									{item.name}
								</option>
							))}
						</select>
						{preset?.description && (
							<p className='mt-1 text-[11px] text-zinc-500'>{preset.description}</p>
						)}
					</div>
					{preset?.signature_scheme && (
						<div>
							<label htmlFor='trigger-secret' className={labelClass}>
								Signing secret
							</label>
							<input
								id='trigger-secret'
								type='password'
								autoComplete='off'
								value={draft.signingSecret}
								onChange={(e) => update({ signingSecret: e.target.value })}
								className={`${inputClass} font-mono`}
							/>
							<p className='mt-1 text-[11px] text-zinc-500'>
								{SECRET_HINT[preset.signature_scheme] ??
									'Used to check each delivery’s signature.'}{' '}
								It can’t be changed later: to use a new one, delete this trigger and
								create another.
							</p>
						</div>
					)}
				</div>
			)}

			{/* Schedule */}
			{draft.type === 'schedule' && (
				<div className='space-y-2'>
					<label htmlFor='trigger-cron' className={labelClass}>
						Cron schedule{' '}
						<span className='font-normal text-zinc-400'>(server time, UTC)</span>
					</label>
					<input
						aria-label='0 9 * * 1-5'
						id='trigger-cron'
						value={draft.cron}
						onChange={(e) => update({ cron: e.target.value })}
						placeholder='0 9 * * 1-5'
						className={`${inputClass} font-mono`}
					/>
					<div className='flex flex-wrap gap-1.5'>
						{CRON_SHORTCUTS.map((shortcut) => (
							<button
								key={shortcut.cron}
								type='button'
								onClick={() => update({ cron: shortcut.cron })}
								className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ${
									draft.cron.trim() === shortcut.cron
										? 'border-primary-400 bg-primary-50 text-primary-800 dark:border-primary-600 dark:bg-primary-950/30 dark:text-primary-300'
										: 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400'
								}`}>
								{shortcut.label}
							</button>
						))}
					</div>
				</div>
			)}

			{/* Polling */}
			{draft.type === 'polling' && (
				<div className='space-y-3'>
					<div className='grid grid-cols-1 gap-2 sm:grid-cols-[90px_1fr]'>
						<div>
							<label htmlFor='trigger-method' className={labelClass}>
								Method
							</label>
							<select
								id='trigger-method'
								value={draft.method}
								onChange={(e) =>
									update({ method: e.target.value as TDraft['method'] })
								}
								className={inputClass}>
								<option value='get'>GET</option>
								<option value='post'>POST</option>
							</select>
						</div>
						<div>
							<label htmlFor='trigger-url' className={labelClass}>
								URL to poll
							</label>
							<input
								aria-label='https://api.example.com/orders'
								id='trigger-url'
								value={draft.url}
								onChange={(e) => update({ url: e.target.value })}
								placeholder='https://api.example.com/orders'
								className={`${inputClass} font-mono`}
							/>
						</div>
					</div>
					<div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
						<div>
							<label htmlFor='trigger-items' className={labelClass}>
								Items path
							</label>
							<input
								aria-label='data.items'
								id='trigger-items'
								value={draft.itemsPath}
								onChange={(e) => update({ itemsPath: e.target.value })}
								placeholder='data.items'
								className={`${inputClass} font-mono`}
							/>
						</div>
						<div>
							<label htmlFor='trigger-id-path' className={labelClass}>
								Item id path
							</label>
							<input
								aria-label='id'
								id='trigger-id-path'
								value={draft.idPath}
								onChange={(e) => update({ idPath: e.target.value })}
								placeholder='id'
								className={`${inputClass} font-mono`}
							/>
						</div>
						<div>
							<label htmlFor='trigger-interval' className={labelClass}>
								Every (minutes)
							</label>
							<input
								aria-label='15'
								id='trigger-interval'
								inputMode='numeric'
								value={draft.intervalMinutes}
								onChange={(e) => update({ intervalMinutes: e.target.value })}
								placeholder='15'
								className={inputClass}
							/>
						</div>
					</div>
					<div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
						<div>
							<label htmlFor='trigger-cursor-param' className={labelClass}>
								Cursor query param{' '}
								<span className='font-normal text-zinc-400'>(optional)</span>
							</label>
							<input
								aria-label='since_id'
								id='trigger-cursor-param'
								value={draft.cursorParam}
								onChange={(e) => update({ cursorParam: e.target.value })}
								placeholder='since_id'
								className={`${inputClass} font-mono`}
							/>
						</div>
						<div>
							<label htmlFor='trigger-cursor-path' className={labelClass}>
								Cursor value path{' '}
								<span className='font-normal text-zinc-400'>(optional)</span>
							</label>
							<input
								aria-label='Defaults to the item id path'
								id='trigger-cursor-path'
								value={draft.cursorPath}
								onChange={(e) => update({ cursorPath: e.target.value })}
								placeholder='Defaults to the item id path'
								className={`${inputClass} font-mono`}
							/>
						</div>
					</div>
					<p className='text-[11px] text-zinc-500'>
						Each new item in the response starts one run, with the item as the run
						input. The request is sent without credentials, so the URL must be reachable
						as-is.
					</p>
				</div>
			)}

			{/* Filters */}
			{(draft.type === 'webhook' || draft.type === 'polling') && (
				<div className='space-y-2'>
					<div className='flex items-center justify-between'>
						<span className={labelClass}>
							Only run when{' '}
							<span className='font-normal text-zinc-400'>
								(all filters must match)
							</span>
						</span>
						<button
							type='button'
							onClick={() =>
								update({
									filters: [
										...draft.filters,
										{
											source: 'payload',
											path: '',
											operator: 'equals',
											value: '',
										},
									],
								})
							}
							className='flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'>
							<Plus size={11} />
							Add filter
						</button>
					</div>
					{draft.filters.length === 0 ? (
						<p className='text-[11px] text-zinc-400'>
							No filters: every event starts a run.
						</p>
					) : (
						draft.filters.map((filter, index) => (
							<div
								key={index}
								className='grid grid-cols-1 gap-2 sm:grid-cols-[100px_1fr_110px_1fr_auto]'>
								<select
									aria-label='Filter source'
									value={filter.source}
									onChange={(e) =>
										updateFilter(index, {
											source: e.target.value as TFilterDraft['source'],
										})
									}
									className={inputClass}>
									<option value='payload'>Body</option>
									{draft.type === 'webhook' && (
										<option value='header'>Header</option>
									)}
								</select>
								<input
									aria-label='Filter path'
									value={filter.path}
									onChange={(e) => updateFilter(index, { path: e.target.value })}
									placeholder={
										filter.source === 'header' ? 'X-GitHub-Event' : 'ref'
									}
									className={`${inputClass} font-mono`}
								/>
								<select
									aria-label='Filter operator'
									value={filter.operator}
									onChange={(e) =>
										updateFilter(index, {
											operator: e.target.value as TFilterDraft['operator'],
										})
									}
									className={inputClass}>
									<option value='equals'>equals</option>
									<option value='not_equals'>does not equal</option>
									<option value='contains'>contains</option>
								</select>
								<input
									aria-label='Filter value'
									value={filter.value}
									onChange={(e) => updateFilter(index, { value: e.target.value })}
									placeholder={
										filter.source === 'header' ? 'push' : 'refs/heads/main'
									}
									className={`${inputClass} font-mono`}
								/>
								<button
									type='button'
									title='Remove filter'
									aria-label='Remove filter'
									onClick={() =>
										update({
											filters: draft.filters.filter((_, i) => i !== index),
										})
									}
									className='flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30'>
									<Trash2 size={13} />
								</button>
							</div>
						))
					)}
					{draft.type === 'webhook' &&
						draft.filters.some((filter) => filter.source === 'header') && (
							<p className='text-[11px] text-zinc-500'>
								Only allow-listed headers are kept (for example X-GitHub-Event), so
								filters on other headers never match.
							</p>
						)}
				</div>
			)}

			{error && (
				<p className='flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-400'>
					<AlertTriangle size={13} className='mt-px shrink-0' />
					{error}
				</p>
			)}

			<div className='flex items-center justify-end gap-2'>
				<button type='button' onClick={onCancel} className={ghostButtonClass}>
					Cancel
				</button>
				<button
					type='button'
					onClick={handleSubmit}
					disabled={isSaving}
					className={primaryButtonClass}>
					{isSaving && <Loader2 size={13} className='animate-spin' />}
					{isEdit ? 'Save changes' : 'Create trigger'}
				</button>
			</div>
		</div>
	);
};

// ─── Events ───────────────────────────────────────────────────

const TriggerEvents = ({ workspaceId, triggerId }: { workspaceId: string; triggerId: string }) => {
	const events = useTriggerEvents(workspaceId, triggerId);
	const [openEventId, setOpenEventId] = useState<string | null>(null);

	if (events.isLoading) {
		return (
			<div className='flex items-center gap-1.5 text-[11px] text-zinc-400'>
				<Loader2 size={11} className='animate-spin' />
				Loading events…
			</div>
		);
	}
	if (events.isError) return <p className='text-[11px] text-rose-500'>Couldn’t load events.</p>;
	if (!events.data?.length)
		return <p className='text-[11px] text-zinc-400'>No events received yet.</p>;

	return (
		<div className='max-h-64 space-y-1 overflow-y-auto'>
			{events.data.map((event) => {
				const isOpen = openEventId === event.id;
				return (
					<div key={event.id} className='rounded-lg bg-zinc-50 dark:bg-zinc-900/60'>
						<div className='flex items-center gap-2 px-2.5 py-1.5 text-[11px]'>
							<button
								type='button'
								onClick={() => setOpenEventId(isOpen ? null : event.id)}
								className='flex min-w-0 flex-1 items-center gap-2 text-left'>
								<ChevronRight
									size={11}
									className={`shrink-0 text-zinc-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
								/>
								<span
									className={`h-1.5 w-1.5 shrink-0 rounded-full ${eventStatusDot[event.status] ?? 'bg-zinc-300'}`}
								/>
								<span className='font-semibold text-zinc-700 capitalize dark:text-zinc-300'>
									{event.status}
								</span>
								<span className='text-zinc-400'>· {event.source}</span>
								{event.duplicate_count > 0 && (
									<span
										className='text-zinc-400'
										title='Repeat deliveries of the same event were ignored'>
										· ×{event.duplicate_count + 1}
									</span>
								)}
								{event.error && (
									<span className='truncate text-rose-500'>· {event.error}</span>
								)}
							</button>
							<span className='shrink-0 text-zinc-400'>
								{formatDistanceToNow(new Date(event.created_at), {
									addSuffix: true,
								})}
							</span>
							{event.run_id && (
								<Link
									to={paths.trail(workspaceId, event.run_id)}
									title='Open this run in Trail'
									className='hover:text-primary-600 dark:hover:text-primary-400 shrink-0 text-zinc-400'>
									<ExternalLink size={11} />
								</Link>
							)}
						</div>
						{isOpen && (
							<pre className='max-h-40 overflow-auto border-t border-zinc-200 px-2.5 py-2 font-mono text-[10px] text-zinc-600 dark:border-zinc-800 dark:text-zinc-400'>
								{JSON.stringify(event.payload ?? {}, null, 2)}
							</pre>
						)}
					</div>
				);
			})}
		</div>
	);
};

// ─── Card ─────────────────────────────────────────────────────

type TTriggerCardProps = {
	workspaceId: string;
	trigger: TTrigger;
	presets: TTriggerPreset[];
	isPublished: boolean;
};

const TriggerCard = ({ workspaceId, trigger, presets, isPublished }: TTriggerCardProps) => {
	const { confirm } = useConfirm();
	const updateTrigger = useUpdateTrigger(workspaceId);
	const deleteTrigger = useDeleteTrigger(workspaceId);
	const runTrigger = useRunTrigger(workspaceId);
	const rotateToken = useRotateTriggerToken(workspaceId);
	const [isEditing, setIsEditing] = useState(false);
	const [eventsOpen, setEventsOpen] = useState(false);

	const type = trigger.type as TWorkflowTriggerType;
	const Icon = TYPE_ICON[type] ?? Webhook;
	const webhookUrl =
		trigger.type === 'webhook' && trigger.token ? webhookUrlFor(trigger.token) : '';
	const failures = trigger.consecutive_failure_count ?? 0;

	const handleToggle = () =>
		updateTrigger.mutate({ id: trigger.id, body: { is_active: !trigger.is_active } });

	const handleDelete = async () => {
		const confirmed = await confirm({
			title: 'Delete trigger',
			confirmText: 'Delete',
			message:
				trigger.type === 'webhook'
					? 'The webhook URL stops working immediately and its event history is removed.'
					: 'This trigger stops firing and its event history is removed.',
		});
		if (!confirmed) return;
		deleteTrigger.mutate(trigger.id, { onSuccess: () => notify.success('Trigger deleted') });
	};

	const handleRotate = async () => {
		const confirmed = await confirm({
			title: 'Rotate webhook URL',
			confirmText: 'Rotate',
			message:
				'A new URL is issued and the current one stops working immediately. Anything still posting to it will get a 404 until you update it.',
		});
		if (!confirmed) return;
		rotateToken.mutate(trigger.id, { onSuccess: () => notify.success('Webhook URL rotated') });
	};

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(webhookUrl);
			notify.success('Webhook URL copied');
		} catch {
			notify.error('Could not copy the webhook URL');
		}
	};

	const handleRun = () => {
		setEventsOpen(true);
		runTrigger.mutate(trigger.id, { onSuccess: () => notify.success('Run queued') });
	};

	const handleSave = (draft: TDraft) =>
		updateTrigger.mutate(
			{ id: trigger.id, body: { config: toConfig(draft, trigger.config) } },
			{
				onSuccess: () => {
					setIsEditing(false);
					notify.success('Trigger updated');
				},
			},
		);

	const runBlockedReason = !isPublished
		? 'Publish the workflow first — triggers run the published version.'
		: !trigger.is_active
			? 'Turn the trigger on to run it.'
			: undefined;

	return (
		<div className='space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/20 p-4 dark:border-zinc-800 dark:bg-zinc-900/20'>
			<div className='flex items-start justify-between gap-3'>
				<div className='flex min-w-0 items-start gap-2.5'>
					<span className='bg-primary-100 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'>
						<Icon size={15} />
					</span>
					<div className='min-w-0'>
						<div className='flex flex-wrap items-center gap-2'>
							<h4 className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>
								{triggerTitle(trigger, presets)}
							</h4>
							<span
								className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
									trigger.is_active
										? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
										: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
								}`}>
								{trigger.is_active ? 'Active' : 'Paused'}
							</span>
						</div>
						<p
							className='mt-0.5 truncate text-[11px] text-zinc-500'
							title={describe(trigger)}>
							{describe(trigger)}
						</p>
						<p className='mt-0.5 text-[11px] text-zinc-400'>
							{trigger.last_run_at
								? `Last fired ${formatDistanceToNow(new Date(trigger.last_run_at), { addSuffix: true })}`
								: 'Never fired'}
						</p>
					</div>
				</div>
				<div className='flex shrink-0 items-center gap-1'>
					<button
						type='button'
						role='switch'
						aria-checked={trigger.is_active}
						aria-label={trigger.is_active ? 'Pause trigger' : 'Turn trigger on'}
						title={trigger.is_active ? 'Pause trigger' : 'Turn trigger on'}
						disabled={updateTrigger.isPending}
						onClick={handleToggle}
						className='flex h-7 w-9 items-center justify-center rounded-lg disabled:opacity-50'>
						<span
							className={`relative inline-flex h-4 w-7 rounded-full border-2 border-transparent transition-colors ${
								trigger.is_active
									? 'bg-primary-400'
									: 'bg-zinc-200 dark:bg-zinc-800'
							}`}>
							<span
								className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition duration-200 ${
									trigger.is_active ? 'translate-x-3' : 'translate-x-0'
								}`}
							/>
						</span>
					</button>
					{type !== 'manual' && (
						<button
							type='button'
							title='Edit trigger'
							aria-label='Edit trigger'
							onClick={() => setIsEditing((open) => !open)}
							className={iconButtonClass}>
							{isEditing ? <X size={13} /> : <Pencil size={13} />}
						</button>
					)}
					<button
						type='button'
						title='Delete trigger'
						aria-label='Delete trigger'
						disabled={deleteTrigger.isPending}
						onClick={handleDelete}
						className={`${iconButtonClass} hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30`}>
						<Trash2 size={13} />
					</button>
				</div>
			</div>

			{failures > 0 && (
				<div className='flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-300'>
					<AlertTriangle size={12} className='mt-px shrink-0' />
					{trigger.is_active
						? `The last ${failures} ${failures === 1 ? 'run has' : 'runs have'} failed. After 5 in a row the trigger is paused automatically.`
						: `Paused automatically after ${failures} failed runs in a row. Fix the cause, then turn it back on.`}
				</div>
			)}

			{isEditing ? (
				<div className='rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40'>
					<TriggerForm
						initial={toDraft(trigger)}
						isEdit
						presets={presets}
						isSaving={updateTrigger.isPending}
						onCancel={() => setIsEditing(false)}
						onSubmit={handleSave}
					/>
				</div>
			) : (
				webhookUrl && (
					<div className='space-y-1'>
						<div className='flex items-center justify-between'>
							<span className='text-[11px] font-semibold text-zinc-500 dark:text-zinc-400'>
								Webhook URL <span className='font-mono text-zinc-400'>(POST)</span>
							</span>
							<div className='flex items-center gap-0.5'>
								<button
									type='button'
									title='Copy webhook URL'
									onClick={handleCopy}
									className={iconButtonClass}>
									<Copy size={12} />
								</button>
								<button
									type='button'
									title='Rotate webhook URL'
									disabled={rotateToken.isPending}
									onClick={handleRotate}
									className={iconButtonClass}>
									<RefreshCw
										size={12}
										className={rotateToken.isPending ? 'animate-spin' : ''}
									/>
								</button>
							</div>
						</div>
						<code className='block rounded-lg border border-zinc-200 bg-white p-2 font-mono text-[11px] break-all text-zinc-700 select-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'>
							{webhookUrl}
						</code>
						<p className='text-[11px] text-zinc-400'>
							The JSON body becomes the run input, so nodes can read it as{' '}
							<code className='font-mono'>{'{{ input.<field> }}'}</code>.
						</p>
					</div>
				)
			)}

			<div className='flex items-center justify-between'>
				<button
					type='button'
					onClick={() => setEventsOpen((open) => !open)}
					className='flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'>
					<ChevronRight
						size={12}
						className={`transition-transform ${eventsOpen ? 'rotate-90' : ''}`}
					/>
					Recent events
				</button>
				<button
					type='button'
					title={runBlockedReason ?? 'Fire this trigger now, as if an event had arrived'}
					disabled={runTrigger.isPending || Boolean(runBlockedReason)}
					onClick={handleRun}
					className={ghostButtonClass}>
					{runTrigger.isPending ? (
						<Loader2 size={11} className='animate-spin' />
					) : (
						<Play size={11} />
					)}
					Run now
				</button>
			</div>

			{eventsOpen && <TriggerEvents workspaceId={workspaceId} triggerId={trigger.id} />}
		</div>
	);
};

// ─── Tab ──────────────────────────────────────────────────────

/**
 * Workflow triggers are their own workspace-scoped resource
 * (`target_type: 'workflow'`), not graph nodes — this backend ships no
 * trigger node types, so this tab is the only place they are managed.
 */
const WorkflowTriggersTab = ({
	workspaceId,
	workflowId,
}: {
	workspaceId: string;
	workflowId: string;
}) => {
	const { state } = useWorkflowEditor();
	const { data, isLoading, isError, refetch } = useTriggers(workspaceId);
	const { data: presetGroups } = useTriggerPresets();
	const createTrigger = useCreateTrigger(workspaceId);
	const [isCreating, setIsCreating] = useState(false);

	const isPublished = Boolean(state.workflow.currentVersionId);
	const presets = useMemo(() => Object.values(presetGroups ?? {}).flat(), [presetGroups]);
	// The index returns every trigger in the workspace and takes no target filter.
	const triggers = useMemo(
		() =>
			(data ?? []).filter(
				(trigger) =>
					trigger.target_type === 'workflow' &&
					String(trigger.target_id) === String(workflowId),
			),
		[data, workflowId],
	);

	const handleCreate = (draft: TDraft) =>
		createTrigger.mutate(
			{
				target_type: 'workflow',
				target_id: workflowId,
				type: draft.type,
				preset_id: draft.type === 'webhook' && draft.presetId ? draft.presetId : null,
				config: toConfig(draft),
				is_active: true,
				...(draft.signingSecret.trim()
					? { signing_secret: draft.signingSecret.trim() }
					: {}),
			},
			{
				onSuccess: () => {
					setIsCreating(false);
					notify.success('Trigger created');
				},
			},
		);

	return (
		<div className='space-y-6'>
			<div className='flex items-start justify-between gap-3'>
				<div>
					<h3 className='text-sm font-bold text-zinc-800 dark:text-zinc-200'>Triggers</h3>
					<p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
						Start this workflow automatically from a webhook, a schedule or a polled
						URL.
					</p>
				</div>
				{!isCreating && (
					<button
						type='button'
						onClick={() => setIsCreating(true)}
						className={primaryButtonClass}>
						<Plus size={13} />
						New trigger
					</button>
				)}
			</div>

			{!isPublished && (
				<div className='flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300'>
					<AlertTriangle size={14} className='mt-px shrink-0' />
					<span>
						Triggers run the <strong>published</strong> version. This workflow hasn’t
						been published yet, so every event is skipped until you publish it.
					</span>
				</div>
			)}

			{isCreating && (
				<div className='border-primary-200 dark:border-primary-900/60 space-y-3 rounded-xl border bg-white p-4 dark:bg-zinc-900/40'>
					<h4 className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>
						New trigger
					</h4>
					<TriggerForm
						initial={emptyDraft()}
						isEdit={false}
						presets={presets}
						isSaving={createTrigger.isPending}
						onCancel={() => setIsCreating(false)}
						onSubmit={handleCreate}
					/>
				</div>
			)}

			{isLoading && (
				<div className='flex items-center gap-2 text-xs text-zinc-400'>
					<Loader2 size={13} className='animate-spin' />
					Loading triggers…
				</div>
			)}

			{isError && (
				<div className='flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300'>
					Couldn’t load triggers.
					<button type='button' onClick={() => refetch()} className='font-bold underline'>
						Try again
					</button>
				</div>
			)}

			{!isLoading && !isError && triggers.length === 0 && !isCreating && (
				<div className='rounded-xl border border-dashed border-zinc-200 py-8 text-center text-xs text-zinc-400 dark:border-zinc-800'>
					No triggers yet. This workflow only runs when someone starts it.
				</div>
			)}

			{triggers.length > 0 && (
				<div className='space-y-3'>
					{triggers.map((trigger) => (
						<TriggerCard
							key={trigger.id}
							workspaceId={workspaceId}
							trigger={trigger}
							presets={presets}
							isPublished={isPublished}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default WorkflowTriggersTab;
