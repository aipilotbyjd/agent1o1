import { useState } from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { useWorkflowEditor } from '../../../_context/WorkflowEditorProvider.context';
import type { TNodeComment } from '../../../_types/node.type';

const NodeCommentsPanel = ({
	nodeId,
	comments = [],
}: {
	nodeId: string;
	comments: TNodeComment[];
}) => {
	const { dispatch } = useWorkflowEditor();
	const [text, setText] = useState('');
	const [open, setOpen] = useState(false);

	const submit = () => {
		if (!text.trim()) return;
		dispatch({ type: 'ADD_NODE_COMMENT', id: nodeId, text: text.trim() });
		setText('');
	};

	return (
		<div className='relative'>
			<button
				type='button'
				title='Node comments'
				onClick={(e) => {
					e.stopPropagation();
					setOpen((prev) => !prev);
				}}
				className='relative flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-white/[0.08] dark:hover:text-zinc-200'>
				<MessageSquare size={13} />
				{comments.length > 0 && (
					<span className='absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary-400 text-[8px] font-bold text-primary-950'>
						{comments.length}
					</span>
				)}
			</button>

			{open && (
				<div
					className='absolute top-8 right-0 z-50 w-72 rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900'
					onClick={(e) => e.stopPropagation()}>
					<div className='border-b border-zinc-100 px-3 py-2 dark:border-zinc-800'>
						<span className='text-xs font-bold text-zinc-600 dark:text-zinc-300'>
							Comments ({comments.length})
						</span>
					</div>

					{/* Comments list */}
					<div className='max-h-48 overflow-y-auto'>
						{comments.length === 0 ? (
							<div className='px-3 py-4 text-center text-xs text-zinc-400'>
								No comments yet
							</div>
						) : (
							<div className='divide-y divide-zinc-100 dark:divide-zinc-800'>
								{comments.map((comment) => (
									<div key={comment.id} className='flex items-start gap-2 p-3'>
										<div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'>
											{comment.author?.slice(0, 1).toUpperCase() ?? 'U'}
										</div>
										<div className='min-w-0 flex-1'>
											<p className='text-xs leading-relaxed text-zinc-700 dark:text-zinc-300'>
												{comment.text}
											</p>
											<div className='mt-0.5 text-[10px] text-zinc-400'>
												{new Date(comment.at).toLocaleTimeString()}
											</div>
										</div>
										<button
											type='button'
											onClick={() =>
												dispatch({
													type: 'REMOVE_NODE_COMMENT',
													id: nodeId,
													commentId: comment.id,
												})
											}
											className='flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-300 hover:text-rose-500 dark:text-zinc-600 dark:hover:text-rose-400'>
											<Trash2 size={11} />
										</button>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Add comment input */}
					<div className='border-t border-zinc-100 p-2 dark:border-zinc-800'>
						<div className='flex items-center gap-2'>
							<input
								type='text'
								value={text}
								onChange={(e) => setText(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') submit();
									if (e.key === 'Escape') setOpen(false);
								}}
								placeholder='Add a comment…'
								className='flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-primary-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
							/>
							<button
								type='button'
								onClick={submit}
								disabled={!text.trim()}
								className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary-400 text-primary-950 hover:bg-primary-500 disabled:opacity-40'>
								<Send size={11} />
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default NodeCommentsPanel;
