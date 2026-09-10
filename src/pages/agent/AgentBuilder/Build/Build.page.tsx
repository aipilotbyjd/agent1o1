import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown, { type Components } from 'react-markdown';
import {
	ArrowUp,
	Bot,
	Paperclip,
	Share2,
	Sparkles,
	SquarePen,
	Link2,
	Play,
	CheckCircle2,
	Plus,
	Moon,
	Sun,
	Send,
	Database,
	Users,
	Download,
	SlidersHorizontal,
	MoreHorizontal,
	Ghost,
	Mic,
	X,
	CheckSquare,
	Square,
	ChevronDown,
	ChevronRight,
	FileText,
	Globe,
	Zap,
	Cpu,
	Undo2,
	Flame,
	Layers,
	MessageSquare,
	Brain,
	Target,
	BarChart2,
	Shield,
	Copy,
	Lock,
	AlertTriangle,
	ExternalLink,
	Mail,
	FileSpreadsheet,
	HardDrive,
	Calendar,
	TrendingUp,
	Search,
	Rocket,
	Loader2,
	RotateCcw,
	FileJson,
	Trash2,
	Menu,
	Share,
	ImageIcon,
} from 'lucide-react';
import AgentTemplateCard from '../_partial/AgentTemplateCard.partial';
import { agentTemplateTabs, agentTemplates, agentModelOptions } from '../_helper/agentBuilder.constants';
import MainAppBar, { MainAppBarPillButton, MainAppBarIconButton } from '@/pages/app/_partial/MainAppBar.partial';
import { toast } from 'react-toastify';
import useDarkMode from '@/hooks/useDarkMode';
import DARK_MODE from '@/constants/darkMode.constant';
import { LogoFyr } from '@/assets/images';
import useAsideStatus from '@/hooks/useAsideStatus';
import pages from '@/Routes/pages';
import { useWorkspaceContext } from '@/context/workspaceContext';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import {
	useAgent,
	useCreateAgent,
	useUpdateAgent,
	useDeleteAgent,
	useAgentSkills,
	useCreateAgentSkill,
	useAttachAgentSkill,
	useDetachAgentSkill,
	useAgentTriggers,
	useCreateAgentTrigger,
	useUpdateAgentTrigger,
	useDeleteAgentTrigger,
	useFireAgentTrigger,
	useAgentMetaModels,
} from '@/api/modules/agents';
import type { TAgentTriggerType } from '@/types/agent.type';
import { AgentService } from '@/api/modules/agents/agents.service';
import { subscribeToAgentStream } from '@/api/modules/agents/agents.realtime';
import { useDownloadArtifact } from '@/api/modules/artifacts';
import { useRealtime } from '@/context/realtimeContext';
import { XCircle, Wrench, FileDown } from 'lucide-react';
import AgentDataPanel from './_partial/AgentDataPanel.partial';

/** One entry in the live "scratchpad" — reasoning text or a tool call, exactly as it streamed in. */
type TChatTimelineItem =
	| { kind: 'text'; id: string; text: string }
	| {
			kind: 'tool';
			id: string;
			toolName: string;
			arguments: Record<string, unknown>;
			status: 'running' | 'done' | 'error';
	  }
	| {
			kind: 'artifact';
			id: string;
			filename: string;
			version: number;
			mimeType: string;
			size: number;
	  };

interface TMessage {
	id: string;
	sender: 'agent' | 'user';
	text: string;
	timestamp: string;
	type?: 'text' | 'table';
	headers?: string[];
	data?: any[];
	followUp?: string;
	actions?: { label: string; type: string }[];
	/** What the agent did to produce this reply — kept collapsible under the finished message. */
	timeline?: TChatTimelineItem[];
}

/** Markdown rendering for agent replies, sized for this page's chat bubble type scale. */
const mdComponents: Components = {
	p: ({ children }) => <p className='mb-2 last:mb-0 whitespace-pre-line'>{children}</p>,
	strong: ({ children }) => <strong className='font-black text-zinc-900 dark:text-white'>{children}</strong>,
	em: ({ children }) => <em className='italic'>{children}</em>,
	ul: ({ children }) => <ul className='mb-2 ml-4 list-disc space-y-1 last:mb-0'>{children}</ul>,
	ol: ({ children }) => <ol className='mb-2 ml-4 list-decimal space-y-1 last:mb-0'>{children}</ol>,
	li: ({ children }) => <li className='pl-0.5'>{children}</li>,
	h1: ({ children }) => <h1 className='mb-1.5 text-base font-black'>{children}</h1>,
	h2: ({ children }) => <h2 className='mb-1.5 text-sm font-black'>{children}</h2>,
	h3: ({ children }) => <h3 className='mb-1 text-sm font-bold'>{children}</h3>,
	code: ({ children }) => (
		<code className='rounded bg-zinc-100 px-1 py-0.5 font-mono text-[12px] text-primary-700 dark:bg-zinc-800 dark:text-primary-400'>
			{children}
		</code>
	),
	pre: ({ children }) => (
		<pre className='mb-2 overflow-x-auto rounded-lg bg-zinc-100 p-3 text-[12px] dark:bg-zinc-950'>{children}</pre>
	),
	a: ({ children, href }) => (
		<a
			href={href}
			target='_blank'
			rel='noreferrer'
			className='underline underline-offset-2 hover:text-primary-600 dark:hover:text-primary-400'>
			{children}
		</a>
	),
};

const prettifyToolName = (raw: string) =>
	raw.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

/** One tool-call line in the live scratchpad or a finished message's collapsed steps. */
const ToolStepLine = ({
	item,
}: {
	item: Extract<TChatTimelineItem, { kind: 'tool' }>;
}) => (
	<div className='flex items-center gap-1.5 text-[12.5px] font-semibold text-zinc-500 dark:text-zinc-400'>
		{item.status === 'running' && <Loader2 size={12} className='shrink-0 animate-spin text-primary-500' />}
		{item.status === 'done' && <CheckCircle2 size={12} className='shrink-0 text-emerald-500' />}
		{item.status === 'error' && <XCircle size={12} className='shrink-0 text-rose-500' />}
		<Wrench size={12} className='shrink-0 opacity-60' />
		<span>{prettifyToolName(item.toolName.replace(/Tool$/, ''))}</span>
	</div>
);

