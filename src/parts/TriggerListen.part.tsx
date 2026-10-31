import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Loader2, Radio, Square } from 'lucide-react';
import { TriggerService } from '@/api/modules/triggers';
import { copyWithNotice } from '@/pages/coreapp/Playbooks/WorkflowEditor/_helper/trigger.helper';

/** How long it keeps listening before giving up. */
const LISTEN_FOR_MS = 5 * 60 * 1000;
const CHECK_EVERY_MS = 2_000;

type TProps = {
	ws: string;
	triggerId: string;
};

/**
 * "Listen for event": waits for the next real event to reach the trigger and
 * shows what it carried, so a flow can be built from live data without
 * guessing. It only watches the trigger's event list; it fires nothing itself.
 *
 * Send the event the usual way (post to the webhook, send the email, react to
 * the message) and it appears here within a couple of seconds.
 */
const TriggerListen = ({ ws, triggerId }: TProps) => {
	const [since, setSince] = useState<number | null>(null);
	const isListening = since !== null;

	// Stop on its own after a few minutes.
	useEffect(() => {
		if (since === null) return;
		const timer = window.setTimeout(() => setSince(null), LISTEN_FOR_MS);
		return () => window.clearTimeout(timer);
	}, [since]);

	const { data: heard } = useQuery({
		queryKey: ['triggers', ws, 'detail', triggerId, 'listen', since],
		queryFn: ({ signal }) =>
			TriggerService.events(ws, triggerId, { per_page: 5 }, signal).then((page) =>
				page.events.find(
					(event) => since !== null && new Date(event.created_at).getTime() >= since,
				),
			),
		enabled: isListening,
		refetchInterval: (query) => (query.state.data ? false : CHECK_EVERY_MS),
	});

	const json = heard ? JSON.stringify(heard.payload ?? {}, null, 2) : '';

	return (
		<div className='flex flex-col gap-1'>
			<div className='flex items-center justify-between'>
				<span className='text-[10px] font-semibold text-zinc-500 dark:text-zinc-400'>
					Test with a real event
				</span>
				{isListening && !heard ? (
					<button
						type='button'
						onClick={() => setSince(null)}
						className='flex cursor-pointer items-center gap-1 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-zinc-600 transition dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'>
						<Square size={8} />
						Stop
					</button>
				) : (
					<button
						type='button'
						onClick={() => setSince(Date.now())}
						className='hover:border-primary-300 hover:text-primary-900 dark:hover:text-primary-400 flex cursor-pointer items-center gap-1 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-zinc-600 transition dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'>
						<Radio size={9} />
						{heard ? 'Listen again' : 'Listen for event'}
					</button>
				)}
			</div>
			{isListening && !heard && (
				<span className='flex items-center gap-1 text-[9px] text-zinc-400'>
					<Loader2 size={9} className='animate-spin' />
					Waiting for the next event… send one now.
				</span>
			)}
			{heard && (
				<div className='flex flex-col gap-1 rounded-md bg-white/70 p-1.5 dark:bg-zinc-900/70'>
					<div className='flex items-center justify-between text-[9px]'>
						<span className='font-semibold text-emerald-700 capitalize dark:text-emerald-400'>
							Got a {heard.source} event ({heard.status})
						</span>
						<button
							type='button'
							title='Copy this event as JSON'
							onClick={() => void copyWithNotice(json, 'Event')}
							className='hover:text-primary-900 dark:hover:text-primary-400 cursor-pointer text-zinc-400 transition'>
							<Copy size={10} />
						</button>
					</div>
					<pre className='max-h-48 overflow-auto rounded bg-zinc-50 p-2 font-mono text-[9px] leading-relaxed text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300'>
						{json}
					</pre>
				</div>
			)}
		</div>
	);
};

export default TriggerListen;
