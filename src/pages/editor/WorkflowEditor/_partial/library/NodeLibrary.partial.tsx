import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Search, Sparkles, X } from 'lucide-react';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import { useWorkflowRouteParams } from '../../_hooks/useWorkflowRouteParams.hook';
import { mapApiCategoriesToGroups } from '../../_helper/apiNodeCatalog.helper';
import type { TNodeCategoryGroup } from '../../_helper/apiNodeCatalog.helper';
import type { TNodeDefinition } from '../../_types/node.type';
import { useNodeCategories } from '@/api/modules/node-types';
import NodeLibrarySearch from './NodeLibrarySearch.partial';
import CategoryIcon from './CategoryIcon.partial';
import { PanelLoader } from './LibraryItems.partial';
import { tintStyle } from './library.util';
import HomePanel from './HomePanel.partial';
import CategoryPanel from './CategoryPanel.partial';
import CustomNodesPanel from './CustomNodesPanel.partial';
import SearchPanel from './SearchPanel.partial';

const SEARCH_DEBOUNCE_MS = 250;

const NodeLibrary = () => {
	const { state, dispatch } = useWorkflowEditor();
	const { workspaceId } = useWorkflowRouteParams();

	const [query, setQuery] = useState('');
	const [debouncedQuery, setDebouncedQuery] = useState('');
	const [selected, setSelected] = useState<TNodeCategoryGroup | null>(null);
	const prevIntentRef = useRef<typeof state.ui.leftPanelIntent | null>(null);

	const { data: categories } = useNodeCategories();

	useEffect(() => {
		if (!categories) return;
		const intent = state.ui.leftPanelIntent;
		if (prevIntentRef.current === intent) return;
		prevIntentRef.current = intent;

		if (intent === 'trigger') {
			const groups = mapApiCategoriesToGroups(categories);
			const triggersGroup = groups.find((g) => g.slug === 'triggers-events');
			setSelected(triggersGroup ?? null);
		} else {
			setSelected(null);
		}
	}, [categories, state.ui.leftPanelIntent]);

	useEffect(() => {
		const id = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(id);
	}, [query]);

	const addNode = (node: TNodeDefinition) => {
		dispatch({
			type: 'ADD_NODE',
			defKey: node.key,
			definition: node,
			position: { x: 120, y: 120 },
		});
		setQuery('');
	};

	if (!state.ui.leftPanelOpen) return null;

	const trimmedQuery = query.trim();
	const isSearching = trimmedQuery.length > 0;
	const showCategoryHeader = !isSearching && selected;

	const body = isSearching ? (
		debouncedQuery === trimmedQuery ? (
			<SearchPanel query={debouncedQuery} workspaceId={workspaceId} onAdd={addNode} />
		) : (
			<PanelLoader />
		)
	) : selected ? (
		selected.slug === 'custom' ? (
			<CustomNodesPanel workspaceId={workspaceId} onAdd={addNode} />
		) : (
			<CategoryPanel categoryId={selected.id} workspaceId={workspaceId} onAdd={addNode} />
		)
	) : (
		<HomePanel workspaceId={workspaceId} onSelectCategory={setSelected} onAdd={addNode} />
	);

	return (
		<aside className='relative flex h-full w-full shrink-0 flex-col overflow-hidden border-r border-zinc-200 bg-white text-zinc-950 shadow-[8px_0_28px_rgba(24,24,27,0.03)] dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100'>
			{showCategoryHeader ? (
				<div className='flex items-center justify-between px-5 pt-5 pb-2.5'>
					<div className='flex min-w-0 items-center gap-2.5'>
						<button
							type='button'
							onClick={() => setSelected(null)}
							className='flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 dark:hover:text-primary-300'>
							<ArrowLeft size={16} />
						</button>
						<span
							className='flex h-8 w-8 shrink-0 items-center justify-center rounded-xl'
							style={tintStyle(selected.colorHex)}>
							<CategoryIcon slug={selected.slug} label={selected.label} size={17} />
						</span>
						<span className='flex min-w-0 flex-col'>
							<span className='truncate text-sm font-extrabold text-zinc-900 dark:text-white'>
								{selected.label}
							</span>
							<span className='truncate text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
								{selected.nodesCount} node{selected.nodesCount === 1 ? '' : 's'}
							</span>
						</span>
					</div>
					<button
						type='button'
						onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANEL' })}
						aria-label='Close node library'
						className='flex h-6 w-6 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900'
					>
						<X size={13} />
					</button>
				</div>
			) : (
				<div className='flex items-center justify-between px-5 pt-5 pb-2.5'>
					<h2 className='text-[10px] font-black tracking-widest text-zinc-400 uppercase dark:text-zinc-500'>
						Search & Add Nodes
					</h2>
					<button
						type='button'
						onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANEL' })}
						aria-label='Close node library'
						className='flex h-6 w-6 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900'
					>
						<X size={13} />
					</button>
				</div>
			)}

			<div className='px-5 pb-3'>
				<div className='group flex h-11 items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 text-zinc-400 transition focus-within:border-primary-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-100 dark:border-white/10 dark:bg-white/[0.02] dark:focus-within:border-primary-500/40 dark:focus-within:bg-transparent dark:focus-within:ring-primary-500/10'>
					<Search size={16} className='text-zinc-400 transition group-focus-within:text-primary-500 dark:text-zinc-500' />
					<NodeLibrarySearch value={query} onChange={setQuery} />
					{query && (
						<button
							type='button'
							onClick={() => setQuery('')}
							className='cursor-pointer text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'>
							<X size={14} />
						</button>
					)}
				</div>
			</div>

			<div className='min-h-0 flex-1 overflow-y-auto'>{body}</div>

			<div className='flex justify-center border-t border-zinc-200 px-5 pt-3 pb-5 dark:border-white/[0.05]'>
				<button
					type='button'
					onClick={() => dispatch({ type: 'TOGGLE_AI_PANEL' })}
					className='flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50/60 px-4 py-1.5 text-xs font-bold text-primary-700 shadow-xs transition hover:border-primary-300 hover:bg-primary-50 dark:border-primary-500/20 dark:bg-primary-400/[0.08] dark:text-primary-300 dark:hover:bg-primary-500/[0.14]'>
					<Sparkles
						size={13}
						className='fill-primary-500/20 text-primary-600 dark:fill-primary-400/20 dark:text-primary-400'
					/>
					<span>+ Ask AI for help</span>
				</button>
			</div>
		</aside>
	);
};

export default NodeLibrary;
