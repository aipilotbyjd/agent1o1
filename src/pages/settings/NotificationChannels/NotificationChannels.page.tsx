import { useState } from 'react';
import { useWorkspaceContext } from '@/context/workspace';
import { useConfirm } from '@/context/confirm';
import {
	Plus,
	Trash2,
	FlaskConical,
	Pencil,
	X,
	Check,
	AlertTriangle,
	Bell,
	Webhook,
	MessageSquare,
	Phone,
} from 'lucide-react';
import {
	useNotificationChannels,
	useCreateNotificationChannel,
	useUpdateNotificationChannel,
	useDeleteNotificationChannel,
	useTestNotificationChannel,
} from '@/api/modules/notification-channels';
import type {
	TNotificationChannel,
	TNotificationChannelType,
	TCreateNotificationChannelDto,
} from '@/types/notification.type';
import { ApiError } from '@/api/core';
import { primaryBtn, secondaryBtn } from '@/pages/settings/_shared/buttons';

const inputClass =
	'h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 shadow-xs outline-none placeholder:text-zinc-400 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-primary-500 dark:focus:ring-primary-500/20';

const errorClass = 'mt-1.5 text-xs font-semibold text-red-500';

const CHANNEL_ICONS: Record<TNotificationChannelType, React.ReactNode> = {
	slack: <MessageSquare size={15} />,
	discord: <MessageSquare size={15} />,
	webhook: <Webhook size={15} />,
	sms: <Phone size={15} />,
};

const CHANNEL_COLORS: Record<TNotificationChannelType, string> = {
	slack: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
	discord: 'bg-primary-100 text-primary-700 dark:bg-primary-400/15 dark:text-primary-400',
	webhook: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
	sms: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
};

type TFormErrors = Record<string, string>;
type TCreateForm = {
	channel: TNotificationChannelType;
	label: string;
	url: string;
	secret: string;
	phone: string;
};

const defaultCreateForm: TCreateForm = {
	channel: 'slack',
	label: '',
	url: '',
	secret: '',
	phone: '',
};

