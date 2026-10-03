import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { Play, Plus, Trash2 } from 'lucide-react';
import {
	useAssistantTriggers,
	useDeleteTrigger,
	useRunTriggerNow,
	useUpdateTrigger,
} from '@/api/modules/assistant';
import TriggerModalPartial from './TriggerModal.partial';

interface ITriggersPanelProps {
	workspaceId: string;
	onOpenSession: (sessionId: string) => void;
}

/** Schedules, one-time runs and webhooks that start the assistant on its own. */
const TriggersPanelPartial = ({ workspaceId, onOpenSession }: ITriggersPanelProps) => {
	const { t } = useTranslation();
	const { data: triggers = [], isLoading } = useAssistantTriggers(workspaceId);
	const update = useUpdateTrigger(workspaceId);
	const remove = useDeleteTrigger(workspaceId);
	const runNow = useRunTriggerNow(workspaceId);
	const [creating, setCreating] = useState(false);

	return (
		<div className='flex flex-col gap-2'>
			<div className='flex items-center justify-between px-2'>
				<p className='text-xs font-semibold tracking-wide text-zinc-400 uppercase'>
					{t('assistant.triggersTitle')}
				</p>
				<button
					type='button'
					onClick={() => setCreating(true)}
					aria-label={t('assistant.newTrigger')}
					title={t('assistant.newTrigger')}
					className='text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'>
					<Plus className='h-4 w-4' />
				</button>
			</div>

			{!isLoading && triggers.length === 0 && (
				<p className='px-2 text-xs text-zinc-500'>{t('assistant.noTriggers')}</p>
			)}

			<ul className='flex flex-col gap-1'>
				{triggers.map((trigger) => (
					<li
						key={trigger.id}
						className='group rounded-lg px-2 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-white/5'>
						<div className='flex items-center gap-2'>
							<input
								type='checkbox'
								checked={trigger.status === 'active'}
								onChange={(event) =>
									update.mutate({
										id: trigger.id,
										payload: {
											status: event.target.checked ? 'active' : 'paused',
										},
									})
								}
								aria-label={t('assistant.triggerOn')}
							/>
							<span className='min-w-0 flex-1 truncate text-zinc-800 dark:text-zinc-100'>
								{trigger.name}
							</span>
							<button
								type='button'
								onClick={() =>
									runNow.mutate(trigger.id, {
										onSuccess: (result) =>
											result.session_id && onOpenSession(result.session_id),
									})
								}
								aria-label={t('assistant.runNow')}
								title={t('assistant.runNow')}
								className='text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-zinc-700 focus:opacity-100 dark:hover:text-zinc-200'>
								<Play className='h-3.5 w-3.5' />
							</button>
							<button
								type='button'
								onClick={() => remove.mutate(trigger.id)}
								aria-label={t('assistant.delete')}
								title={t('assistant.delete')}
								className='text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-red-500 focus:opacity-100'>
								<Trash2 className='h-3.5 w-3.5' />
							</button>
						</div>
						<p className='mt-0.5 pl-6 text-[11px] text-zinc-500'>
							{trigger.status === 'disabled'
								? t('assistant.triggerDisabled')
								: trigger.type === 'webhook'
									? t('assistant.triggerWebhook')
									: trigger.next_run_at
										? t('assistant.nextRun', {
												time: dayjs(trigger.next_run_at).format(
													'ddd, MMM D · HH:mm',
												),
											})
										: t('assistant.triggerPaused')}
						</p>
						{trigger.webhook_url && (
							<input
								readOnly
								value={trigger.webhook_url}
								onFocus={(event) => event.target.select()}
								aria-label={t('assistant.webhookUrl')}
								className='mt-1 ml-6 w-[calc(100%-1.5rem)] rounded border border-zinc-200 bg-transparent px-1.5 py-0.5 text-[10px] text-zinc-500 dark:border-white/10'
							/>
						)}
					</li>
				))}
			</ul>

			<TriggerModalPartial
				workspaceId={workspaceId}
				isOpen={creating}
				onClose={() => setCreating(false)}
			/>
		</div>
	);
};

export default TriggersPanelPartial;