const formatArtifactSize = (bytes: number): string => {
	if (bytes === 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	const value = bytes / 1024 ** exponent;
	return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
};

/** Rich, always-visible card for a file an agent exported mid-conversation. */
const ArtifactCard = ({
	item,
	ws,
}: {
	item: Extract<TChatTimelineItem, { kind: 'artifact' }>;
	ws: string;
}) => {
	const downloadMutation = useDownloadArtifact(ws);

	return (
		<div className='flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 shadow-2xs dark:border-zinc-800/85 dark:bg-zinc-900/60'>
			<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-400/10 text-primary-600 dark:text-primary-400'>
				<FileDown size={16} />
			</div>
			<div className='min-w-0 flex-1'>
				<p className='truncate text-xs font-bold text-zinc-800 dark:text-zinc-200'>{item.filename}</p>
				<p className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
					v{item.version} · {formatArtifactSize(item.size)}
				</p>
			</div>
			<button
				onClick={() => downloadMutation.mutate({ artifactId: item.id, filename: item.filename })}
				className='flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'>
				<Download size={13} />
			</button>
		</div>
	);
};

/** Collapsible "N steps" summary shown above a finished agent reply — what it did to get there. */
const TimelineSteps = ({ items, className = '' }: { items: TChatTimelineItem[]; className?: string }) => {
	const [expanded, setExpanded] = useState(false);
	const toolCount = items.filter((item) => item.kind === 'tool').length;

	if (toolCount === 0) return null;

	return (
		<div className={`flex flex-col gap-1.5 pl-1 ${className}`}>
			<button
				type='button'
				onClick={() => setExpanded((v) => !v)}
				className='flex w-fit items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'>
				<ChevronRight size={11} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
				{toolCount} step{toolCount === 1 ? '' : 's'}
			</button>
			{expanded && (
				<div className='flex flex-col gap-1'>
					{items.map((item) => (item.kind === 'tool' ? <ToolStepLine key={item.id} item={item} /> : null))}
				</div>
			)}
		</div>
	);
};

const BuildPage = () => {
	const { agentId: routeAgentId } = useParams<{ agentId?: string }>();
	const navigate = useNavigate();
	const { activeWorkspaceId } = useWorkspaceContext();
	const { activeWorkspaceId: fallbackWorkspaceId } = useWorkflowShellStore();
	const workspaceId = activeWorkspaceId || fallbackWorkspaceId;

	const [currentAgentId, setCurrentAgentId] = useState<string | undefined>(routeAgentId);
	const [conversationId, setConversationId] = useState<string | null>(null);
	const { echo } = useRealtime();

	// Live scratchpad for the reply currently streaming in — reset on every send.
	const [streamTimeline, setStreamTimeline] = useState<TChatTimelineItem[]>([]);
	const streamTimelineRef = useRef<TChatTimelineItem[]>([]);
	const setTimeline = (updater: (prev: TChatTimelineItem[]) => TChatTimelineItem[]) => {
		streamTimelineRef.current = updater(streamTimelineRef.current);
		setStreamTimeline(streamTimelineRef.current);
	};

	const { data: existingAgent } = useAgent(workspaceId, currentAgentId ?? '');
	const createAgentMutation = useCreateAgent(workspaceId);
	const updateAgentMutation = useUpdateAgent(workspaceId);
	const deleteAgentMutation = useDeleteAgent(workspaceId);

	// Skills — workspace catalog + this agent's attachments
	const { data: workspaceSkills } = useAgentSkills(workspaceId);
	const createSkillMutation = useCreateAgentSkill(workspaceId);
	const attachSkillMutation = useAttachAgentSkill(workspaceId);
	const detachSkillMutation = useDetachAgentSkill(workspaceId);
	const [isSkillPanelOpen, setIsSkillPanelOpen] = useState(false);
	const [newSkillName, setNewSkillName] = useState('');
	const [newSkillInstructions, setNewSkillInstructions] = useState('');

	// Triggers
	const { data: agentTriggers } = useAgentTriggers(workspaceId, currentAgentId ?? '');
	const createTriggerMutation = useCreateAgentTrigger(workspaceId, currentAgentId ?? '');
	const updateTriggerMutation = useUpdateAgentTrigger(workspaceId, currentAgentId ?? '');
	const deleteTriggerMutation = useDeleteAgentTrigger(workspaceId, currentAgentId ?? '');
	const fireTriggerMutation = useFireAgentTrigger(workspaceId, currentAgentId ?? '');
	const [isTriggerPanelOpen, setIsTriggerPanelOpen] = useState(false);

	// Live model catalog from the backend (agents/meta/models). Only models the
	// workspace actually has a configured provider for are returned — merge them
	// with the static option metadata (label/tier/description) where names match,
	// and fall back to the static list when the catalog is empty/unconfigured.
	const { data: metaModelGroups } = useAgentMetaModels(workspaceId);
	const modelOptions = useMemo(() => {
		const liveIds = (metaModelGroups ?? [])
			.flatMap((group) => group.models)
			.filter((id): id is string => typeof id === 'string');
		if (liveIds.length === 0) return agentModelOptions;
		return liveIds.map((id) => {
			const known = agentModelOptions.find((m) => m.id === id);
			return (
				known ?? {
					id,
					provider: 'anyapi' as const,
					label: id.includes('/') ? id.split('/').slice(1).join('/') : id,
					tier: 'Available',
					description: id,
				}
			);
		});
	}, [metaModelGroups]);

	const [newTriggerType, setNewTriggerType] = useState<TAgentTriggerType>('schedule');
	const [newTriggerCron, setNewTriggerCron] = useState('0 9 * * *');
	const [newTriggerEventName, setNewTriggerEventName] = useState('');
	const [newTriggerInitialMessage, setNewTriggerInitialMessage] = useState('');

	const [activeTab, setActiveTab] = useState('All');
	const [promptText, setPromptText] = useState('');
	const { isDarkTheme, setDarkModeStatus } = useDarkMode();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const chatEndRef = useRef<HTMLDivElement>(null);
	const { toggleAside } = useAsideStatus();

	// Screen size state
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Preview / Chat states
	const [isPreviewMode, setIsPreviewMode] = useState(false);
	const [agentName, setAgentName] = useState('Lead Generation Agent');
	const [agentIcon, setAgentIcon] = useState<any>(Bot);
	const [agentIconColor, setAgentIconColor] = useState('purple');
	const [chatHistory, setChatHistory] = useState<TMessage[]>([]);
	const [chatInput, setChatInput] = useState('');
	const [isTyping, setIsTyping] = useState(false);
	const [incognito, setIncognito] = useState(false);
	const [skillEnabled, setSkillEnabled] = useState(true);

	// Sidebar settings panel states
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [activeSidebarTab, setActiveSidebarTab] = useState<
		'agent' | 'settings' | 'chatDetails' | 'data'
	>('agent');
	const [agentInstructions, setAgentInstructions] = useState('');
	const [agentModel, setAgentModel] = useState(
		agentModelOptions.find((m) => m.label === 'Sonnet 5')?.id ?? agentModelOptions[0].id,
	);
	const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
	const [allowSelfUpdates, setAllowSelfUpdates] = useState(true);
	const [agentDescription, setAgentDescription] = useState(
		'An agent that helps me research competitors, analyze their strategies, products, pricing, marketing, reviews, and overall market positioning.'
	);

	// Icon Picker Dropdown State
	const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

	// Connected Apps State
	const [connectedApps, setConnectedApps] = useState([
		{ id: 'firecrawl', name: 'Firecrawl', desc: 'Scrape and extract data from websites.', icon: Flame, iconBg: 'bg-orange-500', isConnected: true },
		{ id: 'google-docs', name: 'Google Docs', desc: 'Create, read and update documents.', icon: FileText, iconBg: 'bg-blue-500', isConnected: false },
		{ id: 'parallel', name: 'Parallel', desc: 'Run AI tasks in parallel for faster results.', icon: Globe, iconBg: 'bg-zinc-800 dark:bg-zinc-700 border dark:border-zinc-600', isConnected: true }
	]);

	// Add an App drawer states
	const [isAddAppOpen, setIsAddAppOpen] = useState(false);
	const [appSearchQuery, setAppSearchQuery] = useState('');
	const [appCategory, setAppCategory] = useState<'all' | 'custom'>('all');

	// Saving and dropdown states
	const [isSaving, setIsSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState('Agent draft autosaved');
	const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);

	const toggleDarkMode = () => {
		setDarkModeStatus(isDarkTheme ? DARK_MODE.LIGHT : DARK_MODE.DARK);
	};

	// Hydrate the form once the real agent record loads (edit mode)
	useEffect(() => {
		if (!existingAgent) return;
		setAgentName(existingAgent.name);
		setAgentDescription(existingAgent.description ?? '');
		setAgentInstructions(existingAgent.instructions ?? '');
		// Only trust a saved model if it's still a valid, AnyAPI-prefixed option —
		// agents saved before the AnyAPI switch may hold a stale unprefixed id
		// (e.g. 'claude-opus-4-8'), which AnyAPI can't resolve and 502s on.
		if (existingAgent.model && agentModelOptions.some((m) => m.id === existingAgent.model)) {
			setAgentModel(existingAgent.model);
		}
	}, [existingAgent]);

	// Creates the agent on first save, updates it on every save after that.
	// Returns the persisted agent's id so callers (chat, settings) can use it immediately.
	const ensureAgentPersisted = async (): Promise<string> => {
		const payload = {
			name: agentName.trim() || 'Untitled Agent',
			description: agentDescription,
			instructions: agentInstructions || 'You are a helpful assistant.',
			model: agentModel,
			provider: agentModelOptions.find((m) => m.id === agentModel)?.provider ?? 'anyapi',
		};

		if (currentAgentId) {
			await updateAgentMutation.mutateAsync({ agentId: currentAgentId, body: payload });
			return currentAgentId;
		}

		const created = await createAgentMutation.mutateAsync(payload);
		setCurrentAgentId(created.id);
		navigate(`${pages.agent.subPages.editAgent.to}/${created.id}`, { replace: true });
		return created.id;
	};

	const handleSaveAgent = async () => {
		if (isSaving) return;
		setIsSaving(true);
		setSaveStatus('Saving changes...');
		try {
			await ensureAgentPersisted();
			const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
			setSaveStatus(`Saved at ${now}`);
			toast.success('Agent saved successfully!');
		} catch {
			setSaveStatus('Failed to save');
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteAgent = async () => {
		setIsMoreDropdownOpen(false);
		if (currentAgentId) {
			await deleteAgentMutation.mutateAsync(currentAgentId);
		}
		navigate(pages.app.subPages.agents.to);
	};

	// Skills/Triggers both operate on a real agent id — save a draft first if needed.
	const openSkillPanel = async () => {
		await ensureAgentPersisted();
		setIsSkillPanelOpen(true);
	};

	const openTriggerPanel = async () => {
		await ensureAgentPersisted();
		setIsTriggerPanelOpen(true);
	};

	const attachedSkillIds = new Set((existingAgent?.skills ?? []).map((s) => s.id));
	const availableSkillsToAttach = (workspaceSkills ?? []).filter((s) => !attachedSkillIds.has(s.id));

	const handleAttachSkill = (skillId: string) => {
		if (!currentAgentId) return;
		attachSkillMutation.mutate({ agentId: currentAgentId, skillId });
	};

	const handleDetachSkill = (skillId: string) => {
		if (!currentAgentId) return;
		detachSkillMutation.mutate({ agentId: currentAgentId, skillId });
	};

	const handleCreateAndAttachSkill = async () => {
		if (!currentAgentId || !newSkillName.trim() || !newSkillInstructions.trim()) return;
		const skill = await createSkillMutation.mutateAsync({
			name: newSkillName.trim(),
			instructions: newSkillInstructions.trim(),
		});
		attachSkillMutation.mutate({ agentId: currentAgentId, skillId: skill.id });
		setNewSkillName('');
		setNewSkillInstructions('');
	};

	const handleCreateTrigger = () => {
		if (!currentAgentId) return;
		const config: Record<string, unknown> =
			newTriggerType === 'schedule'
				? { cron: newTriggerCron }
				: newTriggerType === 'event'
					? { event: newTriggerEventName }
					: {};

		createTriggerMutation.mutate({
			type: newTriggerType,
			config,
			initial_message: newTriggerInitialMessage || undefined,
			is_active: true,
		});
		setNewTriggerEventName('');
		setNewTriggerInitialMessage('');
	};

	const handleToggleTrigger = (triggerId: string, isActive: boolean) => {
		updateTriggerMutation.mutate({ triggerId, body: { is_active: !isActive } });
	};

	const handleDeleteTrigger = (triggerId: string) => {
		deleteTriggerMutation.mutate(triggerId);
	};

	const handleFireTrigger = (triggerId: string) => {
		fireTriggerMutation.mutate({ triggerId });
	};

	const handleCopyWebhookUrl = (url: string) => {
		navigator.clipboard.writeText(url).catch(() => {});
		toast.success('Webhook URL copied!');
	};

	// Auto-scroll chat to bottom
	useEffect(() => {
		if (chatEndRef.current) {
			chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [chatHistory, isTyping]);

	const suggestionChips = [
		{
			label: 'Recruiting Sourcer',
			text: 'Create a recruiting agent that reads a job description and finds matching candidates, scores them, and drafts outreach.',
			icon: Users,
		},
		{
			label: 'Feedback Analyzer',
			text: 'Build an agent that reads support tickets, groups them by theme, and produces a summary report.',
			icon: Sparkles,
		},
		{
			label: 'Database SQL Analyst',
			text: 'Create a SQL analyst agent that connects to a database, runs query metrics, and alerts on anomalies.',
			icon: Database,
		},
	];

	const selectableIcons = [
		{ Icon: Bot },
		{ Icon: Flame },
		{ Icon: Search },
		{ Icon: Target },
		{ Icon: SlidersHorizontal },
		{ Icon: Shield },
		{ Icon: Sparkles },
		{ Icon: Brain },
		{ Icon: Rocket },
		{ Icon: Layers },
	];

	const colorsList = [
		{ value: 'purple', bgClass: 'bg-primary-400' },
		{ value: 'blue', bgClass: 'bg-blue-500' },
		{ value: 'teal', bgClass: 'bg-teal-500' },
		{ value: 'orange', bgClass: 'bg-amber-500' },
		{ value: 'red', bgClass: 'bg-rose-500' },
		{ value: 'rainbow', bgClass: 'bg-gradient-to-tr from-primary-400 via-emerald-500 to-rose-500' },
	];

	const availableApps = [
		{ id: 'slack', name: 'Slack', desc: 'Connect Slack channels and send notifications.', icon: MessageSquare, iconBg: 'bg-rose-500', isConnected: true },
		{ id: 'airtable', name: 'Airtable', desc: 'Read and write data to Airtable bases.', icon: Database, iconBg: 'bg-blue-400', isConnected: true },
		{ id: 'gmail', name: 'Gmail', desc: 'Send and read emails directly.', icon: Mail, iconBg: 'bg-red-500', isConnected: true },
		{ id: 'google-sheets', name: 'Google Sheets', desc: 'Create and update spreadsheet rows.', icon: FileSpreadsheet, iconBg: 'bg-emerald-500', isConnected: true },
		{ id: 'google-drive', name: 'Google Drive', desc: 'Search and read files from Google Drive.', icon: HardDrive, iconBg: 'bg-blue-600', isConnected: true },
		{ id: 'google-calendar', name: 'Google Calendar', desc: 'Create calendar events.', icon: Calendar, iconBg: 'bg-blue-500', isConnected: true },
		{ id: 'google-docs', name: 'Google Docs', desc: 'Create, read and update documents.', icon: FileText, iconBg: 'bg-blue-500', isConnected: true },
		{ id: 'google-slides', name: 'Google Slides', desc: 'Generate presentation slides.', icon: FileText, iconBg: 'bg-amber-500', isConnected: true },
		{ id: 'google-ads', name: 'Google Ads', desc: 'Create search keyword campaigns.', icon: TrendingUp, iconBg: 'bg-blue-500', isConnected: true },
		{ id: 'google-search-console', name: 'Google Search Console', desc: 'Check search engine optimization details.', icon: Search, iconBg: 'bg-blue-500', isConnected: true },
		{ id: 'google-bigquery', name: 'Google BigQuery', desc: 'Run SQL analytics on datasets.', icon: Database, iconBg: 'bg-primary-400', isConnected: true },
	];

	const getIconColorClass = (color: string) => {
		switch (color) {
			case 'green':
				return 'text-emerald-500 dark:text-emerald-400';
			case 'blue':
				return 'text-blue-500 dark:text-blue-400';
			case 'teal':
				return 'text-teal-500 dark:text-teal-400';
			case 'orange':
				return 'text-amber-500 dark:text-amber-400';
			case 'red':
				return 'text-rose-500 dark:text-rose-400';
			case 'rainbow':
				return 'text-transparent bg-clip-text bg-gradient-to-tr from-primary-400 via-emerald-500 to-rose-500';
			default: // purple
				return 'text-primary-500 dark:text-primary-400';
		}
	};

	const handleChipClick = (text: string) => {
		setPromptText(text);
		if (textareaRef.current) {
			textareaRef.current.focus();
		}
	};

	// Start preview mode with selected agent details
	const startPreview = (name: string, icon: any, color: string, customGreeting?: string) => {
		setAgentName(name);
		setAgentIcon(icon);
		setAgentIconColor(color);
		setIsPreviewMode(true);

		const greeting = customGreeting || `Hi! I'm your ${name}. How can I help you today?`;
		setChatHistory([
			{
				id: 'init-' + Date.now(),
				sender: 'agent',
				text: greeting,
				timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
				type: 'text',
			},
		]);
	};

	// Handle Generate agent click from main builder prompt
	const handleSendMessage = () => {
		if (!promptText.trim()) {
			startPreview('Lead Generation Agent', Bot, 'purple');
			toast.info('Starting default Lead Generation Agent preview.');
			return;
		}

		let matchedName = 'Lead Generation Agent';
		let matchedIcon = Bot;
		let matchedColor = 'purple';
		let greeting = `Hi! I'm your Lead Generation Agent. How can I help you today?`;

		const promptLower = promptText.toLowerCase();
		if (promptLower.includes('recruit') || promptLower.includes('job') || promptLower.includes('candidate')) {
			matchedName = 'Recruiting Sourcer Agent';
			matchedIcon = Users;
			matchedColor = 'purple';
			greeting = `Hi! I'm your Recruiting Sourcer Agent. How can I help you today?`;
		} else if (promptLower.includes('feedback') || promptLower.includes('ticket') || promptLower.includes('support')) {
			matchedName = 'Feedback Digest Agent';
			matchedIcon = Bot;
			matchedColor = 'green';
			greeting = `Hi! I'm your Feedback Digest Agent. How can I help you today?`;
		} else if (promptLower.includes('sql') || promptLower.includes('database') || promptLower.includes('query')) {
			matchedName = 'Database SQL Analyst Agent';
			matchedIcon = Database;
			matchedColor = 'purple';
			greeting = `Hi! I'm your Database SQL Analyst Agent. How can I help you today?`;
		}

		startPreview(matchedName, matchedIcon, matchedColor, greeting);

		const userMsg = promptText;
		setPromptText('');

		setTimeout(() => {
			sendChatMessage(userMsg);
		}, 800);
	};

	// Handle template card clicks
	const handleTemplateClick = (templateTitle: string) => {
		let matchedName = 'Lead Generation Agent';
		let matchedIcon = Bot;
		let matchedColor = 'purple';

		if (templateTitle === 'Recruiting Sourcer') {
			matchedName = 'Recruiting Sourcer Agent';
			matchedIcon = Users;
			matchedColor = 'purple';
		} else if (templateTitle === 'Feedback Digest Agent') {
			matchedName = 'Feedback Digest Agent';
			matchedIcon = Bot;
			matchedColor = 'green';
		} else if (templateTitle === 'Weekly Recap Agent') {
			matchedName = 'Weekly Recap Agent';
			matchedIcon = Users;
			matchedColor = 'purple';
		} else if (templateTitle === 'LinkedIn Outreach Expert') {
			matchedName = 'LinkedIn Outreach Expert Agent';
			matchedIcon = Users;
			matchedColor = 'purple';
		} else if (templateTitle === 'Metrics Analyst Bot') {
			matchedName = 'Metrics Analyst Bot';
			matchedIcon = Database;
			matchedColor = 'purple';
		} else if (templateTitle === 'SEO Content Planner') {
			matchedName = 'SEO Content Planner Agent';
			matchedIcon = Bot;
			matchedColor = 'purple';
		}

		const greeting = `Hi! I'm your ${matchedName}. How can I help you today?`;
		startPreview(matchedName, matchedIcon, matchedColor, greeting);
	};

// Sends a message to the real agent — persists the agent first if this is
	// still an unsaved draft, then starts or continues its conversation.
	const sendChatMessage = async (messageText: string) => {
		const trimmed = messageText.trim();
		if (!trimmed || !workspaceId) return;

		const userMsg: TMessage = {
			id: 'user-' + Date.now(),
			sender: 'user',
			text: trimmed,
			timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
		};

		setChatHistory((prev) => [...prev, userMsg]);
		setIsTyping(true);
		setTimeline(() => []);

		try {
			const agentIdForRun = await ensureAgentPersisted();

			if (!echo) {
				throw new Error('Realtime connection unavailable — check your connection and try again.');
			}

			const queued = conversationId
				? await AgentService.sendMessage(workspaceId, agentIdForRun, conversationId, {
						message: trimmed,
					})
				: await AgentService.createConversation(workspaceId, agentIdForRun, { message: trimmed });

			// The agent's reply streams live over agent.stream.{request_id} — see
			// ProcessAgentMessageJob. We resolve once the terminal "ready" event lands.
			await new Promise<void>((resolve, reject) => {
				const unsubscribe = subscribeToAgentStream(echo, queued.request_id, {
					onTextDelta: (event) => {
						setTimeline((prev) => {
							const last = prev[prev.length - 1];
							if (last && last.kind === 'text') {
								return [...prev.slice(0, -1), { ...last, text: last.text + event.delta }];
							}
							return [...prev, { kind: 'text', id: event.id, text: event.delta }];
						});
					},
					onToolCall: (event) => {
						setTimeline((prev) => [
							...prev,
							{
								kind: 'tool',
								id: event.tool_id,
								toolName: event.tool_name,
								arguments: event.arguments,
								status: 'running',
							},
						]);
					},
					onToolResult: (event) => {
						setTimeline((prev) =>
							prev.map((item) =>
								item.kind === 'tool' && item.id === event.tool_id
									? { ...item, status: event.successful ? 'done' : 'error' }
									: item,
							),
						);
					},
					onArtifact: (event) => {
						setTimeline((prev) => [
							...prev,
							{
								kind: 'artifact',
								id: event.id,
								filename: event.filename,
								version: event.version,
								mimeType: event.mime_type,
								size: event.size,
							},
						]);
					},
					onReady: (event) => {
						unsubscribe();

						if (event.error) {
							reject(new Error(event.error_message || 'The agent failed to respond.'));
							return;
						}

						if (!conversationId && event.conversation_id) {
							setConversationId(event.conversation_id);
						}

						const finishedTimeline = streamTimelineRef.current;
						const agentMsg: TMessage = {
							id: 'agent-' + Date.now(),
							sender: 'agent',
							text: event.response,
							timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
							type: 'text',
							timeline: finishedTimeline.length > 0 ? finishedTimeline : undefined,
						};
						setChatHistory((prev) => [...prev, agentMsg]);
						resolve();
					},
				});
			});
		} catch (err) {
			setChatHistory((prev) => [
				...prev,
				{
					id: 'agent-error-' + Date.now(),
					sender: 'agent',
					text: "Sorry, I couldn't process that — please try again.",
					timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
					type: 'text',
				},
			]);
			toast.error(err instanceof Error ? err.message : 'Failed to reach the agent.');
		} finally {
			setIsTyping(false);
			setTimeline(() => []);
		}
	};

	// Action chip clicks in chat response
	const handleActionClick = (action: { label: string; type: string }) => {
		if (action.type === 'export_csv') {
			toast.success('List exported as CSV successfully!');
			return;
		}
		if (action.type === 'pdf_digest') {
			toast.success('PDF digest report generated!');
			return;
		}
		if (action.type === 'email_summary') {
			toast.success('Summary emailed to the product team!');
			return;
		}

		// Otherwise, send it as a user chat message
		sendChatMessage(action.label);
	};

	// Add selected app to active connected apps
	const handleAddAppFromList = (app: typeof availableApps[0]) => {
		if (connectedApps.some((a) => a.id === app.id)) {
			toast.info(`${app.name} is already added!`);
			return;
		}

		const newApp = {
			id: app.id,
			name: app.name,
			desc: app.desc,
			icon: app.icon,
			iconBg: app.iconBg,
			isConnected: true,
		};

		setConnectedApps((prev) => [...prev, newApp]);
		toast.success(`${app.name} connected successfully!`);
		setIsAddAppOpen(false);
	};

	// Filter templates based on dynamic active tab state, limited to first 3
	const filteredTemplates = (
		activeTab === 'All'
			? agentTemplates
			: agentTemplates.filter((template) => template.categories?.includes(activeTab))
	).slice(0, 3);

	// Filter available apps based on search query
	const filteredAvailableApps = availableApps.filter((app) => {
		const matchesSearch = app.name.toLowerCase().includes(appSearchQuery.toLowerCase()) || 
		                      app.desc.toLowerCase().includes(appSearchQuery.toLowerCase());
		if (appCategory === 'custom') {
			return matchesSearch && app.id === 'slack'; // mock custom category
		}
		return matchesSearch;
	});

	const AgentIconComponent = agentIcon;

	return (
		<div className='dark:text-zinc-500 relative flex min-w-0 flex-1 flex-col overflow-hidden bg-zinc-50/50 text-zinc-950 transition-colors duration-300 dark:bg-zinc-950'>
			{/* Ambient Lighting Gradients */}
			<div className='pointer-events-none absolute top-[-100px] left-1/4 -z-10 h-[380px] w-[380px] rounded-full bg-primary-400/8 blur-[120px] dark:bg-primary-400/12' />
			<div className='pointer-events-none absolute right-1/4 bottom-1/4 -z-10 h-[450px] w-[450px] rounded-full bg-emerald-500/8 blur-[140px] dark:bg-emerald-600/12' />

			{!isPreviewMode ? (
				<>
					{/* Main Header / Top Bar */}
					<MainAppBar
						title='Agent Builder'
						status={saveStatus}
						meta='Templates ready'
						primaryActionLabel='Create agent'
						primaryActionIcon={Plus}
						primaryActionColor='purple'
						showWorkspaceActions={false}
						showThemeToggle={false}
						toggleClassName='md:hidden'
						onPrimaryAction={handleSendMessage}>
						{/* Share button */}
						<MainAppBarPillButton onClick={() => {
							navigator.clipboard.writeText(window.location.href);
							toast.success('Share link copied to clipboard!');
						}}>
							<Share2 size={15} />
							Share
						</MainAppBarPillButton>
						{/* Theme Toggle button (Moon/Sun) */}
						<MainAppBarIconButton title='Toggle theme' onClick={toggleDarkMode} className='border border-zinc-200 bg-white dark:border-white/10 dark:bg-white/[0.03]'>
							{isDarkTheme ? <Sun size={15} /> : <Moon size={15} />}
						</MainAppBarIconButton>
						{/* Save button with loading feedback */}
						<MainAppBarPillButton onClick={handleSaveAgent}>
							{isSaving ? (
								<Loader2 size={15} className='animate-spin text-primary-600 dark:text-primary-400' />
							) : (
								<CheckCircle2 size={15} />
							)}
							<span>{isSaving ? 'Saving...' : 'Save'}</span>
						</MainAppBarPillButton>
						{/* Preview button with live state values */}
						<MainAppBarPillButton
							onClick={() => startPreview(agentName, agentIcon, agentIconColor)}
							className='!text-primary-600 border-primary-200 hover:bg-primary-50 hover:text-primary-700 dark:!text-primary-400 dark:border-primary-500/30 dark:hover:bg-primary-950/20'>
							<Play size={15} className='fill-current' />
							Preview
						</MainAppBarPillButton>
					</MainAppBar>

					<main className='min-h-0 flex-1 overflow-y-auto'>
						<motion.div
							initial={{ y: 18, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
							className='mx-auto flex min-h-full w-full max-w-[1120px] flex-col px-5 pt-10 pb-5 sm:px-8 sm:pt-12 lg:px-10 lg:pt-14'>
							
							{/* Hero Banner Section */}
							<section className='relative z-10 overflow-hidden rounded-3xl border border-primary-100/50 bg-linear-to-tr from-primary-400/5 via-primary-400/5 to-primary-400/5 p-6 sm:p-8 lg:p-10 dark:border-border-main dark:from-bg-card dark:to-bg-card'>
								{/* Background glow overlay */}
								<div className='pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-400/5' />

								{/* Robot badge */}
								<div className='relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-lg dark:bg-bg-sidebar dark:border dark:border-white/10'>
									<Bot size={28} strokeWidth={2} />
								</div>

								{/* Title */}
								<h1 className='text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl dark:text-white'>
									Build your <span className='bg-gradient-to-r from-primary-400 to-primary-400 bg-clip-text text-transparent dark:from-primary-400 dark:to-primary-300'>agent</span>
								</h1>

								{/* Description */}
								<p className='mt-3 max-w-2xl text-xs font-semibold text-zinc-500 sm:text-sm lg:text-md dark:text-zinc-400'>
									Choose an agent template or simply describe what you need to get started.
								</p>

								{/* Describe Agent Input Box */}
								<div className='mt-8 max-w-2xl'>
									<div className='relative flex items-center rounded-full border border-zinc-200/80 bg-white p-1.5 shadow-sm transition-all focus-within:border-primary-500/50 focus-within:ring-4 focus-within:ring-primary-500/5 dark:border-border-main dark:bg-zinc-950/40'>
										<input
											type='text'
											placeholder='Describe what your agent should do...'
											value={promptText}
											onChange={(e) => setPromptText(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													handleSendMessage();
												}
											}}
											className='flex-1 bg-transparent px-4 py-2 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none border-none focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500'
										/>
										<button
											type='button'
											onClick={handleSendMessage}
											className='flex items-center gap-1.5 rounded-full bg-primary-400 px-5 py-2 text-xs font-bold text-primary-950 shadow-md shadow-primary-500/25 transition hover:bg-primary-500 active:scale-95 dark:shadow-none'>
											<Sparkles size={13} />
											Generate agent
										</button>
									</div>
								</div>
							</section>

							{/* Templates Section */}
							<section className='relative z-10 mt-12 sm:mt-14 lg:mt-16'>
								<div className='mb-5 flex items-center justify-between gap-4'>
									<div className='flex items-center gap-2.5'>
										<h2 className='text-lg font-black tracking-tight sm:text-xl dark:text-zinc-50'>
											Templates
										</h2>
										<span className='text-zinc-600 inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-black dark:bg-zinc-950/60 dark:text-zinc-400'>
											{filteredTemplates.length} Available
										</span>
									</div>
									<button
										type='button'
										className='shrink-0 text-xs font-bold text-zinc-400 transition hover:text-zinc-950 sm:text-sm dark:text-zinc-500 dark:hover:text-zinc-200'>
										Don't show again
									</button>
								</div>

								{/* Categories Tab Bar */}
								<div className='text-zinc-400 flex gap-5 overflow-x-auto border-b border-zinc-200/80 text-[13px] font-black whitespace-nowrap sm:gap-6 sm:text-sm dark:border-border-main dark:text-zinc-500'>
									{agentTemplateTabs.map((tab) => {
										const isActive = tab === activeTab;
										return (
											<button
												key={tab}
												type='button'
												onClick={() => setActiveTab(tab)}
												className={`relative pb-4 transition-colors ${
													isActive
														? 'text-zinc-950 dark:text-white'
														: 'hover:text-zinc-800 dark:hover:text-zinc-300'
												}`}>
												{tab}
												{isActive && (
													<motion.div
														layoutId='activeTabUnderline'
														className='absolute right-0 bottom-0 left-0 h-0.5 bg-primary-400 dark:bg-primary-400'
														transition={{
															type: 'spring',
															stiffness: 380,
															damping: 30,
														}}
													/>
												)}
											</button>
										);
									})}
								</div>

								{/* Template Grid */}
								<div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5'>
									<AnimatePresence mode='popLayout'>
										{filteredTemplates.map((template) => (
											<motion.div
												layout
												key={template.title}
												initial={{ opacity: 0, scale: 0.95 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0, scale: 0.95 }}
												transition={{ duration: 0.2 }}>
												<AgentTemplateCard
													template={template}
													onClick={() => handleTemplateClick(template.title)}
												/>
											</motion.div>
										))}
									</AnimatePresence>
								</div>
							</section>

							{/* Chat Console Cockpit */}
							<section className='relative z-10 mt-12 lg:mt-14'>
								{/* Prompt Suggestions */}
								<div className='mb-4 flex flex-wrap items-center gap-3'>
									<span className='text-xs font-semibold text-zinc-400 dark:text-zinc-500'>Quick starters</span>
									{suggestionChips.map((chip) => {
										const ChipIcon = chip.icon;
										return (
											<button
												key={chip.label}
												type='button'
												onClick={() => handleChipClick(chip.text)}
												className='text-zinc-600 hover:text-zinc-950 inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/70 px-4 py-1.5 text-[11px] font-black shadow-2xs backdrop-blur-xs transition-all hover:bg-zinc-50/50 dark:border-border-main dark:bg-zinc-950/40 dark:text-zinc-400 dark:hover:border-border-main dark:hover:bg-bg-card'>
												<ChipIcon size={12} className='text-primary-500' />
												{chip.label}
											</button>
										);
									})}
								</div>

								{/* Cockpit Shell */}
								<div className='relative flex items-center rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm focus-within:border-primary-500/50 focus-within:ring-4 focus-within:ring-primary-500/5 dark:border-border-main dark:bg-zinc-950/40'>
									<div className='flex h-10 w-10 shrink-0 items-center justify-center text-primary-500'>
										<Sparkles size={18} />
									</div>
									<input
										ref={textareaRef as any}
										type='text'
										value={promptText}
										onChange={(e) => setPromptText(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												handleSendMessage();
											}
										}}
										placeholder='Send a message to your agent...'
										className='flex-1 bg-transparent px-2 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none border-none focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500'
									/>
									<button
										type='button'
										onClick={handleSendMessage}
										className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-400 text-primary-950 shadow-md transition hover:bg-primary-500 active:scale-95'>
										<Send size={15} />
									</button>
								</div>
							</section>

							<div className='pointer-events-none mt-auto h-6' />
						</motion.div>
					</main>

					<div className='pointer-events-none absolute right-10 bottom-8 hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 xl:flex dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'>
						<Sparkles size={16} />
						Agent draft ready
					</div>
				</>
			) : (
				// Premium Chat Interface View (from user screenshot)
				<div className='flex min-h-0 flex-1 flex-col bg-zinc-50/20 dark:bg-zinc-950/80'>
					{/* Responsive Chat Header */}
					{/* Mobile Chat Header */}
					<header className='flex h-14 shrink-0 items-center justify-between border-b border-zinc-150 bg-white px-4 md:hidden dark:border-zinc-800 dark:bg-zinc-900'>
						<button
							onClick={toggleAside}
							type='button'
							className='flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
						>
							<Menu size={20} />
						</button>
						<div className='flex items-center gap-3'>
							<button
								onClick={() => {
									navigator.clipboard.writeText(window.location.href);
									toast.success('Share link copied to clipboard!');
								}}
								type='button'
								className='flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
							>
								<Share size={18} />
							</button>
							<button
								onClick={() => {
									setActiveSidebarTab('agent');
									setIsSettingsOpen(true);
								}}
								type='button'
								className='flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
							>
								<SlidersHorizontal size={18} />
							</button>
						</div>
					</header>

					{/* Desktop Chat Header */}
					<header className='hidden md:flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/90'>
						<div className='flex items-center gap-3 min-w-0'>
							{/* Back button */}
							<button
								onClick={() => setIsPreviewMode(false)}
								className='flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:bg-white/[0.07] dark:hover:text-white'>
								<X size={16} />
							</button>

							{/* Agent Avatar */}
							<div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-md dark:bg-zinc-900 dark:border dark:border-white/10`}>
								<AgentIconComponent size={20} className={getIconColorClass(agentIconColor)} />
							</div>

							{/* Agent name & status */}
							<div className='flex flex-col min-w-0'>
								<div className='flex items-center gap-1.5'>
									<span className='truncate text-[14px] font-black tracking-tight text-zinc-900 dark:text-white'>
										{agentName}
									</span>
									<button className='text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300'>
										<SquarePen size={12} />
									</button>
								</div>
								<div className='flex items-center gap-1.5'>
									<span className='h-2 w-2 rounded-full bg-emerald-500' />
									<span className='text-[11px] font-bold text-emerald-600 dark:text-emerald-400'>
										Active
									</span>
								</div>
							</div>
						</div>

						{/* Action Buttons Right */}
						<div className='flex items-center gap-2'>
							<MainAppBarPillButton onClick={() => toast.success('Share link copied!')}>
								<Share2 size={14} />
								<span>Share</span>
							</MainAppBarPillButton>
							
							<MainAppBarIconButton title='Settings' onClick={() => { setActiveSidebarTab('agent'); setIsSettingsOpen(true); }}>
								<SlidersHorizontal size={14} />
							</MainAppBarIconButton>

							<div className='relative'>
								<MainAppBarIconButton title='More options' onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}>
									<MoreHorizontal size={14} />
								</MainAppBarIconButton>
								<AnimatePresence>
									{isMoreDropdownOpen && (
										<>
											{/* Click outside backdrop */}
											<div className='fixed inset-0 z-40' onClick={() => setIsMoreDropdownOpen(false)} />
											
											{/* Dropdown Menu */}
											<motion.div
												initial={{ opacity: 0, y: 8, scale: 0.95 }}
												animate={{ opacity: 1, y: 0, scale: 1 }}
												exit={{ opacity: 0, y: 8, scale: 0.95 }}
												transition={{ duration: 0.15, ease: 'easeOut' }}
												className='absolute right-0 mt-2 w-52 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg z-50 dark:border-white/10 dark:bg-zinc-900'>
												<button
													onClick={() => {
														setIsMoreDropdownOpen(false);
														setConversationId(null);
														const greeting = `Hi! I'm your ${agentName}. How can I help you today?`;
														setChatHistory([
															{
																id: 'init-' + Date.now(),
																sender: 'agent',
																text: greeting,
																timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
																type: 'text',
															},
														]);
														toast.success('Chat history cleared!');
													}}
													className='flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/[0.04] transition-colors'>
													<RotateCcw size={13} />
													Reset Chat History
												</button>
												
												<button
													onClick={() => {
														setIsMoreDropdownOpen(false);
														const agentConfig = {
															name: agentName,
															description: agentDescription,
															instructions: agentInstructions,
															color: agentIconColor,
															connectedApps: connectedApps.filter(app => app.isConnected).map(app => app.name),
														};
														const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(agentConfig, null, 2));
														const downloadAnchor = document.createElement('a');
														downloadAnchor.setAttribute("href", dataStr);
														downloadAnchor.setAttribute("download", `${agentName.toLowerCase().replace(/\s+/g, '-')}-config.json`);
														document.body.appendChild(downloadAnchor);
														downloadAnchor.click();
														downloadAnchor.remove();
														toast.success('Agent configuration exported!');
													}}
													className='flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/[0.04] transition-colors'>
													<FileJson size={13} />
													Export Agent JSON
												</button>
												
												<div className='my-1 border-t border-zinc-100 dark:border-white/5' />
												
												<button
													onClick={handleDeleteAgent}
													className='flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-colors'>
													<Trash2 size={13} />
													Delete Agent
												</button>
											</motion.div>
										</>
									)}
								</AnimatePresence>
							</div>

							<button
								onClick={() => setIsPreviewMode(false)}
								className='flex h-9 items-center gap-1.5 rounded-lg bg-primary-400 px-4 text-xs font-bold text-primary-950 shadow-md shadow-primary-500/20 hover:bg-primary-500 transition active:scale-95 dark:shadow-none'>
								<SquarePen size={13} />
								<span>Edit Draft</span>
							</button>
						</div>
					</header>

					{/* Chat Message Box */}
					<div className='flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-4xl w-full mx-auto space-y-6'>
						{isMobile && chatHistory.filter((m) => m.sender === 'user').length === 0 ? (
							<div className='flex flex-col items-center justify-center pt-8 pb-4 px-2 select-none'>
								{/* Centered Fire/Flame Logo */}
								<div className='flex items-center justify-center mb-6'>
									<img
										src={LogoFyr}
										alt='Fyr Logo'
										className='h-[88px] w-[88px] object-contain'
									/>
								</div>

								{/* Centered Title */}
								<h2 className='text-[22px] font-black tracking-tight text-zinc-900 text-center dark:text-white mb-6 px-4'>
									{agentName}
								</h2>

								{/* Row of circular buttons */}
								<div className='flex items-center justify-center gap-3.5 w-full max-w-sm flex-wrap px-4'>
									<button
										type='button'
										onClick={() => {
											setChatInput('Research top competitor strategies...');
										}}
										className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-100 bg-orange-50/60 text-orange-500 shadow-2xs transition hover:scale-105 active:scale-95 dark:border-orange-500/20 dark:bg-orange-500/10'
									>
										<Flame size={18} />
									</button>
									<button
										type='button'
										onClick={() => {
											setChatInput('Generate competitor comparison matrix...');
										}}
										className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50/60 text-blue-500 shadow-2xs transition hover:scale-105 active:scale-95 dark:border-blue-500/20 dark:bg-blue-500/10'
									>
										<FileText size={18} />
									</button>
									<button
										type='button'
										className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50/60 text-zinc-500 shadow-2xs transition hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800'
									>
										<Layers size={18} />
									</button>
									<button
										type='button'
										className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50/60 text-zinc-500 shadow-2xs transition hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800'
									>
										<Globe size={18} />
									</button>
									<button
										type='button'
										className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50/60 text-zinc-500 shadow-2xs transition hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800'
									>
										<Download size={18} />
									</button>
									<button
										type='button'
										className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50/60 text-zinc-500 shadow-2xs transition hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800'
									>
										<ImageIcon size={18} />
									</button>
									<button
										type='button'
										onClick={() => {
											const greeting = `Hi! I'm your ${agentName}. How can I help you today?`;
											setChatHistory([
												{
													id: 'init-' + Date.now(),
													sender: 'agent',
													text: greeting,
													timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
													type: 'text',
												},
											]);
										}}
										className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50/60 text-zinc-500 shadow-2xs transition hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800'
									>
										<RotateCcw size={18} />
									</button>
								</div>

								{/* Get started section */}
								<div className='w-full mt-12 px-4'>
									<div className='flex items-center justify-between mb-4'>
										<span className='text-[15px] font-black text-zinc-800 dark:text-zinc-100'>Get started</span>
										<button className='text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'>Dismiss</button>
									</div>

									{/* Horizontal scrolling grid container */}
									<div className='flex gap-4 overflow-x-auto pb-4 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
										{/* Card 1 */}
										<button
											type='button'
											onClick={() => {
												sendChatMessage('Set up a trigger for Competitor Research Agent');
											}}
											className='flex min-w-[270px] max-w-[270px] flex-col rounded-2xl border border-zinc-150 bg-white p-5 text-left shadow-2xs hover:bg-zinc-50/30 transition dark:border-zinc-800/80 dark:bg-zinc-900'
										>
											<div className='flex items-center gap-2 mb-2 text-zinc-800 dark:text-zinc-200'>
												<Zap size={16} className='text-zinc-450 dark:text-zinc-400' />
												<span className='text-xs font-black'>Set up a trigger</span>
											</div>
											<p className='text-[11px] font-semibold text-zinc-500 leading-relaxed dark:text-zinc-400'>
												I want you to start doing things without me having to ask. Help me set up a trigger so you can run on a schedule or...
											</p>
										</button>

										{/* Card 2 */}
										<button
											type='button'
											onClick={() => {
												sendChatMessage('Build a competitor marketing analysis dashboard');
											}}
											className='flex min-w-[270px] max-w-[270px] flex-col rounded-2xl border border-zinc-150 bg-white p-5 text-left shadow-2xs hover:bg-zinc-50/30 transition dark:border-zinc-800/80 dark:bg-zinc-900'
										>
											<div className='flex items-center gap-2 mb-2 text-zinc-800 dark:text-zinc-200'>
												<Layers size={16} className='text-zinc-455 dark:text-zinc-400' />
												<span className='text-xs font-black'>Build widgets</span>
											</div>
											<p className='text-[11px] font-semibold text-zinc-500 leading-relaxed dark:text-zinc-400'>
												Build me a fresh copy of your application or customize your views to match your design system and preferences.
											</p>
										</button>
									</div>
								</div>
							</div>
						) : (
							chatHistory.map((message) => {
								const isUser = message.sender === 'user';
								return (
									<div key={message.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
										<div className={`flex gap-3 max-w-[90%] sm:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
											{/* Agent Avatar in body */}
											{!isUser && (
												<div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white border dark:border-white/10 dark:bg-zinc-900`}>
													<AgentIconComponent size={16} className={getIconColorClass(agentIconColor)} />
												</div>
											)}

											<div className='flex flex-col min-w-0'>
												{/* What the agent did to produce this reply — collapsible steps */}
												{!isUser && message.timeline && message.timeline.length > 0 && (
													<TimelineSteps items={message.timeline} className='mb-1.5' />
												)}

												{/* Files the agent exported — always shown, never collapsed */}
												{!isUser && message.timeline && message.timeline.length > 0 && (
													<div className='mb-1.5 flex flex-col gap-1.5'>
														{message.timeline.map((item) =>
															item.kind === 'artifact' ? (
																<ArtifactCard key={item.id} item={item} ws={workspaceId} />
															) : null,
														)}
													</div>
												)}

												{/* Chat bubble */}
												<div className={`rounded-2xl px-4 py-3 text-sm font-semibold leading-relaxed ${
													isUser
														? 'bg-primary-400/10 text-zinc-950 dark:bg-primary-400/25 dark:text-zinc-100 rounded-tr-none'
														: 'bg-white text-zinc-800 border border-zinc-200/80 dark:bg-zinc-900/60 dark:text-zinc-200 dark:border-zinc-800/85 rounded-tl-none shadow-2xs'
												}`}>
													{isUser ? (
														<p className='whitespace-pre-line'>{message.text}</p>
													) : (
														<ReactMarkdown components={mdComponents}>{message.text}</ReactMarkdown>
													)}

													{/* Structured Table for data responses */}
													{message.type === 'table' && message.headers && message.data && (
														<div className='mt-4 overflow-hidden rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950'>
															<div className='overflow-x-auto'>
																<table className='w-full text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400'>
																	<thead className='bg-zinc-50/50 text-[11px] font-black uppercase tracking-wider text-zinc-600 border-b border-zinc-200 dark:bg-zinc-900/40 dark:text-zinc-400 dark:border-zinc-800'>
																		<tr>
																			{message.headers.map((h) => (
																				<th key={h} className='px-4 py-2.5 font-bold'>{h}</th>
																			))}
																		</tr>
																	</thead>
																	<tbody className='divide-y divide-zinc-200/80 dark:divide-zinc-800'>
																		{message.data.map((row, rIdx) => (
																			<tr key={rIdx} className='hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20'>
																				{message.headers!.map((h) => (
																					<td key={h} className='px-4 py-2.5 text-zinc-900 dark:text-zinc-100 whitespace-nowrap'>
																						{row[h]}
																					</td>
																				))}
																			</tr>
																		))}
																	</tbody>
																</table>
															</div>
														</div>
													)}

													{/* Follow up text */}
													{message.followUp && (
														<p className='mt-4 text-xs font-bold text-zinc-500 dark:text-zinc-400'>
															{message.followUp}
														</p>
													)}
												</div>

												{/* Action Buttons for agent messages */}
												{!isUser && message.actions && message.actions.length > 0 && (
													<div className='mt-3.5 flex flex-wrap gap-2.5'>
														{message.actions.map((act) => {
															let IconComp = Sparkles;
															if (act.type === 'export_csv' || act.type === 'pdf_digest') IconComp = Download;
															if (act.type === 'refine' || act.type === 'set_alert') IconComp = SlidersHorizontal;

															return (
																<button
																	key={act.label}
																	onClick={() => handleActionClick(act)}
																	className='inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-black text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80 transition active:scale-95'>
																	<IconComp size={12} className='text-primary-500' />
																	<span>{act.label}</span>
																</button>
															);
														})}
													</div>
												)}

												{/* Timestamp */}
												<span className={`text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mt-1.5 ${isUser ? 'text-right' : 'text-left'}`}>
													{message.timestamp}
												</span>
											</div>
										</div>
									</div>
								);
							})
						)}

						{/* Live scratchpad — reasoning + tool calls as they stream in, Gumloop-style */}
						{isTyping && (
							<div className='flex w-full justify-start'>
								<div className='flex gap-3 max-w-[90%] sm:max-w-[80%] flex-row'>
									<div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white border dark:border-white/10 dark:bg-zinc-900`}>
										<AgentIconComponent size={16} className={getIconColorClass(agentIconColor)} />
									</div>
									<div className='min-w-0 flex-1'>
										{streamTimeline.length === 0 ? (
											<div className='inline-flex items-center gap-1.5 rounded-2xl rounded-tl-none border border-zinc-200/80 bg-white px-4 py-3 dark:border-zinc-800/85 dark:bg-zinc-900/60 shadow-2xs'>
												<div className='w-2.5 h-2.5 rounded-full bg-primary-400 animate-bounce [animation-delay:-0.3s]' />
												<div className='w-2.5 h-2.5 rounded-full bg-primary-400 animate-bounce [animation-delay:-0.15s]' />
												<div className='w-2.5 h-2.5 rounded-full bg-primary-400 animate-bounce' />
											</div>
										) : (
											<>
												<div className='flex flex-col gap-1.5 rounded-2xl rounded-tl-none border border-zinc-200/80 bg-white px-4 py-3 text-sm leading-relaxed dark:border-zinc-800/85 dark:bg-zinc-900/60 shadow-2xs'>
													{streamTimeline.map((item) => {
														if (item.kind === 'text') {
															return (
																<span key={item.id} className='whitespace-pre-line text-zinc-700 dark:text-zinc-300'>
																	{item.text}
																	<span className='ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-current align-middle' />
																</span>
															);
														}
														if (item.kind === 'tool') {
															return <ToolStepLine key={item.id} item={item} />;
														}
														return null;
													})}
												</div>
												{streamTimeline.some((item) => item.kind === 'artifact') && (
													<div className='mt-1.5 flex flex-col gap-1.5'>
														{streamTimeline.map((item) =>
															item.kind === 'artifact' ? (
																<ArtifactCard key={item.id} item={item} ws={workspaceId} />
															) : null,
														)}
													</div>
												)}
											</>
										)}
									</div>
								</div>
							</div>
						)}

						<div ref={chatEndRef} />
					</div>

					{/* Chat Footer Input Area */}
					{isMobile ? (
						<footer className='border-t border-zinc-150 bg-zinc-50/50 px-4 py-4 dark:border-zinc-850 dark:bg-zinc-950/90'>
							<div className='mx-auto max-w-4xl w-full flex flex-col gap-3'>
								{/* Chat Input Container */}
								<div className='flex flex-col rounded-2xl border border-zinc-200 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60'>
									{/* Input Text Area */}
									<textarea
										rows={2}
										value={chatInput}
										onChange={(e) => setChatInput(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter' && !e.shiftKey) {
												e.preventDefault();
												if (chatInput.trim()) {
													sendChatMessage(chatInput);
													setChatInput('');
												}
											}
										}}
										placeholder='Send a message to your agent'
										className='w-full resize-none bg-transparent px-1 text-sm font-semibold text-zinc-800 placeholder:text-zinc-450 outline-none border-none focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500'
									/>
									{/* Bottom Controls Row */}
									<div className='flex items-center justify-between mt-2 pt-2 border-t border-zinc-100/50 dark:border-zinc-800/50'>
										{/* Plus button */}
										<button 
											type='button'
											onClick={() => toast.info('File attachment is not available in draft mode.')}
											className='flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-50 dark:text-zinc-500 dark:hover:bg-zinc-800'
										>
											<Plus size={18} />
										</button>
										
										{/* Right controls: Loader, Mic, Send */}
										<div className='flex items-center gap-2.5'>
											{/* Loading spinner */}
											<div className='flex h-4 w-4 items-center justify-center rounded-full border border-zinc-200 border-t-zinc-400 animate-spin size-4 shrink-0' style={{ borderTopColor: '#3b82f6', borderWidth: '1.5px' }} />
											
											{/* Mic */}
											<button 
												type='button'
												onClick={() => toast.info('Voice input is not available in draft mode.')}
												className='flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-50 dark:text-zinc-500 dark:hover:bg-zinc-800'
											>
												<Mic size={18} />
											</button>

											{/* Send button (pink/purple gradient circle with white up-arrow) */}
											<button
												type='button'
												onClick={() => {
													if (chatInput.trim()) {
														sendChatMessage(chatInput);
														setChatInput('');
													}
												}}
												className='flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-tr from-primary-400 to-primary-400 text-primary-950 shadow-2xs transition hover:opacity-90 active:scale-95'
											>
												<ArrowUp size={16} strokeWidth={2.5} />
											</button>
										</div>
									</div>
								</div>

								{/* Footer link */}
								<div className='flex items-center justify-center gap-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 mt-1'>
									<span>Having Trouble?</span>
									<button 
										onClick={() => toast.info('Thank you! Feedback reported.')}
										className='underline hover:text-zinc-655 dark:hover:text-zinc-350'
									>
										Report an Issue or Bug
									</button>
								</div>
							</div>
						</footer>
					) : (
						<footer className='border-t border-zinc-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-zinc-950/90'>
							<div className='mx-auto max-w-4xl w-full flex flex-col gap-3'>
								<div className='relative flex items-center rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xs focus-within:border-primary-500/50 focus-within:ring-4 focus-within:ring-primary-500/5 dark:border-zinc-800 dark:bg-zinc-900/60'>
									{/* Left attachments & skill checkbox */}
									<div className='flex items-center gap-1 px-1.5'>
										<button
											title='Attach files'
											className='flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'>
											<Paperclip size={18} />
										</button>

										{/* Skill checkbox */}
										<button
											onClick={() => setSkillEnabled(!skillEnabled)}
											title='Toggle Skills'
											className='flex h-9 items-center gap-1.5 rounded-lg border border-zinc-100 bg-zinc-50/50 px-2.5 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400 dark:hover:bg-zinc-800'>
											{skillEnabled ? (
												<CheckSquare size={14} className='text-primary-600 dark:text-primary-400' />
											) : (
												<Square size={14} />
											)}
											<span>Skill</span>
										</button>
									</div>

									{/* Chat Input */}
									<input
										type='text'
										value={chatInput}
										onChange={(e) => setChatInput(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												if (chatInput.trim()) {
													sendChatMessage(chatInput);
													setChatInput('');
												}
											}
										}}
										placeholder='Send a message to your agent...'
										className='flex-1 bg-transparent px-3 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none border-none focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500'
									/>

									{/* Right features: Incognito & Send */}
									<div className='flex items-center gap-3 px-1.5'>
										{/* Incognito toggle switch */}
										<div className='flex items-center gap-2'>
											<button
												onClick={() => setIncognito(!incognito)}
												className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
													incognito ? 'bg-zinc-800 dark:bg-zinc-700' : 'bg-zinc-200 dark:bg-zinc-800'
												}`}>
												<span
													className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
														incognito ? 'translate-x-4' : 'translate-x-0'
													}`}
												/>
											</button>
											<div className='flex items-center gap-1 text-[11px] font-black text-zinc-400 dark:text-zinc-500'>
												<Ghost size={12} className={incognito ? 'text-zinc-700 dark:text-zinc-300' : ''} />
												<span>Incognito</span>
											</div>
										</div>

										{/* Mic icon */}
										<button
											title='Voice input'
											className='flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'>
											<Mic size={18} />
										</button>

										{/* Send Button */}
										<button
											onClick={() => {
												if (chatInput.trim()) {
													sendChatMessage(chatInput);
													setChatInput('');
												}
											}}
											className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-400 text-primary-950 shadow-md transition hover:bg-primary-500 active:scale-95'>
											<ArrowUp size={16} strokeWidth={2.5} />
										</button>
									</div>
								</div>
								
								<div className='flex items-center justify-center gap-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500'>
									<span>Agent can make mistakes. Please verify important information.</span>
									<button className='underline hover:text-zinc-700 dark:hover:text-zinc-300'>Report an issue</button>
								</div>
							</div>
						</footer>
					)}
				</div>
			)}

			{/* Settings Sidebar Drawer */}
			<AnimatePresence>
				{isSettingsOpen && (
					<>
						{/* Backdrop Overlay */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setIsSettingsOpen(false)}
							className='fixed inset-0 z-50 bg-black/15 backdrop-blur-xs'
						/>

						{/* Sidebar Drawer */}
						<motion.div
							initial={{ x: '100%' }}
							animate={{ x: 0 }}
							exit={{ x: '100%' }}
							transition={{ type: 'spring', damping: 25, stiffness: 220 }}
							className='fixed right-0 top-0 bottom-0 z-55 flex w-full max-w-[480px] flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900 overflow-hidden'
						>
							{/* Header Tabs */}
							<div className='flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-white/10 dark:bg-zinc-900'>
								<div className='flex gap-2 h-full items-end'>
									{/* Tab: Agent */}
									<button 
										onClick={() => setActiveSidebarTab('agent')}
										className={`flex items-center gap-1.5 px-3 pb-4 text-xs font-bold transition-all border-b-2 ${
											activeSidebarTab === 'agent'
												? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400'
												: 'text-zinc-400 border-transparent hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
										}`}
									>
										<Bot size={14} />
										<span>Agent</span>
									</button>
									{/* Tab: Settings */}
									<button 
										onClick={() => setActiveSidebarTab('settings')}
										className={`flex items-center gap-1.5 px-3 pb-4 text-xs font-bold transition-all border-b-2 ${
											activeSidebarTab === 'settings'
												? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400'
												: 'text-zinc-400 border-transparent hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
										}`}
									>
										<SlidersHorizontal size={14} />
										<span>Settings</span>
									</button>
									{/* Tab: Chat Details */}
									<button 
										onClick={() => setActiveSidebarTab('chatDetails')}
										className={`flex items-center gap-1.5 px-3 pb-4 text-xs font-bold transition-all border-b-2 ${
											activeSidebarTab === 'chatDetails'
												? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400'
												: 'text-zinc-400 border-transparent hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
										}`}
									>
										<MessageSquare size={14} />
										<span>Chat Details</span>
									</button>
									{/* Tab: Data (knowledge / memory / runs / analytics) */}
									<button
										onClick={() => setActiveSidebarTab('data')}
										className={`flex items-center gap-1.5 px-3 pb-4 text-xs font-bold transition-all border-b-2 ${
											activeSidebarTab === 'data'
												? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400'
												: 'text-zinc-400 border-transparent hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
										}`}
									>
										<Database size={14} />
										<span>Data</span>
									</button>
								</div>

								{/* Top Right Action (Back/Undo & Save) */}
								<div className='flex items-center gap-2'>
									<button 
										onClick={() => setIsSettingsOpen(false)}
										title="Go back"
										className='flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'>
										<Undo2 size={14} />
									</button>
									<button
										onClick={async () => {
											await handleSaveAgent();
											setIsSettingsOpen(false);
										}}
										className='flex h-8 items-center gap-1 rounded-lg bg-primary-400 px-3 text-[11px] font-bold text-primary-950 shadow-md shadow-primary-500/20 hover:bg-primary-500 transition active:scale-95 dark:shadow-none'>
										<CheckCircle2 size={13} />
										<span>Save</span>
									</button>
								</div>
							</div>

							{/* Settings Body - Render conditionally based on activeSidebarTab */}
							{activeSidebarTab === 'agent' && (
								<div className='flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/40 dark:bg-zinc-950/20'>
									
									{/* Agent Preferences Section */}
									<div className='rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-4'>
										{/* Preferences Header */}
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-1.5 cursor-pointer'>
												<ChevronDown size={16} className='text-zinc-500' />
												<h3 className='text-sm font-black text-zinc-900 dark:text-white'>Agent Preferences</h3>
											</div>
											<button className='inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-bold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'>
												<span>Advanced</span>
												<SlidersHorizontal size={10} />
											</button>
										</div>

										{/* Model Selector Card */}
										<div className='relative'>
											<button
												type='button'
												onClick={() => setIsModelPickerOpen((v) => !v)}
												className='flex w-full items-center justify-between rounded-xl border border-zinc-100 p-3 bg-zinc-50/20 dark:border-zinc-800 dark:bg-zinc-950/20 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition'>
												<div className='flex items-center gap-3'>
													<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/5 dark:text-blue-400'>
														<Sparkles size={16} fill='currentColor' />
													</div>
													<div className='flex flex-col text-left'>
														<span className='text-[10px] font-black tracking-wide text-zinc-400 uppercase'>Model</span>
														<span className='text-xs font-black text-zinc-800 dark:text-zinc-200'>
															{modelOptions.find((m) => m.id === agentModel)?.label ?? agentModel}
														</span>
													</div>
												</div>
												<ChevronDown size={14} className={`text-zinc-400 transition-transform ${isModelPickerOpen ? 'rotate-180' : ''}`} />
											</button>

											{isModelPickerOpen && (
												<>
													<div className='fixed inset-0 z-10' onClick={() => setIsModelPickerOpen(false)} />
													<div className='absolute left-0 right-0 z-20 mt-1.5 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900'>
														{modelOptions.map((option) => (
															<button
																key={option.id}
																type='button'
																onClick={() => {
																	setAgentModel(option.id);
																	setIsModelPickerOpen(false);
																}}
																className={`flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition ${
																	option.id === agentModel
																		? 'bg-primary-50 dark:bg-primary-950/30'
																		: 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
																}`}>
																<div className='flex w-full items-center justify-between'>
																	<span className='text-xs font-black text-zinc-800 dark:text-zinc-200'>{option.label}</span>
																	<span className='rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>
																		{option.tier}
																	</span>
																</div>
																<span className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
																	{option.description}
																</span>
															</button>
														))}
													</div>
												</>
											)}
										</div>

										{/* Instructions Textarea */}
										<div className='flex flex-col'>
											<textarea
												rows={3}
												value={agentInstructions}
												onChange={(e) => setAgentInstructions(e.target.value.substring(0, 4000))}
												placeholder='Add instructions for the agent...'
												className='w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/5 dark:border-zinc-800 dark:bg-zinc-950/25 dark:text-zinc-200 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-0 focus:ring-offset-50'
											/>
											<span className='text-[10px] font-bold text-zinc-400 dark:text-zinc-500 text-right mt-1.5'>
												{agentInstructions.length} / 4000
											</span>
										</div>

										{/* Allow Self-Updates Row */}
										<div className='flex items-center justify-between rounded-xl border border-zinc-100 p-3 bg-zinc-50/20 dark:border-zinc-800 dark:bg-zinc-950/20'>
											<div className='flex items-center gap-3'>
												<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
													<SquarePen size={16} />
												</div>
												<div className='flex flex-col pr-4'>
													<span className='text-xs font-black text-zinc-800 dark:text-zinc-200'>Allow Self-Updates</span>
													<span className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-400 mt-0.5 leading-normal'>Let the agent improve its knowledge and instructions automatically.</span>
												</div>
											</div>
											<button
												onClick={() => setAllowSelfUpdates(!allowSelfUpdates)}
												className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
													allowSelfUpdates ? 'bg-primary-400 dark:bg-primary-400' : 'bg-zinc-200 dark:bg-zinc-800'
												}`}>
												<span
													className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
														allowSelfUpdates ? 'translate-x-4' : 'translate-x-0'
													}`}
												/>
											</button>
										</div>
									</div>

									{/* Triggers Section */}
									<div className='rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-3'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-2'>
												<div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
													<Zap size={14} fill="currentColor" />
												</div>
												<h4 className='text-xs font-black text-zinc-900 dark:text-white'>Triggers</h4>
											</div>
											<button
												onClick={openTriggerPanel}
												className='flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black text-primary-600 hover:bg-zinc-50 dark:border-primary-500/20 dark:bg-zinc-900 dark:text-primary-400 dark:hover:bg-zinc-800'>
												<Plus size={10} />
												<span>Trigger</span>
											</button>
										</div>

										{(agentTriggers ?? []).length === 0 && !isTriggerPanelOpen && (
											<p className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 pl-9'>
												Define events or conditions that activate this agent.
											</p>
										)}

										{(agentTriggers ?? []).length > 0 && (
											<div className='space-y-2 pl-9'>
												{(agentTriggers ?? []).map((trigger) => (
													<div
														key={trigger.id}
														className='flex flex-col gap-1.5 rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
														<div className='flex items-center justify-between'>
															<div className='flex items-center gap-2'>
																<span className='rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-black uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'>
																	{trigger.type}
																</span>
																<button
																	onClick={() => handleToggleTrigger(trigger.id, trigger.is_active)}
																	className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
																		trigger.is_active ? 'bg-primary-400' : 'bg-zinc-200 dark:bg-zinc-800'
																	}`}>
																	<span
																		className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition duration-200 ${
																			trigger.is_active ? 'translate-x-3' : 'translate-x-0'
																		}`}
																	/>
																</button>
															</div>
															<div className='flex items-center gap-2'>
																<button
																	onClick={() => handleFireTrigger(trigger.id)}
																	title='Fire now'
																	className='text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400'>
																	<Play size={12} />
																</button>
																<button
																	onClick={() => handleDeleteTrigger(trigger.id)}
																	title='Delete trigger'
																	className='text-zinc-400 hover:text-rose-500'>
																	<Trash2 size={12} />
																</button>
															</div>
														</div>
														{trigger.webhook_url && (
															<button
																onClick={() => handleCopyWebhookUrl(trigger.webhook_url!)}
																className='flex items-center gap-1.5 truncate text-left text-[10px] font-semibold text-zinc-400 hover:text-primary-600 dark:text-zinc-500 dark:hover:text-primary-400'>
																<Copy size={10} className='shrink-0' />
																<span className='truncate'>{trigger.webhook_url}</span>
															</button>
														)}
													</div>
												))}
											</div>
										)}

										{isTriggerPanelOpen && (
											<div className='space-y-2.5 rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 dark:border-zinc-800 dark:bg-zinc-950/20 ml-9'>
												<div className='flex gap-1.5'>
													{(['schedule', 'webhook', 'event'] as TAgentTriggerType[]).map((t) => (
														<button
															key={t}
															type='button'
															onClick={() => setNewTriggerType(t)}
															className={`rounded-lg px-2.5 py-1 text-[10px] font-black capitalize transition ${
																newTriggerType === t
																	? 'bg-primary-400 text-primary-950'
																	: 'border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
															}`}>
															{t}
														</button>
													))}
												</div>
												{newTriggerType === 'schedule' && (
													<input
														type='text'
														value={newTriggerCron}
														onChange={(e) => setNewTriggerCron(e.target.value)}
														placeholder='Cron expression (0 9 * * *)'
														className='w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-mono text-zinc-800 outline-none focus:border-primary-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
													/>
												)}
												{newTriggerType === 'event' && (
													<input
														type='text'
														value={newTriggerEventName}
														onChange={(e) => setNewTriggerEventName(e.target.value)}
														placeholder='Event name'
														className='w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-800 outline-none focus:border-primary-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
													/>
												)}
												<input
													type='text'
													value={newTriggerInitialMessage}
													onChange={(e) => setNewTriggerInitialMessage(e.target.value)}
													placeholder='Initial message (optional)'
													className='w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-800 outline-none focus:border-primary-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
												/>
												<div className='flex justify-end gap-2'>
													<button
														onClick={() => setIsTriggerPanelOpen(false)}
														className='rounded-lg px-2.5 py-1 text-[10px] font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'>
														Cancel
													</button>
													<button
														onClick={() => {
															handleCreateTrigger();
															setIsTriggerPanelOpen(false);
														}}
														className='rounded-lg bg-primary-400 px-3 py-1 text-[10px] font-black text-primary-950 hover:bg-primary-500'>
														Create
													</button>
												</div>
											</div>
										)}
									</div>

									{/* Apps Section */}
									<div className='rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-3'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-2'>
												<div className='flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/5 dark:text-blue-400'>
													<Layers size={14} />
												</div>
												<div className='flex items-center gap-2'>
													<h4 className='text-xs font-black text-zinc-900 dark:text-white'>Apps</h4>
													<span className='inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/5 px-2 py-0.5 rounded-full'>
														<span className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
														<span>AI Discovery: ON</span>
													</span>
												</div>
											</div>
											<button 
												onClick={() => {
													setAppSearchQuery('');
													setAppCategory('all');
													setIsAddAppOpen(true);
												}} 
												className='flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black text-primary-600 hover:bg-zinc-50 dark:border-primary-500/20 dark:bg-zinc-900 dark:text-primary-400 dark:hover:bg-zinc-800'>
												<Plus size={10} />
												<span>App</span>
											</button>
										</div>

										{/* App List */}
										<div className='space-y-2 pl-9'>
											{connectedApps.map((app) => {
												const AppIcon = app.icon;
												return (
													<div key={app.id} className='flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/80 last:border-0'>
														<div className='flex items-center gap-3'>
															<div className={`flex h-8 w-8 items-center justify-center rounded-lg ${app.iconBg} text-white`}>
																<AppIcon size={15} />
															</div>
															<div className='flex flex-col'>
																<span className='text-xs font-black text-zinc-800 dark:text-zinc-200'>{app.name}</span>
																<span className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5'>{app.desc}</span>
															</div>
														</div>
														<div className='flex items-center gap-2'>
															{!app.isConnected && app.id === 'google-docs' ? (
																<button
																	onClick={() => {
																		setConnectedApps(prev => prev.map(a => a.id === 'google-docs' ? { ...a, isConnected: true } : a));
																		toast.success('Google Docs connected successfully!');
																	}}
																	className='px-2.5 py-1 border border-primary-200 text-primary-600 bg-primary-50 text-[10px] font-bold rounded-lg hover:bg-primary-100 dark:border-primary-500/20 dark:bg-primary-400/10 dark:text-primary-400 animate-pulse'>
																	Connect
																</button>
															) : (
																<ChevronRight size={14} className='text-zinc-400' />
															)}
															<button className='text-zinc-400 hover:text-zinc-700 p-1 dark:hover:text-zinc-200'><MoreHorizontal size={14}/></button>
														</div>
													</div>
												);
											})}
										</div>
									</div>

									{/* Skills Section */}
									<div className='rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-3'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-2'>
												<div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
													<Cpu size={14} />
												</div>
												<h4 className='text-xs font-black text-zinc-900 dark:text-white'>Skills</h4>
											</div>
											<button
												onClick={openSkillPanel}
												className='flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black text-primary-600 hover:bg-zinc-50 dark:border-primary-500/20 dark:bg-zinc-900 dark:text-primary-400 dark:hover:bg-zinc-800'>
												<Plus size={10} />
												<span>Skill</span>
											</button>
										</div>

										{(existingAgent?.skills ?? []).length === 0 && !isSkillPanelOpen && (
											<p className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 pl-9'>
												Add custom skills to extend your agent's abilities.
											</p>
										)}

										{(existingAgent?.skills ?? []).length > 0 && (
											<div className='space-y-2 pl-9'>
												{(existingAgent?.skills ?? []).map((skill) => (
													<div
														key={skill.id}
														className='flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/80 last:border-0'>
														<div className='flex flex-col min-w-0'>
															<span className='text-xs font-black text-zinc-800 dark:text-zinc-200'>{skill.name}</span>
															{skill.description && (
																<span className='truncate text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
																	{skill.description}
																</span>
															)}
														</div>
														<button
															onClick={() => handleDetachSkill(skill.id)}
															title='Remove skill'
															className='shrink-0 text-zinc-400 hover:text-rose-500'>
															<X size={13} />
														</button>
													</div>
												))}
											</div>
										)}

										{isSkillPanelOpen && (
											<div className='space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 dark:border-zinc-800 dark:bg-zinc-950/20 ml-9'>
												{availableSkillsToAttach.length > 0 && (
													<div className='space-y-1.5'>
														<span className='text-[10px] font-black text-zinc-400 uppercase tracking-wider'>
															Attach existing
														</span>
														{availableSkillsToAttach.map((skill) => (
															<button
																key={skill.id}
																onClick={() => handleAttachSkill(skill.id)}
																className='flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800'>
																<span className='text-[11px] font-bold text-zinc-700 dark:text-zinc-300'>{skill.name}</span>
																<Plus size={11} className='text-primary-500' />
															</button>
														))}
													</div>
												)}

												<div className='space-y-1.5'>
													<span className='text-[10px] font-black text-zinc-400 uppercase tracking-wider'>
														Create new
													</span>
													<input
														type='text'
														value={newSkillName}
														onChange={(e) => setNewSkillName(e.target.value)}
														placeholder='Skill name'
														className='w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-800 outline-none focus:border-primary-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
													/>
													<textarea
														rows={2}
														value={newSkillInstructions}
														onChange={(e) => setNewSkillInstructions(e.target.value)}
														placeholder='Instructions for this skill...'
														className='w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-800 outline-none focus:border-primary-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
													/>
												</div>

												<div className='flex justify-end gap-2'>
													<button
														onClick={() => setIsSkillPanelOpen(false)}
														className='rounded-lg px-2.5 py-1 text-[10px] font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'>
														Cancel
													</button>
													<button
														onClick={async () => {
															await handleCreateAndAttachSkill();
															setIsSkillPanelOpen(false);
														}}
														disabled={!newSkillName.trim() || !newSkillInstructions.trim()}
														className='rounded-lg bg-primary-400 px-3 py-1 text-[10px] font-black text-primary-950 hover:bg-primary-500 disabled:opacity-40'>
														Create & Attach
													</button>
												</div>
											</div>
										)}
									</div>

									{/* Subagents Section */}
									<div className='rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-3'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-2'>
												<div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
													<Users size={14} />
												</div>
												<h4 className='text-xs font-black text-zinc-900 dark:text-white'>Subagents</h4>
											</div>
											<button onClick={() => toast.info('Subagent creation dialog opened')} className='flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black text-primary-600 hover:bg-zinc-50 dark:border-primary-500/20 dark:bg-zinc-900 dark:text-primary-400 dark:hover:bg-zinc-800'>
												<Plus size={10} />
												<span>Subagent</span>
											</button>
										</div>
										<p className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 pl-9'>
											Delegate tasks to specialized subagents.
										</p>

										{/* Subagent Item */}
										<div className='flex items-center justify-between py-2 border border-zinc-100 rounded-xl p-3 bg-zinc-50/20 dark:border-zinc-800 dark:bg-zinc-950/20 pl-9'>
											<div className='flex items-center gap-3'>
												<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-zinc-800 dark:border dark:border-zinc-700'>
													<Bot size={15} />
												</div>
												<div className='flex flex-col'>
													<span className='text-xs font-black text-zinc-800 dark:text-zinc-200'>Competitor Research Agent (Me)</span>
													<span className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5'>Enables me to clone myself as a subagent to research competitors.</span>
												</div>
											</div>
											<button className='text-zinc-400 hover:text-zinc-700 p-1 dark:hover:text-zinc-200'><MoreHorizontal size={14}/></button>
										</div>
									</div>

									{/* Bottom Autosave footer banner */}
									<div className='flex gap-3 rounded-xl bg-primary-400/5 border border-primary-500/10 p-3.5 dark:bg-primary-400/5 dark:border-primary-500/10'>
										<Sparkles size={16} className='text-primary-500 shrink-0 mt-0.5' />
										<div className='flex flex-col'>
											<span className='text-xs font-bold text-primary-700 dark:text-primary-400'>Changes are saved automatically</span>
											<span className='text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-1 leading-normal'>Your agent will use the latest configuration for all new conversations.</span>
										</div>
									</div>

								</div>
							)}

							{/* Settings Tab Layout */}
							{activeSidebarTab === 'settings' && (
								<div className='flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/40 dark:bg-zinc-950/20'>
									
									{/* Personalization Section */}
									<div className='rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-4 shadow-2xs'>
										{/* Section Header */}
										<div className='flex items-center gap-2.5 pb-2 border-b border-zinc-100 dark:border-zinc-800/80'>
											<ChevronDown size={18} className='text-zinc-500 cursor-pointer' />
											<div className='flex h-8 w-8 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-400/10 dark:text-primary-400'>
												<Users size={16} />
											</div>
											<h3 className='text-sm font-black text-zinc-950 dark:text-white'>Personalization</h3>
										</div>

										{/* Content Layout */}
										<div className='grid grid-cols-1 md:grid-cols-12 gap-6 items-start'>
											
											{/* Left side: Avatar and Popover Icon Selector Grid */}
											<div className='md:col-span-5 flex flex-col items-start space-y-3 relative'>
												{/* Subheader Title */}
												<div className='space-y-0.5'>
													<h4 className='text-xs font-black text-zinc-950 dark:text-white'>Icon & Name</h4>
													<p className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>Choose an icon and give your agent a name.</p>
												</div>

												{/* Large Chosen Icon Avatar Box */}
												<div 
													onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
													className='relative flex h-24 w-24 items-center justify-center rounded-2xl border border-zinc-200 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-950/45 shadow-2xs cursor-pointer select-none'
												>
													<AgentIconComponent size={44} className={getIconColorClass(agentIconColor)} />
													{/* Pencil edit badge overlay */}
													<div className='absolute -bottom-1 -right-1 flex h-6.5 w-6.5 items-center justify-center rounded-full bg-primary-400 text-primary-950 border border-white dark:border-zinc-900 shadow-md shadow-primary-500/10 cursor-pointer'>
														<SquarePen size={11} />
													</div>
												</div>

												{/* Icon Picker Popover Container (Dropdown) */}
												<AnimatePresence>
													{isIconPickerOpen && (
														<motion.div
															initial={{ opacity: 0, y: -10 }}
															animate={{ opacity: 1, y: 0 }}
															exit={{ opacity: 0, y: -10 }}
															transition={{ duration: 0.15 }}
															className='relative w-full max-w-[280px] border border-zinc-200 bg-white p-4 shadow-sm rounded-2xl space-y-4 dark:border-zinc-800 dark:bg-zinc-900/60 mt-1.5'
														>
															{/* Top pointer speech-bubble triangle */}
															<div className='absolute -top-1.5 left-9 w-3 h-3 bg-white border-t border-l border-zinc-200 rotate-45 dark:bg-zinc-900 dark:border-zinc-800' />
															
															{/* Icons Grid (10 icons) */}
															<div className='grid grid-cols-5 gap-2 relative z-10'>
																{selectableIcons.map((item, idx) => {
																	const Icon = item.Icon;
																	const isSelected = agentIcon === Icon;
																	return (
																		<button
																			key={idx}
																			type='button'
																			onClick={() => setAgentIcon(() => Icon)}
																			className={`flex h-9 w-9 items-center justify-center rounded-xl border transition active:scale-95 ${
																				isSelected
																					? 'border-primary-600 bg-primary-50 text-primary-600 dark:border-primary-400 dark:bg-primary-400/10 dark:text-primary-400'
																					: 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
																			}`}>
																			<Icon size={16} />
																		</button>
																	);
																})}
															</div>

															{/* Colors Selector */}
															<div className='space-y-1.5 relative z-10'>
																<span className='text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider'>Color</span>
																<div className='flex items-center gap-2.5'>
																	{colorsList.map((col) => {
																		const isSelected = agentIconColor === col.value;
																		return (
																			<button
																				key={col.value}
																				type='button'
																				onClick={() => setAgentIconColor(col.value)}
																				className={`h-5 w-5 rounded-full border transition flex items-center justify-center ${col.bgClass} ${
																					isSelected ? 'ring-2 ring-primary-500 ring-offset-50 dark:ring-offset-zinc-900 bg-clip-content p-[1px]' : 'border-zinc-200 dark:border-zinc-700'
																				}`}
																				title={col.value}>
																				{col.value === 'rainbow' && (
																					<div className='h-full w-full rounded-full bg-gradient-to-tr from-primary-400 via-emerald-500 to-rose-500' />
																				)}
																			</button>
																		);
																	})}
																</div>
															</div>
														</motion.div>
													)}
												</AnimatePresence>
											</div>

											{/* Right side: Input text name & description */}
											<div className='md:col-span-7 space-y-4 w-full pt-12 md:pt-0'>
												{/* Agent Name input field */}
												<div className='space-y-1.5 w-full'>
													<label className='text-[11px] font-black text-zinc-500 dark:text-zinc-400'>Agent Name</label>
													<div className='relative flex items-center rounded-xl border border-zinc-200 bg-white px-3.5 py-3 shadow-2xs focus-within:border-primary-500/50 focus-within:ring-4 focus-within:ring-primary-500/5 dark:border-zinc-800 dark:bg-zinc-950/20'>
														<input
															type='text'
															value={agentName}
															onChange={(e) => setAgentName(e.target.value.substring(0, 50))}
															className='flex-1 bg-transparent text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none border-none focus:ring-0 p-0 dark:text-zinc-100'
															placeholder='Name your agent...'
														/>
														<span className='text-[10px] font-bold text-zinc-400 dark:text-zinc-500 shrink-0'>{agentName.length} / 50</span>
													</div>
												</div>

												{/* Description textarea box */}
												<div className='space-y-1.5 w-full'>
													<div className='flex flex-col'>
														<label className='text-[11px] font-black text-zinc-600 dark:text-zinc-300'>Description</label>
														<span className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5'>Describe what your agent does and how it helps you.</span>
													</div>
													{/* Border wrapping both textarea and character count at bottom right */}
													<div className='relative flex flex-col rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs focus-within:border-primary-500/50 focus-within:ring-4 focus-within:ring-primary-500/5 dark:border-zinc-800 dark:bg-zinc-950/20'>
														<textarea
															rows={4}
															value={agentDescription}
															onChange={(e) => setAgentDescription(e.target.value.substring(0, 500))}
															className='w-full bg-transparent resize-none border-none outline-none focus:ring-0 p-0 text-xs font-semibold text-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-500 focus:outline-none'
															placeholder='Describe agent capability...'
														/>
														<span className='text-[10px] font-bold text-zinc-400 dark:text-zinc-500 text-right mt-2 self-end'>
															{agentDescription.length} / 500
														</span>
													</div>
												</div>
											</div>
										</div>
									</div>

									{/* List of sub-setting options rows */}
									<div className='space-y-2.5'>
										{/* Agent Details */}
										<div className='flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs hover:bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-900/40 transition cursor-pointer'>
											<div className='flex items-center gap-3 min-w-0'>
												<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
													<Zap size={16} />
												</div>
												<div className='flex flex-col min-w-0'>
													<span className='text-xs font-black text-zinc-900 dark:text-zinc-200'>Agent Details</span>
													<span className='truncate text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5'>Configure core information and capabilities of your agent.</span>
												</div>
											</div>
											<div className='flex items-center gap-2.5 shrink-0'>
												<button
													type='button'
													onClick={(e) => {
														e.stopPropagation();
														toast.success('Agent copy created successfully!');
													}}
													className='flex items-center gap-1.5 px-3 py-1 border border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 text-[10px] font-black rounded-lg dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900'>
													<Copy size={11} />
													<span>Make a Copy</span>
												</button>
												<ChevronRight size={14} className='text-zinc-400' />
											</div>
										</div>

										{/* Chat Preferences */}
										<div className='flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs hover:bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-900/40 transition cursor-pointer'>
											<div className='flex items-center gap-3 min-w-0'>
												<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/5 dark:text-blue-400'>
													<MessageSquare size={16} />
												</div>
												<div className='flex flex-col min-w-0'>
													<span className='text-xs font-black text-zinc-900 dark:text-zinc-200'>Chat Preferences</span>
													<span className='truncate text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5'>Customize how your agent communicates and responds.</span>
												</div>
											</div>
											<ChevronRight size={14} className='text-zinc-400' />
										</div>

										{/* Slack Preferences */}
										<div className='flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs hover:bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-900/40 transition cursor-pointer'>
											<div className='flex items-center gap-3 min-w-0'>
												<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/5 dark:text-emerald-400'>
													<Layers size={16} />
												</div>
												<div className='flex flex-col min-w-0'>
													<span className='text-xs font-black text-zinc-900 dark:text-zinc-200'>Slack Preferences</span>
													<span className='truncate text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5'>Configure how your agent interacts in Slack.</span>
												</div>
											</div>
											<ChevronRight size={14} className='text-zinc-400' />
										</div>

										{/* Secrets */}
										<div className='flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs hover:bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-900/40 transition cursor-pointer'>
											<div className='flex items-center gap-3 min-w-0'>
												<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/5 dark:text-amber-400'>
													<Lock size={16} />
												</div>
												<div className='flex flex-col min-w-0'>
													<span className='text-xs font-black text-zinc-900 dark:text-zinc-200'>Secrets</span>
													<span className='truncate text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5'>Manage API keys, tokens, and other sensitive information.</span>
												</div>
											</div>
											<ChevronRight size={14} className='text-zinc-400' />
										</div>

										{/* Danger Zone */}
										<div className='flex items-center justify-between rounded-xl border border-rose-200 bg-white p-3.5 shadow-2xs hover:bg-rose-50/20 dark:border-rose-950/40 dark:bg-zinc-900/40 transition cursor-pointer'>
											<div className='flex items-center gap-3 min-w-0'>
												<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/5 dark:text-rose-400'>
													<AlertTriangle size={16} />
												</div>
												<div className='flex flex-col min-w-0'>
													<span className='text-xs font-black text-rose-600 dark:text-rose-400'>Danger Zone</span>
													<span className='truncate text-[10px] font-semibold text-zinc-400 dark:text-rose-950/40 leading-tight mt-0.5'>Irreversible actions that can affect your agent.</span>
												</div>
											</div>
											<ChevronRight size={14} className='text-rose-400' />
										</div>
									</div>

									{/* Bottom secure banner */}
									<div className='flex items-center justify-between rounded-xl bg-primary-400/5 border border-primary-500/10 p-3.5 dark:bg-primary-400/5 dark:border-primary-500/10'>
										<div className='flex gap-3'>
											<Shield size={16} className='text-primary-500 shrink-0 mt-0.5' />
											<div className='flex flex-col'>
												<span className='text-xs font-bold text-primary-700 dark:text-primary-400'>Your settings are secure</span>
												<span className='text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-1 leading-normal'>All changes are saved automatically and encrypted.</span>
											</div>
										</div>
										<a
											href='#'
											onClick={(e) => {
												e.preventDefault();
												toast.info('Secure credentials document opened.');
											}}
											className='text-[10px] font-bold text-primary-600 hover:underline flex items-center gap-1 shrink-0 dark:text-primary-400'>
											<span>Learn more</span>
											<ExternalLink size={10} />
										</a>
									</div>

								</div>
							)}

							{/* Chat Details Tab */}
							{activeSidebarTab === 'chatDetails' && (
								<div className='flex-1 overflow-y-auto p-4 bg-zinc-50/40 dark:bg-zinc-950/20 flex flex-col items-center justify-center text-center space-y-3'>
									<div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500'>
										<MessageSquare size={22} />
									</div>
									<h4 className='text-sm font-black text-zinc-800 dark:text-zinc-100'>No Active Chat History Details</h4>
									<p className='text-xs font-semibold text-zinc-400 dark:text-zinc-500 max-w-[280px] leading-relaxed'>
										Once this agent runs inside a production environment, conversation logs, token usage, and execution stats will be displayed here.
									</p>
								</div>
							)}

							{activeSidebarTab === 'data' && (
								<AgentDataPanel ws={workspaceId} agentId={currentAgentId} />
							)}

						</motion.div>
					</>
				)}
			</AnimatePresence>

			{/* Add an App Drawer (Layered Overlay on top of settings drawer) */}
			<AnimatePresence>
				{isAddAppOpen && (
					<>
						{/* Subtle Dark Backdrop on settings drawer */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setIsAddAppOpen(false)}
							className='fixed inset-0 z-60 bg-black/20 backdrop-blur-xs'
						/>

						{/* Add App Drawer Container */}
						<motion.div
							initial={{ x: '100%' }}
							animate={{ x: 0 }}
							exit={{ x: '100%' }}
							transition={{ type: 'spring', damping: 25, stiffness: 220 }}
							className='fixed right-0 top-0 bottom-0 z-65 flex w-full max-w-[440px] flex-col border-l border-zinc-200 bg-white shadow-3xl dark:border-white/10 dark:bg-zinc-900 overflow-hidden'
						>
							{/* Drawer Header */}
							<div className='flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-5 dark:border-white/10 dark:bg-zinc-900'>
								<h3 className='text-[16px] font-black text-zinc-900 dark:text-white'>Add an app</h3>
								<button
									onClick={() => setIsAddAppOpen(false)}
									className='flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-800'>
									<X size={18} />
								</button>
							</div>

							{/* Search & Tabs Filter Box */}
							<div className='p-4 border-b border-zinc-100 dark:border-white/10 space-y-3 dark:bg-zinc-900'>
								<div className='flex gap-3 items-center'>
									{/* Search Input */}
									<div className='flex-1 relative flex items-center rounded-xl border border-zinc-200 bg-zinc-50/50 p-2 focus-within:border-primary-500/50 focus-within:ring-4 focus-within:ring-primary-500/5 dark:border-zinc-800 dark:bg-zinc-950/20'>
										<Search size={15} className='text-zinc-400 shrink-0 ml-1.5' />
										<input
											type='text'
											value={appSearchQuery}
											onChange={(e) => setAppSearchQuery(e.target.value)}
											placeholder='Search 98 apps'
											className='flex-1 bg-transparent px-2.5 text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none border-none focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500'
										/>
									</div>

									{/* Filter Tabs (All / Custom) */}
									<div className='flex bg-zinc-100 rounded-lg p-0.5 dark:bg-zinc-950/45 shrink-0'>
										<button
											onClick={() => setAppCategory('all')}
											className={`px-3 py-1.5 text-[10px] font-black rounded-md transition ${
												appCategory === 'all'
													? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-white'
													: 'text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300'
											}`}>
											All
										</button>
										<button
											onClick={() => setAppCategory('custom')}
											className={`px-3 py-1.5 text-[10px] font-black rounded-md transition ${
												appCategory === 'custom'
													? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-white'
													: 'text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300'
											}`}>
											Custom
										</button>
									</div>
								</div>
							</div>

							{/* Apps List Scrollable */}
							<div className='flex-1 overflow-y-auto p-4 space-y-3 dark:bg-zinc-950/10'>
								<h4 className='text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1'>All apps</h4>
								
								<div className='space-y-1.5'>
									{filteredAvailableApps.map((app) => {
										const AppIcon = app.icon;
										return (
											<div
												key={app.id}
												className='flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40 transition'>
												<div className='flex items-center gap-3'>
													<div className={`flex h-8 w-8 items-center justify-center rounded-lg ${app.iconBg} text-white shadow-2xs`}>
														<AppIcon size={16} />
													</div>
													<div className='flex flex-col'>
														<span className='text-xs font-black text-zinc-900 dark:text-zinc-100'>{app.name}</span>
														{/* Add description in mock detail */}
														<span className='text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5 leading-tight'>{app.desc}</span>
													</div>
												</div>
												<button
													onClick={() => handleAddAppFromList(app)}
													className='flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 active:scale-90 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition shadow-2xs'>
													<Plus size={14} />
												</button>
											</div>
										);
									})}
									{filteredAvailableApps.length === 0 && (
										<div className='text-center py-8 text-xs font-bold text-zinc-400 dark:text-zinc-500'>
											No apps match "{appSearchQuery}"
										</div>
									)}
								</div>
							</div>

							{/* Save Footer Bar */}
							<div className='p-3 border-t border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 flex justify-center'>
								<button
									onClick={() => {
										toast.success('App selections saved!');
										setIsAddAppOpen(false);
									}}
									className='w-full max-w-[380px] flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-500 text-white font-bold text-xs shadow-md shadow-zinc-500/20 hover:bg-zinc-600 transition active:scale-95 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:shadow-none'>
									<span>Save ⌘ S</span>
								</button>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
};

export default BuildPage;
