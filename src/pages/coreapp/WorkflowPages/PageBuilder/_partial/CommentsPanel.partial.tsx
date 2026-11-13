import { useState } from 'react';
import type { FormEvent } from 'react';
import {
	Check,
	CornerDownRight,
	MessageSquare,
	Pencil,
	RotateCcw,
	Send,
	Trash2,
} from 'lucide-react';
import {
	useWorkflowPageCommentActions,
	useWorkflowPageComments,
} from '@/api/modules/workflow-pages';
import { useConfirm } from '@/context/confirm';
import relativeTime from '@/utils/relativeTime.util';
import type { TPageComment } from '@/types/workflow-page.type';
import { BLOCK_CATALOG, blockSummary } from '../_helper/blockCatalog.helper';
import { findBlock } from '../_helper/blockTree.helper';
import { selectBlocks, usePageBuilderStore } from '../_store/pageBuilder.store';
import { usePageBuilder } from '../_context/PageBuilder.context';
import { panelInputClass } from './controls.partial';

const Avatar = ({ name }: { name: string }) => (
	<span className='bg-primary-100 text-primary-800 dark:bg-primary-400/15 dark:text-primary-300 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold'>
		{name.charAt(0).toUpperCase()}
	</span>
);

/** Posts on ⌘/Ctrl+Enter; a plain Enter adds a line. */
const Composer = ({
	placeholder,
	onSend,
	busy,
	autoFocus,
	initial = '',
	onCancel,
}: {
	placeholder: string;
	onSend: (body: string) => Promise<unknown>;
	busy: boolean;
	autoFocus?: boolean;
	initial?: string;
	onCancel?: () => void;
}) => {
	const [body, setBody] = useState(initial);
	const submit = (event?: FormEvent) => {
		event?.preventDefault();
		const trimmed = body.trim();
		if (!trimmed || busy) return;
		void onSend(trimmed).then(() => setBody(''));
	};
	return (
		<form onSubmit={submit} className='space-y-1.5'>
			<textarea
				value={body}
				autoFocus={autoFocus}
				rows={2}
				maxLength={5000}
				placeholder={placeholder}
				onChange={(e) => setBody(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
					if (e.key === 'Escape') onCancel?.();
				}}
				className={`${panelInputClass} resize-none`}
			/>
			<div className='flex items-center justify-end gap-1.5'>
				{onCancel && (
					<button
						type='button'
						onClick={onCancel}
						className='h-7 rounded-md px-2 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'>
						Cancel
					</button>
				)}
				<button
					type='submit'
					disabled={!body.trim() || busy}
					title='Send (⌘↵)'
					className='flex h-7 items-center gap-1 rounded-md bg-zinc-900 px-2.5 text-[11px] font-bold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900'>
					<Send size={11} /> Send
				</button>
			</div>
		</form>
	);
};

const CommentBody = ({ comment, onEdit }: { comment: TPageComment; onEdit?: () => void }) => (
	<div className='flex gap-2'>
		<Avatar name={comment.author?.name ?? '?'} />
		<div className='min-w-0 flex-1'>
			<p className='flex items-baseline gap-1.5 text-[11px]'>
				<span className='font-bold text-zinc-900 dark:text-zinc-100'>
					{comment.author?.name ?? 'Former member'}
				</span>
				<span
					className='text-zinc-400'
					title={new Date(comment.created_at).toLocaleString()}>
					{relativeTime(comment.created_at)}
					{comment.updated_at !== comment.created_at && ' · edited'}
				</span>
				{onEdit && (
					<button
						type='button'
						onClick={onEdit}
						aria-label='Edit'
						className='ml-auto text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'>
						<Pencil size={11} />
					</button>
				)}
			</p>
			<p className='mt-0.5 text-xs leading-relaxed break-words whitespace-pre-wrap text-zinc-700 dark:text-zinc-300'>
				{comment.body}
			</p>
		</div>
	</div>
);

