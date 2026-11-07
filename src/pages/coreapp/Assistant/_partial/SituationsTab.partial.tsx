import { Check, Send, X } from 'lucide-react';
import { useBrand } from '@/context/brand';
import {
	useSendSituation,
	useSituations,
	useUpdateSituation,
	useUpdateSituationStep,
} from '@/api/modules/assistant';
import type { TSituation } from '@/types/assistant.type';

interface ISituationsTabProps {
	workspaceId: string;
	onOpenSession: (sessionId: string) => void;
}

/**
 * Real work the owner owns, found by their reports. "Send" hands one to the
 * assistant as a new conversation; steps can be ticked off by hand.
 */
const SituationsTabPartial = ({ workspaceId, onOpenSession }: ISituationsTabProps) => {
	const brand = useBrand();
	const { data: situations = [], isLoading } = useSituations(workspaceId);
	const send = useSendSituation(workspaceId);
	const update = useUpdateSituation(workspaceId);
	const updateStep = useUpdateSituationStep(workspaceId);

	if (isLoading) return null;

	if (situations.length === 0) {
		return (
			<p className='py-6 text-center text-sm text-zinc-500'>
				Nothing needs you right now. Situations from your Daily report show up here.
			</p>
		);
	}

	const handleSend = (situation: TSituation) =>
		send.mutate(situation.id, {
			onSuccess: (sent) => sent.session_id && onOpenSession(sent.session_id),
		});

	return (
		<ul className='flex flex-col gap-3'>
			{situations.map((situation) => (
				<li
					key={situation.id}
					className='rounded-2xl border border-zinc-200 p-4 dark:border-white/10'>
					<div className='flex items-start justify-between gap-3'>
						<div className='min-w-0'>
							<p className='font-semibold text-zinc-900 dark:text-white'>
								{situation.title}
							</p>
							{situation.summary && (
								<p className='mt-1 text-sm text-zinc-600 dark:text-zinc-300'>
									{situation.summary}
								</p>
							)}
							{situation.sources.length > 0 && (
								<div className='mt-2 flex flex-wrap gap-1'>
									{situation.sources.map((source) => (
										<span
											key={source}
											className='rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-white/5 dark:text-zinc-300'>
											{source}
										</span>
									))}
								</div>
							)}
						</div>
						<button
							type='button'
							onClick={() => update.mutate({ id: situation.id, status: 'dismissed' })}
							aria-label='Dismiss'
							title='Dismiss'
							className='shrink-0 rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'>
							<X className='h-4 w-4' />
						</button>
					</div>

					{situation.steps.length > 0 && (
						<ol className='mt-3 flex flex-col gap-1.5'>
							{situation.steps.map((step) => (
								<li key={step.id} className='flex items-start gap-2 text-sm'>
									<button
										type='button'
										onClick={() =>
											updateStep.mutate({
												id: situation.id,
												stepId: step.id,
												status: step.status === 'done' ? 'todo' : 'done',
											})
										}
										aria-label={step.body}
										className={
											step.status === 'done'
												? 'bg-assistant mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded text-white'
												: 'mt-0.5 h-4 w-4 shrink-0 rounded border border-zinc-300 dark:border-white/20'
										}>
										{step.status === 'done' && <Check className='h-3 w-3' />}
									</button>
									<span
										className={
											step.status === 'done'
												? 'text-zinc-400 line-through'
												: 'text-zinc-700 dark:text-zinc-200'
										}>
										{step.body}
									</span>
								</li>
							))}
						</ol>
					)}

					<div className='mt-3 flex gap-2'>
						<button
							type='button'
							disabled={send.isPending}
							onClick={() => handleSend(situation)}
							className='bg-assistant inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50'>
							<Send className='h-3.5 w-3.5' />
							Send to {brand.name}
						</button>
						<button
							type='button'
							onClick={() => update.mutate({ id: situation.id, status: 'done' })}
							className='rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 dark:border-white/10 dark:text-zinc-200'>
							Mark done
						</button>
					</div>
				</li>
			))}
		</ul>
	);
};

export default SituationsTabPartial;
