import { useEffect, useMemo, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Box, Search, Sparkles } from 'lucide-react';
import { useNodeCategories } from '@/api/modules/node-types';
import { mapApiCategoriesToGroups } from '../../_helper/apiNodeCatalog.helper';
import { NODE_GROUPS } from '../../_helper/nodeGroups.constants';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import type { TNodeDefinition } from '../../_types/node.type';
import Modal from './Modal.partial';

const QuickAddNodeDialog = () => {
	const { state, dispatch } = useWorkflowEditor();
	const reactFlow = useReactFlow();
	const [query, setQuery] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);
	const {
		data: apiCategories,
		isLoading: apiIsLoading,
		isError: apiIsError,
	} = useNodeCategories({
		include_nodes: true,
	});

	const apiGroups = useMemo(
		() => (apiCategories?.length ? mapApiCategoriesToGroups(apiCategories) : []),
		[apiCategories],
	);

	const isApiUnavailable = apiIsError || (!apiIsLoading && !apiCategories?.length);
	const groups = isApiUnavailable
		? NODE_GROUPS.map((group) => ({
				id: group.category,
				label: group.meta.label,
				color: group.meta.color,
				order: group.meta.order,
				nodes: group.nodes,
			}))
		: apiGroups;

	const needle = query.trim().toLowerCase();
	const filteredGroups = useMemo(() => {
		if (!needle) return groups;

		return groups
			.map((group) => ({
				...group,
				nodes: group.nodes.filter((node) =>
					[node.label, node.description, node.category, node.key].some((value) =>
						value?.toLowerCase().includes(needle),
					),
				),
			}))
			.filter((group) => group.nodes.length);
	}, [groups, needle]);

	const firstNode = filteredGroups[0]?.nodes[0];

	const addNode = (node: TNodeDefinition) => {
		const position = reactFlow.screenToFlowPosition({
			x: window.innerWidth / 2,
			y: window.innerHeight / 2,
		});

		dispatch({
			type: 'ADD_NODE',
			defKey: node.key,
			definition: node,
			position,
		});
		dispatch({ type: 'SET_QUICK_ADD', open: false });
		setQuery('');
	};

	useEffect(() => {
		if (!state.ui.quickAddOpen) return;
		const timeout = window.setTimeout(() => inputRef.current?.focus(), 50);
		return () => window.clearTimeout(timeout);
	}, [state.ui.quickAddOpen]);

	if (!state.ui.quickAddOpen) return null;

	return (
		<Modal
			title='Quick Add Node'
			onClose={() => dispatch({ type: 'SET_QUICK_ADD', open: false })}>
			<div className='grid gap-4'>
				<div className='flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-zinc-400 focus-within:border-emerald-300/40 focus-within:text-zinc-200'>
					<Search size={16} />
					<input
						ref={inputRef}
						aria-label='Search node types'
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter' && firstNode) {
								event.preventDefault();
								addNode(firstNode);
							}
						}}
						placeholder='Search Gmail, Slack, HTTP, AI...'
						className='h-full min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600'
					/>
					<span className='hidden rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 sm:block'>
						Enter
					</span>
				</div>
				{isApiUnavailable && !apiIsLoading && (
					<div className='flex items-center gap-2 rounded-lg border border-amber-300/10 bg-amber-300/5 px-3 py-2 text-xs font-medium text-amber-100'>
						<Sparkles size={13} />
						Local premium node catalog
					</div>
				)}
				<div className='max-h-[56vh] overflow-y-auto pr-1'>
					{apiIsLoading && (
						<div className='space-y-2'>
							<div className='h-10 animate-pulse rounded-lg bg-white/[0.05]' />
							<div className='h-10 animate-pulse rounded-lg bg-white/[0.05]' />
							<div className='h-10 animate-pulse rounded-lg bg-white/[0.05]' />
						</div>
					)}
					{!apiIsLoading && !filteredGroups.length && (
						<div className='flex flex-col items-center justify-center px-4 py-12 text-center'>
							<Box className='mb-3 text-zinc-600' size={24} />
							<div className='text-sm font-semibold text-zinc-300'>
								No nodes found
							</div>
							<div className='mt-1 text-xs text-zinc-600'>
								Try a different service, action, or category.
							</div>
						</div>
					)}
					{filteredGroups.map((group) => (
						<div key={group.id} className='pb-4'>
							<div className='mb-1 px-1 text-xs font-semibold tracking-[0.16em] text-zinc-600 uppercase'>
								{group.label}
							</div>
							<div className='grid gap-1'>
								{group.nodes.map((node) => (
									<button
										key={node.key}
										type='button'
										onClick={() => addNode(node)}
										className='flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white/[0.06] focus:bg-white/[0.06] focus:outline-none'>
										<span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-[10px] font-black text-zinc-200'>
											{node.icon}
										</span>
										<span className='min-w-0 flex-1'>
											<span className='block truncate text-sm font-semibold text-zinc-100'>
												{node.label}
											</span>
											<span className='block truncate text-xs text-zinc-500'>
												{node.description}
											</span>
										</span>
									</button>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</Modal>
	);
};

export default QuickAddNodeDialog;
