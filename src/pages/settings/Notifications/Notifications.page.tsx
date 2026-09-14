import { useMemo, useState } from 'react';
import { useWorkspaceContext } from '@/context/workspaceContext';
import { Bell, ExternalLink, Save } from 'lucide-react';
import { Link } from 'react-router';
import {
	useNotificationPreferences,
	useUpsertNotificationPreference,
} from '@/api/modules/notification-preferences';
import { useNotificationEvents } from '@/api/modules/notifications';
import type {
	TNotificationEventCatalogEntry,
	TNotificationEventKey,
	TNotificationPreference,
} from '@/types/notification.type';
import pages from '@/Routes/pages';
import { useNotificationChannels } from '@/api/modules/notification-channels';
import { primaryBtn, secondaryBtn } from '@/pages/settings/_shared/buttons';

// ============================================================
// Notification preferences
// ------------------------------------------------------------
// Three endpoints feed this screen:
//   * GET /notifications/events           — the fixed event catalog
//   * GET /workspaces/{ws}/notification-preferences — saved rows
//   * GET /workspaces/{ws}/notification-channels    — delivery targets
// A preference row exists only once a user has saved one, so the
// catalog is the list and the saved row (or the catalog defaults)
// supplies each event's state. Saving goes one event at a time —
// the API's upsert takes a single `event_key`.
// ============================================================

/** A delivery target: the two built-ins plus every configured channel. */
type TDeliveryTarget =
	| { kind: 'in_app'; id: 'in_app'; label: string }
	| { kind: 'email'; id: 'email'; label: string }
	| { kind: 'channel'; id: string; label: string; isActive: boolean };

type TPendingChange = {
	in_app: boolean;
	email: boolean;
	channel_ids: string[];
};

const groupLabel = (eventKey: string) => {
	const group = eventKey.split('.')[0] ?? 'other';
	return group.charAt(0).toUpperCase() + group.slice(1);
};

const ChannelToggle = ({
	label,
	checked,
	disabled,
	disabledReason,
	onChange,
}: {
	label: string;
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
				{label}
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
	event,
	state,
	targets,
	onToggleEnabled,
	onToggleTarget,
}: {
	event: TNotificationEventCatalogEntry;
	state: TPendingChange;
	targets: TDeliveryTarget[];
	onToggleEnabled: (key: TNotificationEventKey, enabled: boolean) => void;
	onToggleTarget: (key: TNotificationEventKey, target: TDeliveryTarget, on: boolean) => void;
}) => {
	const enabled = state.in_app || state.email || state.channel_ids.length > 0;

	return (
		<div className='grid items-center gap-4 border-b border-zinc-100 py-4 sm:grid-cols-[1fr_auto_auto] dark:border-zinc-800'>
			<div className='flex items-center gap-3'>
				<EnabledToggle
					enabled={enabled}
					onChange={(val) => onToggleEnabled(event.key, val)}
				/>
				<div>
					<div className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
						{event.label}
					</div>
					<div className='text-xs font-medium text-zinc-400 dark:text-zinc-500'>
						{event.description || event.key}
					</div>
				</div>
			</div>

			<div
				className={`flex items-end gap-4 ${!enabled ? 'pointer-events-none opacity-40' : ''}`}>
				{targets.map((target) => {
					const checked =
						target.kind === 'in_app'
							? state.in_app
							: target.kind === 'email'
								? state.email
								: state.channel_ids.includes(target.id);
					const disabled = target.kind === 'channel' && !target.isActive;

					return (
						<ChannelToggle
							key={target.id}
							label={target.label}
							checked={checked}
							disabled={disabled}
							disabledReason={
								disabled ? `Activate the ${target.label} channel first` : undefined
							}
							onChange={(on) => onToggleTarget(event.key, target, on)}
						/>
					);
				})}
			</div>
		</div>
	);
};

