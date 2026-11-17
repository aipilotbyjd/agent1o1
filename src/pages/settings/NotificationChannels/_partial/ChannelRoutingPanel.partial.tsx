import { useState } from 'react';
import { KeyRound, Plus, X } from 'lucide-react';
import { useNotificationCatalog } from '@/api/modules/notifications';
import {
	useCreateNotificationRoute,
	useDeleteNotificationRoute,
	useNotificationRoutes,
} from '@/api/modules/notification-routes';
import {
	useNotificationChannelDeliveries,
	useRotateNotificationChannelSecret,
} from '@/api/modules/notification-channels';
import relativeTime from '@/utils/relativeTime.util';
import type {
	TNotificationCatalog,
	TNotificationChannel,
	TNotificationDeliveryStatus,
	TNotificationRoute,
	TNotificationSeverity,
} from '@/types/notification.type';

const SEVERITY_LABELS: Record<TNotificationSeverity, string> = {
	critical: 'Critical only',
	warning: 'Warnings and up',
	info: 'Everything',
	success: 'Everything',
};

const STATUS_CLASSES: Record<TNotificationDeliveryStatus, string> = {
	sent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
	failed: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
	pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
	skipped: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400',
};

const selectClass =
	'min-h-9 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200';

/** What a route covers, in words. */
const routeLabel = (route: TNotificationRoute, catalog: TNotificationCatalog | undefined) => {
	if (route.event_key) {
		const event = catalog?.categories
			.flatMap((category) => category.events)
			.find((entry) => entry.key === route.event_key);
		return event?.label ?? route.event_key;
	}
	if (route.category) {
		return (
			catalog?.categories.find((category) => category.key === route.category)?.label ??
			route.category
		);
	}
	return 'Every workspace event';
};

type TProps = {
	ws: string;
	channel: TNotificationChannel;
	canManage: boolean;
};

/**
 * Under a channel: which events reach it (routes), what it was sent lately,
 * and for webhooks, its signing secret. Routing belongs to the workspace, so
 * a channel gets each message once however many members are notified.
 */
