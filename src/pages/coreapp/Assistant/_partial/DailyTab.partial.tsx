import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { Loader2, Settings2 } from 'lucide-react';
import AssistantMarkdown from '@/components/assistant/AssistantMarkdown';
import {
	useBriefingRun,
	useDailyReport,
	usePauseDailyReport,
	useRunDailyReportNow,
} from '@/api/modules/assistant';
import type { TBriefingRun } from '@/types/assistant.type';
import DailySettingsModalPartial from './DailySettingsModal.partial';

const IN_PROGRESS: TBriefingRun['status'][] = ['queued', 'collecting', 'writing'];

/** The Daily report: its schedule, a run-now button, and past reports. */
const DailyTabPartial = ({ workspaceId }: { workspaceId: string }) => {
	const { t } = useTranslation();
	const { data } = useDailyReport(workspaceId);
	const runNow = useRunDailyReportNow(workspaceId);
	const pause = usePauseDailyReport(workspaceId);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [openRunId, setOpenRunId] = useState<string | null>(null);
	const { data: openRun } = useBriefingRun(workspaceId, openRunId);

	if (!data) return null;

	const { config, runs } = data;
	const isRunning = runs.some((run) => IN_PROGRESS.includes(run.status));

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 p-3 text-sm dark:border-white/10'>
				<span className='text-zinc-600 dark:text-zinc-300'>
					{!config.enabled
						? t('assistant.dailyOff')
						: config.paused
							? t('assistant.dailyPaused')
							: t('assistant.dailySchedule', {
									time: config.schedule.time,
									timezone: config.schedule.timezone,
								})}
				</span>
				<div className='flex gap-2'>
					{config.enabled && (
						<button
							type='button'
							onClick={() => pause.mutate(!config.paused)}
							className='rounded-lg border border-zinc-200 px-3 py-1.5 dark:border-white/10'>
							{config.paused ? t('assistant.resume') : t('assistant.pause')}
						</button>
					)}
					<button
						type='button'
						onClick={() => runNow.mutate(undefined)}
						disabled={runNow.isPending || isRunning}
						className='bg-assistant inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold text-white disabled:opacity-50'>
						{isRunning && <Loader2 className='h-3.5 w-3.5 animate-spin' />}
						{isRunning ? t('assistant.writingReport') : t('assistant.runNow')}
					</button>
					<button
						type='button'
						onClick={() => setSettingsOpen(true)}
						aria-label={t('assistant.dailySettings')}
						title={t('assistant.dailySettings')}
						className='rounded-lg border border-zinc-200 px-2 dark:border-white/10'>
						<Settings2 className='h-4 w-4' />
					</button>
				</div>
			</div>

			{runs.length === 0 && (
				<p className='py-4 text-center text-sm text-zinc-500'>{t('assistant.noReports')}</p>
			)}

			<ul className='flex flex-col gap-2'>
				{runs.map((run) => (
					<li
						key={run.id}
						className='rounded-2xl border border-zinc-200 p-4 dark:border-white/10'>
						<button
							type='button'
							onClick={() => setOpenRunId(openRunId === run.id ? null : run.id)}
							className='flex w-full flex-col gap-1 text-left'>
							<span className='flex items-center gap-2 text-xs text-zinc-500'>
								{dayjs(run.created_at).format('ddd, MMM D · HH:mm')}
								{IN_PROGRESS.includes(run.status) && (
									<Loader2 className='h-3 w-3 animate-spin' />
								)}
							</span>
							<span className='text-sm text-zinc-800 dark:text-zinc-100'>
								{run.status === 'failed'
									? run.error
									: (run.summary ?? t('assistant.writingReport'))}
							</span>
						</button>

						{run.sources.length > 0 && (
							<div className='mt-2 flex flex-wrap gap-1'>
								{run.sources.map((source) => (
									<span
										key={source.source}
										title={source.error ?? undefined}
										className={
											source.ok
												? 'rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-white/5 dark:text-zinc-300'
												: 'rounded-full bg-red-50 px-2 py-0.5 text-[11px] text-red-600 dark:bg-red-500/10 dark:text-red-400'
										}>
										{source.ok
											? source.name
											: t('assistant.sourceFailed', { name: source.name })}
									</span>
								))}
							</div>
						)}

						{openRunId === run.id && openRun?.document && (
							<div className='mt-3 border-t border-zinc-200 pt-3 text-sm text-zinc-800 dark:border-white/10 dark:text-zinc-100'>
								<p className='mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase'>
									{t('assistant.catchUp')}
								</p>
								<AssistantMarkdown text={openRun.document} />
							</div>
						)}
					</li>
				))}
			</ul>

			<DailySettingsModalPartial
				workspaceId={workspaceId}
				isOpen={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				config={config}
				readableSources={data.readable_sources}
			/>
		</div>
	);
};

export default DailyTabPartial;