const Thread = ({ thread }: { thread: TPageComment }) => {
	const { ws, page, fields } = usePageBuilder();
	const { confirm } = useConfirm();
	const actions = useWorkflowPageCommentActions(ws, page.id);
	const blocks = usePageBuilderStore(selectBlocks);
	const select = usePageBuilderStore((store) => store.select);
	const selectedId = usePageBuilderStore((store) => store.selectedId);
	const [replying, setReplying] = useState(false);
	const [editing, setEditing] = useState<string | null>(null);
	const block = thread.block_id ? findBlock(blocks, thread.block_id) : undefined;
	const resolved = !!thread.resolved_at;

	const remove = async (comment: TPageComment) => {
		const ok = await confirm({
			title: comment.id === thread.id ? 'Delete this thread?' : 'Delete this reply?',
			message:
				comment.id === thread.id
					? 'The comment and all its replies are removed.'
					: 'The reply is removed.',
			confirmText: 'Delete',
		});
		if (ok) actions.remove.mutate(comment.id);
	};

	const renderComment = (comment: TPageComment) =>
		editing === comment.id ? (
			<Composer
				key={comment.id}
				placeholder='Edit your comment'
				initial={comment.body}
				autoFocus
				busy={actions.update.isPending}
				onCancel={() => setEditing(null)}
				onSend={(body) =>
					actions.update
						.mutateAsync({ commentId: comment.id, body })
						.then(() => setEditing(null))
				}
			/>
		) : (
			<div key={comment.id} className='group/comment relative'>
				<CommentBody
					comment={comment}
					onEdit={comment.is_mine ? () => setEditing(comment.id) : undefined}
				/>
				{comment.is_mine && comment.id !== thread.id && (
					<button
						type='button'
						aria-label='Delete reply'
						onClick={() => void remove(comment)}
						className='absolute top-0 right-5 text-zinc-300 opacity-0 transition group-hover/comment:opacity-100 hover:text-rose-500'>
						<Trash2 size={11} />
					</button>
				)}
			</div>
		);

	return (
		<li
			className={`space-y-2.5 rounded-xl border p-3 transition ${
				thread.block_id && thread.block_id === selectedId
					? 'border-primary-400 bg-primary-50/40 dark:bg-primary-400/5'
					: 'border-zinc-200 dark:border-white/10'
			} ${resolved ? 'opacity-70' : ''}`}>
			<div className='flex items-center gap-1.5'>
				{thread.block_id ? (
					<button
						type='button'
						onClick={() => block && select(block.id, { keepTab: true })}
						disabled={!block}
						className='min-w-0 truncate rounded-md bg-zinc-100 px-1.5 py-0.5 text-left text-[10px] font-semibold text-zinc-600 hover:bg-zinc-200 disabled:cursor-default disabled:line-through dark:bg-white/[0.06] dark:text-zinc-300'>
						{block
							? `${BLOCK_CATALOG[block.type].label} · ${blockSummary(block, fields)}`
							: 'Removed block'}
					</button>
				) : (
					<span className='rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300'>
						The whole page
					</span>
				)}
				<span className='ml-auto flex shrink-0 items-center gap-0.5'>
					<button
						type='button'
						onClick={() =>
							actions.update.mutate({ commentId: thread.id, resolved: !resolved })
						}
						title={resolved ? 'Reopen' : 'Resolve'}
						aria-label={resolved ? 'Reopen thread' : 'Resolve thread'}
						className={`flex size-6 items-center justify-center rounded-md transition ${
							resolved
								? 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/[0.06]'
								: 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
						}`}>
						{resolved ? <RotateCcw size={12} /> : <Check size={13} />}
					</button>
					{thread.is_mine && (
						<button
							type='button'
							onClick={() => void remove(thread)}
							aria-label='Delete thread'
							className='flex size-6 items-center justify-center rounded-md text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10'>
							<Trash2 size={12} />
						</button>
					)}
				</span>
			</div>
			{renderComment(thread)}
			{(thread.replies ?? []).length > 0 && (
				<div className='space-y-2.5 border-l-2 border-zinc-100 pl-3 dark:border-white/[0.06]'>
					{(thread.replies ?? []).map(renderComment)}
				</div>
			)}
			{resolved ? (
				<p className='text-[10px] text-zinc-400'>
					Resolved{thread.resolved_by ? ` by ${thread.resolved_by.name}` : ''}{' '}
					{thread.resolved_at && relativeTime(thread.resolved_at)}
				</p>
			) : replying ? (
				<Composer
					placeholder='Reply…'
					autoFocus
					busy={actions.add.isPending}
					onCancel={() => setReplying(false)}
					onSend={(body) =>
						actions.add
							.mutateAsync({ body, parent_id: thread.id })
							.then(() => setReplying(false))
					}
				/>
			) : (
				<button
					type='button'
					onClick={() => setReplying(true)}
					className='flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'>
					<CornerDownRight size={11} /> Reply
				</button>
			)}
		</li>
	);
};