const ChannelRoutingPanel = ({ ws, channel, canManage }: TProps) => {
	const { data: catalog } = useNotificationCatalog();
	const { data: routes = [] } = useNotificationRoutes(ws);
	const { data: deliveries } = useNotificationChannelDeliveries(ws, channel.id);
	const createRoute = useCreateNotificationRoute(ws);
	const deleteRoute = useDeleteNotificationRoute(ws);
	const rotateSecret = useRotateNotificationChannelSecret(ws);

	const [target, setTarget] = useState('all');
	const [minSeverity, setMinSeverity] = useState<TNotificationSeverity | ''>('');
	const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

	const channelRoutes = routes.filter((route) => route.notification_channel_id === channel.id);
	const workspaceCategories = (catalog?.categories ?? []).filter(
		(category) => category.scope === 'workspace',
	);

	const addRoute = () => {
		const [kind, value] = target.split(':', 2) as [
			'all' | 'category' | 'event',
			string | undefined,
		];
		createRoute.mutate(
			{
				notification_channel_id: channel.id,
				category: kind === 'category' ? (value as TNotificationRoute['category']) : null,
				event_key: kind === 'event' ? (value ?? null) : null,
				min_severity: minSeverity || null,
			},
			{ onSuccess: () => setMinSeverity('') },
		);
	};

	return (
		<div className='space-y-5 border-t border-zinc-100 pt-4 dark:border-zinc-800'>
			<section>
				<h4 className='mb-2 text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
					Sends
				</h4>
				{channelRoutes.length === 0 ? (
					<p className='text-xs font-medium text-zinc-400 dark:text-zinc-500'>
						Nothing yet. Add what this channel should hear about.
					</p>
				) : (
					<div className='flex flex-wrap gap-1.5'>
						{channelRoutes.map((route) => (
							<span
								key={route.id}
								className='inline-flex items-center gap-1 rounded-full bg-zinc-100 py-1 pr-1 pl-2.5 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
								{routeLabel(route, catalog)}
								{route.min_severity && (
									<span className='font-semibold text-zinc-400'>
										· {SEVERITY_LABELS[route.min_severity]}
									</span>
								)}
								{canManage && (
									<button
										type='button'
										aria-label={`Stop sending ${routeLabel(route, catalog)}`}
										onClick={() => deleteRoute.mutate(route.id)}
										className='flex h-5 w-5 items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700'>
										<X size={11} />
									</button>
								)}
							</span>
						))}
					</div>
				)}

				{canManage && (
					<div className='mt-3 flex flex-wrap items-center gap-2'>
						<select
							aria-label='What to send'
							value={target}
							onChange={(event) => setTarget(event.target.value)}
							className={selectClass}>
							<option value='all'>Every workspace event</option>
							{workspaceCategories.map((category) => (
								<optgroup key={category.key} label={category.label}>
									<option value={`category:${category.key}`}>
										All {category.label.toLowerCase()}
									</option>
									{category.events.map((event) => (
										<option key={event.key} value={`event:${event.key}`}>
											{event.label}
										</option>
									))}
								</optgroup>
							))}
						</select>
						<select
							aria-label='How urgent'
							value={minSeverity}
							onChange={(event) =>
								setMinSeverity(event.target.value as TNotificationSeverity | '')
							}
							className={selectClass}>
							<option value=''>Any urgency</option>
							<option value='warning'>Warnings and up</option>
							<option value='critical'>Critical only</option>
						</select>
						<button
							type='button'
							onClick={addRoute}
							disabled={createRoute.isPending}
							className='inline-flex min-h-9 items-center gap-1 rounded-lg bg-zinc-900 px-3 text-xs font-bold text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-900'>
							<Plus size={13} /> Add
						</button>
					</div>
				)}
			</section>

			{channel.type === 'webhook' && canManage && (
				<section>
					<h4 className='mb-2 text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
						Signing secret
					</h4>
					<p className='mb-2 text-xs font-medium text-zinc-400 dark:text-zinc-500'>
						Each request carries <code>X-Notification-Signature</code>: an HMAC-SHA256
						of the timestamp header, a dot and the raw body.
					</p>
					{revealedSecret ? (
						<code className='block rounded-lg bg-zinc-100 px-3 py-2 text-xs break-all text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'>
							{revealedSecret}
						</code>
					) : (
						<button
							type='button'
							onClick={() =>
								rotateSecret.mutate(channel.id, {
									onSuccess: (updated) =>
										setRevealedSecret(updated.signing_secret ?? null),
								})
							}
							disabled={rotateSecret.isPending}
							className='inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'>
							<KeyRound size={13} /> Rotate and show a new secret
						</button>
					)}
				</section>
			)}

			<section>
				<h4 className='mb-2 text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
					Recent deliveries
				</h4>
				{(deliveries?.items ?? []).length === 0 ? (
					<p className='text-xs font-medium text-zinc-400 dark:text-zinc-500'>
						Nothing sent yet.
					</p>
				) : (
					<ul className='space-y-1'>
						{deliveries?.items.map((delivery) => (
							<li key={delivery.id} className='flex items-center gap-2 text-xs'>
								<span
									className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${STATUS_CLASSES[delivery.status]}`}>
									{delivery.status}
								</span>
								<span className='min-w-0 flex-1 truncate font-semibold text-zinc-600 dark:text-zinc-300'>
									{delivery.event_key ?? 'test'}
									{delivery.error && (
										<span className='font-medium text-zinc-400'>
											{' '}
											· {delivery.error}
										</span>
									)}
								</span>
								<span className='shrink-0 text-zinc-400'>
									{relativeTime(delivery.created_at)}
								</span>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
};

export default ChannelRoutingPanel;