const ChannelBadge = ({ type }: { type: TNotificationChannelType }) => (
	<span
		className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${CHANNEL_COLORS[type]}`}>
		{CHANNEL_ICONS[type]}
		{type}
	</span>
);

const ActiveToggle = ({
	checked,
	onChange,
	isPending,
}: {
	checked: boolean;
	onChange: () => void;
	isPending: boolean;
}) => (
	<button
		type='button'
		role='switch'
		aria-checked={checked}
		disabled={isPending}
		onClick={onChange}
		className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
			checked ? 'bg-primary-400' : 'bg-zinc-200 dark:bg-zinc-700'
		}`}>
		<span
			className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
				checked ? 'translate-x-4' : 'translate-x-0'
			}`}
		/>
	</button>
);

const ConfigFields = ({
	channelType,
	form,
	errors,
	onChange,
	isEdit,
}: {
	channelType: TNotificationChannelType;
	form: TCreateForm;
	errors: TFormErrors;
	onChange: (field: keyof TCreateForm, value: string) => void;
	isEdit?: boolean;
}) => {
	if (channelType === 'sms') {
		return (
			<div>
				<label className='mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
					Phone number (E.164 format)
				</label>
				<input
					className={inputClass}
					placeholder='+15551234567'
					value={form.phone}
					onChange={(e) => onChange('phone', e.target.value)}
				/>
				{errors.phone && <p className={errorClass}>{errors.phone}</p>}
			</div>
		);
	}

	return (
		<>
			<div>
				<label className='mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
					Webhook URL{' '}
					{isEdit && (
						<span className='font-normal text-zinc-400'>
							(leave blank to keep existing)
						</span>
					)}
				</label>
				<input
					className={inputClass}
					placeholder={
						channelType === 'slack'
							? 'https://hooks.slack.com/services/...'
							: channelType === 'discord'
								? 'https://discord.com/api/webhooks/...'
								: 'https://your-server.com/webhook'
					}
					value={form.url}
					onChange={(e) => onChange('url', e.target.value)}
				/>
				{errors.url && <p className={errorClass}>{errors.url}</p>}
			</div>
			{channelType === 'webhook' && (
				<div>
					<label className='mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
						Signing secret <span className='font-normal text-zinc-400'>(optional)</span>
					</label>
					<input
						className={inputClass}
						placeholder='Used to compute HMAC signature header'
						value={form.secret}
						onChange={(e) => onChange('secret', e.target.value)}
					/>
					{errors.secret && <p className={errorClass}>{errors.secret}</p>}
				</div>
			)}
		</>
	);
};

type TEditState = {
	id: string;
	label: string;
	url: string;
	secret: string;
	phone: string;
	errors: TFormErrors;
};

const ChannelRow = ({ channel }: { channel: TNotificationChannel }) => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const { confirm } = useConfirm();
	const updateChannel = useUpdateNotificationChannel(activeWorkspaceId);
	const deleteChannel = useDeleteNotificationChannel(activeWorkspaceId);
	const testChannel = useTestNotificationChannel(activeWorkspaceId);
	const [editState, setEditState] = useState<TEditState | null>(null);

	const startEdit = () => {
		setEditState({
			id: channel.id,
			label: channel.label,
			url: '',
			secret: '',
			phone: '',
			errors: {},
		});
	};

	const cancelEdit = () => setEditState(null);

	const handleToggleActive = () => {
		updateChannel.mutate({ id: channel.id, body: { is_active: !channel.is_active } });
	};

	const handleDelete = async () => {
		const confirmed = await confirm({
			title: 'Delete Channel',
			message: (
				<>
					Are you sure you want to delete{' '}
					<strong className='font-semibold text-zinc-800 dark:text-zinc-200'>
						"{channel.label}"
					</strong>
					? This cannot be undone.
				</>
			),
		});
		if (!confirmed) return;
		deleteChannel.mutate(channel.id);
	};

	const handleTest = () => {
		testChannel.mutate(channel.id);
	};

	const handleSaveEdit = async () => {
		if (!editState) return;
		const errs: TFormErrors = {};
		if (!editState.label.trim()) errs.label = 'Label is required';

		const config: Record<string, string> = {};
		if (channel.channel === 'sms') {
			if (editState.phone.trim() && !/^\+[1-9]\d{7,14}$/.test(editState.phone.trim())) {
				errs.phone = 'Must be in E.164 format (e.g. +15551234567)';
			}
			if (editState.phone.trim()) config.phone = editState.phone.trim();
		} else {
			if (editState.url.trim() && !/^https?:\/\/.+/.test(editState.url.trim())) {
				errs.url = 'Must be a valid URL';
			}
			if (editState.url.trim()) config.url = editState.url.trim();
			if (channel.channel === 'webhook' && editState.secret.trim()) {
				config.secret = editState.secret.trim();
			}
		}

		if (Object.keys(errs).length > 0) {
			setEditState((prev) => prev && { ...prev, errors: errs });
			return;
		}

		const body: Record<string, unknown> = { label: editState.label.trim() };
		if (Object.keys(config).length > 0) body.config = config;

		try {
			await updateChannel.mutateAsync({ id: channel.id, body });
			setEditState(null);
		} catch (error) {
			if (ApiError.is(error)) {
				const fieldErrors = error.fieldErrors();
				setEditState((prev) => prev && { ...prev, errors: fieldErrors });
			}
		}
	};

	return (
		<div className='rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-800/50'>
			{editState ? (
				<div className='space-y-4'>
					<div>
						<label className='mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
							Label
						</label>
						<input
							className={inputClass}
							placeholder='My Slack Webhook'
							value={editState.label}
							onChange={(e) =>
								setEditState((prev) => prev && { ...prev, label: e.target.value })
							}
						/>
						{editState.errors.label && (
							<p className={errorClass}>{editState.errors.label}</p>
						)}
					</div>
					<ConfigFields
						channelType={channel.channel}
						form={{
							channel: channel.channel,
							label: editState.label,
							url: editState.url,
							secret: editState.secret,
							phone: editState.phone,
						}}
						errors={editState.errors}
						onChange={(field, value) =>
							setEditState((prev) => prev && { ...prev, [field]: value })
						}
						isEdit
					/>
					<div className='flex gap-2 pt-1'>
						<button
							type='button'
							onClick={handleSaveEdit}
							disabled={updateChannel.isPending}
							className='flex h-9 items-center gap-1.5 rounded-xl bg-primary-400 px-4 text-sm font-bold text-primary-950 shadow-sm shadow-primary-500/20 transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60'>
							<Check size={14} />
							{updateChannel.isPending ? 'Saving...' : 'Save'}
						</button>
						<button
							type='button'
							onClick={cancelEdit}
							className='flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-500 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'>
							<X size={14} />
							Cancel
						</button>
					</div>
				</div>
			) : (
				<div className='flex flex-wrap items-center gap-4'>
					<div className='flex min-w-0 flex-1 items-center gap-3'>
						<ChannelBadge type={channel.channel} />
						<div className='min-w-0'>
							<div className='truncate text-sm font-bold text-zinc-900 dark:text-zinc-100'>
								{channel.label}
							</div>
							<div className='mt-0.5 text-xs font-medium text-zinc-400 dark:text-zinc-500'>
								{channel.channel === 'sms'
									? String(channel.config.phone ?? '••••••••')
									: String(channel.config.url ?? '••••••••')}
							</div>
						</div>
					</div>

					<div className='flex items-center gap-3'>
						<div className='flex items-center gap-2'>
							<span className='text-xs font-medium text-zinc-500 dark:text-zinc-400'>
								{channel.is_active ? 'Active' : 'Inactive'}
							</span>
							<ActiveToggle
								checked={channel.is_active}
								onChange={handleToggleActive}
								isPending={updateChannel.isPending}
							/>
						</div>

						<button
							type='button'
							onClick={handleTest}
							disabled={testChannel.isPending || !channel.is_active}
							title={
								!channel.is_active
									? 'Activate channel to test'
									: 'Send test message'
							}
							className='flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-500 shadow-xs transition hover:bg-zinc-50 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200'>
							<FlaskConical size={12} />
							{testChannel.isPending ? 'Testing...' : 'Test'}
						</button>

						<button
							type='button'
							onClick={startEdit}
							className='flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-500 shadow-xs transition hover:bg-zinc-50 hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200'>
							<Pencil size={12} />
							Edit
						</button>

						<button
							type='button'
							onClick={handleDelete}
							disabled={deleteChannel.isPending}
							className='flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 shadow-xs transition hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-red-500/10 dark:hover:bg-red-500/20'>
							<Trash2 size={13} />
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

const CreateChannelForm = ({ onCancel }: { onCancel: () => void }) => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const createChannel = useCreateNotificationChannel(activeWorkspaceId);
	const [form, setForm] = useState<TCreateForm>(defaultCreateForm);
	const [errors, setErrors] = useState<TFormErrors>({});

	const updateField = (field: keyof TCreateForm, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => {
			const next = { ...prev };
			delete next[field];
			return next;
		});
	};

	const validate = (): TFormErrors => {
		const errs: TFormErrors = {};
		if (!form.label.trim()) errs.label = 'Label is required';

		if (form.channel === 'sms') {
			if (!form.phone.trim()) {
				errs.phone = 'Phone number is required';
			} else if (!/^\+[1-9]\d{7,14}$/.test(form.phone.trim())) {
				errs.phone = 'Must be in E.164 format (e.g. +15551234567)';
			}
		} else {
			if (!form.url.trim()) {
				errs.url = 'Webhook URL is required';
			} else if (!/^https?:\/\/.+/.test(form.url.trim())) {
				errs.url = 'Must be a valid URL';
			}
		}

		return errs;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const errs = validate();
		if (Object.keys(errs).length > 0) {
			setErrors(errs);
			return;
		}

		const config: Record<string, string> = {};
		if (form.channel === 'sms') {
			config.phone = form.phone.trim();
		} else {
			config.url = form.url.trim();
			if (form.channel === 'webhook' && form.secret.trim()) {
				config.secret = form.secret.trim();
			}
		}

		const dto: TCreateNotificationChannelDto = {
			channel: form.channel,
			label: form.label.trim(),
			config,
		};

		try {
			await createChannel.mutateAsync(dto);
			onCancel();
		} catch (error) {
			if (ApiError.is(error)) {
				const fieldErrors = error.fieldErrors();
				setErrors(fieldErrors);
			}
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className='rounded-2xl border border-primary-200 bg-primary-50/50 p-6 dark:border-primary-900/30 dark:bg-primary-400/5'>
			<div className='mb-5 flex items-center justify-between'>
				<h3 className='text-base font-bold text-zinc-900 dark:text-zinc-100'>
					Add notification channel
				</h3>
				<button
					type='button'
					onClick={onCancel}
					className='flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300'>
					<X size={16} />
				</button>
			</div>

			<div className='mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-700/40 dark:bg-amber-500/10'>
				<AlertTriangle
					size={15}
					className='mt-0.5 shrink-0 text-amber-600 dark:text-amber-400'
				/>
				<p className='text-xs font-medium text-amber-700 dark:text-amber-400'>
					Sensitive values (URLs, secrets, phone numbers) are encrypted at rest and{' '}
					<strong>permanently masked</strong> after creation — you won't be able to view
					them again. To update a value, delete this channel and recreate it.
				</p>
			</div>

			<div className='space-y-4'>
				<div>
					<label className='mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
						Channel type
					</label>
					<select
						className={inputClass}
						value={form.channel}
						onChange={(e) =>
							updateField('channel', e.target.value as TNotificationChannelType)
						}>
						<option value='slack'>Slack</option>
						<option value='discord'>Discord</option>
						<option value='webhook'>Webhook</option>
						<option value='sms'>SMS</option>
					</select>
				</div>

				<div>
					<label className='mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
						Label
					</label>
					<input
						className={inputClass}
						placeholder='e.g. My Slack Webhook'
						value={form.label}
						onChange={(e) => updateField('label', e.target.value)}
						maxLength={100}
					/>
					{errors.label && <p className={errorClass}>{errors.label}</p>}
				</div>

				<ConfigFields
					channelType={form.channel}
					form={form}
					errors={errors}
					onChange={updateField}
				/>
			</div>

			<div className='mt-5 flex gap-3'>
				<button
					type='submit'
					disabled={createChannel.isPending}
					className={primaryBtn}>
					<Plus size={15} />
					{createChannel.isPending ? 'Creating...' : 'Create channel'}
				</button>
				<button
					type='button'
					onClick={onCancel}
					className={secondaryBtn}>
					Cancel
				</button>
			</div>
		</form>
	);
};

const NotificationChannelsPage = () => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const { data: channels, isLoading } = useNotificationChannels(activeWorkspaceId);
	const [showCreateForm, setShowCreateForm] = useState(false);

	return (
		<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
			<div className='mb-8 flex flex-wrap items-start justify-between gap-4'>
				<div>
					<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
						Notification Channels
					</h1>
					<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
						Configure where to deliver notifications — Slack, Discord, webhooks, or SMS.
					</p>
				</div>
				{!showCreateForm && (
					<button
						type='button'
						onClick={() => setShowCreateForm(true)}
						className={primaryBtn}>
						<Plus size={15} />
						Add Channel
					</button>
				)}
			</div>

			{showCreateForm && (
				<div className='mb-6'>
					<CreateChannelForm onCancel={() => setShowCreateForm(false)} />
				</div>
			)}

			{isLoading ? (
				<div className='space-y-3'>
					{[...Array(3)].map((_, i) => (
						<div
							key={i}
							className='h-20 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800'
						/>
					))}
				</div>
			) : channels && channels.length > 0 ? (
				<div className='space-y-3'>
					{channels.map((ch) => (
						<ChannelRow key={ch.id} channel={ch} />
					))}
				</div>
			) : (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-16 dark:border-zinc-700'>
					<Bell size={32} className='mb-3 text-zinc-300 dark:text-zinc-600' />
					<p className='mb-1 text-sm font-bold text-zinc-500 dark:text-zinc-400'>
						No channels configured
					</p>
					<p className='mb-5 text-xs font-medium text-zinc-400 dark:text-zinc-500'>
						Add a Slack, Discord, webhook, or SMS channel to receive notifications.
					</p>
					{!showCreateForm && (
						<button
							type='button'
							onClick={() => setShowCreateForm(true)}
							className='flex h-9 items-center gap-2 rounded-xl bg-primary-400 px-4 text-sm font-bold text-primary-950 shadow-lg shadow-primary-500/20 transition hover:bg-primary-500'>
							<Plus size={14} />
							Add your first channel
						</button>
					)}
				</div>
			)}

			{channels && channels.length > 0 && !showCreateForm && (
				<div className='mt-6 flex justify-center'>
					<button
						type='button'
						onClick={() => setShowCreateForm(true)}
						className='flex h-9 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-500 shadow-xs transition hover:bg-zinc-50 hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'>
						<Plus size={14} />
						Add another channel
					</button>
				</div>
			)}
		</div>
	);
};

export default NotificationChannelsPage;
