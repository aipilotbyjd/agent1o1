import { useState } from 'react';
import { AlertTriangle, Check, Clock, PencilLine, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import type {
	TActionEffect,
	TActionRisk,
	TAgentAction,
	TAgentActionDecision,
} from '@/types/agent-action.type';

const EFFECT_LABEL: Record<TActionEffect, { label: string; className: string }> = {
	read: {
		label: 'Reads',
		className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
	},
	write: {
		label: 'Changes data',
		className: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
	},
	external: {
		label: 'Reaches people',
		className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
	},
	destructive: {
		label: 'Deletes',
		className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
	},
};

const RISK_LABEL: Record<TActionRisk, string> = {
	low: 'Low risk',
	medium: 'Medium risk',
	high: 'High risk',
};

export const prettifyActionTool = (raw: string) =>
	raw.replace(/[_-]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

const formatValue = (value: unknown) =>
	typeof value === 'string' ? value : JSON.stringify(value, null, 2);

/** When a waiting action lapses — the workspace's approval window. */
const expiresLabel = (expiresAt: string | null) => {
	if (!expiresAt) return null;
	const minutes = Math.round((new Date(expiresAt).getTime() - Date.now()) / 60000);
	if (minutes <= 0) return 'Expiring';
	if (minutes < 60) return `Expires in ${minutes}m`;
	const hours = Math.round(minutes / 60);
	return hours < 48 ? `Expires in ${hours}h` : `Expires in ${Math.round(hours / 24)}d`;
};

type TCardMode = 'view' | 'edit' | 'reject';

export const ApprovalCard = ({
	action,
	busy,
	canRemember,
	showAgent = false,
	onDecide,
}: {
	action: TAgentAction;
	busy: boolean;
	/** Name the agent — in the workspace inbox, or for a subagent's action in a chat. */
	showAgent?: boolean;
	/** "Always allow" is offered only to people who may manage the agent, and only for node/workflow tools. */
	canRemember: boolean;
	onDecide: (decision: TAgentActionDecision) => void;
}) => {
	const args = action.edited_arguments ?? action.arguments ?? {};
	const [mode, setMode] = useState<TCardMode>('view');
	const [note, setNote] = useState('');
	const [argsText, setArgsText] = useState(() => JSON.stringify(args, null, 2));
	const [argsError, setArgsError] = useState<string | null>(null);
	const [remember, setRemember] = useState(false);
	const [stop, setStop] = useState(false);
	const effect = EFFECT_LABEL[action.effect];
	const expires = expiresLabel(action.expires_at);
	const rememberable = canRemember && action.tool_kind !== 'builtin';
	const namedApprovers = (action.approvers ?? []).length > 0;

	const approve = () => {
		if (mode === 'edit') {
			try {
				const parsed = JSON.parse(argsText) as unknown;
				if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
					setArgsError('The input must be a JSON object.');
					return;
				}
				onDecide({
					action_id: action.id,
					decision: 'edit',
					arguments: parsed as Record<string, unknown>,
					note: note.trim() || null,
				});
			} catch {
				setArgsError('That is not valid JSON.');
			}
			return;
		}
		onDecide({
			action_id: action.id,
			decision: 'approve',
			note: note.trim() || null,
			remember: rememberable && remember,
		});
	};

	const reject = () =>
		onDecide({ action_id: action.id, decision: 'reject', note: note.trim() || null, stop });

	return (
		<div className='rounded-2xl border border-amber-200 bg-amber-50/40 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/20'>
			<div className='flex flex-wrap items-center gap-2'>
				<ShieldAlert size={15} className='shrink-0 text-amber-600 dark:text-amber-400' />
				<span className='text-[13px] font-bold text-zinc-800 dark:text-zinc-100'>
					{action.agent && (showAgent || action.session?.parent_session_id)
						? `${action.agent.name} wants to `
						: 'Wants to '}
					{prettifyActionTool(action.tool_name).toLowerCase()}
				</span>
				<span
					className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-bold ${effect.className}`}>
					{effect.label}
				</span>
				{action.risk && (
					<span className='rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10.5px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
						{RISK_LABEL[action.risk]}
					</span>
				)}
				{expires && (
					<span className='ml-auto flex items-center gap-1 text-[11px] font-semibold text-zinc-400'>
						<Clock size={11} /> {expires}
					</span>
				)}
			</div>

			{(action.review_reason || action.reason?.detail) && (
				<p className='mt-1.5 text-[12px] font-semibold text-zinc-500 dark:text-zinc-400'>
					{action.review_reason ?? action.reason?.detail}
				</p>
			)}

			{mode === 'edit' ? (
				<div className='mt-2.5'>
					<label
						className='mb-1 block text-[11px] font-bold text-zinc-500'
						htmlFor={`args-${action.id}`}>
						Input it will run with
					</label>
					<textarea
						id={`args-${action.id}`}
						value={argsText}
						onChange={(event) => {
							setArgsText(event.target.value);
							setArgsError(null);
						}}
						rows={Math.min(12, argsText.split('\n').length + 1)}
						spellCheck={false}
						className='w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 font-mono text-[11.5px] text-zinc-800 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200'
					/>
					{argsError && (
						<p className='mt-1 text-[11px] font-bold text-rose-600'>{argsError}</p>
					)}
					<p className='mt-1 text-[11px] font-semibold text-zinc-400'>
						Values fixed when the tool was attached can't be changed here.
					</p>
				</div>
			) : (
				Object.keys(args).length > 0 && (
					<dl className='mt-2.5 space-y-1.5'>
						{Object.entries(args).map(([key, value]) => (
							<div key={key} className='min-w-0'>
								<dt className='font-mono text-[11px] font-bold text-zinc-500 dark:text-zinc-400'>
									{key}
								</dt>
								<dd className='max-h-32 overflow-y-auto rounded-md bg-white px-2 py-1 font-mono text-[11px] [overflow-wrap:anywhere] whitespace-pre-wrap text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300'>
									{formatValue(value)}
								</dd>
							</div>
						))}
					</dl>
				)
			)}

			{mode !== 'view' && (
				<input
					value={note}
					onChange={(event) => setNote(event.target.value)}
					maxLength={2000}
					placeholder={
						mode === 'reject'
							? 'Tell the agent why, or what to do instead (optional)'
							: 'Note for the agent (optional)'
					}
					className='mt-2.5 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[12.5px] font-semibold text-zinc-800 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200'
				/>
			)}

			{namedApprovers && (
				<p className='mt-2 flex items-center gap-1 text-[11px] font-semibold text-zinc-400'>
					<AlertTriangle size={11} /> Only the approvers named for this tool (and admins)
					can decide it.
				</p>
			)}

			<div className='mt-3 flex flex-wrap items-center gap-2'>
				{mode === 'reject' ? (
					<>
						<button
							type='button'
							disabled={busy}
							onClick={reject}
							className='flex min-h-9 items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-[12.5px] font-bold text-white hover:bg-rose-700 disabled:opacity-50'>
							<X size={13} /> Reject
						</button>
						<label className='flex items-center gap-1.5 text-[12px] font-semibold text-zinc-600 dark:text-zinc-300'>
							<input
								type='checkbox'
								checked={stop}
								onChange={(event) => setStop(event.target.checked)}
							/>
							Stop the agent here
						</label>
						<button
							type='button'
							disabled={busy}
							onClick={() => setMode('view')}
							className='ml-auto min-h-9 rounded-lg px-3 text-[12.5px] font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'>
							Back
						</button>
					</>
				) : (
					<>
						<button
							type='button'
							disabled={busy}
							onClick={approve}
							className='flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[12.5px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50'>
							<Check size={13} /> {mode === 'edit' ? 'Run with changes' : 'Approve'}
						</button>
						<button
							type='button'
							disabled={busy}
							onClick={() => setMode('reject')}
							className='flex min-h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-[12.5px] font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-rose-950/40'>
							<X size={13} /> Reject
						</button>
						{mode === 'view' ? (
							<button
								type='button'
								disabled={busy}
								onClick={() => setMode('edit')}
								className='flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-bold text-zinc-500 hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800'>
								<PencilLine size={13} /> Edit
							</button>
						) : (
							<button
								type='button'
								disabled={busy}
								onClick={() => {
									setMode('view');
									setArgsText(JSON.stringify(args, null, 2));
									setArgsError(null);
								}}
								className='min-h-9 rounded-lg px-3 text-[12.5px] font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'>
								Cancel edit
							</button>
						)}
						{rememberable && mode === 'view' && (
							<label className='ml-auto flex items-center gap-1.5 text-[12px] font-semibold text-zinc-600 dark:text-zinc-300'>
								<input
									type='checkbox'
									checked={remember}
									onChange={(event) => setRemember(event.target.checked)}
								/>
								Always allow this tool
							</label>
						)}
					</>
				)}
			</div>
		</div>
	);
};

/**
 * The actions a paused turn is waiting on, as approve / edit / reject cards
 * under the chat. The turn resumes once every one is decided — the last
 * decision streams the agent carrying on, right here.
 */
const AgentApprovalCards = ({
	actions,
	busy,
	canRemember,
	onDecide,
}: {
	actions: TAgentAction[];
	busy: boolean;
	canRemember: boolean;
	onDecide: (decisions: TAgentActionDecision[]) => void;
}) => {
	if (actions.length === 0) return null;

	return (
		<div className='flex w-full justify-start'>
			<div className='w-full max-w-3xl space-y-2.5 pl-12'>
				<div className='flex items-center gap-2'>
					<ShieldCheck size={14} className='text-amber-600 dark:text-amber-400' />
					<span className='text-[12.5px] font-bold text-zinc-700 dark:text-zinc-200'>
						{actions.length === 1
							? 'The agent is waiting for your approval'
							: `The agent is waiting for approval on ${actions.length} actions`}
					</span>
					{actions.length > 1 && (
						<button
							type='button'
							disabled={busy}
							onClick={() =>
								onDecide(
									actions.map((action) => ({
										action_id: action.id,
										decision: 'approve' as const,
									})),
								)
							}
							className='ml-auto min-h-8 rounded-lg px-2.5 text-[12px] font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40'>
							Approve all
						</button>
					)}
				</div>
				{actions.map((action) => (
					<ApprovalCard
						key={action.id}
						action={action}
						busy={busy}
						canRemember={canRemember}
						onDecide={(decision) => onDecide([decision])}
					/>
				))}
			</div>
		</div>
	);
};

export default AgentApprovalCards;
