import {
	Background,
	BackgroundVariant,
	MiniMap,
	ReactFlow,
	useReactFlow,
	useViewport,
	type Connection,
	type EdgeTypes,
	type IsValidConnection,
	type NodeChange,
	type NodeTypes,
	type OnConnectEnd,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Database, GitBranch, Globe2, MousePointer2, Timer, Webhook, Zap, Minus, Plus, Maximize2, ChevronDown } from 'lucide-react';
import { useCanvasDrop } from '../../_hooks/useCanvasDrop.hook';
import { isTypingTarget } from '../../_hooks/useEditorHotkeys.hook';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import BaseNode from './nodes/BaseNode.partial';
import InputNode from './nodes/InputNode.partial';
import OutputNode from './nodes/OutputNode.partial';
import StickyNote from './nodes/StickyNote.partial';
import TriggerNode from './nodes/TriggerNode.partial';
import CanvasEmptyState from './CanvasEmptyState.partial';
import CanvasStats from './CanvasStats.partial';
import CanvasSearch from './CanvasSearch.partial';
import ClickEdge from './ClickEdge.partial';
import NodeDocumentationPanel from '../dialogs/NodeDocumentationPanel.partial';
import NodeExpandedView from '../dialogs/NodeExpandedView.partial';
import useDarkMode from '@/hooks/useDarkMode';
import { useAiChatStore } from '@/store/aiChat.store';
import { useAuth } from '@/context/auth';
import type { TCanvasNode } from '../../_types/canvas.type';
import { validateWorkflow } from '../../_helper/validation.helper';
import { getNodeDefinition, NODE_CATALOG_MAP } from '../../_helper/nodeCatalog.constants';
import { PORT_TYPE_COLOR } from '../../_helper/builder.constants';
import type { TPortType } from '../../_types/node.type';

const nodeTypes: NodeTypes = {
	base: BaseNode,
	input: InputNode,
	output: OutputNode,
	note: StickyNote,
	trigger: TriggerNode,
};

const edgeTypes: EdgeTypes = {
	workflow: ClickEdge,
};

const quickAddNodes = [
	{ key: 'trigger.webhook', label: 'Webhook', icon: Webhook },
	{ key: 'ai.agent', label: 'AI Agent', icon: Bot },
	{ key: 'data.http', label: 'API', icon: Globe2 },
	{ key: 'data.database', label: 'Database', icon: Database },
	{ key: 'logic.condition', label: 'Condition', icon: GitBranch },
	{ key: 'utility.delay', label: 'Delay', icon: Timer },
];

const getPortType = (node: TCanvasNode | undefined, portId?: string | null): TPortType => {
	const def = node ? getNodeDefinition(node.data.defKey, node.data.definition) : undefined;
	const port = [...(def?.inputs ?? []), ...(def?.outputs ?? [])].find(
		(item) => item.id === portId,
	);
	return port?.type ?? 'any';
};

const getEdgeLabel = (
	nodes: TCanvasNode[],
	source: string,
	target: string,
	sourceHandle?: string | null,
	targetHandle?: string | null,
) => {
	const byId = new Map(nodes.map((node) => [node.id, node]));
	const sourceType = getPortType(byId.get(source), sourceHandle);
	const targetType = getPortType(byId.get(target), targetHandle);
	const type = sourceType === 'any' ? targetType : sourceType;
	return type === 'any' ? 'flow' : type;
};