/**
 * The page's comment threads: about the selected block or the whole page,
 * with replies, resolved and reopened by the team. Updates as others post.
 */
const CommentsPanel = () => {
	const { ws, page, fields } = usePageBuilder();
	const { data: comments, isLoading } = useWorkflowPageComments(ws, page.id);
	const actions = useWorkflowPageCommentActions(ws, page.id);
	const blocks = usePageBuilderStore(selectBlocks);
	const selectedId = usePageBuilderStore((store) => store.selectedId);
	const [show, setShow] = useState<'open' | 'resolved'>('open');
	const selected = selectedId ? findBlock(blocks, selectedId) : undefined;

	const threads = (comments ?? [])
		.filter((thread) => (show === 'open' ? !thread.resolved_at : !!thread.resolved_at))
		// Threads about the selected block first.
		.sort((a, b) => Number(b.block_id === selectedId) - Number(a.block_id === selectedId));
	const openCount = (comments ?? []).filter((thread) => !thread.resolved_at).length;

	return (
		<div className='flex h-full flex-col'>
			<div className='flex items-center gap-2 border-b border-zinc-100 px-4 py-3 dark:border-white/[0.06]'>
				<p className='text-xs font-bold text-zinc-900 dark:text-zinc-100'>Comments</p>
				<div
					role='radiogroup'
					aria-label='Show'
					className='ml-auto flex rounded-lg bg-zinc-100 p-0.5 dark:bg-white/[0.06]'>
					{(['open', 'resolved'] as const).map((value) => (
						<button
							key={value}
							type='button'
							role='radio'
							aria-checked={show === value}
							onClick={() => setShow(value)}
							className={`h-6 rounded-md px-2 text-[11px] font-semibold capitalize transition ${
								show === value
									? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white'
									: 'text-zinc-500'
							}`}>
							{value === 'open'
								? `Open${openCount ? ` · ${openCount}` : ''}`
								: 'Resolved'}
						</button>
					))}
				</div>
			</div>

			<div className='min-h-0 flex-1 overflow-y-auto p-3'>
				{isLoading ? (
					<p className='p-2 text-[11px] text-zinc-400'>Loading comments…</p>
				) : threads.length === 0 ? (
					<div className='flex flex-col items-center gap-2 px-4 py-10 text-center'>
						<MessageSquare size={22} className='text-zinc-300 dark:text-zinc-600' />
						<p className='text-xs font-semibold text-zinc-600 dark:text-zinc-300'>
							{show === 'open' ? 'No open comments' : 'Nothing resolved yet'}
						</p>
						{show === 'open' && (
							<p className='text-[11px] text-zinc-400'>
								Select a block to comment on it, or comment on the whole page below.
							</p>
						)}
					</div>
				) : (
					<ul className='space-y-2'>
						{threads.map((thread) => (
							<Thread key={thread.id} thread={thread} />
						))}
					</ul>
				)}
			</div>

			<div className='space-y-1.5 border-t border-zinc-100 p-3 dark:border-white/[0.06]'>
				<p className='truncate text-[10px] font-semibold text-zinc-500'>
					{selected
						? `On ${BLOCK_CATALOG[selected.type].label}: ${blockSummary(selected, fields)}`
						: 'On the whole page'}
				</p>
				<Composer
					placeholder={selected ? 'Comment on this block…' : 'Comment on the page…'}
					busy={actions.add.isPending}
					onSend={(body) =>
						actions.add
							.mutateAsync({ body, block_id: selected?.id ?? null })
							.then(() => setShow('open'))
					}
				/>
			</div>
		</div>
	);
};

export default CommentsPanel;
