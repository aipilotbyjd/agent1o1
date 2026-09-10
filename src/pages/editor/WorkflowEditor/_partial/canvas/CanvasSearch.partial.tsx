import { useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';

const CanvasSearch = () => {
	const { state, dispatch } = useWorkflowEditor();
	const reactFlow = useReactFlow();
	const inputRef = useRef<HTMLInputElement>(null);
	const query = state.ui.canvasSearchQuery;

	const matches = state.nodes.filter((node) => {
		if (!query.trim()) return false;
		const q = query.toLowerCase();
		return (
			node.data.label.toLowerCase().includes(q) ||
			node.data.defKey.toLowerCase().includes(q) ||
			node.data.definition?.description?.toLowerCase().includes(q)
		);
	});

	useEffect(() => {
		if (state.ui.canvasSearchOpen) {
			setTimeout(() => inputRef.current?.focus(), 80);
		}
	}, [state.ui.canvasSearchOpen]);

	const zoomToNode = (nodeId: string) => {
		reactFlow.fitView({ nodes: [{ id: nodeId }], padding: 0.5, duration: 400 });
		dispatch({ type: 'SELECT_NODE', id: nodeId });
	};

	if (!state.ui.canvasSearchOpen) return null;

	return (
		<div className='absolute top-4 left-1/2 z-30 w-[480px] -translate-x-1/2'>
			<motion.div
				initial={{ opacity: 0, y: -8, scale: 0.97 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: -8, scale: 0.97 }}
				transition={{ duration: 0.14 }}
				className='overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-200/60 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/50'>
				<div className='flex items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-white/[0.06]'>
					<Search size={15} className='shrink-0 text-zinc-400' />
					<input
						ref={inputRef}
						type='text'
						value={query}
						onChange={(e) =>
							dispatch({ type: 'SET_CANVAS_SEARCH', query: e.target.value })
						}
						onKeyDown={(e) => {
							if (e.key === 'Escape') {
								dispatch({ type: 'SET_CANVAS_SEARCH', open: false, query: '' });
							}
							if (e.key === 'Enter' && matches.length > 0) {
								zoomToNode(matches[0].id);
							}
						}}
						placeholder='Search nodes by label, type, or description…'
						className='flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100'
					/>
					<button
						type='button'
						onClick={() =>
							dispatch({ type: 'SET_CANVAS_SEARCH', open: false, query: '' })
						}
						className='flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.07] dark:hover:text-white'>
						<X size={13} />
					</button>
				</div>

				<AnimatePresence>
					{query.trim().length > 0 && (
						<motion.div
							initial={{ height: 0 }}
							animate={{ height: 'auto' }}
							exit={{ height: 0 }}
							className='overflow-hidden'>
							{matches.length === 0 ? (
								<div className='px-4 py-3 text-sm text-zinc-400'>
									No nodes match &quot;{query}&quot;
								</div>
							) : (
								<div className='max-h-64 overflow-y-auto py-1'>
									{matches.map((node) => (
										<button
											key={node.id}
											type='button'
											onClick={() => zoomToNode(node.id)}
											className='flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-zinc-50 dark:hover:bg-white/[0.04]'>
											<span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-xs font-black text-primary-700 dark:bg-primary-400/15 dark:text-primary-300'>
												{node.data.label.slice(0, 1).toUpperCase()}
											</span>
											<div className='min-w-0 flex-1'>
												<div className='truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100'>
													{node.data.label}
												</div>
												<div className='truncate text-xs text-zinc-400'>
													{node.data.defKey}
												</div>
											</div>
											{node.data.breakpoint && (
												<span className='shrink-0 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white'>
													BP
												</span>
											)}
										</button>
									))}
								</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>

				{!query.trim() && (
					<div className='px-3 py-2 text-xs text-zinc-400'>
						{state.nodes.length} nodes on canvas · Press Esc to close
					</div>
				)}
			</motion.div>
		</div>
	);
};

export default CanvasSearch;
