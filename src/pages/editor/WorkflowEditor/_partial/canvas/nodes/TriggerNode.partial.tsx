import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
	Folder,
	FileSpreadsheet,
	Calendar,
	Mail,
	MessageSquare,
	Users,
	Clock,
	Webhook,
	FileText,
	Layers,
	Database,
	ChevronsDownUp,
	ChevronsUpDown,
	Coins,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { TCanvasNode } from '../../../_types/canvas.type';
import { getNodeDefinition } from '../../../_helper/nodeCatalog.constants';
import { getNodeCreditCost } from '../../../_helper/builder.constants';
import {
	useWorkflowTrigger,
	useCreateWorkflowWebhook,
	useCreateWorkflowPollingTrigger,
	usePauseWorkflowTrigger,
	useDeleteWorkflowTrigger,
	useWorkflowTriggerDetail,
	useResumeWorkflowTrigger,
} from '@/api/modules/workflows/workflows.hooks';
import { useWorkflowRouteParams } from '../../../_hooks/useWorkflowRouteParams.hook';
import { useWorkflowEditor } from '../../../_context/WorkflowEditorProvider.context';
import { useMemo } from 'react';
import NodeFields from './NodeFields.partial';
import { PortHandles } from './BaseNode.partial';
import NodeToolbar from './NodeToolbar.partial';
import NodeIOPanel from './NodeIOPanel.partial';
import NodeOptionsPanel from './NodeOptionsPanel.partial';
import NodeLoopToggle from './NodeLoopToggle.partial';
import NodeAuthWarning from './NodeAuthWarning.partial';
import NodeCredentialBadge from './NodeCredentialBadge.partial';
import NodeHelpTip from './NodeHelpTip.partial';
import { tintStyle, getNodeAccentColor } from '../../library/library.util';

const iconMap: Record<
	string,
	React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
> = {
	'trigger.google_drive': Folder,
	'trigger.google_sheets': FileSpreadsheet,
	'trigger.google_calendar': Calendar,
	'trigger.gmail': Mail,
	'trigger.slack_message': MessageSquare,
	'trigger.teams_message': Users,
	'trigger.time': Clock,
	'trigger.webhook': Webhook,
	'trigger.google_form_responses': FileText,
	'trigger.hubspot_list': Layers,
	'trigger.airtable_reader': Database,
	'trigger.zendesk_ticket': FileText,
	'trigger.linear_issue': FileText,
	'trigger.jira_issue': FileText,
	'trigger.typeform_submission': FileText,
	'trigger.incident_io': FileText,
	'trigger.parallel_web_monitor': FileText,
};

/** Distinct accent per integration so triggers are recognizable at a glance on the canvas. */
const colorMap: Record<string, string> = {
	'trigger.google_drive': '#eab308',
	'trigger.google_sheets': '#16a34a',
	'trigger.google_calendar': '#2563eb',
	'trigger.gmail': '#dc2626',
	'trigger.slack_message': '#8b5cf6',
	'trigger.teams_message': '#4f46e5',
	'trigger.time': '#71717a',
	'trigger.webhook': '#0ea5e9',
	'trigger.google_form_responses': '#a855f7',
	'trigger.hubspot_list': '#f97316',
	'trigger.airtable_reader': '#0d9488',
	'trigger.zendesk_ticket': '#f97316',
	'trigger.linear_issue': '#6366f1',
	'trigger.jira_issue': '#2563eb',
	'trigger.typeform_submission': '#171717',
	'trigger.incident_io': '#dc2626',
	'trigger.parallel_web_monitor': '#0ea5e9',
};

const DEFAULT_TRIGGER_COLOR = '#8b5cf6';

const brandNameMap: Record<string, string> = {
	'trigger.google_drive': 'Google Drive',
	'trigger.google_sheets': 'Google Sheets',
	'trigger.google_calendar': 'Google Calendar',
	'trigger.gmail': 'Gmail',
	'trigger.slack_message': 'Slack',
	'trigger.teams_message': 'Teams',
	'trigger.time': 'Schedule',
	'trigger.webhook': 'Webhook',
	'trigger.google_form_responses': 'Google Forms',
	'trigger.hubspot_list': 'HubSpot',
	'trigger.airtable_reader': 'Airtable',
};

