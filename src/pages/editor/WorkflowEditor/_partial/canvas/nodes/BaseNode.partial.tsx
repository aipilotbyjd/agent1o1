import { useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
	Bot,
	Braces,
	CheckCircle2,
	ChevronsDownUp,
	ChevronsUpDown,
	Circle,
	Clock3,
	Coins,
	Database,
	GitBranch,
	Globe2,
	Info,
	Loader2,
	Maximize2,
	MessageSquare,
	OctagonX,
	Pin,
	TriangleAlert,
	Webhook,
	Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getNodeDefinition } from '../../../_helper/nodeCatalog.constants';
import ApiNodeIcon from '../../library/NodeIcon.partial';
import NodeFields from './NodeFields.partial';
import NodeColorPicker from './NodeColorPicker.partial';
import NodeCommentsPanel from './NodeCommentsPanel.partial';
import NodeInlineTest from './NodeInlineTest.partial';
import NodeRunIO from './NodeRunIO.partial';
import NodeToolbar from './NodeToolbar.partial';
import NodeIOPanel from './NodeIOPanel.partial';
import NodeOptionsPanel from './NodeOptionsPanel.partial';
import NodeLoopToggle from './NodeLoopToggle.partial';
import NodeFlowTriggerToggle from './NodeFlowTriggerToggle.partial';
import NodeAuthWarning from './NodeAuthWarning.partial';
import NodeCredentialBadge from './NodeCredentialBadge.partial';
import { tintStyle, getNodeAccentColor } from '../../library/library.util';
import { PORT_TYPE_COLOR, getNodeCreditCost } from '../../../_helper/builder.constants';
import { useWorkflowEditor } from '../../../_context/WorkflowEditorProvider.context';
import type { TCanvasNode } from '../../../_types/canvas.type';
import type { TNodeComment, TNodePort } from '../../../_types/node.type';
import type { TValidationIssue } from '../../../_helper/validation.helper';

const getPortTop = (index: number, total: number) => `${((index + 1) * 100) / (total + 1)}%`;

const iconMap = {
	'trigger.webhook': Webhook,
	'ai.agent': Bot,
	'ai.chat': MessageSquare,
	'ai.extract': Braces,
	'data.http': Globe2,
	'data.database': Database,
	'logic.condition': GitBranch,
	'logic.if': GitBranch,
	'utility.delay': Clock3,
	'output.display': Zap,
};

const statusClass: Record<string, string> = {
	idle: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
	queued: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
	running: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
	success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
	error: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
	skipped: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
};

/** Map durationMs → profiler gradient color */
const profilerColor = (ms?: number): string => {
	if (ms === undefined) return '';
	if (ms < 200) return 'rgba(16,185,129,0.12)';
	if (ms < 800) return 'rgba(245,158,11,0.12)';
	return 'rgba(244,63,94,0.12)';
};

export const PortHandles = ({
	ports,
	type,
	color,
}: {
	ports: TNodePort[];
	type: 'source' | 'target';
	color?: string;
}) => {
	const position = type === 'source' ? Position.Bottom : Position.Top;
	const getPortLeft = (index: number, total: number) => `${((index + 1) * 100) / (total + 1)}%`;
	const showIndex = ports.length > 1;
	const size = showIndex ? 16 : 12;
	return (
		<>
			{ports.map((port, index) => (
				<Handle
					key={port.id}
					id={port.id}
					type={type}
					position={position}
					title={`${port.name}: ${port.type}`}
					style={{
						left: `calc(${getPortLeft(index, ports.length)} - ${size / 2}px)`,
						bottom: type === 'source' ? -(size / 2) : undefined,
						top: type === 'target' ? -(size / 2) : undefined,
						width: size,
						height: size,
						backgroundColor: 'white',
						borderWidth: 1.5,
						borderColor: color ?? '#d4d4d8',
						color: color ?? '#71717a',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: 8,
						fontWeight: 700,
						zIndex: 10,
					}}
					className='rounded-full cursor-crosshair shadow-sm transition-transform duration-150 hover:scale-125 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700'
				>
					{showIndex && (
						<span className='pointer-events-none'>{(index + 1).toString()}</span>
					)}
				</Handle>
			))}
		</>
	);
};

