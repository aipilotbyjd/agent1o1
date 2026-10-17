import { useState } from 'react';
import { Link } from 'react-router';
import {
	ChevronRight,
	Copy,
	ExternalLink,
	KeyRound,
	Play,
	RefreshCw,
	Terminal,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { notify } from '@/api/core';
import {
	useRotateTriggerToken,
	useRunTrigger,
	useTriggerEvents,
	useUpdateTrigger,
} from '@/api/modules/triggers';
import { useConfirm } from '@/context/confirm';
import paths from '@/Routes/paths';
import type { TTrigger } from '@/types/trigger.type';
import {
	copyWithNotice,
	eventStatusDot as statusDot,
	webhookCurlFor,
	webhookUrlFor,
} from '../../../_helper/trigger.helper';

const EVENTS_SHOWN = 5;

const DEFAULT_TOKEN_HEADER = 'X-Webhook-Token';

/** A long random token for Header token authentication. */
const generateToken = () =>
	Array.from(crypto.getRandomValues(new Uint8Array(24)), (byte) =>
		byte.toString(16).padStart(2, '0'),
	).join('');

/**
 * The secret behind the Webhook node's Authentication setting (published
 * value): a token the sender puts in a header, or the key it signs the body
 * with. Write-only: the API only says whether one is set. A method that
 * needs a secret rejects every request until one is added, so that's
 * flagged. A legacy webhook with a provider source keeps its old secret field.
 */
const WebhookSecret = ({ workspaceId, trigger }: { workspaceId: string; trigger: TTrigger }) => {
	const updateTrigger = useUpdateTrigger(workspaceId);
	const [isEditing, setIsEditing] = useState(false);
	const [secret, setSecret] = useState('');

	const authentication = String(trigger.config?.authentication ?? '');
	const header = String(trigger.config?.header_name || DEFAULT_TOKEN_HEADER);
	const isToken = authentication === 'header_token';
	const isLegacySource = !authentication && Boolean(trigger.preset_id);

	if (
		authentication === 'none' ||
		(!authentication && !isLegacySource && !trigger.has_signing_secret)
	) {
		return (
			<span className='text-[9px] text-zinc-400'>
				No authentication: anyone with the URL can start a run.
			</span>
		);
	}

	const noun = isToken ? 'Token' : 'Signing secret';

	const save = (value: string | null) =>
		updateTrigger.mutate(
			{ id: trigger.id, body: { signing_secret: value } },
			{
				onSuccess: () => {
					notify.success(value ? `${noun} saved` : `${noun} removed`);
					setIsEditing(false);
					setSecret('');
				},
			},
		);

	if (isEditing) {
		return (
			<div className='flex items-center gap-1'>
				<input
					type={isToken ? 'text' : 'password'}
					value={secret}
					placeholder={isToken ? 'Paste or generate a token' : 'Paste the signing secret'}
					onChange={(event) => setSecret(event.target.value)}
					className='focus:border-primary-400 min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
				/>
				{isToken && (
					<button
						type='button'
						onClick={() => setSecret(generateToken())}
						className='hover:text-primary-600 cursor-pointer text-[9px] font-semibold text-zinc-500'>
						Generate
					</button>
				)}
				<button
					type='button'
					disabled={!secret.trim() || updateTrigger.isPending}
					onClick={() => save(secret.trim())}
					className='text-primary-600 dark:text-primary-400 cursor-pointer text-[9px] font-semibold disabled:cursor-not-allowed disabled:opacity-50'>
					Save
				</button>
				<button
					type='button'
					onClick={() => setIsEditing(false)}
					className='cursor-pointer text-[9px] font-semibold text-zinc-400 hover:text-zinc-600'>
					Cancel
				</button>
			</div>
		);
	}

	return (
		<div className='flex flex-col gap-0.5'>
			<div className='flex items-center justify-between text-[10px]'>
				<span
					className={`flex items-center gap-1 font-semibold ${trigger.has_signing_secret ? 'text-zinc-500 dark:text-zinc-400' : 'text-rose-500'}`}>
					<KeyRound size={10} />
					{trigger.has_signing_secret
						? `${noun} set`
						: `No ${noun.toLowerCase()}: every request is rejected`}
				</span>
				<div className='flex items-center gap-2'>
					{trigger.has_signing_secret && (
						<button
							type='button'
							disabled={updateTrigger.isPending}
							onClick={() => save(null)}
							className='cursor-pointer text-[9px] font-semibold text-rose-500 hover:text-rose-600'>
							Remove
						</button>
					)}
					<button
						type='button'
						onClick={() => setIsEditing(true)}
						className='hover:text-primary-600 cursor-pointer text-[9px] font-semibold text-zinc-500'>
						{trigger.has_signing_secret ? 'Replace' : 'Add'}
					</button>
				</div>
			</div>
			<span className='text-[9px] text-zinc-400'>
				{isToken ? (
					<>
						Send it as the <code className='font-mono'>{header}</code> header.
					</>
				) : isLegacySource ? (
					'The sending app’s signing secret.'
				) : (
					<>
						Sign the raw body:{' '}
						<code className='font-mono'>
							X-Signature-256: sha256=HMAC-SHA256(body, secret)
						</code>
						.
					</>
				)}
			</span>
		</div>
	);
};

/** Canvas nodes are draggable: every control here has to keep the pointer to itself. */
const stop = (event: React.SyntheticEvent) => event.stopPropagation();

type Props = {
	workspaceId: string;
	trigger: TTrigger;
};

const TriggerDetails = ({ workspaceId, trigger }: Props) => {
	const { confirm } = useConfirm();
	const runTrigger = useRunTrigger(workspaceId);
	const rotateToken = useRotateTriggerToken(workspaceId);
	const [eventsOpen, setEventsOpen] = useState(false);
	// Only fetched once the list is opened; an empty id keeps the query disabled.
	const events = useTriggerEvents(workspaceId, eventsOpen ? trigger.id : '');

	const webhookUrl =
		trigger.type === 'webhook' && trigger.token ? webhookUrlFor(trigger.token) : '';

	const handleCopy = () => copyWithNotice(webhookUrl, 'Webhook URL');
	const handleCopyCurl = () => copyWithNotice(webhookCurlFor(trigger), 'curl example');

	const handleRotate = async () => {
		const confirmed = await confirm({
			title: 'Rotate webhook URL',
			confirmText: 'Rotate',
			message:
				'A new URL is issued and the current one stops working immediately. Anything still posting to it will get a 404 until you update it.',
		});
		if (!confirmed) return;
		rotateToken.mutate(trigger.id, {
			onSuccess: () => notify.success('Webhook URL rotated'),
		});
	};

	const handleRun = () => {
		runTrigger.mutate(trigger.id, {
			onSuccess: () => notify.success('Run queued'),
		});
	};

	const stats = trigger.stats_24h;

	return (
		<div className='nodrag flex flex-col gap-2' onPointerDown={stop}>
			{(stats || trigger.next_run_at) && (
				<div className='flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] font-semibold text-zinc-400'>
					{stats && (
						<span title='Over the last 24 hours'>
							24h: {stats.fired} run{stats.fired === 1 ? '' : 's'}
							{stats.failed > 0 && (
								<span className='text-rose-500'> · {stats.failed} failed</span>
							)}
							{stats.skipped > 0 && <span> · {stats.skipped} skipped</span>}
						</span>
					)}
					{trigger.is_active && trigger.next_run_at && (
						<span>
							Next{' '}
							{formatDistanceToNow(new Date(trigger.next_run_at), {
								addSuffix: true,
							})}
						</span>
					)}
				</div>
			)}
			{webhookUrl && (
				<div className='flex flex-col gap-1'>
					<div className='flex items-center justify-between'>
						<span className='text-[10px] font-semibold text-zinc-500 dark:text-zinc-400'>
							Webhook URL <span className='font-mono text-zinc-400'>(POST)</span>
						</span>
						<div className='flex items-center gap-0.5'>
							<button
								type='button'
								title='Copy webhook URL'
								onClick={(event) => {
									stop(event);
									handleCopy();
								}}
								className='hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/40 dark:hover:text-primary-400 flex h-5 w-5 cursor-pointer items-center justify-center rounded text-zinc-400 transition'>
								<Copy size={11} />
							</button>
							<button
								type='button'
								title='Copy a curl example for this webhook'
								onClick={(event) => {
									stop(event);
									handleCopyCurl();
								}}
								className='hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/40 dark:hover:text-primary-400 flex h-5 cursor-pointer items-center justify-center gap-0.5 rounded px-1 text-[9px] font-semibold text-zinc-400 transition'>
								<Terminal size={10} />
								curl
							</button>
							<button
								type='button'
								title='Rotate webhook URL'
								disabled={rotateToken.isPending}
								onClick={(event) => {
									stop(event);
									handleRotate();
								}}
								className='hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/40 dark:hover:text-primary-400 flex h-5 w-5 cursor-pointer items-center justify-center rounded text-zinc-400 transition disabled:cursor-not-allowed disabled:opacity-50'>
								<RefreshCw
									size={11}
									className={rotateToken.isPending ? 'animate-spin' : ''}
								/>
							</button>
						</div>
					</div>
					<span className='cursor-text rounded-lg border border-zinc-200 bg-white p-1.5 font-mono text-[9px] font-semibold break-all text-zinc-700 select-all select-text dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'>
						{webhookUrl}
					</span>
					<WebhookSecret workspaceId={workspaceId} trigger={trigger} />
				</div>
			)}

			<div className='flex items-center justify-between'>
				<button
					type='button'
					onClick={(event) => {
						stop(event);
						setEventsOpen((open) => !open);
					}}
					className='flex cursor-pointer items-center gap-1 text-[10px] font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'>
					<ChevronRight
						size={11}
						className={`transition-transform ${eventsOpen ? 'rotate-90' : ''}`}
					/>
					Recent events
				</button>
				<button
					type='button'
					title='Fire this trigger now, as if an event had arrived'
					disabled={runTrigger.isPending}
					onClick={(event) => {
						stop(event);
						handleRun();
					}}
					className='hover:border-primary-300 hover:text-primary-600 dark:hover:text-primary-400 flex cursor-pointer items-center gap-1 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-zinc-600 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'>
					<Play size={9} />
					{runTrigger.isPending ? 'Queuing…' : 'Run now'}
				</button>
			</div>

			{eventsOpen && (
				<div className='flex flex-col gap-1'>
					{events.isLoading && (
						<span className='text-[9px] text-zinc-400'>Loading events…</span>
					)}
					{events.isError && (
						<span className='text-[9px] text-rose-500'>Couldn’t load events.</span>
					)}
					{events.data && events.data.length === 0 && (
						<span className='text-[9px] text-zinc-400'>No events received yet.</span>
					)}
					{events.data?.slice(0, EVENTS_SHOWN).map((event) => (
						<div
							key={event.id}
							title={event.error ?? undefined}
							className='flex items-center gap-1.5 rounded-md bg-white/70 px-1.5 py-1 text-[9px] dark:bg-zinc-900/70'>
							<span
								className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[event.status]}`}
							/>
							<span className='font-semibold text-zinc-700 capitalize dark:text-zinc-300'>
								{event.status}
							</span>
							<span className='text-zinc-400'>· {event.source}</span>
							<span className='ml-auto shrink-0 text-zinc-400'>
								{formatDistanceToNow(new Date(event.created_at), {
									addSuffix: true,
								})}
							</span>
							{event.run_id && (
								<Link
									to={paths.trail(workspaceId, event.run_id)}
									title='Open this run in Trail'
									onClick={stop}
									className='hover:text-primary-600 dark:hover:text-primary-400 shrink-0 text-zinc-400'>
									<ExternalLink size={9} />
								</Link>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default TriggerDetails;
