import { useMemo, useState } from 'react';
import { useNodeCategories } from '@/api/modules/catalog';
import { mapApiCategoriesToGroups } from '../../_helper/apiNodeCatalog.helper';
import type { TNodeDefinition } from '../../_types/node.type';
import { useWorkflowEditor } from '../../_hooks/useWorkflowEditor.hook';
import { useAutoLayout } from '../../_hooks/useAutoLayout.hook';
import { useAiPanelAvailability } from '../../_hooks/useAiPanelAvailability.hook';
import { useRunWorkflow } from '../../_hooks/useRunWorkflow.hook';
import Modal from './Modal.partial';

const CommandPalette = () => {
	const { state, dispatch } = useWorkflowEditor();
	const autoLayout = useAutoLayout();
	const { runWorkflow, stopRun } = useRunWorkflow();
	const { isAiPanelAvailable } = useAiPanelAvailability();
	const [query, setQuery] = useState('');
	const needle = query.trim().toLowerCase();

	const {
		data: apiCategories,
		isLoading: isNodesLoading,
		isError: isNodesError,
	} = useNodeCategories(true);

	const nodeGroups = useMemo(
		() => (apiCategories?.length ? mapApiCategoriesToGroups(apiCategories) : []),
		[apiCategories],
	);

	const filteredNodeGroups = useMemo(() => {
		if (!needle) return nodeGroups;
		return nodeGroups
			.map((group) => ({
				...group,
				nodes: group.nodes.filter((node) =>
					[node.label, node.description, node.category, node.key].some((value) =>
						value?.toLowerCase().includes(needle),
					),
				),
			}))
			.filter((group) => group.nodes.length);
	}, [nodeGroups, needle]);

	const addNode = (node: TNodeDefinition) => {
		dispatch({
			type: 'ADD_NODE',
			defKey: node.key,
			definition: node,
			position: {
				x: 160 + state.nodes.length * 24,
				y: 140 + state.nodes.length * 18,
			},
		});
		dispatch({ type: 'SET_COMMAND_PALETTE', open: false });
	};

	const commands = [
		{
			label: state.run.status === 'running' ? 'Stop workflow' : 'Run workflow',
			description: 'Execute the current canvas',
			shortcut: '⌘↵',
			action: state.run.status === 'running' ? stopRun : runWorkflow,
			category: 'Workflow',
		},
		{
			label: 'Auto-layout canvas',
			description: 'Reposition nodes into a readable flow',
			shortcut: 'L',
			action: autoLayout,
			category: 'Workflow',
		},
		...(isAiPanelAvailable
			? [
					{
						label: 'Open AI builder',
						description: 'Generate or improve a workflow',
						shortcut: '⌘J',
						action: () => dispatch({ type: 'TOGGLE_AI_PANEL' }),
						category: 'Panels',
					},
				]
			: []),
		{
			label: 'Quick add node',
			description: 'Search and add a node to the canvas',
			shortcut: '⌘K',
			action: () => dispatch({ type: 'SET_QUICK_ADD', open: true }),
			category: 'Workflow',
		},
		{
			label: 'Toggle left panel',
			description: 'Show/hide node library',
			shortcut: '⌘⇧L',
			action: () => dispatch({ type: 'TOGGLE_LEFT_PANEL' }),
			category: 'Panels',
		},
		{
			label: 'Open import / export',
			description: 'Load or copy workflow JSON or YAML',
			shortcut: '⌘⇧E',
			action: () => dispatch({ type: 'SET_IMPORT_EXPORT', open: true }),
			category: 'File',
		},
		{
			label: 'Toggle run console',
			description: 'Show execution logs and node output',
			shortcut: '⌥R',
			action: () => dispatch({ type: 'TOGGLE_RUN_PANEL' }),
			category: 'Workflow',
		},
		{
			label: 'Canvas search',
			description: 'Find and zoom to any node on the canvas',
			shortcut: '⌘F',
			action: () => dispatch({ type: 'SET_CANVAS_SEARCH', open: true }),
			category: 'Workflow',
		},
		{
			label: 'Template library',
			description: 'Start from a pre-built workflow template',
			shortcut: '⌥T',
			action: () => dispatch({ type: 'SET_TEMPLATE_LIBRARY', open: true }),
			category: 'File',
		},
		{
			label: 'Node documentation',
			description: 'View selected node fields, ports & usage tips',
			shortcut: '⌘I',
			action: () => dispatch({ type: 'SET_NODE_DOC', open: true }),
			category: 'Workflow',
		},
		{
			label: 'Version diff viewer',
			description: 'Compare current workflow to a history snapshot',
			shortcut: '⌘⇧V',
			action: () => dispatch({ type: 'SET_DIFF_VIEWER', open: true }),
			category: 'File',
			disabled: !state.history.past.length,
		},
		{
			label: 'Keyboard shortcuts',
			description: 'View all keyboard shortcuts',
			shortcut: '?',
			action: () => dispatch({ type: 'SET_SHORTCUTS_OPEN', open: true }),
			category: 'Help',
		},
		{
			label: 'Undo',
			description: 'Revert last action',
			shortcut: '⌘Z',
			action: () => dispatch({ type: 'UNDO' }),
			category: 'Edit',
			disabled: !state.history.past.length,
		},
		{
			label: 'Redo',
			description: 'Re-apply undone action',
			shortcut: '⌘⇧Z',
			action: () => dispatch({ type: 'REDO' }),
			category: 'Edit',
			disabled: !state.history.future.length,
		},
		{
			label: 'Duplicate selected node',
			description: 'Clone the selected node',
			shortcut: '⌘D',
			action: () => dispatch({ type: 'DUPLICATE_SELECTED' }),
			category: 'Edit',
			disabled: !state.ui.selectedNodeId,
		},
		{
			label: 'Delete selected node',
			description: 'Remove the selected node',
			shortcut: '⌫',
			action: () => dispatch({ type: 'DELETE_SELECTED' }),
			category: 'Edit',
			disabled: !state.ui.selectedNodeId,
		},
	].filter((command) =>
		needle
			? [command.label, command.description, command.category].some(
					(value) => typeof value === 'string' && value.toLowerCase().includes(needle),
				)
			: true,
	);

	// Group commands by category
	const commandsByCategory = useMemo(() => {
		const groups: Record<string, typeof commands> = {};
		commands.forEach((cmd) => {
			if (!groups[cmd.category]) groups[cmd.category] = [];
			groups[cmd.category].push(cmd);
		});
		return groups;
	}, [commands]);

	if (!state.ui.commandPaletteOpen) return null;

	return (
		<Modal
			title='Command Palette'
			onClose={() => dispatch({ type: 'SET_COMMAND_PALETTE', open: false })}>
			<div className='grid gap-2'>
				<input
					aria-label='Search commands and nodes'
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder='Search commands and nodes'
					className='mb-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-500/50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-emerald-300/40'
				/>
				<div className='space-y-3'>
					{Object.entries(commandsByCategory).map(([category, cmds]) => (
						<div key={category}>
							<div className='px-1 text-xs font-semibold tracking-[0.16em] text-zinc-500 uppercase dark:text-zinc-600'>
								{category}
							</div>
							<div className='mt-1 space-y-1'>
								{cmds.map((command) => (
									<button
										key={command.label}
										type='button'
										onClick={() => {
											command.action();
											dispatch({
												type: 'SET_COMMAND_PALETTE',
												open: false,
											});
										}}
										disabled={command.disabled}
										className='flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/[0.06]'>
										<div>
											<span className='block text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
												{command.label}
											</span>
											<span className='block text-xs text-zinc-500'>
												{command.description}
											</span>
										</div>
										{command.shortcut && (
											<span className='font-mono text-xs text-zinc-400 dark:text-zinc-600'>
												{command.shortcut}
											</span>
										)}
									</button>
								))}
							</div>
						</div>
					))}
				</div>
				<div className='pt-3 text-xs font-semibold tracking-[0.16em] text-zinc-500 uppercase dark:text-zinc-600'>
					Add node
				</div>
				<div className='max-h-72 overflow-y-auto'>
					{isNodesLoading && (
						<div className='space-y-2 py-1'>
							<div className='h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-white/[0.05]' />
							<div className='h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-white/[0.05]' />
							<div className='h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-white/[0.05]' />
						</div>
					)}
					{isNodesError && (
						<div className='px-3 py-4 text-xs text-red-500'>
							Couldn&apos;t load nodes. Try again in a moment.
						</div>
					)}
					{!isNodesLoading && !isNodesError && !filteredNodeGroups.length && (
						<div className='px-3 py-4 text-xs text-zinc-500'>
							{needle ? 'No nodes match your search' : 'No nodes available'}
						</div>
					)}
					{filteredNodeGroups.map((group) => (
						<div key={group.id} className='pb-2'>
							<div className='px-3 pt-1 pb-0.5 text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase dark:text-zinc-600'>
								{group.label}
							</div>
							{group.nodes.map((node) => (
								<button
									key={node.key}
									type='button'
									onClick={() => addNode(node)}
									className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-white/[0.06]'>
									<span className='flex h-7 w-7 items-center justify-center rounded bg-zinc-100 text-[10px] font-black text-zinc-700 dark:bg-white/[0.07] dark:text-zinc-200'>
										{node.icon}
									</span>
									<span>
										<span className='block text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
											{node.label}
										</span>
										<span className='block text-xs text-zinc-500'>
											{node.description}
										</span>
									</span>
								</button>
							))}
						</div>
					))}
				</div>
			</div>
		</Modal>
	);
};

export default CommandPalette;