const BaseNode = ({ id, data, selected }: NodeProps<TCanvasNode>) => {
	const { state, dispatch } = useWorkflowEditor();
	const def = getNodeDefinition(data.defKey, data.definition);

	/** Every output of each upstream node wired into this one — all become available inputs. */
	// Memoized so React Flow's per-frame drag re-renders don't re-scan every edge/node.
	const incoming = useMemo(
		() =>
			Array.from(new Set(state.edges.filter((edge) => edge.target === id).map((edge) => edge.source)))
				.flatMap((sourceId) => {
					const sourceNode = state.nodes.find((node) => node.id === sourceId);
					if (!sourceNode) return [];
					const sourceDef = getNodeDefinition(sourceNode.data.defKey, sourceNode.data.definition);
					const sourceOutputs =
						sourceDef?.outputs && sourceDef.outputs.length > 0
							? sourceDef.outputs
							: [{ id: 'out', name: 'output', type: 'any' as const }];
					const sourceLabel = sourceNode.data.label || sourceDef?.label || 'Node';
					const sourceColor = getNodeAccentColor(
						sourceId,
						sourceNode.data.color as string | undefined,
						sourceDef?.colorHex,
					);
					return sourceOutputs.map((port) => ({
						id: `${sourceId}:${port.id}`,
						sourceId,
						port,
						sourceLabel,
						sourceColor,
					}));
				}),
		[state.edges, state.nodes, id],
	);
	const nodeIndex = state.nodes.findIndex((node) => node.id === id) + 1;
	const collapsed = Boolean(data.collapsed);
	const status = data.status ?? 'idle';
	const inputs = def?.inputs && def.inputs.length > 0 ? def.inputs : [{ id: 'in', name: 'input', type: 'any' as const }];
	const outputs = def?.outputs && def.outputs.length > 0 ? def.outputs : [{ id: 'out', name: 'output', type: 'any' as const }];
	const validationIssues = (data.validationIssues ?? []) as TValidationIssue[];
	const hasError =
		status === 'error' || validationIssues.some((issue) => issue.severity === 'error');
	const hasWarning = validationIssues.length > 0;
	const isActiveRunNode = Boolean(data.isActiveRunNode);
	const comments = (data.comments ?? []) as TNodeComment[];

	const NodeIcon = iconMap[data.defKey as keyof typeof iconMap];
	const effectiveColorHex = getNodeAccentColor(id, data.color as string | undefined, def?.colorHex);
	const creditCost = getNodeCreditCost(def);

	const brand = (def?.key.split('.')[0] ?? def?.category ?? 'node')
		.replace(/[_-]+/g, ' ')
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
	const credentialField = def?.fields.find((field) => field.kind === 'credential');
	const credentialId = credentialField
		? (data.values[credentialField.key] as string | undefined)
		: undefined;
	const needsAuth = Boolean(def?.requiresCredential) && !credentialId;
	// Integration-style nodes (and anything explicitly flagged) can be promoted to
	// the flow's entry trigger — Gumloop's "Activate as flow trigger" strip.
	const canBeTrigger = Boolean(def?.supportsTrigger || def?.requiresCredential);
	const isFlowTrigger = Boolean(data.activateAsTrigger);

	const durationMs = typeof data.durationMs === 'number' ? data.durationMs : undefined;

	// Stable string identities so framer-motion's boxShadow animation isn't re-fired
	// on every render (React Flow re-renders this node on each drag frame).
	const { baseShadow, hoverShadow } = useMemo(() => {
		const colorRing = data.color ? `, 0 0 0 3px ${data.color}14` : '';
		return {
			baseShadow: `0 1px 2px rgba(24,24,27,0.04), 0 12px 28px -8px rgba(24,24,27,0.14)${colorRing}`,
			hoverShadow: `0 2px 4px rgba(24,24,27,0.05), 0 22px 44px -10px rgba(24,24,27,0.22)${colorRing}`,
		};
	}, [data.color]);

	return (
		<motion.div
			animate={{ boxShadow: baseShadow }}
			whileHover={{ y: -2, boxShadow: hoverShadow }}
			transition={{ duration: 0.18 }}
			className={[
				'group relative w-[320px] rounded-[26px] border p-1.5 text-left ring-1 ring-inset ring-white/60 dark:ring-white/[0.03]',
				'bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100',
				selected
					? 'border-primary-500 ring-2 ring-primary-500/15 dark:border-primary-500'
					: 'border-zinc-200 dark:border-zinc-800',
				hasError ? 'border-rose-400/80 ring-2 ring-rose-500/10' : '',
				isActiveRunNode ? 'ring-2 ring-emerald-400/20' : '',
				data.breakpoint ? 'ring-2 ring-rose-500/40' : '',
			].join(' ')}
			style={{ borderColor: data.color }}>
			<PortHandles ports={inputs} type='target' color={effectiveColorHex} />

			{/* Breakpoint indicator */}
			{data.breakpoint && (
				<div
					title='Breakpoint set — execution will pause here'
					className='absolute -top-1.5 -left-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-rose-300 bg-rose-500 text-white shadow-sm'>
					<OctagonX size={10} />
				</div>
			)}

			{hasWarning && (
				<div
					title={validationIssues.map((issue) => issue.message).join('\n')}
					className={[
						'absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border shadow-sm transition-transform duration-200 group-hover:scale-110',
						hasError
							? 'border-rose-200 bg-rose-500 text-white'
							: 'border-amber-200 bg-amber-400 text-zinc-950',
					].join(' ')}>
					<TriangleAlert size={12} />
				</div>
			)}

			{canBeTrigger && (
				<NodeFlowTriggerToggle nodeId={id} active={isFlowTrigger} />
			)}

			{needsAuth && <NodeAuthWarning />}

			<div
				className={[
					'p-3.5 shadow-[inset_0_1px_2px_rgba(24,24,27,0.03)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]',
					// Square the top when a strip sits above so they read as one stacked card.
					canBeTrigger || needsAuth ? 'rounded-b-2xl' : 'rounded-2xl',
				].join(' ')}
				style={{
					backgroundColor: effectiveColorHex
						? `${effectiveColorHex}0d`
						: durationMs !== undefined
							? profilerColor(durationMs)
							: undefined,
				}}>
				<div className='flex items-start gap-3'>
					<div
						className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm'
						style={tintStyle(effectiveColorHex)}>
						{NodeIcon ? (
							<NodeIcon size={17} strokeWidth={2.25} />
						) : (
							<ApiNodeIcon icon={def?.icon} size={17} />
						)}
					</div>

					<div className='min-w-0 flex-1 pr-7'>
						<div className='mb-1 flex items-center justify-between gap-2'>
							<span className='flex min-w-0 items-center gap-1'>
								<span className='truncate text-[10px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
									{brand}
								</span>
								{/* Docs button */}
								<button
									type='button'
									title='View node documentation'
									onClick={(e) => {
										e.stopPropagation();
										dispatch({ type: 'SET_NODE_DOC', open: true, nodeId: id });
									}}
									className='shrink-0 text-zinc-400 transition hover:text-primary-500'>
									<Info size={10} />
								</button>
							</span>
							<span className='flex shrink-0 items-center gap-1.5'>
								{creditCost > 0 && (
									<span
										title={`Estimated ${creditCost} credit${creditCost === 1 ? '' : 's'} per run`}
										className='inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'>
										<Coins size={9} />
										{creditCost}
									</span>
								)}
								{def?.supportsLoopMode && (
									<NodeLoopToggle nodeId={id} active={Boolean(data.loopMode)} />
								)}
								<button
									type='button'
									title={collapsed ? 'Expand node' : 'Collapse node'}
									onPointerDown={(event) => event.stopPropagation()}
									onClick={(event) => {
										event.stopPropagation();
										dispatch({ type: 'TOGGLE_NODE_COLLAPSED', id });
									}}
									className='nodrag flex size-4 shrink-0 items-center justify-center rounded text-zinc-400 transition hover:text-primary-500 dark:hover:text-primary-400'>
									{collapsed ? <ChevronsUpDown size={12} /> : <ChevronsDownUp size={12} />}
								</button>
								{data.pinned && (
									<span
										title='Output pinned — reused on re-run'
										className='flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'>
										<Pin size={9} />
									</span>
								)}
								<span
									className={[
										'inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase',
										statusClass[status],
										isActiveRunNode ? 'ring-1 ring-emerald-400/50' : '',
									].join(' ')}>
									{status === 'running' && (
										<Loader2 size={9} className='animate-spin' />
									)}
									{status === 'success' && <CheckCircle2 size={9} />}
									{status}
								</span>
							</span>
						</div>
						<div className='truncate text-[14px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100'>
							{data.label || def?.label || 'Node'}
						</div>
					</div>
				</div>

				{/* Node action toolbar — floats in the corner, revealed on hover */}
				<div className='absolute top-2.5 right-2.5 z-10 flex items-center gap-0.5 rounded-xl border border-zinc-200/80 bg-white/95 p-0.5 shadow-sm backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-900/95'>
					<button
						type='button'
						title={collapsed ? 'Expand node' : 'Collapse node'}
						onClick={(e) => {
							e.stopPropagation();
							dispatch({ type: 'TOGGLE_NODE_COLLAPSED', id });
						}}
						className='flex h-6 w-6 items-center justify-center rounded text-zinc-400 transition hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/40 dark:hover:text-primary-400'>
						{collapsed ? <ChevronsUpDown size={13} /> : <ChevronsDownUp size={13} />}
					</button>
					<button
						type='button'
						title='Expand node configuration'
						onClick={(e) => {
							e.stopPropagation();
							dispatch({ type: 'SET_NODE_EXPANDED', open: true, nodeId: id });
						}}
						className='flex h-6 w-6 items-center justify-center rounded text-zinc-400 transition hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/40 dark:hover:text-primary-400'>
						<Maximize2 size={13} />
					</button>
					<NodeColorPicker
						nodeId={id}
						currentColor={data.color as string | undefined}
					/>
					<NodeCommentsPanel nodeId={id} comments={comments} />
				</div>

				{!collapsed && (
					<div className='mt-2 text-[10px] leading-tight text-zinc-500 dark:text-zinc-400'>
						{def?.description}
					</div>
				)}

				{!collapsed && credentialId && (
					<div className='mt-2'>
						<NodeCredentialBadge credentialId={String(credentialId)} />
					</div>
				)}

				{!collapsed && def && def.fields.length > 0 && (
					<div className='mt-4'>
						<NodeFields nodeId={id} fields={def.fields} values={data.values} />
					</div>
				)}

				{/* Execution profiler */}
				{durationMs !== undefined && (
					<div className='mt-3 flex items-center gap-1.5'>
						<Circle
							size={7}
							fill={
								durationMs < 200
									? '#10b981'
									: durationMs < 800
										? '#f59e0b'
										: '#f43f5e'
							}
							stroke='none'
						/>
						<span className='truncate text-[10px] font-bold text-zinc-400'>
							Last run {durationMs}ms
						</span>
					</div>
				)}

				{/* Resolved input/output from the last run */}
				<NodeRunIO
					inputPreview={data.inputPreview}
					outputPreview={data.outputPreview}
					pinned={data.pinned}
					pinnedOutput={data.pinnedOutput}
				/>

				{/* Inline node test */}
				{selected && <NodeInlineTest nodeId={id} defKey={data.defKey} />}
			</div>



			{isActiveRunNode && (
				<div className='absolute inset-0 -z-10 rounded-[26px] bg-emerald-400/15 blur-xl' />
			)}
			<PortHandles ports={outputs} type='source' color={effectiveColorHex} />

			{/* Node index badge */}
			<div className='absolute -bottom-2.5 left-1/2 z-10 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-[9px] font-semibold text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'>
				{nodeIndex}
			</div>

			{/* Toolbar + IO panels: always shown while selected, revealed on hover otherwise */}
			<div
				className={[
					'transition-opacity duration-150',
					selected
						? 'opacity-100'
						: 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100',
				].join(' ')}>
				<NodeToolbar
					nodeId={id}
					defKey={data.defKey}
					label={data.label || def?.label || 'Node'}
					fields={def?.fields ?? []}
				/>

				<NodeIOPanel nodeId={id} nodeColor={effectiveColorHex} incoming={incoming} outputs={outputs} />
				<NodeOptionsPanel
					nodeId={id}
					fields={def?.fields ?? []}
					credentialField={credentialField}
					credentialId={credentialId ? String(credentialId) : undefined}
				/>
			</div>

		</motion.div>
	);
};

export default BaseNode;