const NotificationsPage = () => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const { data: events, isLoading: isEventsLoading } = useNotificationEvents();
	const { data: preferences, isLoading: isPrefsLoading } =
		useNotificationPreferences(activeWorkspaceId);
	const { data: configuredChannels } = useNotificationChannels(activeWorkspaceId);
	const upsertPreference = useUpsertNotificationPreference(activeWorkspaceId);

	const isLoading = isEventsLoading || isPrefsLoading;

	const [pendingChanges, setPendingChanges] = useState<
		Partial<Record<TNotificationEventKey, TPendingChange>>
	>({});

	const targets = useMemo<TDeliveryTarget[]>(
		() => [
			{ kind: 'in_app', id: 'in_app', label: 'In-app' },
			{ kind: 'email', id: 'email', label: 'Email' },
			...(configuredChannels ?? []).map<TDeliveryTarget>((channel) => ({
				kind: 'channel',
				id: channel.id,
				label: channel.name,
				isActive: channel.is_active,
			})),
		],
		[configuredChannels],
	);

	const savedByKey = useMemo(() => {
		const map = new Map<string, TNotificationPreference>();
		for (const pref of preferences ?? []) map.set(pref.event_key, pref);
		return map;
	}, [preferences]);

	/** Saved row if there is one, otherwise the catalog's defaults. */
	const stateFor = (event: TNotificationEventCatalogEntry): TPendingChange => {
		const pending = pendingChanges[event.key];
		if (pending) return pending;

		const saved = savedByKey.get(event.key);
		if (saved) {
			return {
				in_app: saved.in_app,
				email: saved.email,
				channel_ids: saved.channel_ids ?? [],
			};
		}
		return { in_app: event.defaults.in_app, email: event.defaults.email, channel_ids: [] };
	};

	const grouped = useMemo(() => {
		const map = new Map<string, TNotificationEventCatalogEntry[]>();
		for (const event of events ?? []) {
			const group = groupLabel(event.key);
			map.set(group, [...(map.get(group) ?? []), event]);
		}
		return [...map.entries()];
	}, [events]);

	const hasPendingChanges = Object.keys(pendingChanges).length > 0;

	const setState = (key: TNotificationEventKey, next: TPendingChange) =>
		setPendingChanges((prev) => ({ ...prev, [key]: next }));

	const handleToggleEnabled = (key: TNotificationEventKey, enabled: boolean) => {
		const event = (events ?? []).find((item) => item.key === key);
		if (!event) return;
		const current = stateFor(event);

		setState(
			key,
			enabled
				? {
						// Re-enabling with nothing selected falls back to in-app.
						in_app: current.in_app || current.channel_ids.length === 0,
						email: current.email,
						channel_ids: current.channel_ids,
					}
				: { in_app: false, email: false, channel_ids: [] },
		);
	};

	const handleToggleTarget = (
		key: TNotificationEventKey,
		target: TDeliveryTarget,
		on: boolean,
	) => {
		const event = (events ?? []).find((item) => item.key === key);
		if (!event) return;
		const current = stateFor(event);

		if (target.kind === 'in_app') return setState(key, { ...current, in_app: on });
		if (target.kind === 'email') return setState(key, { ...current, email: on });

		const channel_ids = on
			? [...new Set([...current.channel_ids, target.id])]
			: current.channel_ids.filter((id) => id !== target.id);
		return setState(key, { ...current, channel_ids });
	};

	const handleSave = async () => {
		if (!hasPendingChanges) return;
		// The upsert endpoint takes one event per call.
		for (const [event_key, change] of Object.entries(pendingChanges)) {
			if (!change) continue;
			await upsertPreference.mutateAsync({
				event_key: event_key as TNotificationEventKey,
				in_app: change.in_app,
				email: change.email,
				channel_ids: change.channel_ids.length > 0 ? change.channel_ids : null,
			});
		}
		setPendingChanges({});
	};

	const handleReset = () => setPendingChanges({});

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

			{targets.length > 0 && (
				<div className='mb-6 hidden items-center justify-end gap-4 sm:flex'>
					<div className='flex items-end gap-4'>
						{targets.map((target) => (
							<div key={target.id} className='flex flex-col items-center gap-1'>
								<span className='text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
									{target.label}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{grouped.map(([category, categoryEvents]) => (
				<section key={category} className='mb-8'>
					<div className='mb-1 border-b border-zinc-200 pb-3 dark:border-zinc-700'>
						<h2 className='text-base font-bold text-zinc-700 dark:text-zinc-300'>
							{category}
						</h2>
					</div>
					<div>
						{categoryEvents.map((event) => (
							<PreferenceRow
								key={event.key}
								event={event}
								state={stateFor(event)}
								targets={targets}
								onToggleEnabled={handleToggleEnabled}
								onToggleTarget={handleToggleTarget}
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
							disabled={upsertPreference.isPending}
							className={secondaryBtn}>
							Reset
						</button>
						<button
							type='button'
							onClick={handleSave}
							disabled={upsertPreference.isPending}
							className={primaryBtn}>
							<Save size={15} />
							{upsertPreference.isPending ? 'Saving...' : 'Save changes'}
						</button>
					</div>
				</div>
			)}

			{grouped.length === 0 && !isLoading && (
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
