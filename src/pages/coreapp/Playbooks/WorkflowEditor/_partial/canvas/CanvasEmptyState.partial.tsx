import { useState, useEffect, useRef } from 'react';
import { useWorkflowEditor } from '../../_hooks/useWorkflowEditor.hook';
import { useAiChatStore } from '@/store/aiChat.store';
import {
	Paperclip,
	Sliders,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ArrowUp,
	Sparkles,
	Check,
	Loader2,
	AtSign,
	Mail,
	ArrowRight,
	LayoutGrid,
	Cloud,
	Webhook,
	Zap,
	Beaker,
	Image as ImageIcon,
	Bot,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
	const view = state.ui.emptyCanvasView ?? 'ai';

	const [prompt, setPrompt] = useState('');
	const [mode, setMode] = useState<'build' | 'ask'>('build');
	const [isGenerating, setIsGenerating] = useState(false);
	const [generationStep, setGenerationStep] = useState(0);

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string }[]>([]);
	const [activeDropdown, setActiveDropdown] = useState<
		'files' | 'config' | 'cloud' | 'gmail' | 'slack' | null
	>(null);
	const [autocompleteState, setAutocompleteState] = useState<{
		type: 'slash' | 'at';
		query: string;
		position: number;
	} | null>(null);
	const [config, setConfig] = useState({
		temperature: 0.7,
		maxTokens: 2048,
		persona: 'Standard Builder',
	});
	const [connectedIntegrations, setConnectedIntegrations] = useState<Record<string, boolean>>({
		slack: false,
		gmail: false,
		salesforce: false,
	});

	const autocompleteItems = {
		slash: [
			{
				key: 'webhook',
				label: 'Webhook Trigger',
				value: '[Webhook Trigger]',
				icon: <Webhook size={14} className='text-emerald-500' />,
			},
			{
				key: 'image',
				label: 'Image Generation',
				value: '[Image Generation]',
				icon: <ImageIcon size={14} className='text-primary-500' />,
			},
			{
				key: 'slack',
				label: 'Slack Output',
				value: '[Slack Output]',
				icon: (
					<svg
						className='text-primary-500 h-3.5 w-3.5 animate-pulse'
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
				),
			},
			{
				key: 'gmail',
				label: 'Gmail Email',
				value: '[Gmail Email]',
				icon: <Mail size={14} className='text-red-500' />,
			},
			{
				key: 'salesforce',
				label: 'Salesforce Router',
				value: '[Salesforce Router]',
				icon: <Cloud size={14} className='text-primary-500' />,
			},
		],
		at: [
			{
				key: 'salesforce',
				label: 'Salesforce Account',
				value: '@Salesforce',
				icon: <Cloud size={14} className='text-primary-500' />,
			},
			{
				key: 'gmail',
				label: 'Gmail Account',
				value: '@Gmail',
				icon: <Mail size={14} className='text-red-500' />,
			},
			{
				key: 'slack',
				label: 'Slack Account',
				value: '@Slack',
				icon: (
					<svg
						className='text-primary-500 h-3.5 w-3.5'
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
				),
			},
		],
	};

	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const val = e.target.value;
		setPrompt(val);

		const cursorPosition = e.target.selectionStart;
		const textBeforeCursor = val.slice(0, cursorPosition);
		const words = textBeforeCursor.split(/\s/);
		const lastWord = words[words.length - 1];

		if (lastWord.startsWith('/')) {
			setAutocompleteState({
				type: 'slash',
				query: lastWord.slice(1),
				position: cursorPosition,
			});
		} else if (lastWord.startsWith('@')) {
			setAutocompleteState({
				type: 'at',
				query: lastWord.slice(1),
				position: cursorPosition,
			});
		} else {
			setAutocompleteState(null);
		}
	};

	const handleSelectAutocomplete = (item: { label: string; value: string }) => {
		if (!autocompleteState) return;
		const cursor = autocompleteState.position;
		const before = prompt.slice(0, cursor);
		const after = prompt.slice(cursor);

		const words = before.split(/\s/);
		words[words.length - 1] = item.value;

		const newBefore = words.join(' ');
		setPrompt(`${newBefore} ${after}`);
		setAutocompleteState(null);

		if (textareaRef.current) {
			textareaRef.current.focus();
			const newCursorPos = newBefore.length + 1;
			setTimeout(() => {
				if (textareaRef.current) {
					textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
				}
			}, 10);
		}
	};

	const filteredAutocompleteItems = autocompleteState
		? autocompleteItems[autocompleteState.type].filter(
				(item) =>
					item.label.toLowerCase().includes(autocompleteState.query.toLowerCase()) ||
					item.value.toLowerCase().includes(autocompleteState.query.toLowerCase()),
			)
		: [];

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;
		const file = files[0];
		const sizeKb = Math.round(file.size / 1024);
		setAttachedFiles((prev) => [...prev, { name: file.name, size: `${sizeKb} KB` }]);
		setActiveDropdown(null);
	};

	const steps = [
		'Analyzing prompt instructions...',
		'Identifying third-party integration components...',
		'Assembling canvas nodes & endpoints...',
		'Finalizing flow layout and links...',
	];

	useEffect(() => {
		if (!isGenerating) return;

		const interval = setInterval(() => {
			setGenerationStep((prev) => {
				if (prev < steps.length - 1) {
					return prev + 1;
				} else {
					clearInterval(interval);
					// Finish generation and place nodes
					setTimeout(() => {
						setIsGenerating(false);
						dispatch({
							type: 'ADD_TEMPLATE',
							name: prompt ? `${prompt.slice(0, 32)}...` : 'AI Generated Workflow',
							defKeys: ['trigger.webhook', 'ai.agent', 'int.slack', 'output.display'],
						});
					}, 500);
					return prev;
				}
			});
		}, 800);

		return () => clearInterval(interval);
	}, [isGenerating, prompt, dispatch, steps.length]);

	const startChat = useAiChatStore((store) => store.startChat);
	const workflowBuildStep = useAiChatStore((store) => store.workflowBuildStep);

	const handleGenerate = () => {
		const cleanPrompt = prompt.trim();
		if (!cleanPrompt) return;

		startChat(cleanPrompt);

		if (!state.ui.aiPanelOpen) {
			dispatch({ type: 'TOGGLE_AI_PANEL' });
		}

		dispatch({ type: 'SET_EMPTY_CANVAS_VIEW', view: 'chat-started' });
	};

	return (
		<div className='pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-6 select-none'>
			{view === 'ai' && (
				<>
					{/* Main Centered Content */}
					<div className='mt-12 flex flex-1 flex-col items-center justify-center'>
						<div className='pointer-events-auto w-full max-w-2xl'>
							<AnimatePresence mode='wait'>
								{!isGenerating ? (
									<motion.div
										key='builder'
										initial={{ opacity: 0, y: 15 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -15 }}
										transition={{ duration: 0.25 }}
										className='space-y-4'>
										{/* Prompter Container with Gradient Border */}
										<div className='from-primary-300 via-primary-300 dark:from-primary-900/60 dark:via-primary-900/60 relative rounded-[18px] bg-gradient-to-tr to-orange-300 p-[1px] shadow-xl shadow-zinc-200/40 dark:to-orange-900/60 dark:shadow-black/20'>
											{/* Backdrop Click Close for Dropdowns */}
											{activeDropdown !== null && (
												<div
													aria-hidden='true'
													className='fixed inset-0 z-40 bg-transparent'
													onClick={() => setActiveDropdown(null)}
												/>
											)}

											<div className='relative z-40 rounded-[17px] bg-white/95 p-4 backdrop-blur-xl dark:bg-zinc-950/95'>
												{/* Autocomplete Dropdown List */}
												{autocompleteState &&
													filteredAutocompleteItems.length > 0 && (
														<div className='dark:border-zinc-850 absolute bottom-full left-4 z-50 mb-2 max-h-48 w-60 overflow-y-auto rounded-xl border border-zinc-200 bg-white/95 p-2 shadow-xl backdrop-blur-md dark:bg-zinc-950/95'>
															<div className='px-2 py-1.5 text-[9px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
																{autocompleteState.type === 'slash'
																	? 'Insert Component'
																	: 'Add Data Source'}
															</div>
															{filteredAutocompleteItems.map(
																(item) => (
																	<button
																		key={item.key}
																		type='button'
																		onClick={() =>
																			handleSelectAutocomplete(
																				item,
																			)
																		}
																		className='flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs text-zinc-700 transition hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/[0.04]'>
																		{item.icon}
																		<span className='font-semibold'>
																			{item.label}
																		</span>
																	</button>
																),
															)}
														</div>
													)}

												{/* Hidden File Input */}
												<input
													type='file'
													ref={fileInputRef}
													onChange={handleFileUpload}
													className='hidden'
												/>

												{/* Input Container */}
												<div className='relative min-h-[90px]'>
													<textarea
														ref={textareaRef}
														value={prompt}
														onChange={handleTextareaChange}
														onKeyDown={(e) => {
															if (e.key === 'Enter' && !e.shiftKey) {
																e.preventDefault();
																handleGenerate();
															}
														}}
														aria-label='Prompt description'
														className='min-h-[90px] w-full resize-none border-none bg-transparent p-0 text-lg font-medium text-zinc-800 placeholder-transparent outline-none focus:ring-0 focus:outline-none dark:text-zinc-100'
														style={{
															border: 'none',
															outline: 'none',
															boxShadow: 'none',
														}}
													/>
													{!prompt && (
														<div className='pointer-events-none absolute inset-0 space-y-1 p-0'>
															<div className='text-lg font-medium text-zinc-400 dark:text-zinc-500'>
																Describe what you want to build...
															</div>
															<div className='text-xs text-zinc-300 dark:text-zinc-700'>
																Type / to insert components or @ to
																add data
															</div>
														</div>
													)}
												</div>

												{/* Attached Files List */}
												{attachedFiles.length > 0 && (
													<div className='flex flex-wrap gap-1.5 pb-2.5'>
														{attachedFiles.map((file, idx) => (
															<div
																key={idx}
																className='text-zinc-750 flex items-center gap-1.5 rounded-lg border border-zinc-200/60 bg-zinc-50 px-2 py-1 text-[11px] font-semibold dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-300'>
																<Paperclip
																	size={10}
																	className='text-zinc-400'
																/>
																<span className='max-w-40 truncate'>
																	{file.name}
																</span>
																<span className='text-[9px] font-medium text-zinc-400'>
																	({file.size})
																</span>
																<button
																	aria-label='Remove attached file'
																	type='button'
																	onClick={() =>
																		setAttachedFiles((prev) =>
																			prev.filter(
																				(_, i) => i !== idx,
																			),
																		)
																	}
																	className='text-zinc-450 rounded p-0.5 transition hover:text-red-500'>
																	<svg
																		className='h-2.5 w-2.5 stroke-current'
																		fill='none'
																		viewBox='0 0 24 24'
																		strokeWidth='3'>
																		<path d='M6 18L18 6M6 6l12 12' />
																	</svg>
																</button>
															</div>
														))}
													</div>
												)}

												{/* Action Toolbar */}
												<div className='mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800/80'>
													{/* Left side integration icons */}
													<div className='relative z-50 flex items-center gap-2.5'>
														{/* Attach Files */}
														<div className='relative'>
															<button
																type='button'
																onClick={() =>
																	setActiveDropdown((prev) =>
																		prev === 'files'
																			? null
																			: 'files',
																	)
																}
																aria-label='Attach files'
																className='flex items-center justify-center rounded-md p-1 text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'>
																<Paperclip size={18} />
															</button>
															{activeDropdown === 'files' && (
																<div className='absolute bottom-full left-0 z-50 mb-2.5 w-64 rounded-xl border border-zinc-200 bg-white/95 p-3 text-left shadow-xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95'>
																	<div className='mb-2 flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800/50'>
																		<Paperclip
																			size={14}
																			className='text-zinc-500'
																		/>
																		<span className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>
																			Attach Files
																		</span>
																	</div>
																	<div className='space-y-1'>
																		<button
																			type='button'
																			onClick={() =>
																				fileInputRef.current?.click()
																			}
																			className='dark:text-zinc-350 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:hover:bg-white/[0.04]'>
																			<span>
																				Upload from
																				device...
																			</span>
																		</button>
																		<button
																			type='button'
																			onClick={() => {
																				setAttachedFiles(
																					(prev) => [
																						...prev,
																						{
																							name: 'sales_leads_june.csv',
																							size: '42 KB',
																						},
																					],
																				);
																				setActiveDropdown(
																					null,
																				);
																			}}
																			className='dark:text-zinc-350 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:hover:bg-white/[0.04]'>
																			<span className='truncate'>
																				Add
																				sales_leads_june.csv
																			</span>
																		</button>
																		<button
																			type='button'
																			onClick={() => {
																				setAttachedFiles(
																					(prev) => [
																						...prev,
																						{
																							name: 'meeting_notes.pdf',
																							size: '128 KB',
																						},
																					],
																				);
																				setActiveDropdown(
																					null,
																				);
																			}}
																			className='dark:text-zinc-355 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:hover:bg-white/[0.04]'>
																			<span className='truncate'>
																				Add
																				meeting_notes.pdf
																			</span>
																		</button>
																	</div>
																</div>
															)}
														</div>

														{/* Configurations */}
														<div className='relative'>
															<button
																type='button'
																onClick={() =>
																	setActiveDropdown((prev) =>
																		prev === 'config'
																			? null
																			: 'config',
																	)
																}
																aria-label='Configurations'
																className='flex items-center justify-center rounded-md p-1 text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'>
																<Sliders size={18} />
															</button>
															{activeDropdown === 'config' && (
																<div className='absolute bottom-full left-0 z-50 mb-2.5 w-64 rounded-xl border border-zinc-200 bg-white/95 p-3.5 text-left shadow-xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95'>
																	<div className='mb-3 flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800/50'>
																		<Sliders
																			size={14}
																			className='text-zinc-500'
																		/>
																		<span className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>
																			Builder Configuration
																		</span>
																	</div>
																	<div className='space-y-3.5'>
																		<div>
																			<div className='mb-1 flex justify-between text-[10px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
																				<span>
																					Temperature
																				</span>
																				<span className='text-primary-600 dark:text-primary-400'>
																					{
																						config.temperature
																					}
																				</span>
																			</div>
																			<input
																				type='range'
																				min='0'
																				max='1'
																				step='0.1'
																				value={
																					config.temperature
																				}
																				onChange={(e) =>
																					setConfig(
																						(prev) => ({
																							...prev,
																							temperature:
																								parseFloat(
																									e
																										.target
																										.value,
																								),
																						}),
																					)
																				}
																				className='accent-primary-600 dark:accent-primary-400 w-full'
																			/>
																		</div>
																		<div>
																			<div className='text-zinc-505 mb-1 flex justify-between text-[10px] font-bold tracking-wider uppercase dark:text-zinc-400'>
																				<span>
																					Max Tokens
																				</span>
																				<span className='text-primary-600 dark:text-primary-400'>
																					{
																						config.maxTokens
																					}
																				</span>
																			</div>
																			<input
																				type='range'
																				min='256'
																				max='4096'
																				step='256'
																				value={
																					config.maxTokens
																				}
																				onChange={(e) =>
																					setConfig(
																						(prev) => ({
																							...prev,
																							maxTokens:
																								parseInt(
																									e
																										.target
																										.value,
																								),
																						}),
																					)
																				}
																				className='accent-primary-600 dark:accent-primary-400 w-full'
																			/>
																		</div>
																		<div>
																			<span className='mb-1 block text-[10px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
																				Persona
																			</span>
																			<div className='flex flex-wrap gap-1.5'>
																				{[
																					'Standard',
																					'Strict',
																					'Creative',
																				].map((p) => (
																					<button
																						key={p}
																						type='button'
																						onClick={() =>
																							setConfig(
																								(
																									prev,
																								) => ({
																									...prev,
																									persona:
																										p,
																								}),
																							)
																						}
																						className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
																							config.persona ===
																							p
																								? 'bg-primary-400 text-primary-950 dark:bg-primary-400'
																								: 'text-zinc-650 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
																						}`}>
																						{p}
																					</button>
																				))}
																			</div>
																		</div>
																	</div>
																</div>
															)}
														</div>

														<span className='mx-0.5 h-3.5 w-[1px] bg-zinc-200 dark:bg-zinc-800' />

														{/* Cloud / Salesforce icon */}
														<div className='relative'>
															<button
																type='button'
																onClick={() =>
																	setActiveDropdown((prev) =>
																		prev === 'cloud'
																			? null
																			: 'cloud',
																	)
																}
																className='text-primary-600 dark:text-primary-400 flex items-center justify-center rounded-md p-1 transition hover:bg-zinc-50 dark:hover:bg-zinc-900'
																title='Cloud Services'>
																<Cloud
																	size={18}
																	className='fill-primary-600/10'
																/>
															</button>
															{activeDropdown === 'cloud' && (
																<div className='absolute bottom-full left-0 z-50 mb-2.5 w-64 rounded-xl border border-zinc-200 bg-white/95 p-3 text-left shadow-xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95'>
																	<div className='mb-2 flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800/50'>
																		<Cloud
																			size={14}
																			className='text-primary-600 dark:text-primary-400'
																		/>
																		<span className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>
																			Salesforce Integration
																		</span>
																	</div>
																	<div className='flex flex-col space-y-1'>
																		<button
																			type='button'
																			onClick={() => {
																				setPrompt(
																					(p) =>
																						`${
																							p
																						} @Salesforce`,
																				);
																				setActiveDropdown(
																					null,
																				);
																			}}
																			className='text-zinc-750 dark:text-zinc-350 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition hover:bg-zinc-50 dark:hover:bg-white/[0.04]'>
																			<span>
																				Insert @Salesforce
																			</span>
																		</button>
																		<button
																			type='button'
																			onClick={() => {
																				setConnectedIntegrations(
																					(prev) => ({
																						...prev,
																						salesforce: true,
																					}),
																				);
																				dispatch({
																					type: 'SET_LINK_CREDENTIALS_OPEN',
																					open: true,
																				});
																				setActiveDropdown(
																					null,
																				);
																			}}
																			className='dark:text-zinc-350 flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:hover:bg-white/[0.04]'>
																			<span>
																				Link Salesforce
																				account...
																			</span>
																			{connectedIntegrations.salesforce ? (
																				<span className='text-[10px] font-bold text-emerald-500'>
																					Connected
																				</span>
																			) : (
																				<span className='text-[10px] font-medium text-zinc-400'>
																					Not Linked
																				</span>
																			)}
																		</button>
																	</div>
																</div>
															)}
														</div>

														{/* Gmail icon */}
														<div className='relative'>
															<button
																type='button'
																onClick={() =>
																	setActiveDropdown((prev) =>
																		prev === 'gmail'
																			? null
																			: 'gmail',
																	)
																}
																className='flex items-center justify-center rounded-md p-1 text-red-500 transition hover:bg-zinc-50 dark:hover:bg-zinc-900'
																title='Gmail'
																aria-label='Gmail'>
																<svg
																	className='h-4.5 w-4.5 fill-current'
																	viewBox='0 0 24 24'>
																	<path d='M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 6l8 5 8-5v2l-8 5-8-5V6z' />
																</svg>
															</button>
															{activeDropdown === 'gmail' && (
																<div className='absolute bottom-full left-0 z-50 mb-2.5 w-64 rounded-xl border border-zinc-200 bg-white/95 p-3 text-left shadow-xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95'>
																	<div className='mb-2 flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800/50'>
																		<Mail
																			size={14}
																			className='text-red-500'
																		/>
																		<span className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>
																			Gmail Integration
																		</span>
																	</div>
																	<div className='flex flex-col space-y-1'>
																		<button
																			type='button'
																			onClick={() => {
																				setPrompt(
																					(p) =>
																						`${
																							p
																						} @Gmail`,
																				);
																				setActiveDropdown(
																					null,
																				);
																			}}
																			className='dark:text-zinc-350 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:hover:bg-white/[0.04]'>
																			<span>
																				Insert @Gmail
																			</span>
																		</button>
																		<button
																			type='button'
																			onClick={() => {
																				setConnectedIntegrations(
																					(prev) => ({
																						...prev,
																						gmail: true,
																					}),
																				);
																				dispatch({
																					type: 'SET_LINK_CREDENTIALS_OPEN',
																					open: true,
																				});
																				setActiveDropdown(
																					null,
																				);
																			}}
																			className='dark:text-zinc-350 flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:hover:bg-white/[0.04]'>
																			<span>
																				Link Gmail
																				account...
																			</span>
																			{connectedIntegrations.gmail ? (
																				<span className='text-[10px] font-bold text-emerald-500'>
																					Connected
																				</span>
																			) : (
																				<span className='text-[10px] font-medium text-zinc-400'>
																					Not Linked
																				</span>
																			)}
																		</button>
																	</div>
																</div>
															)}
														</div>

														{/* Slack icon */}
														<div className='relative'>
															<button
																type='button'
																onClick={() =>
																	setActiveDropdown((prev) =>
																		prev === 'slack'
																			? null
																			: 'slack',
																	)
																}
																className='text-primary-600 flex items-center justify-center rounded-md p-1 transition hover:bg-zinc-50 dark:hover:bg-zinc-900'
																title='Slack'
																aria-label='Slack'>
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
															</button>
															{activeDropdown === 'slack' && (
																<div className='absolute bottom-full left-0 z-50 mb-2.5 w-64 rounded-xl border border-zinc-200 bg-white/95 p-3 text-left shadow-xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95'>
																	<div className='mb-2 flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800/50'>
																		<svg
																			className='text-primary-500 h-3.5 w-3.5 animate-pulse'
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
																		<span className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>
																			Slack Integration
																		</span>
																	</div>
																	<div className='flex flex-col space-y-1'>
																		<button
																			type='button'
																			onClick={() => {
																				setPrompt(
																					(p) =>
																						`${
																							p
																						} @Slack`,
																				);
																				setActiveDropdown(
																					null,
																				);
																			}}
																			className='dark:text-zinc-350 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:hover:bg-white/[0.04]'>
																			<span>
																				Insert @Slack
																			</span>
																		</button>
																		<button
																			type='button'
																			onClick={() => {
																				setConnectedIntegrations(
																					(prev) => ({
																						...prev,
																						slack: true,
																					}),
																				);
																				dispatch({
																					type: 'SET_LINK_CREDENTIALS_OPEN',
																					open: true,
																				});
																				setActiveDropdown(
																					null,
																				);
																			}}
																			className='dark:text-zinc-350 flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:hover:bg-white/[0.04]'>
																			<span>
																				Link Slack
																				account...
																			</span>
																			{connectedIntegrations.slack ? (
																				<span className='text-[10px] font-bold text-emerald-500'>
																					Connected
																				</span>
																			) : (
																				<span className='text-[10px] font-medium text-zinc-400'>
																					Not Linked
																				</span>
																			)}
																		</button>
																	</div>
																</div>
															)}
														</div>
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
								) : (
									<motion.div
										key='generator'
										initial={{ opacity: 0, scale: 0.96 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.96 }}
										className='mx-auto flex w-full max-w-md flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white/95 p-8 text-center shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95'>
										<div className='bg-primary-400/10 text-primary-500 shadow-primary-500/10 relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg'>
											<Loader2 size={32} className='animate-spin' />
											<Sparkles
												size={16}
												className='text-primary-400 absolute top-2 right-2 animate-pulse'
											/>
										</div>
										<h3 className='text-base font-extrabold text-zinc-800 dark:text-zinc-100'>
											AI is building your flow
										</h3>
										<p className='mt-1 mb-6 text-xs font-medium text-zinc-400 dark:text-zinc-500'>
											Creating workspace nodes, logic cards, and pipeline
											triggers...
										</p>

										{/* Step list */}
										<div className='w-full space-y-2.5 border-t border-zinc-100 pt-5 text-left dark:border-zinc-800/80'>
											{steps.map((step, idx) => {
												const isDone = generationStep > idx;
												const isActive = generationStep === idx;
												return (
													<div
														key={idx}
														className={`flex items-center gap-3 transition-colors ${
															isDone
																? 'text-emerald-500'
																: isActive
																	? 'text-primary-500 font-bold'
																	: 'text-zinc-300 dark:text-zinc-700'
														}`}>
														<div
															className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition ${
																isDone
																	? 'border-emerald-500 bg-emerald-500 text-white'
																	: isActive
																		? 'border-primary-500 bg-primary-400 text-primary-950 animate-pulse'
																		: 'border-zinc-200 bg-transparent text-zinc-400 dark:border-zinc-800'
															}`}>
															{isDone ? (
																<Check size={10} strokeWidth={3} />
															) : (
																idx + 1
															)}
														</div>
														<span className='text-[11px] font-semibold'>
															{step}
														</span>
													</div>
												);
											})}
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</div>

					{/* Custom Bottom Bar overlay */}
					<div className='pointer-events-auto absolute right-0 bottom-0 left-0 flex h-12 items-center justify-between border-t border-zinc-200 bg-white/95 px-4 text-xs backdrop-blur select-none dark:border-white/10 dark:bg-[#090a0f]/95'>
						{/* Left items */}
						<div className='flex items-center gap-3'>
							<button
								type='button'
								aria-label='Add node'
								className='bg-primary-400 text-primary-950 shadow-primary-500/25 hover:bg-primary-500 flex h-6 w-6 items-center justify-center rounded-full shadow-md transition active:scale-95'>
								<span className='text-base leading-none font-bold'>+</span>
							</button>
							<button
								type='button'
								className='flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'>
								<span>Flow</span>
								<ChevronDown size={13} className='text-zinc-400' />
							</button>
						</div>

						{/* Center controls */}
						<div className='flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900'>
							<button
								type='button'
								aria-label='Previous'
								className='text-zinc-400 transition hover:text-zinc-800 dark:hover:text-zinc-200'>
								<ChevronLeft size={16} />
							</button>
							<button
								type='button'
								aria-label='Next'
								className='text-zinc-400 transition hover:text-zinc-800 dark:hover:text-zinc-200'>
								<ChevronRight size={16} />
							</button>
							<span className='mx-1 h-3.5 w-[1px] bg-zinc-200 dark:bg-zinc-800' />
							<button
								type='button'
								className='flex items-center gap-1 font-bold text-zinc-600 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'>
								<span>75%</span>
								<ChevronDown size={12} className='text-zinc-400' />
							</button>
						</div>

						{/* Right items - Spacer for the floating ActionBar */}
						<div className='w-[240px] shrink-0' />
					</div>
				</>
			)}

			{view === 'chat-started' && (
				<>
					{/* Onboarding Welcome Canvas */}
					<div className='pointer-events-auto mt-[-40px] flex flex-1 flex-col items-center justify-center select-none'>
						{/* Node Diagram */}
						<div className='relative flex h-[320px] w-[780px] items-center justify-center'>
							{/* Connection curves background */}
							<svg
								className='pointer-events-none absolute inset-0 h-full w-full'
								style={{ zIndex: 0 }}>
								{/* Trigger to Action curve */}
								<motion.path
									d='M 220 160 C 240 160, 240 175, 250 175 C 260 175, 260 160, 280 160'
									stroke='rgba(161, 161, 170, 0.4)'
									strokeWidth='1.5'
									strokeDasharray='4 4'
									fill='none'
									initial={{ pathLength: 0 }}
									animate={{ pathLength: workflowBuildStep >= 2 ? 1 : 0 }}
									transition={{ duration: 0.5, ease: 'easeInOut' }}
								/>
								{/* Action to Output curve */}
								<motion.path
									d='M 500 160 C 520 160, 520 175, 530 175 C 540 175, 540 160, 560 160'
									stroke='rgba(161, 161, 170, 0.4)'
									strokeWidth='1.5'
									strokeDasharray='4 4'
									fill='none'
									initial={{ pathLength: 0 }}
									animate={{ pathLength: workflowBuildStep >= 3 ? 1 : 0 }}
									transition={{ duration: 0.5, ease: 'easeInOut' }}
								/>
							</svg>

							{/* Node 1: Webhook Trigger Card */}
							<AnimatePresence>
								{workflowBuildStep >= 1 && (
									<motion.div
										initial={{ opacity: 0, scale: 0.9, y: 15 }}
										animate={{ opacity: 1, scale: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.9, y: 15 }}
										whileHover={{ y: -4, scale: 1.02 }}
										transition={{ duration: 0.3 }}
										className='absolute top-[45px] left-0 z-10 w-[220px] rounded-xl border-2 border-emerald-500 bg-white p-1 text-left shadow-lg dark:border-emerald-500 dark:bg-zinc-950'>
										<div className='rounded-lg bg-emerald-500/5 p-2.5 dark:bg-emerald-500/5'>
											{/* Header */}
											<div className='flex items-start gap-2'>
												<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'>
													<Webhook size={18} strokeWidth={2.5} />
												</div>
												<div className='min-w-0 flex-1'>
													<div className='mb-0.5 flex items-center justify-between gap-1'>
														<span className='flex min-w-0 items-center gap-0.5'>
															<span className='shrink-0 text-emerald-600 dark:text-emerald-400'>
																<Webhook size={10} />
															</span>
															<span className='truncate text-[9px] font-bold tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
																TRIGGER
															</span>
														</span>
														<span className='inline-flex shrink-0 items-center gap-0.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-zinc-500 uppercase dark:bg-zinc-800 dark:text-zinc-400'>
															IDLE
														</span>
													</div>
													<div className='truncate text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100'>
														Webhook Trigger
													</div>
												</div>
											</div>

											{/* Description */}
											<div className='mt-1 line-clamp-1 text-[9px] leading-tight text-zinc-500 dark:text-zinc-400'>
												Starts the flow on HTTP POST request.
											</div>

											{/* Mock Fields */}
											<div className='mt-2.5 space-y-2'>
												<div>
													<span className='mb-1 block text-[8px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
														Webhook URL
													</span>
													<div className='flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-zinc-700 shadow-xs select-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'>
														<span className='truncate text-zinc-500 dark:text-zinc-400'>
															https://api.agent101.co/v1/web...
														</span>
													</div>
												</div>
												<div>
													<span className='mb-1 block text-[8px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
														Method
													</span>
													<div className='flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-zinc-700 shadow-xs select-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'>
														<span>POST</span>
														<ChevronDown
															size={12}
															className='shrink-0 text-zinc-400'
														/>
													</div>
												</div>
											</div>

											{/* Inline Action Button */}
											<div className='mt-3'>
												<button
													type='button'
													className='dark:hover:text-emerald-455 flex w-full items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white py-1 text-[10px] font-bold text-zinc-500 transition hover:border-emerald-300 hover:text-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-900'>
													<Beaker size={11} />
													<span>Test Trigger</span>
												</button>
											</div>
										</div>

										{/* Step Number Circle */}
										<div className='dark:text-emerald-450 absolute -bottom-2.5 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border-2 border-emerald-500 bg-white text-[9px] font-bold text-emerald-600 shadow-xs dark:bg-zinc-900'>
											1
										</div>

										{/* Handle right port */}
										<span
											aria-hidden
											className='absolute top-1/2 -right-2 z-20 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-400 bg-white text-[10px] font-bold text-emerald-500 shadow-xs hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-800 dark:bg-zinc-900 dark:hover:bg-emerald-950/30'>
											+
										</span>
									</motion.div>
								)}
							</AnimatePresence>

							{/* Node 2: Image Generation Card (AI/Action) */}
							<AnimatePresence>
								{workflowBuildStep >= 2 && (
									<motion.div
										initial={{ opacity: 0, scale: 0.9, y: 15 }}
										animate={{ opacity: 1, scale: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.9, y: 15 }}
										whileHover={{ y: -4, scale: 1.02 }}
										transition={{ duration: 0.3 }}
										className='border-primary-500 dark:border-primary-500 shadow-primary-500/50 ring-primary-500/10 absolute top-[45px] left-[280px] z-10 w-[220px] rounded-xl border-2 bg-white p-1 text-left shadow-lg ring-4 dark:bg-zinc-950 dark:shadow-none'>
										{/* Floating Toolbar like Mockup 1 */}
										<div className='text-zinc-650 dark:text-zinc-350 shadow-zinc-250/50 absolute -top-[44px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[9px] font-bold whitespace-nowrap shadow-md dark:border-zinc-800 dark:bg-zinc-900'>
											<span className='flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 hover:bg-zinc-50 dark:hover:bg-zinc-800'>
												<svg
													className='text-zinc-505 h-3 w-3'
													fill='none'
													viewBox='0 0 24 24'
													stroke='currentColor'
													strokeWidth='2.5'>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														d='M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2'
													/>
												</svg>
												<span>Duplicate</span>
											</span>
											<span className='flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 hover:bg-zinc-50 dark:hover:bg-zinc-800'>
												<svg
													className='text-zinc-505 h-3 w-3'
													fill='none'
													viewBox='0 0 24 24'
													stroke='currentColor'
													strokeWidth='2.5'>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
													/>
												</svg>
												<span>Rename</span>
											</span>
											<span className='flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 hover:bg-zinc-50 dark:hover:bg-zinc-800'>
												<svg
													className='text-zinc-505 h-3 w-3'
													fill='none'
													viewBox='0 0 24 24'
													stroke='currentColor'
													strokeWidth='2.5'>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														d='M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4'
													/>
												</svg>
												<span>Inputs</span>
											</span>
											<span className='flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 hover:bg-zinc-50 dark:hover:bg-zinc-800'>
												<svg
													className='text-zinc-505 h-3 w-3'
													fill='none'
													viewBox='0 0 24 24'
													stroke='currentColor'
													strokeWidth='2.5'>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z'
													/>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
													/>
												</svg>
												<span>Test</span>
											</span>
											<span className='flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30'>
												<svg
													className='h-3 w-3 text-rose-500'
													fill='none'
													viewBox='0 0 24 24'
													stroke='currentColor'
													strokeWidth='2.5'>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
													/>
												</svg>
												<span>Delete</span>
											</span>
										</div>

										<div className='bg-primary-400/5 dark:bg-primary-400/5 rounded-lg p-2.5'>
											{/* Header */}
											<div className='flex items-start gap-2'>
												<div className='bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'>
													<ImageIcon size={18} strokeWidth={2.5} />
												</div>
												<div className='min-w-0 flex-1'>
													<div className='mb-0.5 flex items-center justify-between gap-1'>
														<span className='flex min-w-0 items-center gap-0.5'>
															<span className='text-primary-600 dark:text-primary-400 shrink-0'>
																<Bot size={10} />
															</span>
															<span className='truncate text-[9px] font-bold tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
																AI
															</span>
														</span>
														<span className='inline-flex shrink-0 items-center gap-0.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-zinc-500 uppercase dark:bg-zinc-800 dark:text-zinc-400'>
															IDLE
														</span>
													</div>
													<div className='truncate text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100'>
														Image Generation
													</div>
												</div>
											</div>

											{/* Description */}
											<div className='mt-1 line-clamp-1 text-[9px] leading-tight text-zinc-500 dark:text-zinc-400'>
												Generate images from text prompts using AI.
											</div>

											{/* Mock Fields */}
											<div className='mt-2.5 space-y-2'>
												<div>
													<span className='mb-1 block text-[8px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
														Provider
													</span>
													<div className='flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-zinc-700 shadow-xs select-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'>
														<span>Gemini</span>
														<ChevronDown
															size={12}
															className='shrink-0 text-zinc-400'
														/>
													</div>
												</div>
												<div>
													<span className='mb-1 block text-[8px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
														Model
													</span>
													<div className='flex h-[29px] w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-zinc-700 shadow-xs select-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'>
														<span className='dark:text-zinc-550 text-zinc-400'>
															Select a model...
														</span>
													</div>
												</div>
											</div>

											{/* Inline Action Button */}
											<div className='mt-3'>
												<button
													type='button'
													className='hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-300 dark:hover:border-primary-900 flex w-full items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white py-1 text-[10px] font-bold text-zinc-500 shadow-2xs transition dark:border-zinc-800 dark:bg-zinc-900'>
													<Beaker size={11} />
													<span>Test Node</span>
												</button>
											</div>
										</div>

										{/* Step Number Circle */}
										<div className='border-primary-500 text-primary-600 dark:text-primary-400 absolute -bottom-2.5 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border-2 bg-white text-[9px] font-bold shadow-xs dark:bg-zinc-900'>
											2
										</div>

										{/* Handle left & right ports */}
										<span
											aria-hidden
											className='border-primary-400 text-primary-505 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/30 dark:border-primary-800 absolute top-1/2 -left-2 z-20 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-[10px] font-bold shadow-xs dark:bg-zinc-900'>
											+
										</span>
										<span
											aria-hidden
											className='border-primary-400 text-primary-505 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/30 dark:border-primary-800 absolute top-1/2 -right-2 z-20 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-[10px] font-bold shadow-xs dark:bg-zinc-900'>
											+
										</span>
									</motion.div>
								)}
							</AnimatePresence>

							{/* Node 3: Slack Output Card (Output) */}
							<AnimatePresence>
								{workflowBuildStep >= 3 && (
									<motion.div
										initial={{ opacity: 0, scale: 0.9, y: 15 }}
										animate={{ opacity: 1, scale: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.9, y: 15 }}
										whileHover={{ y: -4, scale: 1.02 }}
										transition={{ duration: 0.3 }}
										className='absolute top-[45px] left-[560px] z-10 w-[220px] rounded-xl border-2 border-blue-500 bg-white p-1 text-left shadow-lg dark:border-blue-500 dark:bg-zinc-950'>
										<div className='rounded-lg bg-blue-500/5 p-2.5 dark:bg-blue-500/5'>
											{/* Header */}
											<div className='flex items-start gap-2'>
												<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'>
													<Zap size={18} strokeWidth={2.5} />
												</div>
												<div className='min-w-0 flex-1'>
													<div className='mb-0.5 flex items-center justify-between gap-1'>
														<span className='flex min-w-0 items-center gap-0.5'>
															<span className='shrink-0 text-blue-600 dark:text-blue-400'>
																<Zap size={10} />
															</span>
															<span className='truncate text-[9px] font-bold tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
																OUTPUT
															</span>
														</span>
														<span className='inline-flex shrink-0 items-center gap-0.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-zinc-500 uppercase dark:bg-zinc-800 dark:text-zinc-400'>
															IDLE
														</span>
													</div>
													<div className='truncate text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100'>
														Slack Output
													</div>
												</div>
											</div>

											{/* Description */}
											<div className='mt-1 line-clamp-1 text-[9px] leading-tight text-zinc-500 dark:text-zinc-400'>
												Post message to a Slack channel.
											</div>

											{/* Mock Fields */}
											<div className='mt-2.5 space-y-2'>
												<div>
													<span className='mb-1 block text-[8px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
														Channel
													</span>
													<div className='flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-zinc-700 shadow-xs select-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'>
														<span>#general</span>
														<ChevronDown
															size={12}
															className='shrink-0 text-zinc-400'
														/>
													</div>
												</div>
												<div>
													<span className='mb-1 block text-[8px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
														Message
													</span>
													<div className='flex min-h-[29px] w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[9px] leading-snug font-semibold text-zinc-700 shadow-xs select-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'>
														<span className='truncate'>
															Workflow completed!
														</span>
													</div>
												</div>
											</div>

											{/* Inline Action Button */}
											<div className='mt-3'>
												<button
													type='button'
													className='dark:hover:text-blue-455 flex w-full items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white py-1 text-[10px] font-bold text-zinc-500 transition hover:border-blue-300 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-900'>
													<Beaker size={11} />
													<span>Test Node</span>
												</button>
											</div>
										</div>

										{/* Step Number Circle */}
										<div className='dark:text-blue-450 absolute -bottom-2.5 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border-2 border-blue-500 bg-white text-[9px] font-bold text-blue-600 shadow-xs dark:bg-zinc-900'>
											3
										</div>

										{/* Handle left port */}
										<span
											aria-hidden
											className='absolute top-1/2 -left-2 z-20 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full border border-blue-400 bg-white text-[10px] font-bold text-blue-500 shadow-xs hover:bg-blue-50 hover:text-blue-700 dark:border-blue-800 dark:bg-zinc-900 dark:hover:bg-blue-950/30'>
											+
										</span>
									</motion.div>
								)}
							</AnimatePresence>
						</div>

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
					</div>
				</>
			)}
		</div>
	);
};

export default CanvasEmptyState;
