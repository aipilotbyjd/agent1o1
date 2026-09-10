import { useEffect, useRef, useState } from 'react';
import { Copy, Loader2, Pencil, Play, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useWorkflowEditor } from '../../../_context/WorkflowEditorProvider.context';
import { useNodeTestRunner } from '../../../_hooks/useNodeTestRunner.hook';
import ConfigureInputsDialog from '../../dialogs/ConfigureInputsDialog.partial';
import type { TNodeField } from '../../../_types/node.type';

const buttonClass =
	'flex items-center gap-1 rounded px-1.5 py-0.5 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 dark:hover:bg-white/10! dark:hover:text-white';

type Props = {
	nodeId: string;
	defKey: string;
	label: string;
	fields: TNodeField[];
};

/** Floating action bar shown above the selected node. */
const NodeToolbar = ({ nodeId, defKey, label, fields }: Props) => {
	const { dispatch } = useWorkflowEditor();
	const [configureOpen, setConfigureOpen] = useState(false);
	const [renaming, setRenaming] = useState(false);
	const [draftLabel, setDraftLabel] = useState(label);
	const renameRef = useRef<HTMLInputElement>(null);
	const { runTest, testStatus, canRun } = useNodeTestRunner(nodeId, defKey);

	useEffect(() => {
		if (renaming) renameRef.current?.select();
	}, [renaming]);

	const commitRename = () => {
		const next = draftLabel.trim();
		if (next && next !== label) dispatch({ type: 'RENAME_NODE', id: nodeId, label: next });
		setRenaming(false);
	};

	const handleTest = (event: React.MouseEvent) => {
		event.stopPropagation();
		runTest();
	};

	return (
		<>
			<div
				className='nodrag pointer-events-auto absolute -top-11 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-bold whitespace-nowrap text-zinc-600 shadow-md shadow-zinc-200/50 select-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none'
				onPointerDown={(event) => event.stopPropagation()}>
				{renaming ? (
					<input
						ref={renameRef}
						value={draftLabel}
						aria-label='Node name'
						onChange={(event) => setDraftLabel(event.target.value)}
						onBlur={commitRename}
						onKeyDown={(event) => {
							if (event.key === 'Enter') commitRename();
							if (event.key === 'Escape') {
								setDraftLabel(label);
								setRenaming(false);
							}
						}}
						className='w-44 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-zinc-800 outline-none focus:border-primary-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100'
					/>
				) : (
					<>
						<button
							type='button'
							onClick={(event) => {
								event.stopPropagation();
								dispatch({ type: 'DUPLICATE_SELECTED' });
							}}
							className={buttonClass}>
							<Copy size={13} strokeWidth={2.5} />
							<span>Duplicate</span>
						</button>
						<button
							type='button'
							onClick={(event) => {
								event.stopPropagation();
								setDraftLabel(label);
								setRenaming(true);
							}}
							className={buttonClass}>
							<Pencil size={13} strokeWidth={2.5} />
							<span>Rename</span>
						</button>
						<button
							type='button'
							onClick={(event) => {
								event.stopPropagation();
								setConfigureOpen(true);
							}}
							className={buttonClass}>
							<SlidersHorizontal size={13} strokeWidth={2.5} />
							<span>Configure Inputs</span>
						</button>
						<button
							type='button'
							onClick={handleTest}
							disabled={!canRun || testStatus === 'running'}
							title={canRun ? 'Run this node once with the current settings' : 'Save the workflow first'}
							className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-50`}>
							{testStatus === 'running' ? (
								<Loader2 size={13} strokeWidth={2.5} className='animate-spin' />
							) : (
								<Play size={13} strokeWidth={2.5} />
							)}
							<span>{testStatus === 'running' ? 'Testing…' : 'Test'}</span>
						</button>
						<button
							type='button'
							onClick={(event) => {
								event.stopPropagation();
								dispatch({ type: 'DELETE_SELECTED' });
							}}
							className='flex items-center gap-1 rounded px-1.5 py-0.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30! dark:hover:text-rose-300'>
							<Trash2 size={13} strokeWidth={2.5} />
							<span>Delete</span>
						</button>
					</>
				)}
			</div>

			{configureOpen && (
				<ConfigureInputsDialog
					nodeId={nodeId}
					fields={fields}
					onClose={() => setConfigureOpen(false)}
				/>
			)}
		</>
	);
};

export default NodeToolbar;
