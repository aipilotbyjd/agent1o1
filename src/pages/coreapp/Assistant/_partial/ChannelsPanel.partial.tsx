import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { CheckCircle2, Copy, Mail, MessageSquare } from 'lucide-react';
import { useBrand } from '@/context/brand';
import { useAssistantChannels, useInstallAssistantSlack } from '@/api/modules/assistant';
import { notify } from '@/api/core';
import SmsChannelPartial from './SmsChannel.partial';

const SLACK_RESULT_PARAM = 'slack';

interface IChannelsPanelProps {
	workspaceId: string;
}

/** The assistant's email address and Slack app — other ways to reach it. */
const ChannelsPanelPartial = ({ workspaceId }: IChannelsPanelProps) => {
	const brand = useBrand();
	const [searchParams, setSearchParams] = useSearchParams();
	const { data: channels } = useAssistantChannels(workspaceId);
	const installSlack = useInstallAssistantSlack(workspaceId);

	// Slack sends the admin back here with ?slack=connected|failed|cancelled.
	const slackResult = searchParams.get(SLACK_RESULT_PARAM);
	useEffect(() => {
		if (!slackResult) return;
		if (slackResult === 'connected') notify.success(`${brand.name} is now in your Slack`);
		if (slackResult === 'failed') notify.error("Couldn't connect Slack. Please try again.");
		const next = new URLSearchParams(searchParams);
		next.delete(SLACK_RESULT_PARAM);
		setSearchParams(next, { replace: true });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [slackResult]);

	if (
		!channels ||
		(!channels.email.enabled && !channels.slack.available && !channels.sms.available)
	)
		return null;

	const copyAddress = () => {
		void navigator.clipboard
			.writeText(channels.email.address)
			.then(() => notify.success('Address copied'));
	};

	return (
		<div className='flex flex-col gap-3'>
			<p className='px-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase'>
				Reach {brand.name}
			</p>

			{channels.email.enabled && (
				<div className='flex flex-col gap-1 px-2'>
					<div className='flex items-center gap-2 text-sm'>
						<Mail className='h-4 w-4 shrink-0 text-zinc-400' />
						<span className='min-w-0 flex-1 truncate font-medium text-zinc-800 dark:text-zinc-100'>
							{channels.email.address}
						</span>
						<button
							type='button'
							onClick={copyAddress}
							title='Copy address'
							aria-label='Copy address'
							className='text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'>
							<Copy className='h-3.5 w-3.5' />
						</button>
					</div>
					<p className='text-[11px] text-zinc-500'>
						Email or CC this address from your account email.
					</p>
				</div>
			)}

			{channels.slack.available && (
				<div className='flex flex-col gap-1 px-2'>
					{channels.slack.installed ? (
						<div className='flex items-center gap-2 text-sm'>
							<CheckCircle2 className='h-4 w-4 shrink-0 text-emerald-500' />
							<span className='min-w-0 flex-1 truncate font-medium text-zinc-800 dark:text-zinc-100'>
								Connected to {channels.slack.team_name}
							</span>
						</div>
					) : (
						<button
							type='button'
							onClick={() => installSlack.mutate()}
							disabled={installSlack.isPending}
							className='inline-flex items-center gap-2 self-start rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5'>
							<MessageSquare className='h-4 w-4' />
							Add to Slack
						</button>
					)}
					<p className='text-[11px] text-zinc-500'>
						DM {brand.name} in Slack. Reply in the thread to keep going, !stop to stop,
						!link for the chat here.
					</p>
				</div>
			)}

			{channels.sms.available && (
				<SmsChannelPartial workspaceId={workspaceId} sms={channels.sms} />
			)}
		</div>
	);
};

export default ChannelsPanelPartial;
