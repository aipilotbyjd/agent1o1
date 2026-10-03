import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { ExternalLink, Loader2, Settings2 } from 'lucide-react';
import AssistantMarkdown from '@/components/assistant/AssistantMarkdown';
import { useMeetingPrep, useMeetings, usePrepareMeeting } from '@/api/modules/assistant';
import pages from '@/Routes/pages';
import useResolvePath from '@/hooks/useResolvePath';
import type { TMeeting } from '@/types/assistant.type';
import MeetingPrepSettingsModalPartial from './MeetingPrepSettingsModal.partial';

/** Upcoming meetings and their briefs. "Prepare now" works with automatic prep off. */
const MeetingsTabPartial = ({ workspaceId }: { workspaceId: string }) => {
	const { t } = useTranslation();
	const { resolvePath } = useResolvePath();
	const { data } = useMeetings(workspaceId);
	const { data: prep } = useMeetingPrep(workspaceId);
	const prepare = usePrepareMeeting(workspaceId);
	const [openId, setOpenId] = useState<string | null>(null);
	const [settingsOpen, setSettingsOpen] = useState(false);

	if (!data) return null;

	const settings = prep?.config.settings;
	const status = !prep?.config.enabled
		? t('assistant.prepOff')
		: settings?.auto
			? t('assistant.prepAuto', {
					minutes: settings.minutes_before,
					scope: t(`assistant.prepScopes.${settings.scope}`),
				})
			: t('assistant.prepManual');

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 p-3 text-sm dark:border-white/10'>
				<span className='text-zinc-600 dark:text-zinc-300'>{status}</span>
				<button
					type='button'
					onClick={() => setSettingsOpen(true)}
					aria-label={t('assistant.prepSettings')}
					title={t('assistant.prepSettings')}
					className='rounded-lg border border-zinc-200 p-1.5 dark:border-white/10'>
					<Settings2 className='h-4 w-4' />
				</button>
			</div>

			{!data.calendar_connected && (
				<p className='text-sm text-zinc-500'>
					{t('assistant.connectCalendar')}{' '}
					<Link to={resolvePath(pages.workspace.subPages!.apps.to)} className='underline'>
						{t('assistant.appsTitle')}
					</Link>
				</p>
			)}

			{data.calendar_connected && data.meetings.length === 0 && (
				<p className='py-4 text-center text-sm text-zinc-500'>
					{t('assistant.noMeetings')}
				</p>
			)}

			<ul className='flex flex-col gap-2'>
				{data.meetings.map((meeting: TMeeting) => (
					<li
						key={meeting.id}
						className='rounded-2xl border border-zinc-200 p-4 dark:border-white/10'>
						<div className='flex items-start justify-between gap-3'>
							<button
								type='button'
								onClick={() => setOpenId(openId === meeting.id ? null : meeting.id)}
								className='flex min-w-0 flex-col gap-1 text-left'>
								<span className='text-xs text-zinc-500'>
									{dayjs(meeting.starts_at).format('ddd, MMM D · HH:mm')}
									{' · '}
									{t('assistant.guests', { count: meeting.attendees.length })}
									{meeting.is_external && (
										<span className='ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800 dark:bg-amber-400/10 dark:text-amber-300'>
											{t('assistant.external')}
										</span>
									)}
								</span>
								<span className='truncate font-medium text-zinc-900 dark:text-white'>
									{meeting.title}
								</span>
								{meeting.brief?.summary && meeting.brief.status === 'completed' && (
									<span className='text-sm text-zinc-600 dark:text-zinc-300'>
										{meeting.brief.summary}
									</span>
								)}
								{meeting.brief?.status === 'failed' && (
									<span className='text-sm text-red-600 dark:text-red-400'>
										{meeting.brief.error}
									</span>
								)}
							</button>
							<div className='flex shrink-0 items-center gap-2'>
								{meeting.html_link && (
									<a
										href={meeting.html_link}
										target='_blank'
										rel='noreferrer'
										aria-label={t('assistant.openInCalendar')}
										title={t('assistant.openInCalendar')}
										className='text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'>
										<ExternalLink className='h-4 w-4' />
									</a>
								)}
								<button
									type='button'
									disabled={
										meeting.prep_status === 'preparing' || prepare.isPending
									}
									onClick={() => {
										prepare.mutate(meeting.id);
										setOpenId(meeting.id);
									}}
									className='bg-assistant inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50'>
									{meeting.prep_status === 'preparing' && (
										<Loader2 className='h-3.5 w-3.5 animate-spin' />
									)}
									{meeting.prep_status === 'preparing'
										? t('assistant.preparing')
										: meeting.prep_status === 'prepared'
											? t('assistant.prepareAgain')
											: t('assistant.prepareNow')}
								</button>
							</div>
						</div>

						{openId === meeting.id && meeting.brief?.document && (
							<div className='mt-3 border-t border-zinc-200 pt-3 text-sm text-zinc-800 dark:border-white/10 dark:text-zinc-100'>
								<AssistantMarkdown text={meeting.brief.document} />
							</div>
						)}
					</li>
				))}
			</ul>

			{prep && (
				<MeetingPrepSettingsModalPartial
					workspaceId={workspaceId}
					isOpen={settingsOpen}
					onClose={() => setSettingsOpen(false)}
					config={prep.config}
				/>
			)}
		</div>
	);
};

export default MeetingsTabPartial;
