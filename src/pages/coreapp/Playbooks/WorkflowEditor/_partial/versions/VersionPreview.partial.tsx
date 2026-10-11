import { useEffect, useMemo, useState } from 'react';
import {
	Background,
	BackgroundVariant,
	Controls,
	ReactFlow,
	ReactFlowProvider,
	type Edge,
	type NodeTypes,
} from '@xyflow/react';
import { ArrowLeft, Eye, Loader2, RotateCcw, X } from 'lucide-react';
import { format } from 'date-fns';
import { useWorkflowVersion, useWorkflowVersions } from '@/api/modules/workflows';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import type { TBuilderGraph } from '@/types/workflow-builder.type';
import { placeUnpositioned } from '../../_helper/layout.helper';
import type { TCanvasPosition } from '../../_types/canvas.type';
import { conditionEdgeData } from '../../_helper/builderDraft.helper';
import {
	diffGraphs,
	graphNodeLabel,
	nodeChangeMap,
	type TGraphDiff,
} from '../../_helper/versionDiff.helper';
import { getNodeDefinition } from '../../_helper/nodeCatalog.constants';
import { useDraftStatus } from '../../_hooks/useDraftStatus.hook';
import { useVersionRestore } from '../../_hooks/useVersionRestore.hook';
import { useWorkflowEditor } from '../../_hooks/useWorkflowEditor.hook';
import VersionPreviewNode, { type TVersionPreviewNode } from './VersionPreviewNode.partial';

const nodeTypes: NodeTypes = { versionStep: VersionPreviewNode };

const primaryButton =
	'bg-primary-400 text-primary-950 hover:bg-primary-500 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50';
const secondaryButton =
	'inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.08]';

const toPreviewNodes = (
	graph: TBuilderGraph,
	diff: TGraphDiff | null,
	selectedKey: string | null,
	canvasPositions: Map<string, TCanvasPosition>,
): TVersionPreviewNode[] => {
	const changes = diff ? nodeChangeMap(diff) : new Map();
	const nodes: TVersionPreviewNode[] = graph.nodes.map((node) => ({
		id: node.key,
		type: 'versionStep',
		position: node.position ?? { x: 0, y: 0 },
		draggable: false,
		connectable: false,
		data: {
			defKey: node.type,
			change: changes.get(node.key),
			selected: node.key === selectedKey,
		},
	}));
	const unpositioned = new Set(
		graph.nodes.filter((node) => !node.position).map((node) => node.key),
	);
	return placeUnpositioned(
		nodes,
		graph.edges.map((edge) => ({ source: edge.from, target: edge.to })),
		(node) => !unpositioned.has(node.id),
		canvasPositions,
	);
};

const toPreviewEdges = (graph: TBuilderGraph): Edge[] =>
	graph.edges.map((edge, index) => {
		const data = conditionEdgeData(edge.condition);
		return {
			id: `version_edge_${index}`,
			source: edge.from,
			target: edge.to,
			type: 'smoothstep',
			label: data.label as string | undefined,
			style: { stroke: edge.condition === 'error' ? '#f43f5e' : '#a1a1aa', strokeWidth: 1.5 },
		};
	});

/** "Slack, 2 × Gmail: Get Message" — repeats of one step type read once. */
const countedNames = (names: string[]) =>
	[
		...names.reduce(
			(counts, name) => counts.set(name, (counts.get(name) ?? 0) + 1),
			new Map<string, number>(),
		),
	]
		.map(([name, count]) => (count > 1 ? `${count} × ${name}` : name))
		.join(', ');

const formatValue = (value: unknown) => {
	if (value === null || value === undefined || value === '') return '—';
	if (typeof value === 'string') return value;
	return JSON.stringify(value);
};

