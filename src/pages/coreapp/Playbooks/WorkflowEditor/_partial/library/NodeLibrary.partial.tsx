import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Search, Sparkles, Star, X } from 'lucide-react';
import { useWorkflowEditor } from '../../_hooks/useWorkflowEditor.hook';
import { useWorkflowRouteParams } from '../../_hooks/useWorkflowRouteParams.hook';
import { mapApiCategoriesToGroups } from '../../_helper/apiNodeCatalog.helper';
import type { TNodeCategoryGroup } from '../../_helper/apiNodeCatalog.helper';
import type { TNodeDefinition } from '../../_types/node.type';
import { useNodeCategories } from '@/api/modules/catalog';
import NodeLibrarySearch from './NodeLibrarySearch.partial';
import NodeIcon from './NodeIcon.partial';
import { PanelLoader } from './LibraryItems.partial';
import { focusNeighbour, tintStyle } from './library.util';
import type { TFocusDirection } from './library.util';
import HomePanel from './HomePanel.partial';
import CategoryPanel from './CategoryPanel.partial';
import CustomNodesPanel from './CustomNodesPanel.partial';
import SearchPanel from './SearchPanel.partial';
import { useAiPanelAvailability } from '../../_hooks/useAiPanelAvailability.hook';
import { usePinnedApps } from '../../_hooks/usePinnedApps.hook';

const SEARCH_DEBOUNCE_MS = 250;

const ARROW_DIRECTIONS: Record<string, TFocusDirection> = {
	ArrowUp: 'up',
	ArrowDown: 'down',
	ArrowLeft: 'left',
	ArrowRight: 'right',
};
const REMEMBERED_CATEGORY_KEY = 'workflow-editor:library-category';

/** The platform the Apps view was last on, so closing the panel or switching to Triggers and back returns to it. */
const readRememberedCategory = (): string | null => {
	try {
		return sessionStorage.getItem(REMEMBERED_CATEGORY_KEY);
	} catch {
		return null;
	}
};

const writeRememberedCategory = (categoryId: string | null) => {
	try {
		if (categoryId) sessionStorage.setItem(REMEMBERED_CATEGORY_KEY, categoryId);
		else sessionStorage.removeItem(REMEMBERED_CATEGORY_KEY);
	} catch {
		// Private mode: the view just starts from the top next time.
	}
};

