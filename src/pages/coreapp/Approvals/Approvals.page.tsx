import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router';
import { Check, ChevronLeft, ChevronRight, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { OutletContextType } from './_layouts/Approvals.layout';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import Spinner from '@/components/ui/Spinner';
import pages from '@/Routes/pages';
import paths from '@/Routes/paths';
import { useWorkspaceContext } from '@/context/workspace';
import { notify } from '@/api/core';
import { useAgents } from '@/api/modules/agents';
import { useWorkspace } from '@/api/modules/workspaces';
import { useAgentActionInbox, useDecideAgentActions } from '@/api/modules/agent-actions';
import { ApprovalCard } from '@/pages/coreapp/Agents/AgentBuilder/Build/_partial/AgentApprovalCards.partial';
import { prettifyActionTool } from '@/pages/coreapp/Agents/AgentBuilder/Build/_helper/actionTool.helper';
import type {
	TAgentAction,
	TAgentActionDecision,
	TAgentActionStatus,
} from '@/types/agent-action.type';

const STATUS_TABS: { value: TAgentActionStatus; label: string }[] = [
	{ value: 'pending', label: 'Waiting' },
	{ value: 'executed', label: 'Ran' },
	{ value: 'rejected', label: 'Rejected' },
	{ value: 'expired', label: 'Expired' },
	{ value: 'denied', label: 'Blocked' },
	{ value: 'simulated', label: 'Simulated' },
	{ value: 'failed', label: 'Failed' },
];

const formatWhen = (iso: string | null) =>
	iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const conversationLink = (ws: string, action: TAgentAction) =>
	action.agent_session_id
		? `${paths.editAgent(ws, action.agent_id)}?session=${action.agent_session_id}`
		: paths.editAgent(ws, action.agent_id);

/** A settled action in the log — what ran, or why it didn't. */
const ActionLogRow = ({ ws, action }: { ws: string; action: TAgentAction }) => (
	<li className='rounded-2xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900'>
		<div className='flex flex-wrap items-center gap-2'>
			<span className='text-[13px] font-bold text-zinc-800 dark:text-zinc-100'>
				{action.agent?.name ?? 'Agent'} · {prettifyActionTool(action.tool_name)}
			</span>
			<span className='rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10.5px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
				{action.status}
			</span>
			<span className='ml-auto text-[11px] font-semibold text-zinc-400'>
				{formatWhen(action.decided_at ?? action.executed_at ?? action.created_at)}
			</span>
			<Link
				to={conversationLink(ws, action)}
				aria-label='Open the conversation'
				className='flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800'>
				<ExternalLink size={13} />
			</Link>
		</div>
		{(action.decision_note || action.reason?.detail) && (
			<p className='mt-1 text-[12px] font-semibold text-zinc-500 dark:text-zinc-400'>
				{action.decision_note ?? action.reason?.detail}
			</p>
		)}
		{action.result && (
			<pre className='mt-2 max-h-28 overflow-y-auto rounded-md bg-zinc-50 px-2 py-1 font-mono text-[11px] [overflow-wrap:anywhere] whitespace-pre-wrap text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300'>
				{action.result}
			</pre>
		)}
	</li>
);

/**
 * The workspace's approvals inbox: every agent action waiting on a person,
 * oldest first — the agent blocked longest is the one to unblock. Deciding
 * here resumes the agent's turn in the background; the other tabs are the
 * action log, filtered by outcome.
 */
const ApprovalsPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const { activeWorkspaceId: ws } = useWorkspaceContext();

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.workspace.subPages!.approvals }]} />);
		return () => setHeaderLeft(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const [status, setStatus] = useState<TAgentActionStatus>('pending');
	const [agentId, setAgentId] = useState('');
	const [page, setPage] = useState(1);

	const { data, isLoading, isError, refetch } = useAgentActionInbox(ws, {
		status,
		agent_id: agentId || undefined,
		page,
	});
	const { data: agents } = useAgents(ws);
	const { data: workspace } = useWorkspace(ws);
	const canManageAgents = ['owner', 'admin', 'editor'].includes(workspace?.role ?? '');
	const decide = useDecideAgentActions(ws);

	const actions = data?.actions ?? [];
	const meta = data?.meta;
	const waiting = status === 'pending';

	const submit = (decisions: TAgentActionDecision[]) =>
		decide.mutate(
			{ decisions },
			{
				onSuccess: (decided) =>
					notify.success(
						decided.length === 0
							? 'Already decided elsewhere.'
							: `${decided.length} decision${decided.length === 1 ? '' : 's'} recorded — the agent carries on in the background.`,
					),
			},
		);

	return (
		<Container className='relative overflow-x-hidden overflow-y-auto bg-[#f8f9fc] dark:bg-zinc-950'>
			<div className='mx-auto w-full max-w-4xl py-4'>
				<div className='mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
					<div>
						<h1 className='flex items-center gap-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
							<ShieldCheck size={22} className='text-primary-500' /> Approvals
						</h1>
						<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
							Actions your agents paused on, waiting for a person — and everything
							they did or tried to do.
						</p>
					</div>
					<select
						aria-label='Filter by agent'
						value={agentId}
						onChange={(event) => {
							setAgentId(event.target.value);
							setPage(1);
						}}
						className='min-h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'>
						<option value=''>All agents</option>
						{(agents ?? []).map((agent) => (
							<option key={agent.id} value={agent.id}>
								{agent.name}
							</option>
						))}
					</select>
				</div>

				<div
					role='tablist'
					aria-label='Action status'
					className='mb-5 flex flex-wrap gap-1.5'>
					{STATUS_TABS.map((tab) => (
						<button
							key={tab.value}
							type='button'
							role='tab'
							aria-selected={status === tab.value}
							onClick={() => {
								setStatus(tab.value);
								setPage(1);
							}}
							className={`min-h-9 rounded-xl px-3 text-[12.5px] font-bold transition-colors ${
								status === tab.value
									? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
									: 'bg-white text-zinc-500 hover:text-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
							}`}>
							{tab.label}
							{tab.value === 'pending' && waiting && meta ? ` (${meta.total})` : ''}
						</button>
					))}
				</div>

				{waiting && actions.length > 1 && (
					<div className='mb-3 flex flex-wrap items-center gap-2'>
						<button
							type='button'
							disabled={decide.isPending}
							onClick={() =>
								submit(
									actions.map((action) => ({
										action_id: action.id,
										decision: 'approve',
									})),
								)
							}
							className='flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[12.5px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50'>
							<Check size={13} /> Approve all on this page
						</button>
						<button
							type='button'
							disabled={decide.isPending}
							onClick={() =>
								submit(
									actions.map((action) => ({
										action_id: action.id,
										decision: 'reject',
									})),
								)
							}
							className='flex min-h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-[12.5px] font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900'>
							<X size={13} /> Reject all on this page
						</button>
					</div>
				)}

				{isLoading ? (
					<div className='flex justify-center py-16'>
						<Spinner color='primary' className='size-8' />
					</div>
				) : isError ? (
					<div className='rounded-2xl border border-zinc-200 bg-white py-12 text-center dark:border-zinc-800 dark:bg-zinc-900'>
						<p className='text-sm font-semibold text-zinc-600 dark:text-zinc-300'>
							Could not load actions.
						</p>
						<button
							type='button'
							onClick={() => void refetch()}
							className='bg-primary-400 text-primary-950 mt-3 min-h-10 rounded-lg px-4 text-xs font-bold'>
							Retry
						</button>
					</div>
				) : actions.length === 0 ? (
					<p className='rounded-2xl border border-dashed border-zinc-200 py-14 text-center text-sm font-semibold text-zinc-400 dark:border-zinc-800'>
						{waiting ? 'Nothing is waiting for approval.' : 'No actions here yet.'}
					</p>
				) : waiting ? (
					<ul className='space-y-3'>
						{actions.map((action) => (
							<li key={action.id} className='space-y-1'>
								<div className='flex items-center gap-2 px-1 text-[11px] font-semibold text-zinc-400'>
									<span className='min-w-0 flex-1 truncate'>
										{action.session?.title ?? 'Conversation'} · asked{' '}
										{formatWhen(action.requested_at)}
									</span>
									<Link
										to={conversationLink(ws, action)}
										className='text-primary-600 dark:text-primary-400 shrink-0 font-bold hover:underline'>
										Open chat
									</Link>
								</div>
								<ApprovalCard
									action={action}
									busy={decide.isPending}
									canRemember={canManageAgents}
									showAgent
									onDecide={(decision) => submit([decision])}
								/>
							</li>
						))}
					</ul>
				) : (
					<ul className='space-y-2.5'>
						{actions.map((action) => (
							<ActionLogRow key={action.id} ws={ws} action={action} />
						))}
					</ul>
				)}

				{meta && meta.last_page > 1 && (
					<div className='mt-5 flex items-center justify-center gap-3'>
						<button
							type='button'
							aria-label='Previous page'
							disabled={page <= 1}
							onClick={() => setPage((p) => p - 1)}
							className='flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900'>
							<ChevronLeft size={15} />
						</button>
						<span className='text-xs font-bold text-zinc-500'>
							Page {meta.current_page} of {meta.last_page}
						</span>
						<button
							type='button'
							aria-label='Next page'
							disabled={page >= meta.last_page}
							onClick={() => setPage((p) => p + 1)}
							className='flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900'>
							<ChevronRight size={15} />
						</button>
					</div>
				)}
			</div>
		</Container>
	);
};

export default ApprovalsPage;
