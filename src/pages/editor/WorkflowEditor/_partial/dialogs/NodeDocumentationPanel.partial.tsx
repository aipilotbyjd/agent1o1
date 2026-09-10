import { X, Info, Plug, Zap, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import { getNodeDefinition } from '../../_helper/nodeCatalog.constants';
import { PORT_TYPE_COLOR } from '../../_helper/builder.constants';

const NodeDocumentationPanel = () => {
	const { state, dispatch } = useWorkflowEditor();
	if (!state.ui.nodeDocOpen) return null;

	const nodeId = state.ui.nodeDocNodeId ?? state.ui.selectedNodeId;
	const node = state.nodes.find((n) => n.id === nodeId);
	const def = node ? getNodeDefinition(node.data.defKey, node.data.definition) : null;

	return (
		<AnimatePresence>
			<motion.div
				key='node-doc-panel'
				initial={{ x: 380, opacity: 0 }}
				animate={{ x: 0, opacity: 1 }}
				exit={{ x: 380, opacity: 0 }}
				transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
				className='absolute top-0 right-0 z-20 flex h-full w-[360px] flex-col border-l border-zinc-200 bg-white shadow-2xl shadow-zinc-200/40 dark:border-white/10 dark:bg-zinc-950 dark:shadow-none'>
				{/* Header */}
				<div className='flex items-center justify-between border-b border-zinc-100 p-4 dark:border-white/[0.06]'>
					<div className='flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-100'>
						<BookOpen size={15} className='text-primary-500' />
						Node Docs
					</div>
					<button
						type='button'
						onClick={() => dispatch({ type: 'SET_NODE_DOC', open: false })}
						className='flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.07] dark:hover:text-white'>
						<X size={14} />
					</button>
				</div>

				{!def ? (
					<div className='flex flex-1 items-center justify-center text-sm text-zinc-400'>
						Select a node to see its documentation
					</div>
				) : (
					<div className='flex-1 space-y-5 overflow-y-auto p-4'>
						{/* Title */}
						<div>
							<div className='mb-1 flex items-center gap-2'>
								<div
									className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg text-white'
									style={{ backgroundColor: def.colorHex ?? '#8b5cf6' }}>
									{def.icon ? <span>{def.icon}</span> : <Zap size={18} />}
								</div>
								<div>
									<div className='text-base font-bold text-zinc-900 dark:text-zinc-50'>
										{def.label}
									</div>
									<div className='text-xs text-zinc-400'>{def.key}</div>
								</div>
							</div>
							<p className='mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400'>
								{def.description}
							</p>
							{def.requiresCredential && (
								<div className='mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'>
									Requires credential
								</div>
							)}
						</div>

						{/* Inputs */}
						{def.inputs.length > 0 && (
							<div>
								<div className='mb-2 text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase'>
									Inputs
								</div>
								<div className='space-y-2'>
									{def.inputs.map((port) => (
										<div key={port.id} className='flex items-start gap-2'>
											<span
												className='mt-1 h-2.5 w-2.5 shrink-0 rounded-full'
												style={{
													backgroundColor:
														PORT_TYPE_COLOR[port.type] ?? '#71717a',
												}}
											/>
											<div>
												<div className='text-xs font-semibold text-zinc-700 dark:text-zinc-200'>
													{port.name}
													{port.required && (
														<span className='ml-1 text-rose-500'>
															*
														</span>
													)}
												</div>
												<div className='text-[11px] text-zinc-400'>
													Type:{' '}
													<code className='font-mono'>{port.type}</code>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Outputs */}
						{def.outputs.length > 0 && (
							<div>
								<div className='mb-2 text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase'>
									Outputs
								</div>
								<div className='space-y-2'>
									{def.outputs.map((port) => (
										<div key={port.id} className='flex items-start gap-2'>
											<span
												className='mt-1 h-2.5 w-2.5 shrink-0 rounded-full'
												style={{
													backgroundColor:
														PORT_TYPE_COLOR[port.type] ?? '#71717a',
												}}
											/>
											<div>
												<div className='text-xs font-semibold text-zinc-700 dark:text-zinc-200'>
													{port.name}
												</div>
												<div className='text-[11px] text-zinc-400'>
													Type:{' '}
													<code className='font-mono'>{port.type}</code>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Fields */}
						{def.fields.length > 0 && (
							<div>
								<div className='mb-2 text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase'>
									Configuration Fields
								</div>
								<div className='space-y-3'>
									{def.fields.map((field) => (
										<div
											key={field.key}
											className='rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900'>
											<div className='mb-1 flex items-center justify-between'>
												<span className='text-xs font-semibold text-zinc-700 dark:text-zinc-200'>
													{field.label}
													{field.required && (
														<span className='ml-1 text-rose-500'>
															*
														</span>
													)}
												</span>
												<span className='rounded-full bg-zinc-200 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'>
													{field.kind}
												</span>
											</div>
											{field.help && (
												<p className='text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400'>
													{field.help}
												</p>
											)}
											{field.default !== undefined && (
												<div className='mt-1 text-[11px] text-zinc-400'>
													Default:{' '}
													<code className='font-mono'>
														{JSON.stringify(field.default)}
													</code>
												</div>
											)}
										</div>
									))}
								</div>
							</div>
						)}

						{/* Usage tip */}
						<div className='rounded-xl border border-primary-100 bg-primary-50 p-3 dark:border-primary-900/30 dark:bg-primary-950/20'>
							<div className='mb-1 flex items-center gap-1.5 text-xs font-bold text-primary-700 dark:text-primary-300'>
								<Info size={13} />
								Usage Tip
							</div>
							<p className='text-[11px] leading-relaxed text-primary-700/80 dark:text-primary-400'>
								Connect this node by dragging from output handles of upstream nodes
								to the input handles of this node. Use{' '}
								<code className='font-mono'>{'{{nodeName.outputName}}'}</code>{' '}
								syntax in text fields to reference upstream data.
							</p>
						</div>
					</div>
				)}
			</motion.div>
		</AnimatePresence>
	);
};

export default NodeDocumentationPanel;
