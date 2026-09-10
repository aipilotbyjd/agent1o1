import { useMemo, useState } from 'react';
import { NODE_CATALOG } from '../../_helper/nodeCatalog.constants';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import { useRunWorkflow } from '../../_hooks/useRunWorkflow.hook';
import Modal from './Modal.partial';

const CommandPalette = () => {
	const { state, dispatch } = useWorkflowEditor();
	const { runWorkflow, stopRun } = useRunWorkflow();
	const [query, setQuery] = useState('');
	const needle = query.trim().toLowerCase();

	const filteredNodes = useMemo(() => {
		if (!needle) return NODE_CATALOG;
		return NODE_CATALOG.filter((node) =>
			[node.label, node.description, node.category, node.key].some((value) =>
				value.toLowerCase().includes(needle),
			),
		);
	}, [needle]);

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
			action: () => dispatch({ type: 'AUTO_LAYOUT' }),
			category: 'Workflow',
		},
		{
			label: 'Open AI builder',
			description: 'Generate or improve a workflow',
			shortcut: '⌘J',
			action: () => dispatch({ type: 'TOGGLE_AI_PANEL' }),
			category: 'Panels',
		},
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
			shortcut: '⌘⇧R',
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
			shortcut: '⌘⇧T',
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
			label: state.ui.stepMode ? 'Exit step-through mode' : 'Enter step-through mode',
			description: 'Pause at each node during execution for debugging',
			shortcut: '⌘⇧D',
			action: () => dispatch({ type: 'SET_STEP_MODE', enabled: !state.ui.stepMode }),
			category: 'Debug',
		},
		{
			label: 'Toggle breakpoint on selected node',
			description: 'Pause execution at this node in step-through mode',
			shortcut: 'B',
			action: () => {
				if (state.ui.selectedNodeId) {
					dispatch({ type: 'TOGGLE_NODE_BREAKPOINT', id: state.ui.selectedNodeId });
				}
			},
			category: 'Debug',
			disabled: !state.ui.selectedNodeId,
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
					className='mb-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-emerald-300/40'
				/>
				{query ? (
					// Search results
					<div className='space-y-3'>
						{Object.entries(commandsByCategory).map(([category, cmds]) => (
							<div key={category}>
								<div className='px-1 text-xs font-semibold tracking-[0.16em] text-zinc-600 uppercase'>
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
											className='flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50'>
											<div>
												<span className='block text-sm font-semibold text-zinc-100'>
													{command.label}
												</span>
												<span className='block text-xs text-zinc-500'>
													{command.description}
												</span>
											</div>
											{command.shortcut && (
												<span className='font-mono text-xs text-zinc-600'>
													{command.shortcut}
												</span>
											)}
										</button>
									))}
								</div>
							</div>
						))}
					</div>
				) : (
					// Default view with categories
					<div className='space-y-3'>
						{Object.entries(commandsByCategory).map(([category, cmds]) => (
							<div key={category}>
								<span className='px-1 text-xs font-semibold tracking-[0.16em] text-zinc-600 uppercase'>
									{category}
								</span>
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
											className='flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50'>
											<div>
												<span className='block text-sm font-semibold text-zinc-100'>
													{command.label}
												</span>
												<span className='block text-xs text-zinc-500'>
													{command.description}
												</span>
											</div>
											{command.shortcut && (
												<span className='font-mono text-xs text-zinc-600'>
													{command.shortcut}
												</span>
											)}
										</button>
									))}
								</div>
							</div>
						))}
					</div>
				)}
				<div className='pt-3 text-xs font-semibold tracking-[0.16em] text-zinc-600 uppercase'>
					Add node
				</div>
				<div className='max-h-72 overflow-y-auto'>
					{filteredNodes.map((node) => (
						<button
							key={node.key}
							type='button'
							onClick={() => {
								dispatch({
									type: 'ADD_NODE',
									defKey: node.key,
									position: {
										x: 160 + state.nodes.length * 24,
										y: 140 + state.nodes.length * 18,
									},
								});
								dispatch({ type: 'SET_COMMAND_PALETTE', open: false });
							}}
							className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-white/[0.06]'>
							<span className='flex h-7 w-7 items-center justify-center rounded bg-white/[0.07] text-[10px] font-black text-zinc-200'>
								{node.icon}
							</span>
							<span>
								<span className='block text-sm font-semibold text-zinc-100'>
									{node.label}
								</span>
								<span className='block text-xs text-zinc-500'>
									{node.description}
								</span>
							</span>
						</button>
					))}
				</div>
			</div>
		</Modal>
	);
};

export default CommandPalette;