const StepDetails = ({
	graph,
	stepKey,
	onClose,
}: {
	graph: TBuilderGraph;
	stepKey: string;
	onClose: () => void;
}) => {
	const node = graph.nodes.find((candidate) => candidate.key === stepKey);
	if (!node) return null;
	const def = getNodeDefinition(node.type);
	const fieldLabels = new Map(def?.fields.map((field) => [field.key, field.label]) ?? []);
	const entries = Object.entries(node.config ?? {}).filter(
		([key]) => !key.startsWith('__') && key !== '_loop',
	);

	return (
		<aside
			aria-label='Step settings in this version'
			className='absolute bottom-4 left-4 z-10 flex max-h-[55%] w-[320px] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-white/10 dark:bg-zinc-900'>
			<header className='flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3 dark:border-white/[0.06]'>
				<div className='min-w-0'>
					<p className='truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
						{graphNodeLabel(graph, stepKey)}
					</p>
					<p className='text-[11px] text-zinc-500 dark:text-zinc-400'>
						Settings in this version
					</p>
				</div>
				<button
					type='button'
					aria-label='Close step settings'
					onClick={onClose}
					className='flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-white'>
					<X size={14} />
				</button>
			</header>
			<dl className='min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3'>
				{entries.length === 0 && (
					<p className='text-xs text-zinc-500 dark:text-zinc-400'>
						This step had no settings filled in.
					</p>
				)}
				{entries.map(([key, value]) => (
					<div key={key}>
						<dt className='text-[11px] font-medium text-zinc-500 dark:text-zinc-400'>
							{fieldLabels.get(key) ?? key}
						</dt>
						<dd className='mt-0.5 text-xs break-words whitespace-pre-wrap text-zinc-800 dark:text-zinc-200'>
							{formatValue(value)}
						</dd>
					</div>
				))}
			</dl>
		</aside>
	);
};

const ChangeSummary = ({
	diff,
	previousGraph,
	previousNumber,
}: {
	diff: TGraphDiff | null;
	previousGraph?: TBuilderGraph;
	previousNumber?: number;
}) => {
	if (!diff || !previousGraph) {
		return (
			<p className='text-xs text-zinc-500 dark:text-zinc-400'>The first published version.</p>
		);
	}
	const removedNames = diff.removed.map((key) => graphNodeLabel(previousGraph, key));
	const nothing =
		!diff.added.length &&
		!diff.changed.length &&
		!removedNames.length &&
		!diff.connectionsChanged;

	return (
		<div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300'>
			<span className='text-zinc-500 dark:text-zinc-400'>Since v{previousNumber}:</span>
			{nothing && <span>no step changes</span>}
			{diff.added.length > 0 && (
				<span className='inline-flex items-center gap-1.5'>
					<span className='h-2 w-2 rounded-full bg-emerald-500' />
					{diff.added.length} new
				</span>
			)}
			{diff.changed.length > 0 && (
				<span className='inline-flex items-center gap-1.5'>
					<span className='h-2 w-2 rounded-full bg-amber-500' />
					{diff.changed.length} updated
				</span>
			)}
			{removedNames.length > 0 && (
				<span className='inline-flex items-center gap-1.5'>
					<span className='h-2 w-2 rounded-full bg-rose-500' />
					Removed {countedNames(removedNames)}
				</span>
			)}
			{diff.connectionsChanged > 0 && (
				<span className='text-zinc-500 dark:text-zinc-400'>
					{diff.connectionsChanged} connection
					{diff.connectionsChanged === 1 ? '' : 's'} changed
				</span>
			)}
		</div>
	);
};

/**
 * A published version shown read-only over the canvas, with the steps that
 * version added or changed outlined. The draft underneath is untouched until
 * the person restores.
 */
