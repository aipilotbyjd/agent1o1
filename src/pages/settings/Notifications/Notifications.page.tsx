import { useState, useEffect } from 'react';
import { useWorkspaceContext } from '@/context/workspaceContext';
import { Bell, ExternalLink, Save } from 'lucide-react';
import { Link } from 'react-router';
import {
	useNotificationPreferences,
	useUpdateNotificationPreferences,
} from '@/api/modules/notification-preferences';
import type {
	TDeliveryChannel,
	TNotificationPreference,
	TAvailableChannel,
} from '@/types/notification.type';
import pages from '@/Routes/pages';
import { useNotificationChannels } from '@/api/modules/notification-channels';
import { primaryBtn, secondaryBtn } from '@/pages/settings/_shared/buttons';

const CHANNEL_LABELS: Record<TDeliveryChannel, string> = {
	database: 'In-app',
	mail: 'Email',
	slack: 'Slack',
	discord: 'Discord',
	webhook: 'Webhook',
	sms: 'SMS',
};

type TPendingChange = {
	enabled?: boolean;
	channels?: TDeliveryChannel[];
};

const ChannelToggle = ({
	channel,
	checked,
	disabled,
	disabledReason,
	onChange,
}: {
	channel: TDeliveryChannel;
	checked: boolean;
	disabled: boolean;
	disabledReason?: string;
	onChange: (checked: boolean) => void;
}) => {
	return (
		<label
			className={`group flex cursor-pointer flex-col items-center gap-1 ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
			title={disabledReason}>
			<div
				className={`relative flex h-5 w-5 items-center justify-center rounded border transition ${
					checked && !disabled
						? 'border-primary-500 bg-primary-400'
						: 'border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800'
				}`}>
				<input
					type='checkbox'
					className='absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed'
					checked={checked}
					disabled={disabled}
					onChange={(e) => onChange(e.target.checked)}
				/>
				{checked && !disabled && (
					<svg
						className='h-3 w-3 text-white'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
						strokeWidth={3}>
						<path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
					</svg>
				)}
			</div>
			<span className='text-[10px] leading-none font-semibold text-zinc-500 dark:text-zinc-400'>
				{CHANNEL_LABELS[channel]}
			</span>
		</label>
	);
};

const EnabledToggle = ({
	enabled,
	onChange,
}: {
	enabled: boolean;
	onChange: (val: boolean) => void;
}) => (
	<button
		type='button'
		role='switch'
		aria-checked={enabled}
		onClick={() => onChange(!enabled)}
		className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none ${
			enabled ? 'bg-primary-400' : 'bg-zinc-200 dark:bg-zinc-700'
		}`}>
		<span
			className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
				enabled ? 'translate-x-4' : 'translate-x-0'
			}`}
		/>
	</button>
);

const PreferenceRow = ({
	pref,
	availableChannels,
	hasStoredChannel,
	pendingChange,
	onToggleEnabled,
	onToggleChannel,
}: {
	pref: TNotificationPreference;
	availableChannels: TAvailableChannel[];
	hasStoredChannel: (channelId: TDeliveryChannel) => boolean;
	pendingChange?: TPendingChange;
	onToggleEnabled: (type: string, enabled: boolean) => void;
	onToggleChannel: (type: string, channel: TDeliveryChannel, checked: boolean) => void;
}) => {
	const enabled = pendingChange?.enabled ?? pref.enabled;
	const channels = pendingChange?.channels ?? pref.channels;

	return (
		<div className='grid items-center gap-4 border-b border-zinc-100 py-4 sm:grid-cols-[1fr_auto_auto] dark:border-zinc-800'>
			<div className='flex items-center gap-3'>
				<EnabledToggle
					enabled={enabled}
					onChange={(val) => onToggleEnabled(pref.type, val)}
				/>
				<div>
					<div className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
						{pref.label}
					</div>
					<div className='text-xs font-medium text-zinc-400 dark:text-zinc-500'>
						{pref.type}
					</div>
				</div>
			</div>

			<div
				className={`flex items-end gap-4 ${!enabled ? 'pointer-events-none opacity-40' : ''}`}>
				{availableChannels.map((ac) => {
					const needsConfig = ac.requires_stored_config;
					const hasConfig = !needsConfig || hasStoredChannel(ac.id);
					const isChecked = channels.includes(ac.id);

					return (
						<ChannelToggle
							key={ac.id}
							channel={ac.id}
							checked={isChecked}
							disabled={!hasConfig}
							disabledReason={
								!hasConfig ? `Add a ${ac.label} channel first` : undefined
							}
							onChange={(checked) => onToggleChannel(pref.type, ac.id, checked)}
						/>
					);
				})}
			</div>
		</div>
	);
};

const NotificationsPage = () => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const { data, isLoading } = useNotificationPreferences(activeWorkspaceId);
	const { data: configuredChannels } = useNotificationChannels(activeWorkspaceId);
	const updatePreferences = useUpdateNotificationPreferences(activeWorkspaceId);

	const [pendingChanges, setPendingChanges] = useState<Record<string, TPendingChange>>({});

	useEffect(() => {
		const timeoutId = window.setTimeout(() => setPendingChanges({}), 0);
		return () => window.clearTimeout(timeoutId);
	}, [data]);

	const hasPendingChanges = Object.keys(pendingChanges).length > 0;

	const hasStoredChannel = (channelId: TDeliveryChannel): boolean => {
		if (!configuredChannels) return false;
		return configuredChannels.some((ch) => ch.channel === channelId && ch.is_active);
	};

	const handleToggleEnabled = (type: string, enabled: boolean) => {
		setPendingChanges((prev) => {
			const existing = prev[type] ?? {};
			return { ...prev, [type]: { ...existing, enabled } };
		});
	};

	const handleToggleChannel = (type: string, channel: TDeliveryChannel, checked: boolean) => {
		const currentPref = data?.preferences.find((p) => p.type === type);
		const currentChannels = pendingChanges[type]?.channels ?? currentPref?.channels ?? [];

		const nextChannels = checked
			? [...new Set([...currentChannels, channel])]
			: currentChannels.filter((c) => c !== channel);

		setPendingChanges((prev) => {
			const existing = prev[type] ?? {};
			return { ...prev, [type]: { ...existing, channels: nextChannels } };
		});
	};

	const handleSave = async () => {
		if (!hasPendingChanges) return;
		await updatePreferences.mutateAsync({ preferences: pendingChanges });
	};

	const handleReset = () => {
		setPendingChanges({});
	};

	if (isLoading) {
		return (
			<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
				<div className='space-y-3'>
					{[...Array(8)].map((_, i) => (
						<div
							key={i}
							className='h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800'
						/>
					))}
				</div>
			</div>
		);
	}

	const grouped = data?.grouped ?? {};
	const availableChannels = data?.available_channels ?? [];

	return (
		<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
			<div className='mb-8 flex flex-wrap items-start justify-between gap-4'>
				<div>
					<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
						Notifications
					</h1>
					<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
						Choose which events notify you and how you receive them.
					</p>
				</div>
				<Link
					to={pages.settings.subPages.notificationChannels.to}
					className='flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-600 shadow-xs transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200'>
					<Bell size={15} />
					Manage Channels
					<ExternalLink size={13} className='text-zinc-400' />
				</Link>
			</div>

			{availableChannels.length > 0 && (
				<div className='mb-6 hidden items-center justify-end gap-4 sm:flex'>
					<div className='flex items-end gap-4'>
						{availableChannels.map((ac) => (
							<div key={ac.id} className='flex flex-col items-center gap-1'>
								<span className='text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
									{CHANNEL_LABELS[ac.id]}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{Object.entries(grouped).map(([category, prefs]) => (
				<section key={category} className='mb-8'>
					<div className='mb-1 border-b border-zinc-200 pb-3 dark:border-zinc-700'>
						<h2 className='text-base font-bold text-zinc-700 dark:text-zinc-300'>
							{category}
						</h2>
					</div>
					<div>
						{prefs.map((pref) => (
							<PreferenceRow
								key={pref.type}
								pref={pref}
								availableChannels={availableChannels}
								hasStoredChannel={hasStoredChannel}
								pendingChange={pendingChanges[pref.type]}
								onToggleEnabled={handleToggleEnabled}
								onToggleChannel={handleToggleChannel}
							/>
						))}
					</div>
				</section>
			))}

			{hasPendingChanges && (
				<div className='sticky bottom-6 mt-8 flex justify-end'>
					<div className='flex gap-3 rounded-2xl border border-zinc-200 bg-white/90 px-5 py-3 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90'>
						<button
							type='button'
							onClick={handleReset}
							disabled={updatePreferences.isPending}
							className={secondaryBtn}>
							Reset
						</button>
						<button
							type='button'
							onClick={handleSave}
							disabled={updatePreferences.isPending}
							className={primaryBtn}>
							<Save size={15} />
							{updatePreferences.isPending ? 'Saving...' : 'Save changes'}
						</button>
					</div>
				</div>
			)}

			{Object.keys(grouped).length === 0 && !isLoading && (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-16 dark:border-zinc-700'>
					<Bell size={32} className='mb-3 text-zinc-300 dark:text-zinc-600' />
					<p className='text-sm font-semibold text-zinc-400 dark:text-zinc-500'>
						No notification preferences found
					</p>
				</div>
			)}
		</div>
	);
};

export default NotificationsPage;
