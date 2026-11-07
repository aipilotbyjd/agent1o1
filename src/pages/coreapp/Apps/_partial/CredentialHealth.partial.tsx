import { Bot, BookOpen, Check, Workflow, X as CloseIcon } from 'lucide-react';
import { useNavigate } from 'react-router';
import paths, { withWorkspace } from '@/Routes/paths';
import pages from '@/Routes/pages';
import { useConnectorCredentialUsage } from '@/api/modules/connectors';
import type { TConnectorCredentialTestResult } from '@/types/connector.type';
import { formatRelativeTime } from '../_helper/credentialHealth.helper';

export const CredentialTestResult = ({ result }: { result: TConnectorCredentialTestResult }) => (
	<div
		role='status'
		className={`flex items-start gap-3 rounded-2xl border p-4 text-xs font-semibold ${result.ok ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-red-200 bg-red-50/70 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300'}`}>
		<span
			className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${result.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
			{result.ok ? (
				<Check className='h-3 w-3 stroke-[3px]' />
			) : (
				<CloseIcon className='h-3 w-3 stroke-[3px]' />
			)}
		</span>
		<div className='min-w-0'>
			<p className='font-black'>{result.ok ? 'Connection works' : 'Connection failed'}</p>
			<p className='mt-0.5 break-words'>
				{result.ok && result.account ? `Signed in as ${result.account}.` : result.message}
			</p>
			<p className='mt-1 text-[10px] opacity-70'>
				Checked {formatRelativeTime(result.tested_at)}
			</p>
		</div>
	</div>
);

interface ICredentialUsageProps {
	workspaceId: string;
	credentialId: string;
	onNavigate: () => void;
}

export const CredentialUsage = ({
	workspaceId,
	credentialId,
	onNavigate,
}: ICredentialUsageProps) => {
	const navigate = useNavigate();
	const {
		data: usage,
		isLoading,
		isError,
	} = useConnectorCredentialUsage(workspaceId, credentialId);

	const open = (to: string) => {
		onNavigate();
		navigate(to);
	};

	return (
		<div className='rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-zinc-900/30 dark:bg-zinc-950/15'>
			<span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
				Used by
			</span>

			{isLoading ? (
				<div className='mt-2 h-4 w-40 animate-pulse rounded bg-slate-200 dark:bg-zinc-800' />
			) : isError || !usage ? (
				<p className='mt-1.5 text-xs font-semibold text-slate-400 dark:text-zinc-500'>
					Couldn&apos;t load where this account is used.
				</p>
			) : usage.total === 0 ? (
				<p className='mt-1.5 text-xs font-semibold text-slate-500 dark:text-zinc-400'>
					Nothing uses this account yet.
					{usage.is_default_for_unpinned
						? ' As the default, new steps for this app will use it.'
						: ''}
				</p>
			) : (
				<>
					<ul className='mt-2 space-y-1'>
						{usage.workflows.map((workflow) => (
							<UsageRow
								key={`workflow-${workflow.id}`}
								icon={Workflow}
								name={workflow.name}
								detail={`${workflow.nodes_count} ${workflow.nodes_count === 1 ? 'step' : 'steps'}`}
								viaDefault={workflow.via === 'default'}
								onClick={() => open(paths.editPlaybook(workspaceId, workflow.id))}
							/>
						))}
						{usage.agents.map((agent) => (
							<UsageRow
								key={`agent-${agent.id}`}
								icon={Bot}
								name={agent.name}
								detail={`${agent.tools_count} ${agent.tools_count === 1 ? 'tool' : 'tools'}`}
								viaDefault={agent.via === 'default'}
								onClick={() => open(paths.editAgent(workspaceId, agent.id))}
							/>
						))}
						{usage.knowledge_sources.map((source) => (
							<UsageRow
								key={`knowledge-${source.id}`}
								icon={BookOpen}
								name={source.name}
								detail='Knowledge source'
								onClick={() =>
									open(
										withWorkspace(
											pages.workspace.subPages!.knowledge.to,
											workspaceId,
										),
									)
								}
							/>
						))}
					</ul>
					{usage.is_default_for_unpinned && (
						<p className='mt-2 text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
							&ldquo;Default&rdquo; means the step doesn&apos;t pick an account, so it
							uses this one.
						</p>
					)}
				</>
			)}
		</div>
	);
};

const UsageRow = ({
	icon: Icon,
	name,
	detail,
	viaDefault,
	onClick,
}: {
	icon: typeof Workflow;
	name: string;
	detail: string;
	viaDefault?: boolean;
	onClick: () => void;
}) => (
	<li>
		<button
			type='button'
			onClick={onClick}
			className='-mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white dark:hover:bg-zinc-900'>
			<Icon className='h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-zinc-500' />
			<span className='min-w-0 flex-1 truncate text-xs font-bold text-slate-800 dark:text-zinc-200'>
				{name}
			</span>
			{viaDefault && (
				<span className='rounded border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:border-zinc-700 dark:text-zinc-400'>
					Default
				</span>
			)}
			<span className='shrink-0 text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
				{detail}
			</span>
		</button>
	</li>
);