const VersionPreview = () => {
	const { state } = useWorkflowEditor();
	const previewVersionId = useWorkflowShellStore((store) => store.previewVersionId);
	const setPreviewVersionId = useWorkflowShellStore((store) => store.setPreviewVersionId);
	const workspaceId = state.workflow.workspaceId ?? '';
	const workflowId = state.workflow.apiId ?? '';
	const [selectedKey, setSelectedKey] = useState<string | null>(null);

	const { data: versions } = useWorkflowVersions(workspaceId, workflowId);
	const index = versions?.findIndex((version) => version.id === previewVersionId) ?? -1;
	const previousId = index >= 0 ? versions?.[index + 1]?.id : undefined;

	const versionQuery = useWorkflowVersion(workspaceId, workflowId, previewVersionId ?? '');
	const previousQuery = useWorkflowVersion(workspaceId, workflowId, previousId ?? '');
	const { status: draftStatus, liveVersionId } = useDraftStatus();
	const { restore, isRestoring } = useVersionRestore();

	const version = versionQuery.data;
	const graph = version?.editor_graph;
	const previousGraph = previousQuery.data?.editor_graph;

	const diff = useMemo(
		() => (graph && previousGraph ? diffGraphs(previousGraph, graph) : null),
		[graph, previousGraph],
	);
	// Taken when a version opens, not on every canvas change underneath.
	const [canvasPositions, setCanvasPositions] = useState(
		() => new Map<string, TCanvasPosition>(),
	);
	const nodes = useMemo(
		() => (graph ? toPreviewNodes(graph, diff, selectedKey, canvasPositions) : []),
		[graph, diff, selectedKey, canvasPositions],
	);
	const edges = useMemo(() => (graph ? toPreviewEdges(graph) : []), [graph]);

	const [shownVersionId, setShownVersionId] = useState(previewVersionId);
	if (shownVersionId !== previewVersionId) {
		setShownVersionId(previewVersionId);
		setSelectedKey(null);
		setCanvasPositions(new Map(state.nodes.map((node) => [node.id, node.position])));
	}

	useEffect(() => {
		if (!previewVersionId) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setPreviewVersionId(null);
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [previewVersionId, setPreviewVersionId]);

	if (!previewVersionId) return null;

	const isLive = previewVersionId === liveVersionId;
	const draftHasChanges = draftStatus !== 'live';
	const publisher = version?.publisher?.name;

	const handleRestore = async () => {
		if (!version) return;
		const restored = await restore(version, {
			draftHasChanges,
			isDiscard: isLive,
		});
		if (restored) setPreviewVersionId(null);
	};

	return (
		<div className='absolute inset-0 z-[15] flex flex-col bg-zinc-50 dark:bg-[#0b0c0f]'>
			<div className='shrink-0 border-b border-zinc-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-950'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<div className='flex min-w-0 items-center gap-3'>
						<span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300'>
							<Eye size={15} />
						</span>
						<div className='min-w-0'>
							<div className='flex items-center gap-2'>
								<h2 className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
									Viewing v{version?.version ?? '…'}
								</h2>
								{isLive && (
									<span className='rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'>
										Live
									</span>
								)}
								<span className='hidden text-xs text-zinc-500 sm:inline dark:text-zinc-400'>
									Read only
								</span>
							</div>
							{version && (
								<p className='truncate text-xs text-zinc-500 dark:text-zinc-400'>
									{version.notes || 'No description'}
									{' · '}
									{publisher ? `${publisher}, ` : ''}
									{format(new Date(version.created_at), 'MMM d, h:mm a')}
								</p>
							)}
						</div>
					</div>
					<div className='flex items-center gap-2'>
						<button
							type='button'
							onClick={() => setPreviewVersionId(null)}
							className={secondaryButton}>
							<ArrowLeft size={13} />
							Back to draft
						</button>
						{version && !(isLive && !draftHasChanges) && (
							<button
								type='button'
								onClick={handleRestore}
								disabled={isRestoring}
								className={primaryButton}>
								{isRestoring ? (
									<Loader2 size={13} className='animate-spin' />
								) : (
									<RotateCcw size={13} />
								)}
								{isLive ? 'Discard my changes' : 'Restore this version'}
							</button>
						)}
					</div>
				</div>
				{version && (
					<div className='mt-2.5'>
						<ChangeSummary
							diff={diff}
							previousGraph={previousGraph}
							previousNumber={previousQuery.data?.version}
						/>
					</div>
				)}
			</div>

			<div className='relative min-h-0 flex-1'>
				{versionQuery.isLoading && (
					<div className='flex h-full items-center justify-center gap-2 text-sm text-zinc-500'>
						<Loader2 size={16} className='animate-spin' />
						Loading v{versions?.[index]?.version ?? ''}…
					</div>
				)}
				{versionQuery.isError && (
					<div className='flex h-full items-center justify-center text-sm text-zinc-500'>
						This version could not be loaded.
					</div>
				)}
				{graph && (
					<ReactFlowProvider>
						<ReactFlow
							key={previewVersionId}
							nodes={nodes}
							edges={edges}
							nodeTypes={nodeTypes}
							fitView
							fitViewOptions={{ padding: 0.2 }}
							minZoom={0.1}
							nodesDraggable={false}
							nodesConnectable={false}
							elementsSelectable={false}
							deleteKeyCode={null}
							selectionKeyCode={null}
							multiSelectionKeyCode={null}
							onNodeClick={(_, node) =>
								setSelectedKey((current) => (current === node.id ? null : node.id))
							}
							onPaneClick={() => setSelectedKey(null)}
							proOptions={{ hideAttribution: true }}>
							<Background variant={BackgroundVariant.Dots} gap={20} size={1} />
							<Controls showInteractive={false} position='bottom-right' />
						</ReactFlow>
						{graph.nodes.length === 0 && (
							<p className='pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-zinc-500'>
								This version has no steps.
							</p>
						)}
						{selectedKey && (
							<StepDetails
								graph={graph}
								stepKey={selectedKey}
								onClose={() => setSelectedKey(null)}
							/>
						)}
					</ReactFlowProvider>
				)}
			</div>
		</div>
	);
};

export default VersionPreview;
