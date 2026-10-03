import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { Settings2, Tags } from 'lucide-react';
import { useAcceptInboxSuggestion, useInbox, useToggleInbox } from '@/api/modules/assistant';
import pages from '@/Routes/pages';
import useResolvePath from '@/hooks/useResolvePath';
import type { TInboxMessage } from '@/types/assistant.type';
import InboxLabelsModalPartial from './InboxLabelsModal.partial';
import InboxSettingsModalPartial from './InboxSettingsModal.partial';

interface IInboxTabProps {
	workspaceId: string;
	onOpenSession: (sessionId: string) => void;
}

/**
 * Smart Inbox: turning it on, what it did with recent mail (labels, moved
 * out, drafts), and suggested replies to take into chat.
 */
const InboxTabPartial = ({ workspaceId, onOpenSession }: IInboxTabProps) => {
	const { t } = useTranslation();
	const { resolvePath } = useResolvePath();
	const { data } = useInbox(workspaceId);
	const toggle = useToggleInbox(workspaceId);
	const accept = useAcceptInboxSuggestion(workspaceId);
	const [labelsOpen, setLabelsOpen] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [openId, setOpenId] = useState<string | null>(null);

	if (!data) return null;

	const colors = Object.fromEntries(
		data.labels.map((label) => [label.name, label.color ?? '#6b7280']),
	);

	if (!data.config.enabled) {
		return (
			<div className='flex flex-col items-start gap-3 rounded-2xl border border-zinc-200 p-4 text-sm dark:border-white/10'>
				<p className='text-zinc-700 dark:text-zinc-200'>{t('assistant.inboxIntro')}</p>
				{!data.available.plan ? (
					<p className='text-zinc-500'>{t('assistant.inboxNeedsPlan')}</p>
				) : !data.available.gmail_connected ? (
					<p className='text-zinc-500'>
						{t('assistant.inboxConnectGmail')}{' '}
						<Link
							to={resolvePath(pages.workspace.subPages!.apps.to)}
							className='underline'>
							{t('assistant.appsTitle')}
						</Link>
					</p>
				) : (
					<button
						type='button'
						onClick={() => toggle.mutate(true)}
						disabled={toggle.isPending}
						className='bg-assistant rounded-lg px-3 py-1.5 font-semibold text-white disabled:opacity-50'>
						{t('assistant.enableInbox')}
					</button>
				)}
			</div>
		);
	}

	const describeDraft = (message: TInboxMessage) =>
		message.draft_status ? t(`assistant.draftStatuses.${message.draft_status}`) : null;

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 p-3 text-sm dark:border-white/10'>
				<span className='text-zinc-600 dark:text-zinc-300'>
					{t('assistant.inboxWatching', { account: data.config.account })}
					{data.config.last_checked_at &&
						` · ${t('assistant.lastChecked', { time: dayjs(data.config.last_checked_at).format('HH:mm') })}`}
				</span>
				<div className='flex gap-2'>
					<button
						type='button'
						onClick={() => setLabelsOpen(true)}
						className='inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 dark:border-white/10'>
						<Tags className='h-4 w-4' />
						{t('assistant.manageLabels')}
					</button>
					<button
						type='button'
						onClick={() => setSettingsOpen(true)}
						aria-label={t('assistant.inboxSettings')}
						title={t('assistant.inboxSettings')}
						className='rounded-lg border border-zinc-200 px-2 dark:border-white/10'>
						<Settings2 className='h-4 w-4' />
					</button>
				</div>
			</div>

			{data.config.last_error && (
				<p className='rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300'>
					{data.config.last_error}
				</p>
			)}

			{data.messages.length === 0 && (
				<p className='py-4 text-center text-sm text-zinc-500'>
					{t('assistant.inboxEmpty')}
				</p>
			)}

			<ul className='flex flex-col gap-2'>
				{data.messages.map((message) => (
					<li
						key={message.id}
						className='rounded-2xl border border-zinc-200 p-3 dark:border-white/10'>
						<button
							type='button'
							onClick={() => setOpenId(openId === message.id ? null : message.id)}
							className='flex w-full flex-col gap-1 text-left'>
							<span className='flex items-center justify-between gap-2 text-xs text-zinc-500'>
								<span className='truncate'>{message.from}</span>
								{message.received_at && (
									<span className='shrink-0'>
										{dayjs(message.received_at).format('MMM D, HH:mm')}
									</span>
								)}
							</span>
							<span className='truncate text-sm font-medium text-zinc-900 dark:text-white'>
								{message.subject}
							</span>
						</button>
						<div className='mt-2 flex flex-wrap gap-1'>
							{message.labels.map((label) => (
								<span
									key={label}
									className='rounded-full px-2 py-0.5 text-[11px] font-medium text-white'
									style={{ backgroundColor: colors[label] ?? '#6b7280' }}>
									{label}
								</span>
							))}
							{message.archived && (
								<span className='rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-white/5 dark:text-zinc-300'>
									{t('assistant.movedOut')}
								</span>
							)}
							{message.status !== 'classified' && (
								<span className='rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500 dark:bg-white/5'>
									{message.skipped_reason}
								</span>
							)}
							{describeDraft(message) && (
								<span className='rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'>
									{describeDraft(message)}
								</span>
							)}
						</div>

						{openId === message.id && message.suggestion && (
							<div className='mt-3 border-t border-zinc-200 pt-3 text-sm dark:border-white/10'>
								<p className='mb-1 text-xs font-semibold tracking-wide text-zinc-400 uppercase'>
									{t('assistant.suggestedReply')}
								</p>
								<p className='whitespace-pre-wrap text-zinc-800 dark:text-zinc-100'>
									{message.suggestion}
								</p>
								<button
									type='button'
									disabled={accept.isPending}
									onClick={() =>
										accept.mutate(message.id, { onSuccess: onOpenSession })
									}
									className='mt-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold dark:border-white/10'>
									{t('assistant.openInChat')}
								</button>
							</div>
						)}
					</li>
				))}
			</ul>

			<InboxLabelsModalPartial
				workspaceId={workspaceId}
				isOpen={labelsOpen}
				onClose={() => setLabelsOpen(false)}
				labels={data.labels}
			/>
			<InboxSettingsModalPartial
				workspaceId={workspaceId}
				isOpen={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				settings={data.config}
			/>
		</div>
	);
};

export default InboxTabPartial;
