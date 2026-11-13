import { useMemo, useState } from 'react';
import {
	Background,
	BackgroundVariant,
	Controls,
	ReactFlow,
	ReactFlowProvider,
	type Edge,
	type NodeTypes,
} from '@xyflow/react';
import { X } from 'lucide-react';
import type { TBuilderGraph } from '@/types/workflow-builder.type';
import { placeUnpositioned } from '../../_helper/layout.helper';
import type { TCanvasPosition } from '../../_types/canvas.type';
import { conditionEdgeData } from '../../_helper/builderDraft.helper';
import { graphNodeLabel, nodeChangeMap, type TGraphDiff } from '../../_helper/versionDiff.helper';
import { getNodeDefinition } from '../../_helper/nodeCatalog.constants';
import VersionPreviewNode, { type TVersionPreviewNode } from './VersionPreviewNode.partial';

const nodeTypes: NodeTypes = { versionStep: VersionPreviewNode };

export const primaryButton =
	'bg-primary-400 text-primary-950 hover:bg-primary-500 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50';
export const secondaryButton =
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
		graph.edges.map((edge) => ({
			source: edge.from,
			target: edge.to,
			condition: edge.condition,
		})),
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

/** "Slack, 2 × Gmail: Get Message"; repeats of one step type read once. */
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
	if (value === null || value === undefined || value === '') return '-';
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

export const ChangeSummary = ({
	diff,
	previousGraph,
	previousNumber,
	firstLabel = 'The first published version.',
}: {
	diff: TGraphDiff | null;
	previousGraph?: TBuilderGraph;
	previousNumber?: number;
	firstLabel?: string;
}) => {
	if (!diff || !previousGraph) {
		return <p className='text-xs text-zinc-500 dark:text-zinc-400'>{firstLabel}</p>;
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
 * A graph drawn read-only, with the steps `diff` added or changed outlined.
 * Clicking a step shows its settings. Steps without a stored position are
 * placed where `canvasPositions` has them, else laid out.
 */
export const GraphPreviewCanvas = ({
	graph,
	diff,
	canvasPositions,
	emptyLabel,
}: {
	graph: TBuilderGraph;
	diff: TGraphDiff | null;
	canvasPositions: Map<string, TCanvasPosition>;
	emptyLabel: string;
}) => {
	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const nodes = useMemo(
		() => toPreviewNodes(graph, diff, selectedKey, canvasPositions),
		[graph, diff, selectedKey, canvasPositions],
	);
	const edges = useMemo(() => toPreviewEdges(graph), [graph]);

	return (
		<ReactFlowProvider>
			<ReactFlow
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
					{emptyLabel}
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
	);
};