const TriggerNode = ({ id, data, selected }: NodeProps<TCanvasNode>) => {
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
	const credentialField = def?.fields.find((field) => field.kind === 'credential');
	const credentialId = credentialField
		? (data.values[credentialField.key] as string | undefined)
		: undefined;
	const hasError = Boolean(def?.requiresCredential) && !credentialId;
	const brand = brandNameMap[data.defKey] || 'Trigger';
	const color = colorMap[data.defKey] || DEFAULT_TRIGGER_COLOR;
	const creditCost = getNodeCreditCost(def);
	const NodeIcon = iconMap[data.defKey] || Webhook;

	const { workspaceId, workflowId } = useWorkflowRouteParams();
	const { data: triggerData } = useWorkflowTrigger(workspaceId, workflowId);

	const createWebhook = useCreateWorkflowWebhook(workspaceId);
	const createPolling = useCreateWorkflowPollingTrigger(workspaceId);
	const pauseTrigger = usePauseWorkflowTrigger(workspaceId);
	const deleteTrigger = useDeleteWorkflowTrigger(workspaceId);
	const resumeTrigger = useResumeWorkflowTrigger(workspaceId);

	const isTriggerActive = useMemo(() => {
		if (!triggerData) return false;
		if (Array.isArray(triggerData)) {
			return (
				triggerData.length > 0 &&
				triggerData[0]?.status !== 'paused' &&
				triggerData[0]?.is_active !== false
			);
		}
		return (
			(triggerData as any)?.status !== 'paused' && (triggerData as any)?.is_active !== false
		);
	}, [triggerData]);

	const triggerId = useMemo(() => {
		if (!triggerData) return '';
		return Array.isArray(triggerData)
			? String(triggerData[0]?.id ?? '')
			: String((triggerData as any)?.id ?? '');
	}, [triggerData]);

	const { data: triggerDetail } = useWorkflowTriggerDetail(workspaceId, workflowId, triggerId);

	const baseShadow = '0 1px 2px rgba(24,24,27,0.04), 0 12px 28px -8px rgba(24,24,27,0.14)';
	const hoverShadow = '0 2px 4px rgba(24,24,27,0.05), 0 22px 44px -10px rgba(24,24,27,0.22)';

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
			].join(' ')}>
			{/* Top Bar */}
			<div className='flex items-center justify-between px-3 py-2'>
				<div className='flex items-center gap-1 text-[10px] font-semibold text-zinc-500'>
					Activate as flow trigger{' '}
					<NodeHelpTip
						size={11}
						text='When on, this node starts the workflow automatically on incoming events instead of waiting for a manual run.'
					/>
				</div>
				<div className='flex items-center gap-2'>
					<span className='text-[10px] font-semibold text-zinc-400'>
						{isTriggerActive ? 'Yes' : 'No'}
					</span>
					<button
						type='button'
						aria-label='Toggle flow trigger'
						onClick={() => {
							if (!workspaceId || !workflowId) return;
							if (isTriggerActive) {
								const triggerId =
									(triggerData as any)?.id ??
									(Array.isArray(triggerData) ? triggerData[0]?.id : null);
								if (triggerId) {
									pauseTrigger.mutate({ workflowId, triggerId });
								}
							} else {
								const triggerId =
									(triggerData as any)?.id ??
									(Array.isArray(triggerData) ? triggerData[0]?.id : null);
								if (triggerId) {
									resumeTrigger.mutate({ workflowId, triggerId });
								} else {
									if (
										data.defKey.includes('time') ||
										data.defKey.includes('schedule')
									) {
										createPolling.mutate({ id: workflowId });
									} else {
										createWebhook.mutate({ id: workflowId });
									}
								}
							}
						}}
						disabled={
							createWebhook.isPending ||
							createPolling.isPending ||
							pauseTrigger.isPending ||
							resumeTrigger.isPending ||
							deleteTrigger.isPending
						}
						className={[
							'flex h-4 w-7 cursor-pointer items-center rounded-full p-0.5 transition-all duration-200',
							isTriggerActive
								? 'justify-end bg-primary-400'
								: 'justify-start bg-zinc-200 dark:bg-zinc-700',
						].join(' ')}>
						<div className='h-3 w-3 animate-none rounded-full bg-white shadow-xs' />
					</button>
				</div>
			</div>

			{hasError && <NodeAuthWarning />}

			{/* Main Content Area */}
			<div
				className='rounded-2xl p-3.5 shadow-[inset_0_1px_2px_rgba(24,24,27,0.03)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]'
				style={{ backgroundColor: `${color}0d` }}>
				{/* Header */}
				<div className='flex items-start gap-3'>
					{/* Icon Box */}
					<div
						className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm'
						style={tintStyle(color)}>
						<NodeIcon size={17} strokeWidth={2.25} />
					</div>

					<div className='min-w-0 flex-1'>
						<div className='mb-1 flex items-center justify-between'>
							<div className='flex items-center gap-1'>
								<span className='truncate text-[10px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
									{brand}
								</span>
								{def?.description && (
								<NodeHelpTip
									size={10}
									text={def.description}
									className='text-primary-500'
								/>
							)}
								{creditCost > 0 && (
									<span
										title={`Estimated ${creditCost} credit${creditCost === 1 ? '' : 's'} per run`}
										className='ml-1 inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'>
										<Coins size={9} />
										{creditCost}
									</span>
								)}
							</div>
							<div className='flex shrink-0 items-center gap-1 rounded-md border border-zinc-200/80 bg-white/80 px-1 py-0.5 shadow-sm backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-900/80'>
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
									className='nodrag flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/40 dark:hover:text-primary-400'>
									{collapsed ? (
										<ChevronsUpDown size={12} />
									) : (
										<ChevronsDownUp size={12} />
									)}
								</button>
							</div>
						</div>
						<div className='truncate text-[14px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100'>
							{data.label || def?.label || 'Trigger'}
						</div>
					</div>
				</div>

				{!collapsed && (
					<div className='mt-2 text-[10px] leading-tight text-zinc-500 dark:text-zinc-400'>
						{def?.description}
					</div>
				)}

				{!collapsed && credentialId && (
					<div className='mt-2'>
						<NodeCredentialBadge credentialId={credentialId} />
					</div>
				)}

				{!collapsed && def && def.fields.length > 0 && (
					<div className='mt-4'>
						<NodeFields nodeId={id} fields={def.fields} values={data.values} />
					</div>
				)}
					{!!triggerDetail && (
						<div className='mt-3 flex flex-col gap-2 border-t border-zinc-100 pt-2.5 dark:border-zinc-800'>
							{(triggerDetail as any).webhook_url && (
								<div className='flex flex-col gap-1'>
									<span className='text-[10px] font-semibold text-zinc-500 dark:text-zinc-400'>
										Webhook URL:
									</span>
									<span className='cursor-text rounded-lg border border-zinc-200 bg-white p-1.5 font-mono text-[9px] font-semibold break-all text-zinc-700 select-all select-text dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'>
										{(triggerDetail as any).webhook_url}
									</span>
								</div>
							)}
							<div className='mt-1 flex items-center justify-between'>
								<div
									className={`flex items-center gap-1.5 text-[10px] font-semibold ${isTriggerActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
									<span
										className={`h-1.5 w-1.5 rounded-full ${isTriggerActive ? 'animate-pulse bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
									/>
									<span>
										{isTriggerActive
											? 'Listening for events...'
											: 'Trigger paused'}
									</span>
								</div>
								<button
									type='button'
									onClick={() => {
										if (triggerId) {
											deleteTrigger.mutate({ workflowId, triggerId });
										}
									}}
									disabled={deleteTrigger.isPending}
									className='cursor-pointer text-[9px] font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400'>
									Delete Configuration
								</button>
							</div>
						</div>
					)}
				</div>

			{/* Input Handle */}
			{def && (
				<Handle
					id={def.inputs && def.inputs.length > 0 ? def.inputs[0].id : 'in'}
					type='target'
					position={Position.Top}
					style={{
						left: 'calc(50% - 6px)',
						top: -6,
						backgroundColor: 'white',
						borderColor: color,
						borderWidth: 1.5,
						height: 12,
						width: 12,
						zIndex: 10,
					}}
					className='transition-transform duration-150 hover:scale-125 shadow-sm rounded-full cursor-crosshair dark:bg-zinc-900 dark:border-zinc-800'
				/>
			)}

			{/* Output Handles */}
			{def && (
				<PortHandles ports={def.outputs ?? []} type='source' color={color} />
			)}

			{/* Node index badge */}
			<div className='absolute -bottom-2.5 left-1/2 z-10 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-[9px] font-semibold text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'>
				{nodeIndex}
			</div>

			{selected && (
				<NodeToolbar
					nodeId={id}
					defKey={data.defKey}
					label={data.label || def?.label || 'Trigger'}
					fields={def?.fields ?? []}
				/>
			)}

			{selected && def && (
				<NodeIOPanel nodeId={id} nodeColor={color} incoming={incoming} outputs={def.outputs ?? []} />
			)}

			{selected && (
				<NodeOptionsPanel
					nodeId={id}
					fields={def?.fields ?? []}
					credentialField={credentialField}
					credentialId={credentialId ? String(credentialId) : undefined}
				/>
			)}

		</motion.div>
	);
};

export default TriggerNode;
