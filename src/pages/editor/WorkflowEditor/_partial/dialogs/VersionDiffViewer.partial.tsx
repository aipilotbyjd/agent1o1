import { useState } from 'react';
import { GitBranch, X, Plus, Minus, Circle } from 'lucide-react';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import Modal from './Modal.partial';
import type { TCanvasNode } from '../../_types/canvas.type';

type TDiffItem =
	| { kind: 'added'; node: TCanvasNode }
	| { kind: 'removed'; node: TCanvasNode }
	| { kind: 'unchanged'; node: TCanvasNode };

const diffNodes = (prev: TCanvasNode[], current: TCanvasNode[]): TDiffItem[] => {
	const prevMap = new Map(prev.map((n) => [n.id, n]));
	const currentMap = new Map(current.map((n) => [n.id, n]));
	const items: TDiffItem[] = [];

	current.forEach((node) => {
		if (!prevMap.has(node.id)) {
			items.push({ kind: 'added', node });
		} else {
			items.push({ kind: 'unchanged', node });
		}
	});

	prev.forEach((node) => {
		if (!currentMap.has(node.id)) {
			items.push({ kind: 'removed', node });
		}
	});

	return items;
};

const VersionDiffViewer = () => {
	const { state, dispatch } = useWorkflowEditor();
	const [selectedVersion, setSelectedVersion] = useState(0);

	if (!state.ui.diffViewerOpen) return null;

	const snapshots = state.history.past;
	const currentNodes = state.nodes;

	const baseNodes = snapshots[selectedVersion]?.nodes ?? [];
	const diff = diffNodes(baseNodes, currentNodes);

	const added = diff.filter((d) => d.kind === 'added');
	const removed = diff.filter((d) => d.kind === 'removed');
	const unchanged = diff.filter((d) => d.kind === 'unchanged');

	return (
		<Modal
			title='Version Diff'
			onClose={() => dispatch({ type: 'SET_DIFF_VIEWER', open: false })}>
			<div className='space-y-4'>
				{snapshots.length === 0 ? (
					<div className='rounded-xl border border-dashed border-zinc-300 py-10 text-center text-sm text-zinc-400 dark:border-zinc-700'>
						No history snapshots available yet. Make some changes to generate history.
					</div>
				) : (
					<>
						{/* Version selector */}
						<div>
							<label className='mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-400'>
								Compare current with history snapshot:
							</label>
							<select
								value={selectedVersion}
								onChange={(e) => setSelectedVersion(Number(e.target.value))}
								className='w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'>
								{snapshots.map((snap, i) => (
									<option key={i} value={i}>
										Snapshot {i + 1} — {snap.nodes.length} nodes,{' '}
										{snap.edges.length} edges
									</option>
								))}
							</select>
						</div>

						{/* Summary */}
						<div className='flex gap-3'>
							<div className='flex flex-1 items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-950/20'>
								<Plus size={14} className='text-emerald-600' />
								<span className='text-sm font-bold text-emerald-700 dark:text-emerald-300'>
									{added.length} added
								</span>
							</div>
							<div className='flex flex-1 items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 dark:bg-rose-950/20'>
								<Minus size={14} className='text-rose-600' />
								<span className='text-sm font-bold text-rose-700 dark:text-rose-300'>
									{removed.length} removed
								</span>
							</div>
							<div className='flex flex-1 items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50'>
								<Circle size={14} className='text-zinc-400' />
								<span className='text-sm font-bold text-zinc-600 dark:text-zinc-300'>
									{unchanged.length} unchanged
								</span>
							</div>
						</div>

						{/* Diff list */}
						<div className='max-h-72 space-y-1 overflow-y-auto'>
							{added.map((item) => (
								<div
									key={item.node.id}
									className='flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 dark:border-emerald-900/30 dark:bg-emerald-950/20'>
									<Plus size={13} className='shrink-0 text-emerald-600' />
									<span className='text-sm font-semibold text-emerald-700 dark:text-emerald-300'>
										{item.node.data.label}
									</span>
									<span className='ml-auto font-mono text-[10px] text-emerald-500'>
										{item.node.data.defKey}
									</span>
								</div>
							))}
							{removed.map((item) => (
								<div
									key={item.node.id}
									className='flex items-center gap-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 dark:border-rose-900/30 dark:bg-rose-950/20'>
									<Minus size={13} className='shrink-0 text-rose-600' />
									<span className='text-sm font-semibold text-rose-700 line-through dark:text-rose-300'>
										{item.node.data.label}
									</span>
									<span className='ml-auto font-mono text-[10px] text-rose-400'>
										{item.node.data.defKey}
									</span>
								</div>
							))}
							{unchanged.map((item) => (
								<div
									key={item.node.id}
									className='flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900'>
									<Circle size={13} className='shrink-0 text-zinc-400' />
									<span className='text-sm text-zinc-600 dark:text-zinc-300'>
										{item.node.data.label}
									</span>
									<span className='ml-auto font-mono text-[10px] text-zinc-400'>
										{item.node.data.defKey}
									</span>
								</div>
							))}
						</div>

						{/* Restore button */}
						{snapshots[selectedVersion] && (
							<div className='flex justify-end'>
								<button
									type='button'
									onClick={() => {
										dispatch({
											type: 'LOAD_WORKFLOW',
											workflow: {
												workflow: state.workflow,
												nodes: snapshots[selectedVersion].nodes,
												edges: snapshots[selectedVersion].edges,
											},
										});
										dispatch({ type: 'SET_DIFF_VIEWER', open: false });
									}}
									className='rounded-lg border border-zinc-300 px-3 py-2 text-sm font-bold text-zinc-600 hover:border-rose-300 hover:text-rose-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-rose-700 dark:hover:text-rose-400'>
									Restore this snapshot
								</button>
							</div>
						)}
					</>
				)}
			</div>
		</Modal>
	);
};

export default VersionDiffViewer;
