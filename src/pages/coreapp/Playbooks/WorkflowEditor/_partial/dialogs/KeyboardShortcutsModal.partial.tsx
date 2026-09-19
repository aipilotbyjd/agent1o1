import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import Modal from './Modal.partial';

const SHORTCUTS = [
	{
		group: 'Workflow',
		items: [
			{ keys: ['⌘', 'Enter'], label: 'Run / Stop workflow' },
			{ keys: ['⌘', 'S'], label: 'Save workflow' },
			{ keys: ['⌘', 'Shift', 'E'], label: 'Import / Export' },
		],
	},
	{
		group: 'History',
		items: [
			{ keys: ['⌘', 'Z'], label: 'Undo' },
			{ keys: ['⌘', 'Shift', 'Z'], label: 'Redo' },
		],
	},
	{
		group: 'Nodes',
		items: [
			{ keys: ['⌘', 'K'], label: 'Quick add node' },
			{ keys: ['⌘', 'D'], label: 'Duplicate selected node' },
			{ keys: ['Del'], label: 'Delete selected node' },
			{ keys: ['B'], label: 'Toggle breakpoint on selected node' },
			{ keys: ['⌘', 'I'], label: 'Inspect node docs' },
			{ keys: ['⌘', 'T'], label: 'Test selected node inline' },
		],
	},
	{
		group: 'Canvas',
		items: [
			{ keys: ['L'], label: 'Auto-layout nodes' },
			{ keys: ['⌘', 'F'], label: 'Search canvas nodes' },
			{ keys: ['⌘', 'Shift', 'F'], label: 'Fit view' },
		],
	},
	{
		group: 'Panels',
		items: [
			{ keys: ['⌘', 'P'], label: 'Command palette' },
			{ keys: ['⌘', 'J'], label: 'AI Builder panel' },
			{ keys: ['⌘', 'Shift', 'L'], label: 'Toggle node library' },
			{ keys: ['⌘', 'Shift', 'R'], label: 'Toggle run console' },
			{ keys: ['?'], label: 'Keyboard shortcuts' },
		],
	},
	{
		group: 'Debug',
		items: [
			{ keys: ['⌘', 'Shift', 'D'], label: 'Toggle step-through mode' },
			{ keys: ['Space'], label: 'Step to next node (step mode)' },
		],
	},
];

const KeyboardShortcutsModal = () => {
	const { state, dispatch } = useWorkflowEditor();
	if (!state.ui.shortcutsOpen) return null;

	return (
		<Modal
			title='Keyboard Shortcuts'
			onClose={() => dispatch({ type: 'SET_SHORTCUTS_OPEN', open: false })}>
			<div className='grid gap-6 md:grid-cols-2'>
				{SHORTCUTS.map((group) => (
					<div key={group.group}>
						<div className='mb-3 text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase'>
							{group.group}
						</div>
						<div className='space-y-2'>
							{group.items.map((item) => (
								<div
									key={item.label}
									className='flex items-center justify-between gap-4'>
									<span className='text-sm text-zinc-700 dark:text-zinc-300'>
										{item.label}
									</span>
									<div className='flex shrink-0 items-center gap-1'>
										{item.keys.map((key, i) => (
											<kbd
												key={i}
												className='inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md border border-zinc-300 bg-zinc-100 px-1.5 font-mono text-[11px] font-semibold text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
												{key}
											</kbd>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</Modal>
	);
};

export default KeyboardShortcutsModal;
