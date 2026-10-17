import { useState, useRef } from 'react';
import { createEditor, Editor, type Range, type RangeRef } from 'slate';
import { withHistory } from 'slate-history';
import { ReactEditor, withReact } from 'slate-react';
import { useAiPanelAvailability } from '../../_hooks/useAiPanelAvailability.hook';
import { useNavigate } from 'react-router';
import { useWorkflowEditor } from '../../_hooks/useWorkflowEditor.hook';
import { useAiChatStore } from '@/store/aiChat.store';
import { useEditorWorkspaceId } from '../../_hooks/useEditorWorkspaceId.hook';
import type { TConnector } from '@/types/connector.type';
import AccountSelect from './nodes/AccountSelect.partial';
import { usePromptAppShortcuts } from '../../_hooks/usePromptMentionItems.hook';
import PromptAppShortcuts from './PromptAppShortcuts.partial';
import PromptEditor from './PromptEditor.partial';
import { describeToolCall } from '../../_helper/builderToolCalls.helper';
import {
	connectedAccountElement,
	credentialMentionElement,
	insertAtTrigger,
	insertMention,
	promptContext,
	withMentions,
} from '../../_helper/promptEditor.helper';
import {
	Paperclip,
	Loader2,
	ArrowUp,
	Sparkles,
	AtSign,
	Mail,
	ArrowRight,
	LayoutGrid,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AttachDrawer from '@/components/common/AttachDrawer';
import { ChatAttachmentTray, FileDropOverlay } from '@/components/common/ChatAttachments';
import useFileDrop from '@/hooks/useFileDrop';
import paths from '@/Routes/paths';
import {
	IMAGE_AND_TEXT_ATTACHMENT_EXTENSIONS,
	addChatAttachments,
	canAttachFile,
} from '@/utils/chatAttachments.util';

const suggestions = [
	{
		text: 'Before every meeting, I want an AI summary of company news and salesforce contact information for every external attendee',
		icon: Mail,
		iconBg: 'bg-primary-100 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400',
	},
	{
		text: "For an email, enrich the contact with Apollo, get recent news about the company and have AI analyze whether it's a good time to reach out.",
		icon: AtSign,
		iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
	},
	{
		text: 'Build a Slackbot that returns an AI summary of recent calls from Salesforce for a contact',
		icon: 'slack',
		iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400',
	},
];

const CanvasEmptyState = () => {
	const { state, dispatch } = useWorkflowEditor();
	const workspaceId = useEditorWorkspaceId();
	const view = state.ui.emptyCanvasView ?? 'ai';
	const { isAiPanelShown } = useAiPanelAvailability();
	// The node library is its own way in: the AI prompt doesn't compete with it.
	const isPromptHidden = isAiPanelShown || state.ui.leftPanelOpen;

	const [prompt, setPrompt] = useState('');
	const [mode, setMode] = useState<'build' | 'ask'>('build');

	const [editor] = useState(() => withMentions(withHistory(withReact(createEditor()))));
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
	const [isAttachOpen, setIsAttachOpen] = useState(false);
	const addAttachments = (files: File[]) =>
		setAttachedFiles((prev) =>
			addChatAttachments(prev, files, IMAGE_AND_TEXT_ATTACHMENT_EXTENSIONS),
		);
	const fileDrop = useFileDrop(addAttachments);
	const navigate = useNavigate();
	// An app being connected from the prompt: its new account's chip goes at `at`.
	const [connecting, setConnecting] = useState<{
		connector: TConnector;
		at: RangeRef | null;
	} | null>(null);
	const appShortcuts = usePromptAppShortcuts(workspaceId);

	const startConnecting = (connector: TConnector, at?: Range) =>
		setConnecting({ connector, at: at ? Editor.rangeRef(editor, at) : null });

	const stopConnecting = () => {
		connecting?.at?.unref();
		setConnecting(null);
	};

	// After an insert from the toolbar, once Slate has rendered it.
	const focusPrompt = () => requestAnimationFrame(() => ReactEditor.focus(editor));

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files?.length) addAttachments(Array.from(files));
		e.target.value = '';
	};

	const startChat = useAiChatStore((store) => store.startChat);
	const isThinking = useAiChatStore((store) => store.isThinking);
	const runningTool = useAiChatStore((store) => {
		const tools = store.streamTimeline.filter((item) => item.kind === 'tool');
		return tools[tools.length - 1];
	});
	const currentStep =
		runningTool?.kind === 'tool'
			? describeToolCall(runningTool.toolName, runningTool.arguments, state.nodes)
			: null;

	const handleGenerate = () => {
		const cleanPrompt = prompt.trim();
		if (!cleanPrompt && attachedFiles.length === 0) return;

		// Files on their own are a complete request, as in an agent chat.
		startChat(
			cleanPrompt ||
				(mode === 'build'
					? 'Build the workflow described in the attached files.'
					: 'Please review the attached files.'),
			mode,
			attachedFiles,
			promptContext(editor),
		);
		setAttachedFiles([]);
		setIsAttachOpen(false);

		if (!state.ui.aiPanelOpen) {
			dispatch({ type: 'TOGGLE_AI_PANEL' });
		}

		// Ask mode answers in the chat: there is no build to show on the canvas.
		if (mode === 'build') dispatch({ type: 'SET_EMPTY_CANVAS_VIEW', view: 'chat-started' });
	};

	return (
		<div className='pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-6 select-none'>
			{view === 'ai' && (
				<>
					{/* Main Centered Content: steps aside for the AI Chat panel and the node library. */}
					<div
						aria-hidden={isPromptHidden}
						className={[
							'mt-12 flex flex-1 flex-col items-center justify-center',
							isPromptHidden ? 'invisible' : '',
						].join(' ')}>
						<div
							{...fileDrop.dropProps}
							className='pointer-events-auto relative w-full max-w-2xl'>
							{fileDrop.isDragging && (
								<FileDropOverlay
									hint='Images and text files, up to 25 MB'
									className='inset-0'
								/>
							)}
							<AnimatePresence mode='wait'>
								<motion.div
									key='builder'
									initial={{ opacity: 0, y: 15 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -15 }}
									transition={{ duration: 0.25 }}
									className='space-y-4'>
									{isAttachOpen && (
										<AttachDrawer
											ws={state.workflow.workspaceId ?? ''}
											docked={false}
											onClose={() => setIsAttachOpen(false)}
											onUpload={() => {
												setIsAttachOpen(false);
												fileInputRef.current?.click();
											}}
											onAttach={(file) => addAttachments([file])}
											canAttach={(filename) =>
												canAttachFile(
													filename,
													IMAGE_AND_TEXT_ATTACHMENT_EXTENSIONS,
												)
											}
											onOpenLibrary={() =>
												navigate(
													paths.library(state.workflow.workspaceId ?? ''),
												)
											}
											uploadHint='Images and text files, up to 25 MB'
										/>
									)}
									<ChatAttachmentTray
										files={attachedFiles}
										busy={false}
										onRemove={(file) =>
											setAttachedFiles((prev) =>
												prev.filter((item) => item !== file),
											)
										}
									/>
									{/* Prompter Container with Gradient Border */}
									<div className='from-primary-300 via-primary-300 dark:from-primary-900/60 dark:via-primary-900/60 relative rounded-[18px] bg-gradient-to-tr to-orange-300 p-[1px] shadow-xl shadow-zinc-200/40 dark:to-orange-900/60 dark:shadow-black/20'>
										<div className='relative z-40 rounded-[17px] bg-white/95 p-4 backdrop-blur-xl dark:bg-zinc-950/95'>
											{connecting && (
												<AccountSelect
													popupOnly
													connectorKey={connecting.connector.key}
													onChange={(id) => {
														insertMention(
															editor,
															connectedAccountElement(
																connecting.connector,
																id,
															),
															connecting.at?.current,
														);
														focusPrompt();
													}}
													onClose={stopConnecting}
												/>
											)}

											{/* Hidden File Input */}
											<input
												type='file'
												ref={fileInputRef}
												multiple
												accept={IMAGE_AND_TEXT_ATTACHMENT_EXTENSIONS.join(
													',',
												)}
												onChange={handleFileUpload}
												className='hidden'
												aria-label='Choose files to attach'
											/>

											{/* Input Container */}
											<div className='relative min-h-[90px]'>
												<PromptEditor
													editor={editor}
													workspaceId={workspaceId}
													onTextChange={setPrompt}
													onSubmit={handleGenerate}
													onPasteFiles={addAttachments}
													onConnect={startConnecting}
												/>
												{!prompt && (
													<div className='pointer-events-none absolute inset-0 space-y-1 p-0'>
														<div className='text-lg font-medium text-zinc-400 dark:text-zinc-500'>
															Describe what you want to build...
														</div>
														<div className='text-xs text-zinc-300 dark:text-zinc-700'>
															Type / to add a step or @ to use a
															connected account
														</div>
													</div>
												)}
											</div>

											{/* Action Toolbar */}
											<div className='mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800/80'>
												{/* Left side integration icons */}
												<div className='relative z-50 flex items-center gap-2.5'>
													{/* Attach Files */}
													<button
														type='button'
														onClick={() =>
															setIsAttachOpen((open) => !open)
														}
														aria-label='Add files'
														aria-expanded={isAttachOpen}
														title='Add files'
														className={`flex items-center justify-center rounded-md p-1 transition ${
															isAttachOpen
																? 'bg-zinc-100 text-zinc-800 dark:bg-white/10 dark:text-zinc-100'
																: 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'
														}`}>
														<Paperclip size={18} />
													</button>

													<span className='mx-0.5 h-3.5 w-[1px] bg-zinc-200 dark:bg-zinc-800' />

													{/* Connected apps */}
													<PromptAppShortcuts
														shortcuts={appShortcuts}
														onInsert={(credential, connector) => {
															insertMention(
																editor,
																credentialMentionElement(
																	credential,
																	connector,
																),
															);
															focusPrompt();
														}}
														onConnect={(connector) =>
															startConnecting(connector)
														}
													/>

													{/* Accounts */}
													<button
														type='button'
														// Keeps the cursor in the prompt, where the @ goes.
														onMouseDown={(event) =>
															event.preventDefault()
														}
														onClick={() => {
															insertAtTrigger(editor);
															focusPrompt();
														}}
														aria-label='Mention a connected account'
														title='Mention a connected account'
														className='flex items-center justify-center rounded-md p-1 text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'>
														<AtSign size={18} />
													</button>
												</div>

												{/* Right side controls */}
												<div className='flex items-center gap-2'>
													<div className='flex items-center rounded-xl bg-zinc-100 p-0.5 text-xs font-bold dark:bg-zinc-900'>
														<button
															type='button'
															onClick={() => setMode('build')}
															className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
																mode === 'build'
																	? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white'
																	: 'text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200'
															}`}>
															<Sparkles
																size={12}
																className={
																	mode === 'build'
																		? 'text-primary-500'
																		: ''
																}
															/>
															<span>Build</span>
														</button>
														<button
															type='button'
															onClick={() => setMode('ask')}
															className={`rounded-lg px-3 py-1.5 transition ${
																mode === 'ask'
																	? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white'
																	: 'text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200'
															}`}>
															<span>Ask</span>
														</button>
													</div>
													<button
														type='button'
														onClick={handleGenerate}
														className='bg-primary-400 text-primary-950 shadow-primary-500/10 hover:bg-primary-500 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition active:scale-95'
														title='Generate Workflow'>
														<ArrowUp size={16} strokeWidth={2.5} />
													</button>
												</div>
											</div>
										</div>
									</div>

									{/* try these examples divider line */}
									<div className='flex items-center gap-3 py-2'>
										<div className='h-[1px] flex-1 border-t border-dashed border-zinc-200 dark:border-zinc-800' />
										<div className='flex items-center gap-1.5 text-[11px] font-semibold whitespace-nowrap text-zinc-400 dark:text-zinc-500'>
											<Sparkles size={14} className='text-primary-500' />
											<span>Try these examples to get started</span>
										</div>
										<div className='h-[1px] flex-1 border-t border-dashed border-zinc-200 dark:border-zinc-800' />
									</div>

									{/* Suggestions list underneath */}
									<div className='space-y-3'>
										{suggestions.map((item, idx) => (
											<button
												key={idx}
												type='button'
												onClick={() => {
													startChat(item.text);
													if (!state.ui.aiPanelOpen) {
														dispatch({ type: 'TOGGLE_AI_PANEL' });
													}
													dispatch({
														type: 'SET_EMPTY_CANVAS_VIEW',
														view: 'chat-started',
													});
												}}
												className='flex w-full items-center justify-between rounded-2xl border border-zinc-100 bg-white/80 p-4 shadow-sm transition hover:border-zinc-200 hover:bg-white hover:shadow-md dark:border-zinc-800/40 dark:bg-zinc-950/40 dark:hover:border-zinc-800 dark:hover:bg-zinc-900'>
												<div className='flex min-w-0 flex-1 items-center gap-3.5 pr-4'>
													<div
														className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}>
														{typeof item.icon === 'string' &&
														item.icon === 'slack' ? (
															<svg
																className='h-4.5 w-4.5'
																viewBox='0 0 24 24'
																fill='currentColor'>
																<path
																	fill='#e01e5a'
																	d='M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042z'
																/>
																<path
																	fill='#36c5f0'
																	d='M8.823 5.043a2.528 2.528 0 0 1-2.52-2.52A2.528 2.528 0 0 1 8.823 0a2.528 2.528 0 0 1 2.52 2.522v2.52h-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.78a2.528 2.528 0 0 1-2.523-2.522V8.824a2.528 2.528 0 0 1 2.523-2.52h5.043z'
																/>
																<path
																	fill='#2eb67d'
																	d='M18.958 8.824a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52V8.824zm-1.261 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V3.78a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.043z'
																/>
																<path
																	fill='#ecb22e'
																	d='M15.177 18.958a2.528 2.528 0 0 1 2.52 2.52 2.528 2.528 0 0 1-2.52 2.522 2.528 2.528 0 0 1-2.522-2.522v-2.52h2.522zm0-1.261a2.528 2.528 0 0 1-2.522-2.52v-5.043a2.528 2.528 0 0 1 2.522-2.52H20.22a2.528 2.528 0 0 1 2.523 2.52v5.043a2.528 2.528 0 0 1-2.523 2.52h-5.043z'
																/>
															</svg>
														) : (
															typeof item.icon !== 'string' && (
																<item.icon size={18} />
															)
														)}
													</div>
													<span className='truncate text-left text-xs font-semibold text-zinc-700 dark:text-zinc-200'>
														{item.text}
													</span>
												</div>
												<ArrowRight
													size={14}
													className='text-zinc-400 transition hover:translate-x-0.5'
												/>
											</button>
										))}
									</div>

									{/* View more templates button */}
									<div className='flex justify-center pt-2'>
										<button
											type='button'
											onClick={() =>
												dispatch({
													type: 'SET_TEMPLATE_LIBRARY',
													open: true,
												})
											}
											className='text-primary-600 hover:text-primary-700 dark:text-primary-400 pointer-events-auto flex items-center gap-1.5 text-xs font-bold transition'>
											<LayoutGrid size={14} />
											<span>View more templates</span>
										</button>
									</div>
								</motion.div>
							</AnimatePresence>
						</div>
					</div>
				</>
			)}

			{view === 'chat-started' && (
				<div className='pointer-events-auto flex flex-1 flex-col items-center justify-center text-center select-none'>
					{isThinking ? (
						<>
							<span className='bg-primary-400/10 text-primary-500 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl'>
								<Loader2 size={22} className='animate-spin' />
							</span>
							<h2 className='text-zinc-850 text-[22px] font-extrabold dark:text-zinc-100'>
								Building your workflow
							</h2>
							<p className='mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-zinc-500 dark:text-zinc-400'>
								{currentStep ? (
									<>
										<currentStep.Icon size={13} />
										{currentStep.text}
									</>
								) : (
									'Reading your request…'
								)}
							</p>
							<p className='mt-1 text-xs text-zinc-400 dark:text-zinc-500'>
								Steps appear here as the assistant adds them.
							</p>
						</>
					) : (
						<>
							{/* Titles */}
							<h2 className='text-zinc-850 mt-5 text-[22px] font-extrabold dark:text-zinc-100'>
								Start building your workflow
							</h2>
							<p className='mt-1 mb-6 text-[13px] font-semibold text-zinc-400 dark:text-zinc-500'>
								Add steps, connect apps, and automate anything.
							</p>

							{/* Action Buttons */}
							<div className='flex items-center gap-3'>
								<button
									type='button'
									onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANEL' })}
									className='bg-primary-400 text-primary-950 shadow-primary-500/15 hover:bg-primary-500 flex h-10 items-center gap-1.5 rounded-xl px-5 text-sm font-bold shadow-md transition active:scale-97'>
									<span className='text-base font-extrabold'>+</span>
									<span>Add Step</span>
								</button>
								<button
									type='button'
									onClick={() =>
										dispatch({ type: 'SET_TEMPLATE_LIBRARY', open: true })
									}
									className='flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-700 shadow-xs transition hover:bg-zinc-50 active:scale-97 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'>
									Browse Templates
								</button>
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
};

export default CanvasEmptyState;