const Canvas = () => {
	const { state, dispatch } = useWorkflowEditor();
	const { isDarkTheme } = useDarkMode();
	const reactFlow = useReactFlow<TCanvasNode>();
	const isChatActive = useAiChatStore((store) => store.isChatActive);
	const { userData } = useAuth();
	const { zoom } = useViewport();
	const didDragNodeRef = useRef(false);
	const [isDraggingExistingNode, setIsDraggingExistingNode] = useState(false);
	const [contextMenu, setContextMenu] = useState<{
		x: number;
		y: number;
		flowPosition: { x: number; y: number };
	} | null>(null);

	// Figma-style: plain left-drag on empty canvas rubber-bands a selection;
	// holding Space switches to pan-drag instead, matching Figma's space-to-pan.
	const [spacePressed, setSpacePressed] = useState(false);
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.code !== 'Space' || isTypingTarget(event.target) || event.repeat) return;
			if (state.ui.stepMode && state.ui.waitingForStep) return;
			event.preventDefault();
			setSpacePressed(true);
		};
		const onKeyUp = (event: KeyboardEvent) => {
			if (event.code === 'Space') setSpacePressed(false);
		};
		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('keyup', onKeyUp);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('keyup', onKeyUp);
		};
	}, [state.ui.stepMode, state.ui.waitingForStep]);

	const { onDragOver, onDragLeave, onDrop } = useCanvasDrop((event) =>
		reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY }),
	);
	const validationIssues = useMemo(
		() => validateWorkflow(state.nodes, state.edges),
		[state.nodes, state.edges],
	);
	const issuesByNode = useMemo(() => {
		const result = new Map<string, typeof validationIssues>();
		validationIssues.forEach((issue) => {
			if (!issue.nodeId) return;
			result.set(issue.nodeId, [...(result.get(issue.nodeId) ?? []), issue]);
		});
		return result;
	}, [validationIssues]);

	// Create the nodes array that ReactFlow will use
	// During drag, we need to update positions locally, but sync back to store on drag end
	const storeNodes = useMemo(
		() =>
			state.nodes.map((node) => ({
				...node,
				selected: state.ui.selectedNodeIds.includes(node.id),
				draggable: !node.data.locked,
				data: {
					...node.data,
					validationIssues: issuesByNode.get(node.id) ?? [],
					isActiveRunNode: state.run.currentNodeId === node.id,
				},
			})),
		[issuesByNode, state.nodes, state.run.currentNodeId, state.ui.selectedNodeIds],
	);

	const [dragPositions, setDragPositions] = useState<Map<string, { x: number; y: number }>>(
		() => new Map(),
	);

	// Mirrors the current selection so onNodesChange can apply select-diffs without
	// depending on (and re-creating the callback on) selection state itself.
	const selectionRef = useRef<string[]>([]);
	selectionRef.current = state.ui.selectedNodeIds;

	const onNodesChange = useCallback(
		(changes: NodeChange<TCanvasNode>[]) => {
			const nextPositions = new Map<string, { x: number; y: number }>();
			const selectChanges: { id: string; selected: boolean }[] = [];
			changes.forEach((change) => {
				if (change.type === 'position' && 'position' in change && change.position) {
					nextPositions.set(change.id, change.position);
				}
				if (change.type === 'select') {
					selectChanges.push({ id: change.id, selected: change.selected });
				}
			});
			if (nextPositions.size) {
				setDragPositions((previous) => new Map([...previous, ...nextPositions]));
			}
			if (selectChanges.length) {
				const next = new Set(selectionRef.current);
				selectChanges.forEach(({ id, selected }) => {
					if (selected) next.add(id);
					else next.delete(id);
				});
				dispatch({ type: 'SELECT_NODES', ids: Array.from(next) });
			}
		},
		[dispatch],
	);

	// Create the nodes array that includes drag positions during active drag
	const nodes = useMemo(() => {
		return storeNodes.map((node) => {
			// Use drag position if available, otherwise use store position
			const dragPos = dragPositions.get(node.id);
			if (isDraggingExistingNode && dragPos) {
				return {
					...node,
					position: dragPos,
				};
			}
			return node;
		});
	}, [storeNodes, isDraggingExistingNode, dragPositions]);

	const edges = useMemo(
		() =>
			state.edges.map((edge) => {
				const sourceType = getPortType(
					state.nodes.find((node) => node.id === edge.source),
					edge.sourceHandle,
				);
				const targetType = getPortType(
					state.nodes.find((node) => node.id === edge.target),
					edge.targetHandle,
				);
				const typeMismatch =
					sourceType !== 'any' && targetType !== 'any' && sourceType !== targetType;
				const isActive =
					state.run.status === 'running' &&
					(edge.source === state.run.currentNodeId ||
						edge.target === state.run.currentNodeId);
				return {
					...edge,
					type: 'workflow' as const,
					animated: isActive,
					data: {
						...edge.data,
						label: getEdgeLabel(
							state.nodes,
							edge.source,
							edge.target,
							edge.sourceHandle,
							edge.targetHandle,
						),
						labelColor: PORT_TYPE_COLOR[sourceType === 'any' ? targetType : sourceType],
						isActive,
						issue: typeMismatch ? 'Port types do not match' : undefined,
					},
					style: {
						stroke: typeMismatch
							? 'rgb(244 63 94)'
							: isActive
								? 'rgb(16 185 129)'
								: 'rgb(139 92 246)',
						strokeWidth: 3,
					},
				};
			}),
		[state.edges, state.nodes, state.run.currentNodeId, state.run.status],
	);

	const isValidConnection: IsValidConnection = useCallback(
		(connection) => {
			if (
				!connection.source ||
				!connection.target ||
				connection.source === connection.target
			) {
				return false;
			}
			return true;
		},
		[],
	);

	const onConnect = useCallback(
		(connection: Connection) => {
			if (!connection.source || !connection.target) return;
			dispatch({
				type: 'ADD_EDGE',
				source: connection.source,
				target: connection.target,
				sourceHandle: connection.sourceHandle ?? undefined,
				targetHandle: connection.targetHandle ?? undefined,
			});
		},
		[dispatch],
	);

	// Gumloop-style: if the connection is released over a node's body (not exactly
	// on a handle), connect to that node instead of dropping the connection.
	const onConnectEnd: OnConnectEnd = useCallback(
		(event, connectionState) => {
			if (connectionState.toHandle) return; // already handled by onConnect
			const fromHandle = connectionState.fromHandle;
			const fromNodeId = connectionState.fromNode?.id;
			if (!fromHandle || !fromNodeId) return;

			const point =
				'changedTouches' in event ? event.changedTouches[0] : (event as MouseEvent);
			const targetEl = document
				.elementFromPoint(point.clientX, point.clientY)
				?.closest('.react-flow__node');
			const droppedNodeId = targetEl?.getAttribute('data-id');
			if (!droppedNodeId || droppedNodeId === fromNodeId) return;

			// Respect drag direction: a drag started from a target handle means the
			// dropped node is the source.
			const fromIsSource = fromHandle.type === 'source';
			dispatch({
				type: 'ADD_EDGE',
				source: fromIsSource ? fromNodeId : droppedNodeId,
				target: fromIsSource ? droppedNodeId : fromNodeId,
				sourceHandle: fromIsSource ? fromHandle.id ?? undefined : undefined,
				targetHandle: fromIsSource ? undefined : fromHandle.id ?? undefined,
			});
		},
		[dispatch],
	);

	// Clear drag positions when drag ends and sync every moved node back to the
	// store — when multiple nodes are selected, React Flow moves the whole group
	// together and each one needs its own MOVE_NODE, not just the node the mouse
	// grabbed.
	const handleDragStop = useCallback(() => {
		setIsDraggingExistingNode(false);
		didDragNodeRef.current = false;

		setDragPositions((previous) => {
			previous.forEach((position, id) => {
				dispatch({ type: 'MOVE_NODE', id, position });
			});
			return new Map();
		});
	}, [dispatch]);

	return (
		<section
			data-canvas='true'
			className={`relative min-h-0 flex-1 overflow-hidden bg-white dark:bg-[#07080b] ${spacePressed ? 'cursor-grab' : ''}`}
			onContextMenu={(event) => event.preventDefault()}
			onDragOver={onDragOver}
			onDragLeave={onDragLeave}
			onDrop={onDrop}>
			<ReactFlow
				fitView
				snapToGrid
				snapGrid={[4, 4]}
				selectionOnDrag={!spacePressed}
				panOnDrag={spacePressed ? true : [1, 2]}
				multiSelectionKeyCode={['Meta', 'Shift']}
				reconnectRadius={18}
				connectionRadius={45}
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				onNodesChange={onNodesChange}
				onConnect={onConnect}
				onConnectEnd={onConnectEnd}
				isValidConnection={isValidConnection}
				onNodeDragStart={(_, node) => {
					didDragNodeRef.current = true;
					setIsDraggingExistingNode(true);
					// Dragging a node already inside a multi-selection moves the whole
					// group — only collapse to a single selection when grabbing a node
					// that isn't part of the current selection.
					if (!state.ui.selectedNodeIds.includes(node.id)) {
						dispatch({ type: 'SELECT_NODE', id: node.id });
					}
				}}
				onNodeDragStop={handleDragStop}
				onPaneClick={() => {
					setContextMenu(null);
					dispatch({ type: 'CLEAR_NODE_SELECTION' });
				}}
				onPaneContextMenu={(event) => {
					event.preventDefault();
					setContextMenu({
						x: event.clientX,
						y: event.clientY,
						flowPosition: reactFlow.screenToFlowPosition({
							x: event.clientX,
							y: event.clientY,
						}),
					});
				}}
				onNodeClick={() => {
					setContextMenu(null);
					if (didDragNodeRef.current) {
						didDragNodeRef.current = false;
					}
					// Selection itself is handled by onNodesChange's 'select' diffs —
					// React Flow already respects multiSelectionKeyCode there.
				}}
				onEdgesDelete={(deletedEdges) =>
					deletedEdges.forEach((edge) => dispatch({ type: 'REMOVE_EDGE', id: edge.id }))
				}
				deleteKeyCode={null}
				defaultViewport={{ x: 0, y: 0, zoom: 1 }}
				minZoom={0.2}
				maxZoom={1.5}
				colorMode={isDarkTheme ? 'dark' : 'light'}
				className='workflow-react-flow'>
				<Background
					variant={BackgroundVariant.Dots}
					color={isDarkTheme ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.13)'}
					gap={22}
					size={2}
				/>
				{state.ui.miniMapOpen && (
					<MiniMap
						nodeStrokeWidth={3}
						position='bottom-left'
						pannable
						zoomable
						className='overflow-hidden rounded-xl border border-zinc-200 bg-white/90 shadow-2xl shadow-zinc-200/60 backdrop-blur dark:border-white/10 dark:bg-zinc-950/90 dark:shadow-black/30'
					/>
				)}
			</ReactFlow>
			<AnimatePresence>
				{contextMenu && (
					<motion.div
						initial={{ opacity: 0, scale: 0.96, y: 4 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.96, y: 4 }}
						transition={{ duration: 0.12 }}
						style={{ left: contextMenu.x, top: contextMenu.y }}
						className='absolute z-30 w-64 overflow-hidden rounded-xl border border-zinc-250 bg-white p-2 text-zinc-800 shadow-2xl shadow-zinc-200/55 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95 dark:text-zinc-100 dark:shadow-black/40'>
						<div className='mb-1 flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-zinc-450 dark:text-zinc-500'>
							<MousePointer2 size={13} />
							Add node here
						</div>
						{quickAddNodes.map((node) => {
							const Icon = node.icon;
							return (
								<button
									key={node.key}
									type='button'
									onClick={() => {
										dispatch({
											type: 'ADD_NODE',
											defKey: node.key,
											definition: NODE_CATALOG_MAP[node.key],
											position: contextMenu.flowPosition,
										});
										setContextMenu(null);
									}}
									className='flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/[0.07] dark:hover:text-white'>
									<span className='flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.04]'>
										<Icon size={15} />
									</span>
									<span className='font-semibold'>{node.label}</span>
								</button>
							);
						})}
						<button
							type='button'
							onClick={() => {
								dispatch({ type: 'SET_COMMAND_PALETTE', open: true });
								setContextMenu(null);
							}}
							className='mt-1 flex w-full items-center gap-3 rounded-lg border border-primary-100 bg-primary-50 px-2.5 py-2 text-left text-sm font-semibold text-primary-700 transition hover:bg-primary-100 dark:border-primary-500/20 dark:bg-primary-400/10 dark:text-primary-100 dark:hover:bg-primary-500/15'>
							<span className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary-200/50 dark:bg-primary-400/15'>
								<Zap size={15} className='text-primary-600 dark:text-primary-400' />
							</span>
							Open command palette
						</button>
					</motion.div>
				)}
			</AnimatePresence>
			{state.nodes.length === 0 ? (
				<CanvasEmptyState />
			) : (
				<CanvasStats nodes={state.nodes.length} edges={state.edges.length} />
			)}
			<CanvasSearch />
			<NodeDocumentationPanel />
			<NodeExpandedView />

			{isChatActive && (
				<div className='pointer-events-auto absolute right-0 bottom-0 left-0 flex h-14 items-center justify-between border-t border-zinc-200 bg-white/95 px-5 select-none dark:border-white/10 dark:bg-[#07080b]/95 z-10'>
					{/* Left items - Flow Tab */}
					<div className='flex h-full items-end'>
						<div className='flex h-[40px] items-center rounded-t-xl border border-zinc-250 border-b-0 bg-white px-4 text-xs font-bold text-primary-600 dark:border-zinc-800 dark:bg-[#07080b] shadow-xs relative' style={{ borderBottomColor: 'transparent' }}>
							<span className='text-sm font-black'>Flow</span>
							{/* Purple active indicator line */}
							<div className='absolute bottom-0 left-0 right-0 h-[3px] bg-primary-400 rounded-t-lg' />
						</div>
					</div>

					{/* Right items - Zoom controls + User Card */}
					<div className='flex items-center'>
						{/* Zoom Panel */}
						<div className='flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2 py-1 shadow-xs dark:border-zinc-800 dark:bg-zinc-900'>
							<button
								type='button'
								onClick={() => reactFlow.zoomOut({ duration: 150 })}
								className='text-zinc-450 hover:text-zinc-800 p-1 dark:hover:text-zinc-200'
							>
								<Minus size={13} strokeWidth={2.5} />
							</button>
							<span className='min-w-[32px] text-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400'>
								{Math.round(zoom * 100)}%
							</span>
							<button
								type='button'
								onClick={() => reactFlow.zoomIn({ duration: 150 })}
								className='text-zinc-450 hover:text-zinc-800 p-1 dark:hover:text-zinc-200'
							>
								<Plus size={13} strokeWidth={2.5} />
							</button>
							<span className='h-3 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1' />
							<button
								type='button'
								onClick={() => reactFlow.fitView({ padding: 0.18, duration: 240 })}
								className='text-zinc-455 hover:text-zinc-700 p-1 dark:hover:text-zinc-300'
							>
								<Maximize2 size={12} />
							</button>
						</div>

						{/* Profile selector card */}
						<div className='flex items-center gap-2.5 bg-white border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 rounded-xl px-3 py-1.5 shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer ml-3'>
							<div className='relative h-6.5 w-6.5 rounded-full overflow-hidden'>
								<img src={userData?.image?.org || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} alt='User avatar' className='h-full w-full object-cover' />
								<span className='absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900' />
							</div>
							<div className='text-left leading-none'>
								<div className='text-[11px] font-bold text-zinc-800 dark:text-white'>
									{userData?.name || 'Amaan'}
								</div>
								<div className='text-[9px] text-zinc-450 dark:text-zinc-500 font-medium mt-0.5'>
									{userData?.email || 'beingamaan21@gmail.com'}
								</div>
							</div>
							<ChevronDown size={13} className='text-zinc-400 ml-1' />
						</div>
					</div>
				</div>
			)}
		</section>
	);
};

export default Canvas;