const NodeLibrary = () => {
	const { state, dispatch } = useWorkflowEditor();
	const { isAiPanelAvailable } = useAiPanelAvailability();
	const { workspaceId } = useWorkflowRouteParams();

	const [query, setQuery] = useState('');
	const asideRef = useRef<HTMLElement>(null);
	const { isPinned, toggle: togglePin } = usePinnedApps();
	const [debouncedQuery, setDebouncedQuery] = useState('');
	const [selectedId, setSelectedId] = useState<string | null>(readRememberedCategory);
	const [appliedIntent, setAppliedIntent] = useState<typeof state.ui.leftPanelIntent | null>(
		null,
	);

	const { data: categories } = useNodeCategories();
	const groups = useMemo(() => mapApiCategoriesToGroups(categories ?? []), [categories]);
	const selected = useMemo(
		() => groups.find((group) => group.id === selectedId) ?? null,
		[groups, selectedId],
	);

	const intent = state.ui.leftPanelIntent;
	if (categories && appliedIntent !== intent) {
		setAppliedIntent(intent);
		setSelectedId(
			intent === 'trigger'
				? (groups.find((group) => group.slug === 'triggers-events')?.id ?? null)
				: readRememberedCategory(),
		);
	}

	const selectCategory = (group: TNodeCategoryGroup | null) => {
		setSelectedId(group?.id ?? null);
		if (intent === 'home') writeRememberedCategory(group?.id ?? null);
	};

	useEffect(() => {
		const id = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(id);
	}, [query]);

	// Toggling with the panel's own intent closes it; without one the reducer reads
	// 'home' and, from the Triggers view, switches views instead of closing.
	const closePanel = () => dispatch({ type: 'TOGGLE_LEFT_PANEL', intent });

	const addNode = (node: TNodeDefinition) => {
		dispatch({
			type: 'ADD_NODE',
			defKey: node.key,
			definition: node,
			position: { x: 120, y: 120 },
		});
		setQuery('');
		if (window.matchMedia('(max-width: 767px)').matches) {
			closePanel();
		}
	};

	// `/` jumps to the search from anywhere on the page, unless the user is typing somewhere.
	useEffect(() => {
		if (!state.ui.leftPanelOpen) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
			const active = document.activeElement as HTMLElement | null;
			if (active?.matches('input, textarea, select, [contenteditable="true"]')) return;
			event.preventDefault();
			asideRef.current?.querySelector<HTMLElement>('[data-library-search]')?.focus();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [state.ui.leftPanelOpen]);

	if (!state.ui.leftPanelOpen) return null;

	const onPanelKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
		if (event.key === 'Escape') {
			if (query) setQuery('');
			else if (selectedId) selectCategory(null);
			else return;
			event.stopPropagation();
			return;
		}

		const direction = ARROW_DIRECTIONS[event.key];
		const target = event.target as HTMLElement;
		// In a text box the sideways arrows move the caret, so only up and down leave it.
		if (
			!direction ||
			(target.tagName === 'INPUT' && direction !== 'up' && direction !== 'down')
		)
			return;
		if (!asideRef.current) return;
		event.preventDefault();
		focusNeighbour(asideRef.current, target, direction);
	};

	const trimmedQuery = query.trim();
	const isSearching = trimmedQuery.length > 0;
	const showCategoryHeader = !isSearching && selected;

	const body = isSearching ? (
		debouncedQuery === trimmedQuery ? (
			<SearchPanel
				query={debouncedQuery}
				workspaceId={workspaceId}
				onAdd={addNode}
				onSelectApp={(app) => {
					setQuery('');
					selectCategory(app);
				}}
			/>
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
		<HomePanel workspaceId={workspaceId} onSelectCategory={selectCategory} onAdd={addNode} />
	);

	return (
		<aside
			ref={asideRef}
			onKeyDown={onPanelKeyDown}
			className='relative flex h-full w-full shrink-0 flex-col overflow-hidden border-r border-zinc-200 bg-white text-zinc-950 shadow-[8px_0_28px_rgba(24,24,27,0.03)] dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100'>
			{showCategoryHeader ? (
				<div className='flex items-center justify-between px-5 pt-5 pb-2.5'>
					<div className='flex min-w-0 items-center gap-2.5'>
						<button
							aria-label='Back'
							type='button'
							onClick={() => selectCategory(null)}
							className='hover:bg-primary-50 hover:text-primary-900 dark:hover:bg-primary-500/10 dark:hover:text-primary-300 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition'>
							<ArrowLeft size={16} />
						</button>
						<span
							className='flex h-8 w-8 shrink-0 items-center justify-center rounded-xl'
							style={tintStyle(selected.colorHex)}>
							<NodeIcon icon={selected.icon} size={17} />
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
					<div className='flex shrink-0 items-center'>
						{selected.kind === 'app' && (
							<button
								type='button'
								aria-pressed={isPinned(selected.slug)}
								aria-label={
									isPinned(selected.slug)
										? `Unpin ${selected.label}`
										: `Pin ${selected.label}`
								}
								title={
									isPinned(selected.slug)
										? 'Unpin from Your apps'
										: 'Pin to Your apps'
								}
								onClick={() => togglePin(selected.slug)}
								className={`mr-1.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl transition sm:h-6 sm:w-6 sm:rounded-lg ${
									isPinned(selected.slug)
										? 'text-amber-500'
										: 'text-zinc-300 hover:text-amber-500 dark:text-zinc-600'
								}`}>
								<Star
									size={14}
									fill={isPinned(selected.slug) ? 'currentColor' : 'none'}
								/>
							</button>
						)}
						<button
							type='button'
							onClick={closePanel}
							aria-label='Close node library'
							className='flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 sm:h-6 sm:w-6 sm:rounded-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'>
							<X size={13} />
						</button>
					</div>
				</div>
			) : (
				<div className='flex items-center justify-between px-5 pt-5 pb-2.5'>
					<h2 className='text-[10px] font-black tracking-widest text-zinc-400 uppercase dark:text-zinc-500'>
						Search & Add Nodes
					</h2>
					<button
						type='button'
						onClick={closePanel}
						aria-label='Close node library'
						className='flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 sm:h-6 sm:w-6 sm:rounded-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'>
						<X size={13} />
					</button>
				</div>
			)}

			<div className='px-5 pb-3'>
				<div className='group focus-within:border-primary-300 focus-within:ring-primary-100 dark:focus-within:border-primary-500/40 dark:focus-within:ring-primary-500/10 flex h-11 items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 text-zinc-400 transition focus-within:bg-white focus-within:ring-2 dark:border-white/10 dark:bg-white/[0.02] dark:focus-within:bg-transparent'>
					<Search
						size={16}
						className='group-focus-within:text-primary-500 text-zinc-400 transition dark:text-zinc-500'
					/>
					<NodeLibrarySearch value={query} onChange={setQuery} />
					{query && (
						<button
							aria-label='Close'
							type='button'
							onClick={() => setQuery('')}
							className='cursor-pointer text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'>
							<X size={14} />
						</button>
					)}
				</div>
			</div>

			<div className='min-h-0 flex-1 overflow-y-auto'>{body}</div>

			{isAiPanelAvailable && (
				<div className='flex justify-center border-t border-zinc-200 px-5 pt-3 pb-5 dark:border-white/[0.05]'>
					<button
						type='button'
						onClick={() => dispatch({ type: 'TOGGLE_AI_PANEL' })}
						className='border-primary-200 bg-primary-50/60 text-primary-700 hover:border-primary-300 hover:bg-primary-50 dark:border-primary-500/20 dark:bg-primary-400/[0.08] dark:text-primary-300 dark:hover:bg-primary-500/[0.14] flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-4 py-1.5 text-xs font-bold shadow-xs transition'>
						<Sparkles
							size={13}
							className='fill-primary-500/20 text-primary-600 dark:fill-primary-400/20 dark:text-primary-400'
						/>
						<span>+ Ask AI for help</span>
					</button>
				</div>
			)}
		</aside>
	);
};

export default NodeLibrary;
