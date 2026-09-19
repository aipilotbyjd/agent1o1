import { Activity, Check, Clock, Coins, Copy, ExternalLink, MessageSquare, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ExecutionLogsViewer from './ExecutionLogsViewer';
import type { DisplayItem } from '../_types/history.types';

interface HistoryDetailDrawerProps {
	selectedDetails: DisplayItem | null;
	activeWorkspaceId: string;
	copied: boolean;
	onCopyUrl: (id: string) => void;
	onClose: () => void;
}

const HistoryDetailDrawer = ({
	selectedDetails,
	activeWorkspaceId,
	copied,
	onCopyUrl,
	onClose,
}: HistoryDetailDrawerProps) => {
	return (
		<AnimatePresence>
			{selectedDetails && (
				<>
					{/* Backdrop dimmer */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.3 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-40 bg-black'
						onClick={onClose}
					/>

					{/* Drawer panel content */}
					<motion.div
						initial={{ x: '100%' }}
						animate={{ x: 0 }}
						exit={{ x: '100%' }}
						transition={{ type: 'spring' as const, stiffness: 260, damping: 28 }}
						className='dark:border-zinc-800 fixed top-0 right-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white font-sans shadow-2xl dark:bg-[#0f111a]'>
						{/* Drawer header */}
						<div className='flex items-center justify-between border-b border-slate-100 p-6 dark:border-zinc-800/80'>
							<div className='flex items-center gap-3'>
								<div className='flex h-9 w-9 items-center justify-center rounded-xl border border-primary-100 bg-primary-50 text-primary-600 dark:border-primary-900/30 dark:bg-primary-950/20 dark:text-primary-400'>
									<Activity size={17} />
								</div>
								<h2 className='text-lg font-black text-slate-900 dark:text-white'>
									{selectedDetails.type} Details
								</h2>
							</div>
							<button
								onClick={onClose}
								className='hover:text-slate-655 dark:hover:bg-zinc-800 cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-slate-100'>
								<X size={18} />
							</button>
						</div>

						{/* Drawer body */}
						<div className='no-scrollbar flex-1 space-y-6 overflow-y-auto p-6'>
							{/* Summary section */}
							<div className='space-y-4'>
								<h3 className='text-[10px] font-black tracking-widest text-slate-400 uppercase'>
									Summary
								</h3>
								<div className='grid grid-cols-3 gap-3'>
									<div className='dark:border-zinc-800 rounded-2xl border border-slate-200/50 bg-slate-50 p-3.5 text-left dark:bg-zinc-950/30'>
										<span className='mb-1 block text-[9px] font-black tracking-wider text-slate-400 uppercase'>
											Source
										</span>
										<span className='flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-zinc-200'>
											<MessageSquare size={13} className='text-primary-500' />
											{selectedDetails.type}
										</span>
									</div>
									<div className='dark:border-zinc-800 rounded-2xl border border-slate-200/50 bg-slate-50 p-3.5 text-left dark:bg-zinc-950/30'>
										<span className='mb-1 block text-[9px] font-black tracking-wider text-slate-400 uppercase'>
											Started
										</span>
										<span className='flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-zinc-200'>
											<Clock size={13} className='text-primary-500' />
											{selectedDetails.timestamp.split('•')[0].trim()}
										</span>
									</div>
									<div className='dark:border-zinc-800 rounded-2xl border border-slate-200/50 bg-slate-50 p-3.5 text-left dark:bg-zinc-950/30'>
										<span className='mb-1 block text-[9px] font-black tracking-wider text-slate-400 uppercase'>
											Credits
										</span>
										<span className='flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-zinc-200'>
											<Coins size={13} className='text-amber-500' />
											{selectedDetails.credits} Creds
										</span>
									</div>
								</div>
							</div>

							{/* Activity Logs section */}
							<div className='space-y-4'>
								<h3 className='text-[10px] font-black tracking-widest text-slate-400 uppercase'>
									Activity Logs
								</h3>

								{selectedDetails.chatTranscript ? (
									<div className='border-slate-150 dark:border-zinc-800 space-y-4 rounded-2xl border bg-slate-50/50 p-4.5 dark:bg-zinc-950/20'>
										{selectedDetails.chatTranscript.map((log, idx) => (
											<div
												key={idx}
												className={`flex flex-col gap-1.5 ${
													log.sender === 'user' ? 'items-end' : 'items-start'
												}`}>
												<span className='text-[9px] font-black tracking-wider text-slate-400 uppercase'>
													{log.sender === 'user' ? 'User Input' : 'Agent Response'}
												</span>
												<div
													className={`max-w-[85%] rounded-2xl border p-3 text-xs leading-relaxed font-semibold shadow-xs ${
														log.sender === 'user'
															? 'bg-primary-400 border-primary-700 rounded-tr-none text-primary-950'
															: 'text-slate-850 rounded-tl-none border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
													}`}>
													{log.text}
												</div>
											</div>
										))}
									</div>
								) : (
									<ExecutionLogsViewer
										ws={activeWorkspaceId}
										executionId={selectedDetails.id}
									/>
								)}
							</div>
						</div>

						{/* Drawer footer */}
						<div className='flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-6 dark:border-zinc-800/80 dark:bg-zinc-950/40'>
							<button
								onClick={() => onCopyUrl(selectedDetails.id)}
								className='dark:hover:bg-zinc-800 flex h-11 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4.5 text-xs font-black text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'>
								{copied ? (
									<Check size={14} className='text-primary-500' />
								) : (
									<Copy size={14} />
								)}
								<span>{copied ? 'Copied URL!' : 'Copy URL'}</span>
							</button>
							<button
								onClick={onClose}
								className='flex h-11 cursor-pointer items-center gap-1.5 rounded-xl bg-slate-950 px-5 text-xs font-black text-white shadow-md transition active:scale-95 dark:bg-zinc-100 dark:text-slate-950'>
								<span>Close View</span>
								<ExternalLink size={14} />
							</button>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
};

export default HistoryDetailDrawer;
