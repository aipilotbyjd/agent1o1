import { X, Maximize2, Info, SlidersHorizontal, FlaskConical, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import { getNodeDefinition } from '../../_helper/nodeCatalog.constants';
import { getNodeCreditCost } from '../../_helper/builder.constants';
import NodeFields from '../canvas/nodes/NodeFields.partial';
import NodeInlineTest from '../canvas/nodes/NodeInlineTest.partial';
import NodeCredentialBadge from '../canvas/nodes/NodeCredentialBadge.partial';
import ApiNodeIcon from '../library/NodeIcon.partial';
import { tintStyle, getNodeAccentColor } from '../library/library.util';

const NodeExpandedView = () => {
	const { state, dispatch } = useWorkflowEditor();
	if (!state.ui.nodeExpandedOpen) return null;

	const nodeId = state.ui.nodeExpandedId ?? state.ui.selectedNodeId;
	const node = state.nodes.find((n) => n.id === nodeId);
	const def = node ? getNodeDefinition(node.data.defKey, node.data.definition) : null;

	if (!node || !def) return null;

	const brand = (def?.key.split('.')[0] ?? def?.category ?? 'node')
		.replace(/[_-]+/g, ' ')
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
	const effectiveColorHex = getNodeAccentColor(node.id, node.data.color as string | undefined, def?.colorHex);
	const creditCost = getNodeCreditCost(def);
	const credentialField = def?.fields.find((field) => field.kind === 'credential');
	const credentialId = credentialField
		? (node.data.values[credentialField.key] as string | undefined)
		: undefined;

	return (
		<AnimatePresence>
			<motion.div
				key='node-expanded-backdrop'
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.22 }}
				onClick={() => dispatch({ type: 'SET_NODE_EXPANDED', open: false })}
				className='fixed inset-0 z-40 bg-black/40 backdrop-blur-sm dark:bg-black/60'
			/>

			<motion.div
				key='node-expanded-modal'
				initial={{ scale: 0.95, opacity: 0, x: '-50%', y: 8 }}
				animate={{ scale: 1, opacity: 1, x: '-50%', y: 0 }}
				exit={{ scale: 0.95, opacity: 0, x: '-50%', y: 8 }}
				transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
				onClick={(e) => e.stopPropagation()}
				className='fixed inset-y-4 left-1/2 z-50 flex w-[92vw] max-w-2xl flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_2px_4px_rgba(24,24,27,0.05),0_32px_64px_-12px_rgba(24,24,27,0.35)] dark:border-white/10 dark:bg-zinc-950 sm:inset-y-8 md:inset-y-12 lg:inset-y-16'>
				{/* Header */}
				<div
					className='relative shrink-0 overflow-hidden border-b border-zinc-200 px-7 py-5 dark:border-white/[0.06]'
					style={{
						backgroundColor: effectiveColorHex ? `${effectiveColorHex}0a` : undefined,
					}}>
					<div className='flex items-start justify-between gap-4'>
						<div className='flex flex-1 min-w-0 items-start gap-4'>
							<div
								className='flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm'
								style={tintStyle(effectiveColorHex)}>
								{def?.icon ? (
									<ApiNodeIcon icon={def.icon} size={26} />
								) : (
									<Maximize2 size={26} />
								)}
							</div>

							<div className='min-w-0 flex-1'>
								<div className='flex items-center gap-2'>
									<span className='text-[11px] font-bold tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
										{brand}
									</span>
									{creditCost > 0 && (
										<span
											title={`Estimated ${creditCost} credit${creditCost === 1 ? '' : 's'} per run`}
											className='inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'>
											<Coins size={10} />
											{creditCost} credit{creditCost === 1 ? '' : 's'}
										</span>
									)}
								</div>
								<h2 className='mb-1 truncate text-xl font-bold tracking-tight text-zinc-900 dark:text-white'>
									{node.data.label || def?.label || 'Node'}
								</h2>
								<p className='text-sm leading-snug text-zinc-500 dark:text-zinc-400'>
									{def?.description}
								</p>
								{credentialId && (
									<div className='mt-2'>
										<NodeCredentialBadge credentialId={credentialId} />
									</div>
								)}
							</div>
						</div>

						<button
							type='button'
							onClick={() => dispatch({ type: 'SET_NODE_EXPANDED', open: false })}
							className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.07] dark:hover:text-white'>
							<X size={17} />
						</button>
					</div>
				</div>

				{/* Content */}
				<div className='flex-1 overflow-y-auto px-7 py-6'>
					{def.fields.length > 0 ? (
						<div className='space-y-5'>
							<div className='rounded-2xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-white/[0.02]'>
								<div className='mb-4 flex items-center gap-2'>
									<span className='flex h-6 w-6 items-center justify-center rounded-lg bg-primary-500/12 text-primary-500'>
										<SlidersHorizontal size={13} />
									</span>
									<h3 className='text-[13px] font-bold text-zinc-900 dark:text-white'>
										Configuration
									</h3>
								</div>
								<NodeFields
									nodeId={node.id}
									fields={def.fields}
									values={node.data.values}
									forceExpanded
								/>
							</div>

							<div className='rounded-2xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-white/[0.02]'>
								<div className='mb-1 flex items-center gap-2'>
									<span className='flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/12 text-sky-500'>
										<FlaskConical size={13} />
									</span>
									<h3 className='text-[13px] font-bold text-zinc-900 dark:text-white'>
										Test this node
									</h3>
								</div>
								<NodeInlineTest nodeId={node.id} defKey={node.data.defKey} />
							</div>
						</div>
					) : (
						<div className='flex h-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400'>
							No configuration fields
						</div>
					)}
				</div>

				{/* Footer */}
				<div className='flex shrink-0 items-center justify-between border-t border-zinc-200 px-7 py-4 dark:border-white/[0.06]'>
					<button
						type='button'
						onClick={() =>
							dispatch({ type: 'SET_NODE_DOC', open: true, nodeId: node.id })
						}
						className='flex items-center gap-1.5 text-[12px] font-semibold text-zinc-500 transition hover:text-primary-600 dark:text-zinc-400 dark:hover:text-primary-400'>
						<Info size={14} />
						View documentation
					</button>
					<button
						type='button'
						onClick={() => dispatch({ type: 'SET_NODE_EXPANDED', open: false })}
						className='rounded-xl bg-zinc-900 px-4 py-2 text-[12px] font-bold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200'>
						Done
					</button>
				</div>
			</motion.div>
		</AnimatePresence>
	);
};

export default NodeExpandedView;
