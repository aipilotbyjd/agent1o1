import { useState, useRef, useEffect, useMemo, memo, type RefObject } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown, { type Components } from 'react-markdown';
import {
	ArrowUp,
	ArrowDown,
	Bot,
	Paperclip,
	Share2,
	Sparkles,
	SquarePen,
	Play,
	CheckCircle2,
	Plus,
	Moon,
	Sun,
	Send,
	Database,
	Users,
	Mic,
	CheckSquare,
	Download,
	SlidersHorizontal,
	MoreHorizontal,
	X,
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
	Copy,
	RefreshCw,
	Search,
	Loader2,
	RotateCcw,
	FileJson,
	Trash2,
	Share,
	ImageIcon,
} from 'lucide-react';
import AgentTemplateCard from '../_partial/AgentTemplateCard.partial';
import {
	AGENT_COLOR_SWATCHES,
	AGENT_ICON_COMPONENTS,
	agentColorTextClass,
	agentIconFor,
} from '../../_helper/agentAppearance';
import { useAgentTemplates, useUseAgentTemplate } from '@/api/modules/templates';
import MainAppBar, {
	MainAppBarPillButton,
	MainAppBarIconButton,
} from '@/pages/coreapp/_partial/MainAppBar.partial';
import { toast } from 'react-toastify';
import useDarkMode from '@/hooks/useDarkMode';
import DARK_MODE from '@/constants/darkMode.constant';
import { LogoFyr } from '@/assets/images';
import pages from '@/Routes/pages';
import paths, { withWorkspace } from '@/Routes/paths';
import { useWorkspaceContext } from '@/context/workspace';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import {
	useAgent,
	useCreateAgent,
	useUpdateAgent,
	useDeleteAgent,
	useDuplicateAgent,
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
	useDraftAgent,
	useImproveAgentInstructions,
	useAgentSkillAttachments,
	useAgentToolBindings,
	useCreateAgentToolBinding,
	useDeleteAgentToolBinding,
	useAgentWorkflowTools,
	useAttachAgentWorkflow,
	useDetachAgentWorkflow,
	agentKeys,
	agentVersionKeys,
} from '@/api/modules/agents';
import { useGlobalNodeCatalog } from '@/api/modules/nodes';
import { useWorkflows } from '@/api/modules/workflows';
import type { TNode } from '@/types/node.type';
import type { TTrigger } from '@/types/trigger.type';
import { AGENT_COLORS, AGENT_ICONS } from '@/types/agent.type';
import type { TAgentColor, TAgentIcon, TAgentTriggerType } from '@/types/agent.type';
import type { TAgentTemplate } from '@/types/template.type';
import { useAgentSession } from '@/api/modules/agents';
import { AgentSessionService } from '@/api/modules/agents/agent-sessions.service';
import { useDownloadArtifact, ArtifactService } from '@/api/modules/artifacts';
import type { TWorkflow } from '@/types/workflow.type';
import type { TArtifact } from '@/types/artifact.type';
import type { TAgentMessage } from '@/types/agent.type';
import { useAgentChatStore } from '@/store/agentChat.store';
import { useAgentBuilderStore } from '@/store/agentBuilder.store';
import { XCircle, Wrench, FileDown, GitMerge } from 'lucide-react';
import AgentDataPanel from './_partial/AgentDataPanel.partial';
import AgentTagsPanel from './_partial/AgentTagsPanel.partial';
import AgentChatsPanel from './_partial/AgentChatsPanel.partial';

const transcriptToMessages = (messages: TAgentMessage[]): TMessage[] =>
	messages
		.filter((message) => message.role === 'user' || message.role === 'assistant')
		.map((message) => ({
			id: `msg-${message.id}`,
			sender: message.role === 'user' ? ('user' as const) : ('agent' as const),
			text:
				typeof message.content === 'string'
					? message.content
					: JSON.stringify(message.content, null, 2),
			timestamp: new Date(message.created_at).toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit',
			}),
			type: 'text' as const,
			attachments: message.attachments?.map((artifact) => ({
				id: artifact.id,
				filename: artifact.filename,
				size: artifact.size,
			})),
		}));

const EXPORT_ARTIFACT_TOOL = 'ExportArtifactTool';
const UPDATE_INSTRUCTIONS_TOOL = 'update_own_instructions';
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const MAX_ATTACHMENTS = 10;
const ATTACHMENT_EXTENSIONS = [
	'.png',
	'.jpg',
	'.jpeg',
	'.gif',
	'.webp',
	'.pdf',
	'.txt',
	'.md',
	'.html',
	'.csv',
	'.json',
	'.xml',
	'.yaml',
	'.yml',
];

const webhookUrlFor = (trigger: TTrigger) =>
	`${import.meta.env.VITE_API_URL ?? ''}/triggers/${trigger.id}/${trigger.token ?? ''}`;

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
	/** Original composer text, without attachment labels, for a failed-turn retry. */
	retryText?: string;
	/** Files sent with a user message. `id` is the stored artifact's — absent on
	 *  the copy shown while the turn is still in flight. */
	attachments?: { id?: string; filename: string; size: number }[];
	timestamp: string;
	type?: 'text' | 'table';
	headers?: string[];
	data?: any[];
	followUp?: string;
	actions?: { label: string; type: string }[];
	timeline?: TChatTimelineItem[];
	/** Set on a reply the user cut short with Stop — the text is a partial. */
	stopped?: boolean;
	failed?: boolean;
}

/** Where an unsent composer draft is parked, per agent and per chat. */
const draftKey = (agentId: string | null, sessionId: string | null) =>
	`agent1o1:chat-draft:${agentId ?? 'draft'}:${sessionId ?? 'new'}`;

/** Browser storage is unavailable in private windows and with site data blocked,
 *  so a lost draft must never take the composer down with it. */
const readDraft = (key: string) => {
	try {
		return localStorage.getItem(key) ?? '';
	} catch {
		return '';
	}
};

const writeDraft = (key: string, value: string) => {
	try {
		if (value.trim()) localStorage.setItem(key, value);
		else localStorage.removeItem(key);
	} catch {
		// A draft that cannot be parked is not worth an error — it stays in state.
	}
};

/** Grows the composer to fit its content. The height has to be reset first or
 *  scrollHeight only ever reports the taller of the two. */
const autoSizeComposer = (el: HTMLTextAreaElement) => {
	el.style.height = 'auto';
	el.style.height = `${el.scrollHeight}px`;
};

const ChatAttachmentTray = ({
	files,
	busy,
	onRemove,
}: {
	files: File[];
	busy: boolean;
	onRemove: (file: File) => void;
}) => {
	if (files.length === 0) return null;
	return (
		<div className='min-w-0 space-y-1.5' aria-live='polite'>
			<div className='flex max-h-24 flex-wrap gap-1.5 overflow-y-auto'>
				{files.map((file) => (
					<button
						key={`${file.name}-${file.size}-${file.lastModified}`}
						type='button'
						onClick={() => onRemove(file)}
						disabled={busy}
						aria-label={`Remove ${file.name}`}
						className='flex min-h-10 max-w-full min-w-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-2 text-xs disabled:opacity-60 dark:border-zinc-700'>
						<span className='truncate'>📎 {file.name}</span>
						<X size={14} className='shrink-0' />
					</button>
				))}
			</div>
		</div>
	);
};

/** Files a member sent with a message, above its bubble. Downloadable once the
 *  turn is stored and the artifact has an id. */
const MessageAttachments = ({
	attachments,
	ws,
}: {
	attachments: NonNullable<TMessage['attachments']>;
	ws: string;
}) => {
	const downloadMutation = useDownloadArtifact(ws);
	const chipClass =
		'flex min-h-9 max-w-full min-w-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200';

	return (
		<div className='mb-1.5 flex flex-wrap justify-end gap-1.5'>
			{attachments.map((file, index) => {
				const label = (
					<>
						<Paperclip size={12} className='shrink-0 text-zinc-400' />
						<span className='truncate'>{file.filename}</span>
						<span className='shrink-0 text-[10px] text-zinc-400'>
							{formatArtifactSize(file.size)}
						</span>
					</>
				);
				const { id } = file;
				return id ? (
					<button
						key={id}
						type='button'
						aria-label={`Download ${file.filename}`}
						onClick={() =>
							downloadMutation.mutate({ artifactId: id, filename: file.filename })
						}
						className={`${chipClass} cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800`}>
						{label}
					</button>
				) : (
					<span key={`${file.filename}-${index}`} className={chipClass}>
						{label}
					</span>
				);
			})}
		</div>
	);
};

const useDrawerFocus = (open: boolean, drawerRef: RefObject<HTMLDivElement | null>) => {
	useEffect(() => {
		if (!open || !drawerRef.current) return;
		const drawer = drawerRef.current;
		const previousFocus = document.activeElement as HTMLElement | null;
		const focusables = () =>
			Array.from(
				drawer.querySelectorAll<HTMLElement>(
					'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]',
				),
			).filter((element) => element.getClientRects().length > 0);
		focusables()[0]?.focus();
		const keepFocusInside = (event: KeyboardEvent) => {
			if (event.key !== 'Tab') return;
			const items = focusables();
			if (items.length === 0) return;
			const first = items[0];
			const last = items[items.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};
		drawer.addEventListener('keydown', keepFocusInside);
		return () => {
			drawer.removeEventListener('keydown', keepFocusInside);
			if (previousFocus?.isConnected) previousFocus.focus();
		};
	}, [open, drawerRef]);
};

const mdComponents: Components = {
	p: ({ children }) => <p className='mb-2 break-words whitespace-pre-line [overflow-wrap:anywhere] last:mb-0'>{children}</p>,
	strong: ({ children }) => (
		<strong className='font-black text-zinc-900 dark:text-white'>{children}</strong>
	),
	em: ({ children }) => <em className='italic'>{children}</em>,
	ul: ({ children }) => <ul className='mb-2 ml-4 list-disc space-y-1 last:mb-0'>{children}</ul>,
	ol: ({ children }) => (
		<ol className='mb-2 ml-4 list-decimal space-y-1 last:mb-0'>{children}</ol>
	),
	li: ({ children }) => <li className='pl-0.5'>{children}</li>,
	h1: ({ children }) => <h1 className='mb-1.5 text-base font-black'>{children}</h1>,
	h2: ({ children }) => <h2 className='mb-1.5 text-sm font-black'>{children}</h2>,
	h3: ({ children }) => <h3 className='mb-1 text-sm font-bold'>{children}</h3>,
	code: ({ children }) => (
		<code className='text-primary-700 dark:text-primary-400 rounded bg-zinc-100 px-1 py-0.5 font-mono text-[12px] [overflow-wrap:anywhere] dark:bg-zinc-800'>
			{children}
		</code>
	),
	pre: ({ children }) => (
		<pre className='mb-2 max-w-full overflow-x-auto rounded-lg bg-zinc-100 p-3 text-[12px] dark:bg-zinc-950'>
			{children}
		</pre>
	),
	a: ({ children, href }) => (
		<a
			href={href}
			target='_blank'
			rel='noreferrer'
			className='hover:text-primary-600 dark:hover:text-primary-400 underline underline-offset-2 [overflow-wrap:anywhere]'>
			{children}
		</a>
	),
	table: ({ children }) => (
		<div className='mb-2 max-w-full overflow-x-auto'>
			<table className='min-w-max text-left text-xs'>{children}</table>
		</div>
	),
};

// Markdown parsing is the costliest part of a chat row. The page re-renders on
// every keystroke and every streamed delta; memoising on `text` means only the
// reply that is actually changing gets re-parsed.
const MessageMarkdown = memo(function MessageMarkdown({ text }: { text: string }) {
	return <ReactMarkdown components={mdComponents}>{text}</ReactMarkdown>;
});

const prettifyToolName = (raw: string) =>
	raw.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

/** One tool-call line in the live scratchpad or a finished message's collapsed steps. */
const ToolStepLine = ({ item }: { item: Extract<TChatTimelineItem, { kind: 'tool' }> }) => (
	<div className='flex items-center gap-1.5 text-[12.5px] font-semibold text-zinc-500 dark:text-zinc-400'>
		{item.status === 'running' && (
			<Loader2 size={12} className='text-primary-500 shrink-0 animate-spin' />
		)}
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

const ArtifactCard = ({
	item,
	ws,
}: {
	item: Extract<TChatTimelineItem, { kind: 'artifact' }>;
	ws: string;
}) => {
	const downloadMutation = useDownloadArtifact(ws);

	return (
		<div className='flex max-w-full min-w-0 items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 shadow-2xs dark:border-zinc-800/85 dark:bg-zinc-900/60'>
			<div className='bg-primary-400/10 text-primary-600 dark:text-primary-400 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl'>
				<FileDown size={16} />
			</div>
			<div className='min-w-0 flex-1'>
				<p className='truncate text-xs font-bold text-zinc-800 dark:text-zinc-200'>
					{item.filename}
				</p>
				<p className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
					v{item.version} · {formatArtifactSize(item.size)}
				</p>
			</div>
			<button
				aria-label='Download'
				onClick={() =>
					downloadMutation.mutate({ artifactId: item.id, filename: item.filename })
				}
				className='flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'>
				<Download size={13} />
			</button>
		</div>
	);
};

const TimelineSteps = ({
	items,
	className = '',
}: {
	items: TChatTimelineItem[];
	className?: string;
}) => {
	const [expanded, setExpanded] = useState(false);
	const toolCount = items.filter((item) => item.kind === 'tool').length;

	if (toolCount === 0) return null;

	return (
		<div className={`flex flex-col gap-1.5 pl-1 ${className}`}>
			<button
				type='button'
				onClick={() => setExpanded((v) => !v)}
				className='flex w-fit items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'>
				<ChevronRight
					size={11}
					className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
				/>
				{toolCount} step{toolCount === 1 ? '' : 's'}
			</button>
			{expanded && (
				<div className='flex flex-col gap-1'>
					{items.map((item) =>
						item.kind === 'tool' ? <ToolStepLine key={item.id} item={item} /> : null,
					)}
				</div>
			)}
		</div>
	);
};

const BuildPage = () => {
	const { agentId: routeAgentId, workspaceId: routeWorkspaceId } = useParams<{
		agentId?: string;
		workspaceId?: string;
	}>();
	const navigate = useNavigate();
	const { activeWorkspaceId } = useWorkspaceContext();
	const { activeWorkspaceId: fallbackWorkspaceId } = useWorkflowShellStore();
	const workspaceId = routeWorkspaceId || activeWorkspaceId || fallbackWorkspaceId;

	/** `pages` paths are templates (`/:workspaceId/agents/edit`). */
	const toWorkspacePath = (to: string) => withWorkspace(to, workspaceId);

	const [currentAgentId, setCurrentAgentId] = useState<string | undefined>(routeAgentId);

	// The open chat is shared with AgentAside, which lists this agent's past
	// sessions and can switch between them — see store/agentChat.store.ts.
	const conversationId = useAgentChatStore((state) => state.sessionId);
	const openSession = useAgentChatStore((state) => state.openSession);
	const newSession = useAgentChatStore((state) => state.newSession);
	const setChatAgentId = useAgentChatStore((state) => state.setAgentId);
	const setIsSending = useAgentChatStore((state) => state.setIsSending);

	// Live scratchpad for the reply currently streaming in — reset on every send.
	const [streamTimeline, setStreamTimeline] = useState<TChatTimelineItem[]>([]);
	const streamTimelineRef = useRef<TChatTimelineItem[]>([]);
	const setTimeline = (updater: (prev: TChatTimelineItem[]) => TChatTimelineItem[]) => {
		streamTimelineRef.current = updater(streamTimelineRef.current);
		setStreamTimeline(streamTimelineRef.current);
	};

	const { data: existingAgent } = useAgent(workspaceId, currentAgentId ?? '');
	const queryClient = useQueryClient();
	const duplicateAgentMutation = useDuplicateAgent(workspaceId);
	const [showGetStarted, setShowGetStarted] = useState(true);
	const createAgentMutation = useCreateAgent(workspaceId);
	const updateAgentMutation = useUpdateAgent(workspaceId);
	const deleteAgentMutation = useDeleteAgent(workspaceId);

	// Skills — workspace catalog + this agent's attachments
	const { data: workspaceSkills } = useAgentSkills(workspaceId);
	// Attached skills are a sub-resource here, not an `agent.skills` field.
	const { data: attachedSkills } = useAgentSkillAttachments(workspaceId, currentAgentId ?? '');
	const createSkillMutation = useCreateAgentSkill(workspaceId);
	const attachSkillMutation = useAttachAgentSkill(workspaceId, currentAgentId ?? '');
	const detachSkillMutation = useDetachAgentSkill(workspaceId, currentAgentId ?? '');
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

	const { data: metaModelGroups } = useAgentMetaModels(workspaceId);
	const modelOptions = useMemo(
		() =>
			(metaModelGroups ?? []).map((entry) => ({
				id: entry.id,
				slug: entry.slug,
				label: entry.display_name,
				tier: entry.brand,
				description: entry.slug,
				isAvailable: entry.is_available,
			})),
		[metaModelGroups],
	);

	const [newTriggerType, setNewTriggerType] = useState<TAgentTriggerType>('schedule');
	const [newTriggerCron, setNewTriggerCron] = useState('0 9 * * *');
	const [newTriggerEventName, setNewTriggerEventName] = useState('');
	const [newTriggerInitialMessage, setNewTriggerInitialMessage] = useState('');
	const [pendingDeleteTriggerId, setPendingDeleteTriggerId] = useState<string | null>(null);

	const [activeTab, setActiveTab] = useState('All');
	const [promptText, setPromptText] = useState('');
	const { isDarkTheme, setDarkModeStatus } = useDarkMode();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const heroPromptRef = useRef<HTMLInputElement>(null);
	const templatesSectionRef = useRef<HTMLElement>(null);
	const chatScrollRef = useRef<HTMLDivElement>(null);
	const followLatestRef = useRef(true);
	const lastScrolledSessionRef = useRef<string | null>(null);
	const [showLatestButton, setShowLatestButton] = useState(false);
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

		const [isPreviewMode, setIsPreviewMode] = useState(Boolean(routeAgentId));
	const [agentName, setAgentName] = useState('');
	const [agentIcon, setAgentIcon] = useState<TAgentIcon>('bot');
	const [agentIconColor, setAgentIconColor] = useState<TAgentColor>('purple');
	const [chatHistory, setChatHistory] = useState<TMessage[]>([]);
	const [chatInput, setChatInput] = useState('');
	const [chatAttachments, setChatAttachments] = useState<File[]>([]);
	const attachmentInputRef = useRef<HTMLInputElement | null>(null);
	const mobileComposerRef = useRef<HTMLTextAreaElement | null>(null);
	const [mobileViewportHeight, setMobileViewportHeight] = useState<number | null>(null);
	const [isMobileKeyboardOpen, setIsMobileKeyboardOpen] = useState(false);
	const [isTyping, setIsTyping] = useState(false);
	// Aborts the turn in flight. `streamMessage` already takes an AbortSignal —
	// this is the Stop button's end of it.
	const streamAbortRef = useRef<AbortController | null>(null);
	// Message whose hover toolbar is pinned open on touch, where there is no hover.
	const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
	const composerRef = useRef<HTMLTextAreaElement | null>(null);
	useEffect(() => {
		const viewport = window.visualViewport;
		const updateHeight = () => {
			setMobileViewportHeight(Math.round(viewport?.height ?? window.innerHeight));
			setIsMobileKeyboardOpen(
				Boolean(viewport && viewport.height < window.innerHeight - 120),
			);
			if (document.activeElement === mobileComposerRef.current) {
				requestAnimationFrame(() =>
					mobileComposerRef.current?.scrollIntoView({ block: 'nearest' }),
				);
			}
		};
		updateHeight();
		viewport?.addEventListener('resize', updateHeight);
		window.addEventListener('resize', updateHeight);
		return () => {
			viewport?.removeEventListener('resize', updateHeight);
			window.removeEventListener('resize', updateHeight);
		};
	}, []);

	useEffect(() => {
		setChatAgentId(currentAgentId ?? null);
	}, [currentAgentId, setChatAgentId]);

	const loadedSessionRef = useRef<string | null>(null);

	const {
		data: openedSession,
		isPending: isSessionPending,
		isError: isSessionError,
		refetch: refetchSession,
	} = useAgentSession(workspaceId, currentAgentId ?? '', conversationId ?? '');

	useEffect(() => {
		if (!conversationId) {
			if (loadedSessionRef.current === null) return;

			loadedSessionRef.current = null;
			setChatHistory([]);
			return;
		}

		if (loadedSessionRef.current === conversationId) return;
		if (!openedSession || String(openedSession.id) !== String(conversationId)) return;

		loadedSessionRef.current = conversationId;
		setChatHistory(transcriptToMessages(openedSession.messages ?? []));
		setIsPreviewMode(true);
	}, [conversationId, openedSession]);

	// An unsent message survives a chat switch, a tab change and a reload — it is
	// parked per agent and per chat, so two chats never share one draft.
	const draftKeyRef = useRef<string>('');
	useEffect(() => {
		const nextKey = draftKey(currentAgentId ?? null, conversationId ?? null);
		if (nextKey === draftKeyRef.current) return;
		draftKeyRef.current = nextKey;
		setChatInput(readDraft(nextKey));
	}, [currentAgentId, conversationId]);

	/** Every write to the composer goes through here so the draft stays parked.
	 *  Parking in an effect instead would race the restore above and blank it. */
	const updateChatInput = (value: string) => {
		setChatInput(value);
		writeDraft(draftKeyRef.current, value);
	};

	// A restored draft is set straight into state, so nothing has resized the box
	// for it — a two-line draft would come back showing one line.
	useEffect(() => {
		if (composerRef.current) autoSizeComposer(composerRef.current);
		if (mobileComposerRef.current) autoSizeComposer(mobileComposerRef.current);
	}, [chatInput]);

	const selectChatAttachments = (files: FileList | null) => {
		if (!files) return;
		const accepted: File[] = [];
		for (const file of Array.from(files)) {
			if (
				!ATTACHMENT_EXTENSIONS.some((extension) =>
					file.name.toLowerCase().endsWith(extension),
				)
			) {
				toast.error(
					`${file.name}: use an image (JPEG, PNG, GIF, WebP), a PDF, or a text, Markdown, HTML, CSV, JSON, XML, or YAML file.`,
				);
				continue;
			}
			if (file.size > MAX_ATTACHMENT_BYTES) {
				toast.error(`${file.name}: maximum file size is 25 MB.`);
				continue;
			}
			accepted.push(file);
		}
		const added = accepted.filter(
			(file) =>
				!chatAttachments.some(
					(existing) =>
						existing.name === file.name &&
						existing.size === file.size &&
						existing.lastModified === file.lastModified,
				),
		);
		if (chatAttachments.length + added.length > MAX_ATTACHMENTS) {
			toast.error(`You can attach up to ${MAX_ATTACHMENTS} files per message.`);
		}
		setChatAttachments([
			...chatAttachments,
			...added.slice(0, Math.max(MAX_ATTACHMENTS - chatAttachments.length, 0)),
		]);
		if (attachmentInputRef.current) attachmentInputRef.current.value = '';
	};
	const removeChatAttachment = (file: File) => {
		setChatAttachments((current) => current.filter((item) => item !== file));
	};

	
	const [skillEnabled, setSkillEnabled] = useState(true);

	// Sidebar settings panel states
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [activeSidebarTab, setActiveSidebarTab] = useState<
				'agent' | 'chatDetails' | 'data'
	>('agent');

	const requestedDataSection = useAgentBuilderStore((state) => state.requestedDataSection);
	useEffect(() => {
		if (!requestedDataSection) return;
		setActiveSidebarTab('data');
		setIsSettingsOpen(true);
	}, [requestedDataSection]);
	const [agentInstructions, setAgentInstructions] = useState('');
	const [instructionsChange, setInstructionsChange] = useState('');
	const [agentModel, setAgentModel] = useState('');

	useEffect(() => {
		if (agentModel || modelOptions.length === 0) return;
		setAgentModel((modelOptions.find((m) => m.isAvailable) ?? modelOptions[0]).id);
	}, [agentModel, modelOptions]);
	const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
	const [allowSelfUpdates, setAllowSelfUpdates] = useState(false);
	const [agentDescription, setAgentDescription] = useState('');

	const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

	const {
		data: toolBindings,
		isPending: isToolBindingsPending,
		isError: isToolBindingsError,
		refetch: refetchToolBindings,
	} = useAgentToolBindings(workspaceId, currentAgentId ?? '');
	const {
		data: workflowTools,
		isPending: isWorkflowToolsPending,
		isError: isWorkflowToolsError,
		refetch: refetchWorkflowTools,
	} = useAgentWorkflowTools(workspaceId, currentAgentId ?? '');
	const createToolBindingMutation = useCreateAgentToolBinding(workspaceId, currentAgentId ?? '');
	const deleteToolBindingMutation = useDeleteAgentToolBinding(workspaceId, currentAgentId ?? '');
	const attachWorkflowMutation = useAttachAgentWorkflow(workspaceId, currentAgentId ?? '');
	const detachWorkflowMutation = useDetachAgentWorkflow(workspaceId, currentAgentId ?? '');

	const {
		data: nodeCatalog,
		isPending: isNodeCatalogPending,
		isError: isNodeCatalogError,
		refetch: refetchNodeCatalog,
	} = useGlobalNodeCatalog();
	const {
		data: workspaceWorkflows,
		isPending: isWorkflowsPending,
		isError: isWorkflowsError,
		refetch: refetchWorkflows,
	} = useWorkflows(workspaceId);

	const [isAddAppOpen, setIsAddAppOpen] = useState(false);
	const settingsDrawerRef = useRef<HTMLDivElement | null>(null);
	const toolDrawerRef = useRef<HTMLDivElement | null>(null);
	useDrawerFocus(isSettingsOpen, settingsDrawerRef);
	useDrawerFocus(isAddAppOpen, toolDrawerRef);
	const [appSearchQuery, setAppSearchQuery] = useState('');
	const [toolTab, setToolTab] = useState<'nodes' | 'workflows'>('nodes');
	const drawerStateRef = useRef({ settings: false, tool: false });
	const previousDrawerStateRef = useRef({ settings: false, tool: false });
	useEffect(() => {
		drawerStateRef.current = { settings: isSettingsOpen, tool: isAddAppOpen };
		const previous = previousDrawerStateRef.current;
		if (isSettingsOpen && !previous.settings) {
			window.history.pushState({ ...window.history.state, agentDrawer: 'settings' }, '');
		}
		if (isAddAppOpen && !previous.tool) {
			window.history.pushState({ ...window.history.state, agentDrawer: 'tool' }, '');
		}
		previousDrawerStateRef.current = { settings: isSettingsOpen, tool: isAddAppOpen };
	}, [isSettingsOpen, isAddAppOpen]);
	useEffect(() => {
		const closeOnBack = () => {
			if (drawerStateRef.current.tool) setIsAddAppOpen(false);
			else if (drawerStateRef.current.settings) {
				setPendingDeleteTriggerId(null);
				setIsSettingsOpen(false);
			}
		};
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			if (drawerStateRef.current.tool || drawerStateRef.current.settings) {
				event.preventDefault();
				if (window.history.state?.agentDrawer) window.history.back();
				else closeOnBack();
			}
		};
		window.addEventListener('popstate', closeOnBack);
		window.addEventListener('keydown', closeOnEscape);
		return () => {
			window.removeEventListener('popstate', closeOnBack);
			window.removeEventListener('keydown', closeOnEscape);
		};
	}, []);
	const closeSettingsDrawer = () => {
		if (window.history.state?.agentDrawer === 'settings') window.history.back();
		else {
			setPendingDeleteTriggerId(null);
			setIsSettingsOpen(false);
		}
	};
	const closeToolDrawer = () => {
		if (window.history.state?.agentDrawer === 'tool') window.history.back();
		else setIsAddAppOpen(false);
	};

	const [isSaving, setIsSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState('');
	const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);

	const toggleDarkMode = () => {
		setDarkModeStatus(isDarkTheme ? DARK_MODE.LIGHT : DARK_MODE.DARK);
	};

	useEffect(() => {
		if (!existingAgent) return;
		setAgentName(existingAgent.name);
		setAgentDescription(existingAgent.description ?? '');
		setAgentInstructions(existingAgent.instructions ?? '');
		setAgentIcon(existingAgent.icon ?? 'bot');
		setAgentIconColor(existingAgent.color ?? 'purple');
		setAllowSelfUpdates(existingAgent.allow_self_updates);
		if (existingAgent.model_catalog_id) {
			setAgentModel(existingAgent.model_catalog_id);
		}
	}, [existingAgent]);

	// Returns the persisted agent's id so callers (chat, settings) can use it immediately.
	const ensureAgentPersisted = async (overrides?: {
		name?: string;
		description?: string;
		instructions?: string;
		icon?: TAgentIcon;
		color?: TAgentColor;
	}): Promise<string> => {
		const payload = {
			name: overrides?.name?.trim() || agentName.trim() || 'Untitled Agent',
			description: overrides?.description ?? agentDescription,
			icon: overrides?.icon ?? agentIcon,
			color: overrides?.color ?? agentIconColor,
			instructions: (overrides?.instructions ?? agentInstructions).trim() || null,
			model_catalog_id: agentModel || null,
			allow_self_updates: allowSelfUpdates,
		};

		if (currentAgentId) {
			await updateAgentMutation.mutateAsync({ id: currentAgentId, body: payload });
			return currentAgentId;
		}

		const created = await createAgentMutation.mutateAsync(payload);
		setCurrentAgentId(created.id);
		setChatAgentId(created.id);
		navigate(paths.editAgent(workspaceId, created.id), { replace: true });
		return created.id;
	};

	const handleSaveAgent = async () => {
		if (isSaving) return;
		setIsSaving(true);
		setSaveStatus('Saving changes...');
		try {
			await ensureAgentPersisted();
			const now = new Date().toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
			});
			setSaveStatus(`Saved at ${now}`);
			toast.success('Agent saved successfully!');
			return true;
		} catch {
			setSaveStatus('Failed to save');
			return false;
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteAgent = async () => {
		setIsMoreDropdownOpen(false);
		if (currentAgentId) {
			await deleteAgentMutation.mutateAsync(currentAgentId);
		}
		navigate(toWorkspacePath(pages.workspace.subPages!.agents.to));
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

	const attachedSkillIds = new Set((attachedSkills ?? []).map((s) => s.id));
	const availableSkillsToAttach = (workspaceSkills ?? []).filter(
		(s) => !attachedSkillIds.has(s.id),
	);

	const handleAttachSkill = (skillId: string) => {
		if (!currentAgentId) return;
		attachSkillMutation.mutate(skillId);
	};

	const handleDetachSkill = (skillId: string) => {
		if (!currentAgentId) return;
		detachSkillMutation.mutate(skillId);
	};

	const handleCreateAndAttachSkill = async () => {
		if (!currentAgentId || !newSkillName.trim() || !newSkillInstructions.trim()) return;
		const skill = await createSkillMutation.mutateAsync({
			name: newSkillName.trim(),
			instructions: newSkillInstructions.trim(),
		});
		attachSkillMutation.mutate(skill.id);
		setNewSkillName('');
		setNewSkillInstructions('');
	};

	const handleCreateTrigger = async () => {
		if (!currentAgentId) return;
		if (newTriggerType === 'schedule' && !newTriggerCron.trim()) {
			toast.error('Enter a schedule before creating the trigger.');
			return;
		}
		if (newTriggerType === 'event' && !newTriggerEventName.trim()) {
			toast.error('Enter an event name before creating the trigger.');
			return;
		}
		const config: Record<string, unknown> =
			newTriggerType === 'schedule'
				? { cron: newTriggerCron.trim() }
				: newTriggerType === 'event'
					? { event: newTriggerEventName.trim() }
					: {};
		if (newTriggerInitialMessage.trim()) config.initial_message = newTriggerInitialMessage.trim();

		try {
			await createTriggerMutation.mutateAsync({
				type: newTriggerType,
				config,
				is_active: true,
			});
			setNewTriggerEventName('');
			setNewTriggerInitialMessage('');
			setIsTriggerPanelOpen(false);
			toast.success('Trigger created.');
		} catch {
			// The mutation cache shows the API error; keep the form for correction.
		}
	};

	const handleToggleTrigger = async (triggerId: string, isActive: boolean) => {
		try {
			await updateTriggerMutation.mutateAsync({ triggerId, body: { is_active: !isActive } });
			toast.success(isActive ? 'Trigger disabled.' : 'Trigger enabled.');
		} catch {
			// The mutation cache reports the API error.
		}
	};

	const handleDeleteTrigger = (triggerId: string) => {
		deleteTriggerMutation.mutate(triggerId, {
			onSuccess: () => {
				setPendingDeleteTriggerId(null);
				toast.success('Trigger deleted.');
			},
		});
	};

	const handleFireTrigger = async (triggerId: string) => {
		try {
			await fireTriggerMutation.mutateAsync({ triggerId });
			toast.success('Trigger started.');
		} catch {
			// The mutation cache reports the API error.
		}
	};

	const copyToClipboard = async (value: string, successMessage: string) => {
		try {
			await navigator.clipboard.writeText(value);
			toast.success(successMessage);
		} catch {
			toast.error('Could not copy. Please try again.');
		}
	};

	const handleCopyWebhookUrl = (url: string) => {
		void copyToClipboard(url, 'Webhook URL copied!');
	};

	const handleChatScroll = () => {
		const scroll = chatScrollRef.current;
		if (!scroll) return;
		const nearBottom = scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight < 96;
		followLatestRef.current = nearBottom;
		setShowLatestButton(!nearBottom);
	};

	const jumpToLatest = () => {
		followLatestRef.current = true;
		chatScrollRef.current?.scrollTo({
			top: chatScrollRef.current.scrollHeight,
			behavior: 'smooth',
		});
		setShowLatestButton(false);
	};

	// Follow a new chat and live replies only while the reader is near the bottom.
	useEffect(() => {
		const scroll = chatScrollRef.current;
		if (!scroll) return;
		const switchedSession = lastScrolledSessionRef.current !== conversationId;
		lastScrolledSessionRef.current = conversationId;
		if (switchedSession) followLatestRef.current = true;
		if (followLatestRef.current) scroll.scrollTo({ top: scroll.scrollHeight });
	}, [chatHistory, streamTimeline, isTyping, conversationId]);

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

	const handleChipClick = (text: string) => {
		setPromptText(text);
		if (textareaRef.current) {
			textareaRef.current.focus();
		}
	};

	const openPreview = () => setIsPreviewMode(true);

	const draftAgentMutation = useDraftAgent(workspaceId);
	const improveInstructionsMutation = useImproveAgentInstructions(workspaceId);

	// Rewrites what's in the editor (saved or not) with the agent's own model;
	// the result stays unsaved until the user saves the agent.
	const handleImproveInstructions = async () => {
		if (improveInstructionsMutation.isPending) return;
		try {
			const id = currentAgentId ?? (await ensureAgentPersisted());
			const improved = await improveInstructionsMutation.mutateAsync({
				id,
				instructions: agentInstructions.trim() || null,
				request: instructionsChange.trim() || null,
			});
			setAgentInstructions(improved);
			setInstructionsChange('');
			toast.success('Instructions rewritten. Review them, then save.');
		} catch {
			// The mutation's own error toast has already told the user.
		}
	};

		// Drafts the agent's name, description, instructions and look from the
	// description with the selected model, creates it as a new agent, and
	// opens its chat.
	const handleGenerateAgent = async () => {
		const description = promptText.trim();
		if (!description) {
			heroPromptRef.current?.focus();
			toast.info('Describe what your agent should do first.');
			return;
		}
		if (!agentModel) {
			toast.error('Choose a model for the agent first.');
			return;
		}

		try {
			const draft = await draftAgentMutation.mutateAsync({
				prompt: description,
				model_catalog_id: agentModel,
			});
						const created = await createAgentMutation.mutateAsync({
				...draft,
				model_catalog_id: agentModel,
				allow_self_updates: false,
			});
			setAgentName(draft.name);
			setAgentDescription(draft.description);
			setAgentInstructions(draft.instructions);
			setAgentIcon(draft.icon);
			setAgentIconColor(draft.color);
			setAllowSelfUpdates(false);
			setCurrentAgentId(created.id);
			setChatAgentId(created.id);
			navigate(paths.editAgent(workspaceId, created.id), { replace: true });
			setPromptText('');
			setChatHistory([]);
			openPreview();
		} catch {
			// The mutation's own error toast has already told the user.
		}
	};

	const { data: agentTemplates = [] } = useAgentTemplates(workspaceId);
	const useTemplateMutation = useUseAgentTemplate(workspaceId);

	const handleTemplateClick = (template: TAgentTemplate) => {
		if (useTemplateMutation.isPending) return;
		useTemplateMutation.mutate(
			{ id: template.id, body: { name: template.name, model_catalog_id: agentModel || null } },
			{
				onSuccess: (agent) => {
					setCurrentAgentId(agent.id);
					setChatAgentId(agent.id);
					setChatHistory([]);
					navigate(paths.editAgent(workspaceId, agent.id), { replace: true });
					openPreview();
				},
			},
		);
	};

	/**
	 * Files an `export_artifact` call produced during a turn, as download chips.
	 *
	 * The SSE `tool-result` event carries only the tool's id and name, not its
	 * return value, so the artifact ids are not on the wire. They are read back
	 * from `artifacts.index` instead, which returns one row per filename group
	 * at its newest version — see ArtifactController::index's latestPerGroup().
	 */
	const appendExportedArtifacts = async (agentId: string, filenames: string[]) => {
		try {
			const { artifacts } = await ArtifactService.list(workspaceId, {
				agent_id: agentId,
				per_page: 50,
			});
			const byFilename = new Map(artifacts.map((a) => [a.filename, a]));
			const items = Array.from(new Set(filenames))
				.map((filename) => byFilename.get(filename))
				.filter((a): a is TArtifact => !!a)
				.map((a) => ({
					kind: 'artifact' as const,
					id: a.id,
					filename: a.filename,
					version: a.version,
					mimeType: a.mime_type,
					size: a.size,
				}));

			if (items.length > 0) setTimeline((prev) => [...prev, ...items]);
		} catch {
			// A failed lookup costs the download chip, not the reply — the file is
			// stored either way and still shows on the workspace's Artifacts page.
		}
	};

	// Sends a message to the real agent — persists the agent first if this is
	// still an unsaved draft, then starts or continues its conversation.
	const sendChatMessage = async (messageText: string) => {
		const trimmed = messageText.trim();
		const files = [...chatAttachments];
		if ((!trimmed && files.length === 0) || !workspaceId || streamAbortRef.current) return;
		// The backend requires message text, even when only files are sent.
		const prompt = trimmed || 'Please review the attached files.';
		followLatestRef.current = true;
		setShowLatestButton(false);

		const userMsg: TMessage = {
			id: 'user-' + Date.now(),
			sender: 'user',
			text: prompt,
			retryText: trimmed,
			attachments:
				files.length > 0
					? files.map((file) => ({ filename: file.name, size: file.size }))
					: undefined,
			timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
		};

		setIsTyping(true);
		setTimeline(() => []);

		// One controller per turn — Stop aborts this one, and `finally` clears it
		// so a later Stop can never abort a turn that already ended.
		const controller = new AbortController();
		streamAbortRef.current = controller;
		setIsSending(true);
		let turnStarted = false;

		try {
			const agentIdForRun = await ensureAgentPersisted();
			if (controller.signal.aborted) throw new DOMException('Canceled', 'AbortError');

			// Conversations are "sessions" in this backend. The old API created one
			// implicitly with the first message and handed its id back on the reply;
			// here it is an explicit resource — created once, then reused for every
			// later turn so the agent keeps the thread's history.
			let sessionId = conversationId;
			if (!sessionId) {
				// Sessions are stored untitled unless the client names one, which
				// would leave the aside's Recents list a wall of "Untitled chat".
				const created = await AgentSessionService.create(workspaceId, agentIdForRun, {
					title: (trimmed || files[0]?.name || 'New chat').slice(0, 60),
				});
				sessionId = String(created.id);
				// This transcript is already on screen — keep the loader off it.
				loadedSessionRef.current = sessionId;
				openSession(sessionId);
			}
			setChatHistory((prev) => [...prev, userMsg]);
			turnStarted = true;

			// Filenames exported during this turn, resolved to artifacts once it ends.
			const exportedFilenames: string[] = [];
			let updatedInstructions = false;
			let replyText = '';
			let sawComplete = false;

			// The reply arrives as server-sent events on `.../messages/stream` — the
			// old backend broadcast it over Echo instead, which this one never does.
			for await (const event of AgentSessionService.streamMessage(
				workspaceId,
				agentIdForRun,
				sessionId,
				{ message: prompt, attachments: files },
				controller.signal,
			)) {
				if (event.event === 'delta') {
					setTimeline((prev) => {
						const last = prev[prev.length - 1];
						if (last && last.kind === 'text') {
							return [
								...prev.slice(0, -1),
								{ ...last, text: last.text + event.delta },
							];
						}
						return [
							...prev,
							{ kind: 'text', id: `text-${prev.length}`, text: event.delta },
						];
					});
					continue;
				}

				if (event.event === 'tool-call') {
					const args = (event.arguments ?? {}) as Record<string, unknown>;
					if (event.name === EXPORT_ARTIFACT_TOOL && typeof args.filename === 'string') {
						exportedFilenames.push(args.filename);
					}
					setTimeline((prev) => [
						...prev,
						{
							kind: 'tool',
							id: event.id,
							toolName: event.name,
							arguments: args,
							status: 'running',
						},
					]);
					continue;
				}

				if (event.event === 'tool-result') {
					// Only a tool that returned is reported; one that threw ends the
					// turn with `error` instead, so reaching here means success.
					if (event.name === UPDATE_INSTRUCTIONS_TOOL) updatedInstructions = true;
					setTimeline((prev) =>
						prev.map((item) =>
							item.kind === 'tool' && item.id === event.id
								? { ...item, status: 'done' }
								: item,
						),
					);
					continue;
				}

				if (event.event === 'complete') {
					sawComplete = true;
					// The persisted reply. Same string the deltas spell out, and the
					// fallback when a provider streamed none.
					replyText = event.text ?? replyText;
					continue;
				}

				if (event.event === 'error') {
					throw new Error(event.message || 'The agent failed to respond.');
				}
			}

			if (!sawComplete) {
				throw new Error('The connection dropped before the agent finished replying.');
			}

			if (exportedFilenames.length > 0) {
				await appendExportedArtifacts(agentIdForRun, exportedFilenames);
			}

			// The agent rewrote its own instructions; refetching the agent
			// re-syncs the settings form, and the save made a new version.
			if (updatedInstructions) {
				void queryClient.invalidateQueries({
					queryKey: agentKeys.detail(workspaceId, agentIdForRun),
				});
				void queryClient.invalidateQueries({
					queryKey: agentVersionKeys.list(workspaceId, agentIdForRun),
				});
			}

			const finishedTimeline = streamTimelineRef.current;
			const streamedText = finishedTimeline
				.filter((item) => item.kind === 'text')
				.map((item) => item.text)
				.join('');

			const agentMsg: TMessage = {
				id: 'agent-' + Date.now(),
				sender: 'agent',
				text: replyText || streamedText,
				timestamp: new Date().toLocaleTimeString([], {
					hour: '2-digit',
					minute: '2-digit',
				}),
				type: 'text',
				timeline: finishedTimeline.length > 0 ? finishedTimeline : undefined,
			};
			setChatHistory((prev) => [...prev, agentMsg]);
			setChatAttachments([]);
		} catch (err) {
			if (!turnStarted) {
				setChatInput((current) => {
					const restored =
						current.trim() && current.trim() !== trimmed
							? `${trimmed}\n\n${current}`
							: trimmed;
					writeDraft(draftKeyRef.current, restored);
					return restored;
				});
				if (!controller.signal.aborted)
					toast.error(err instanceof Error ? err.message : 'Failed to start the chat.');
				return;
			}
			// Stop is not a failure. Keep whatever the agent had already streamed —
			// throwing it away is the one thing a Stop button must not do.
			if (controller.signal.aborted) {
				const partial = streamTimelineRef.current;
				const partialText = partial
					.filter((item) => item.kind === 'text')
					.map((item) => item.text)
					.join('');
				setChatHistory((prev) => [
					...prev,
					{
						id: 'agent-stopped-' + Date.now(),
						sender: 'agent',
						text: partialText || '_Stopped before the agent replied._',
						timestamp: new Date().toLocaleTimeString([], {
							hour: '2-digit',
							minute: '2-digit',
						}),
						type: 'text',
						timeline: partial.length > 0 ? partial : undefined,
						stopped: true,
					},
				]);
			} else {
				setChatHistory((prev) => [
					...prev,
					{
						id: 'agent-error-' + Date.now(),
						sender: 'agent',
						text: "Sorry, I couldn't process that - please try again.",
						failed: true,
						timestamp: new Date().toLocaleTimeString([], {
							hour: '2-digit',
							minute: '2-digit',
						}),
						type: 'text',
					},
				]);
				toast.error(err instanceof Error ? err.message : 'Failed to reach the agent.');
			}
		} finally {
			streamAbortRef.current = null;
			setIsSending(false);
			setIsTyping(false);
			setTimeline(() => []);
		}
	};

	/** Cuts the turn in flight short; the catch above keeps the partial reply. */
	const stopStreaming = () => {
		streamAbortRef.current?.abort();
	};

	/** Re-runs the last user message. The backend keeps the abandoned turn in the
	 *  session's history — this appends a fresh one rather than replacing it. */
	const regenerateLastReply = () => {
		if (isTyping) return;
		const lastUser = [...chatHistory].reverse().find((message) => message.sender === 'user');
		if (!lastUser) return;
		// Drop the reply being replaced so the transcript does not show both.
		setChatHistory((prev) => {
			const lastUserIdx = prev.map((m) => m.id).lastIndexOf(lastUser.id);
			return lastUserIdx === -1 ? prev : prev.slice(0, lastUserIdx);
		});
		sendChatMessage(lastUser.retryText ?? lastUser.text);
	};

	/** Puts a sent message back in the composer and rewinds the transcript to it. */
	const editUserMessage = (message: TMessage) => {
		if (isTyping) return;
		setChatHistory((prev) => {
			const idx = prev.map((m) => m.id).lastIndexOf(message.id);
			return idx === -1 ? prev : prev.slice(0, idx);
		});
		updateChatInput(message.text);
		// The composer only exists on the desktop layout; mobile falls back to state.
		requestAnimationFrame(() => composerRef.current?.focus());
	};

	const copyMessage = (text: string) => {
		void copyToClipboard(text, 'Message copied.');
	};
	const useSuggestedPrompt = (prompt: string) => {
		updateChatInput(prompt);
		requestAnimationFrame(() => mobileComposerRef.current?.focus());
	};
	const openGetStartedTrigger = () => {
		setActiveSidebarTab('agent');
		setIsSettingsOpen(true);
		void openTriggerPanel().catch(() => {});
	};
	const openGetStartedTool = () => {
		void openToolDrawer().catch(() => {});
	};

	// Action chip clicks in chat response
	const handleActionClick = (action: { label: string; type: string }) => {
		// Otherwise, send it as a user chat message
		sendChatMessage(action.label);
	};

	// Add selected app to active connected apps
	/** Tools need a saved agent to hang off — same rule as skills and triggers. */
	const openToolDrawer = async () => {
		await ensureAgentPersisted();
		setAppSearchQuery('');
		setToolTab('nodes');
		setIsAddAppOpen(true);
	};

	const handleAttachNode = (node: TNode) => {
		if (!currentAgentId) return;
		if ((toolBindings ?? []).some((binding) => binding.node_type === node.type)) {
			toast.info(`${node.name} is already attached.`);
			return;
		}
		createToolBindingMutation.mutate(
			{ node_type: node.type },
			{ onSuccess: () => toast.success(`${node.name} attached.`) },
		);
	};

	const handleAttachWorkflow = (workflow: TWorkflow) => {
		if (!currentAgentId) return;
		if ((workflowTools ?? []).some((attached) => String(attached.id) === String(workflow.id))) {
			toast.info(`${workflow.name} is already attached.`);
			return;
		}
		attachWorkflowMutation.mutate(String(workflow.id), {
			onSuccess: () => toast.success(`${workflow.name} attached.`),
		});
	};

	const templateTabs = useMemo(
		() => [
			'All',
			...Array.from(
				new Set(agentTemplates.map((template) => template.category).filter(Boolean)),
			).sort(),
		] as string[],
		[agentTemplates],
	);
	const filteredTemplates =
		activeTab === 'All'
			? agentTemplates
			: agentTemplates.filter((template) => template.category === activeTab);

	// Drawer contents for whichever tab is showing, minus what's already attached.
	const attachedNodeTypes = new Set((toolBindings ?? []).map((binding) => binding.node_type));
	const attachedWorkflowIds = new Set((workflowTools ?? []).map((w) => String(w.id)));
	const toolQuery = appSearchQuery.trim().toLowerCase();
	const isToolListPending = toolTab === 'nodes'
		? isNodeCatalogPending || isToolBindingsPending
		: isWorkflowsPending || isWorkflowToolsPending;
	const isToolListError = toolTab === 'nodes'
		? isNodeCatalogError || isToolBindingsError
		: isWorkflowsError || isWorkflowToolsError;
	const retryToolList = () => {
		if (toolTab === 'nodes') {
			void refetchNodeCatalog();
			void refetchToolBindings();
		} else {
			void refetchWorkflows();
			void refetchWorkflowTools();
		}
	};

	const attachableNodes = (nodeCatalog ?? []).filter(
		(node) =>
			!attachedNodeTypes.has(node.type) &&
			(!toolQuery ||
				node.name.toLowerCase().includes(toolQuery) ||
				(node.description ?? '').toLowerCase().includes(toolQuery)),
	);

	const attachableWorkflows = (workspaceWorkflows ?? []).filter(
		(workflow) =>
			!attachedWorkflowIds.has(String(workflow.id)) &&
			(!toolQuery ||
				workflow.name.toLowerCase().includes(toolQuery) ||
				(workflow.description ?? '').toLowerCase().includes(toolQuery)),
	);

	/** Node metadata for an attached binding, so a row can show a real name. */
	const nodeFor = (nodeType: string) =>
		(nodeCatalog ?? []).find((node) => node.type === nodeType);

	const AgentIconComponent = agentIconFor(agentIcon);
	const chatStatus = isTyping
		? 'Responding'
		: conversationId && openedSession?.status === 'archived'
			? 'Archived chat'
			: currentAgentId
				? 'Ready'
				: 'Draft';
	const chatStatusColor = chatStatus === 'Ready' || chatStatus === 'Responding'
		? 'text-emerald-600 dark:text-emerald-400'
		: 'text-zinc-500 dark:text-zinc-400';
	const chatStatusDot = chatStatus === 'Ready' || chatStatus === 'Responding'
		? 'bg-emerald-500'
		: 'bg-zinc-400';

	return (
		<div
			style={isMobile && mobileViewportHeight ? { height: mobileViewportHeight } : undefined}
			className='relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-zinc-50/50 text-zinc-950 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-500'>
			{/* Ambient Lighting Gradients */}
			<div className='bg-primary-400/8 dark:bg-primary-400/12 pointer-events-none absolute top-[-100px] left-1/4 -z-10 h-[380px] w-[380px] rounded-full blur-[120px]' />
			<div className='pointer-events-none absolute right-1/4 bottom-1/4 -z-10 h-[450px] w-[450px] rounded-full bg-emerald-500/8 blur-[140px] dark:bg-emerald-600/12' />

						{!currentAgentId && !isPreviewMode ? (
				<>
					{/* Main Header / Top Bar */}
					<MainAppBar
						title='Agent Builder'
						status={
							saveStatus ||
							(existingAgent
								? `Saved ${new Date(existingAgent.updated_at).toLocaleString()}`
								: 'Not saved yet')
						}
						meta={`${agentTemplates.length} templates`}
						primaryActionLabel='Create agent'
						primaryActionIcon={Plus}
						primaryActionColor='purple'
						showWorkspaceActions={false}
						showThemeToggle={false}
						toggleClassName='md:hidden'
						onPrimaryAction={handleGenerateAgent}>
						{/* Share button */}
						<MainAppBarPillButton
							onClick={() =>
								void copyToClipboard(
									window.location.href,
									'Share link copied to clipboard!',
								)
							}>
							<Share2 size={15} />
							Share
						</MainAppBarPillButton>
						{/* Theme Toggle button (Moon/Sun) */}
						<MainAppBarIconButton
							title='Toggle theme'
							onClick={toggleDarkMode}
							className='border border-zinc-200 bg-white dark:border-white/10 dark:bg-white/[0.03]'>
							{isDarkTheme ? <Sun size={15} /> : <Moon size={15} />}
						</MainAppBarIconButton>
						{/* Save button with loading feedback */}
						<MainAppBarPillButton onClick={handleSaveAgent}>
							{isSaving ? (
								<Loader2
									size={15}
									className='text-primary-600 dark:text-primary-400 animate-spin'
								/>
							) : (
								<CheckCircle2 size={15} />
							)}
							<span>{isSaving ? 'Saving...' : 'Save'}</span>
						</MainAppBarPillButton>
						{/* Preview button with live state values */}
						<MainAppBarPillButton
							onClick={openPreview}
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
							<section className='border-primary-100/50 from-primary-400/5 via-primary-400/5 to-primary-400/5 dark:border-border-main dark:from-bg-card dark:to-bg-card relative z-10 overflow-hidden rounded-3xl border bg-linear-to-tr p-6 sm:p-8 lg:p-10'>
								{/* Background glow overlay */}
								<div className='bg-primary-400/10 dark:bg-primary-400/5 pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full blur-3xl' />

								{/* Robot badge */}
								<div className='dark:bg-bg-sidebar relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-lg dark:border dark:border-white/10'>
									<Bot size={28} strokeWidth={2} />
								</div>

								{/* Title */}
								<h1 className='text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl dark:text-white'>
									Build your{' '}
									<span className='from-primary-400 to-primary-400 dark:from-primary-400 dark:to-primary-300 bg-gradient-to-r bg-clip-text text-transparent'>
										agent
									</span>
								</h1>

								{/* Description */}
								<p className='lg:text-md mt-3 max-w-2xl text-xs font-semibold text-zinc-500 sm:text-sm dark:text-zinc-400'>
									Choose an agent template or simply describe what you need to get
									started.
								</p>

								{/* Describe Agent Input Box */}
								<div className='mt-8 max-w-2xl'>
									<div className='focus-within:border-primary-500/50 focus-within:ring-primary-500/5 dark:border-border-main relative flex items-center rounded-full border border-zinc-200/80 bg-white p-1.5 shadow-sm transition-all focus-within:ring-4 dark:bg-zinc-950/40'>
										<input
											ref={heroPromptRef}
											type='text'
											placeholder='Describe what your agent should do...'
											value={promptText}
											onChange={(e) => setPromptText(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													void handleGenerateAgent();
												}
											}}
											className='flex-1 border-none bg-transparent px-4 py-2 text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500'
										/>
										<button
											type='button'
											onClick={() => void handleGenerateAgent()}
											className='bg-primary-400 text-primary-950 shadow-primary-500/25 hover:bg-primary-500 flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold shadow-md transition active:scale-95 dark:shadow-none'>
											{draftAgentMutation.isPending ? (
												<Loader2 size={13} className='animate-spin' />
											) : (
												<Sparkles size={13} />
											)}
											{draftAgentMutation.isPending ? 'Generating…' : 'Generate agent'}
										</button>
									</div>
								</div>
							</section>

							{/* Templates Section */}
							<section
								ref={templatesSectionRef}
								className='relative z-10 mt-8 scroll-mt-4 sm:mt-14 lg:mt-16'>
								<div className='mb-5 flex items-center justify-between gap-4'>
									<div className='flex items-center gap-2.5'>
										<h2 className='text-lg font-black tracking-tight sm:text-xl dark:text-zinc-50'>
											Templates
										</h2>
										<span className='inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-black text-zinc-600 dark:bg-zinc-950/60 dark:text-zinc-400'>
											{filteredTemplates.length} Available
										</span>
									</div>
								</div>

								{/* Categories Tab Bar */}
								<div className='dark:border-border-main flex gap-5 overflow-x-auto border-b border-zinc-200/80 text-[13px] font-black whitespace-nowrap text-zinc-400 sm:gap-6 sm:text-sm dark:text-zinc-500'>
									{templateTabs.map((tab) => {
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
														className='bg-primary-400 dark:bg-primary-400 absolute right-0 bottom-0 left-0 h-0.5'
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
												key={template.id}
												initial={{ opacity: 0, scale: 0.95 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0, scale: 0.95 }}
												transition={{ duration: 0.2 }}>
												<AgentTemplateCard
													template={template}
													isCreating={
														useTemplateMutation.isPending &&
														useTemplateMutation.variables?.id === template.id
													}
													onClick={() => handleTemplateClick(template)}
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
									<span className='text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
										Quick starters
									</span>
									{suggestionChips.map((chip) => {
										const ChipIcon = chip.icon;
										return (
											<button
												key={chip.label}
												type='button'
												onClick={() => handleChipClick(chip.text)}
												className='dark:border-border-main dark:hover:border-border-main dark:hover:bg-bg-card inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/70 px-4 py-1.5 text-[11px] font-black text-zinc-600 shadow-2xs backdrop-blur-xs transition-all hover:bg-zinc-50/50 hover:text-zinc-950 dark:hover:text-white dark:bg-zinc-950/40 dark:text-zinc-400'>
												<ChipIcon size={12} className='text-primary-500' />
												{chip.label}
											</button>
										);
									})}
								</div>

								{/* Cockpit Shell */}
								<div className='focus-within:border-primary-500/50 focus-within:ring-primary-500/5 dark:border-border-main relative flex items-center rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm focus-within:ring-4 dark:bg-zinc-950/40'>
									<div className='text-primary-500 flex h-10 w-10 shrink-0 items-center justify-center'>
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
												void handleGenerateAgent();
											}
										}}
										placeholder='Or describe your agent here...'
										className='flex-1 border-none bg-transparent px-2 text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500'
									/>
									<button
										aria-label='Send'
										type='button'
										onClick={() => void handleGenerateAgent()}
										className='bg-primary-400 text-primary-950 hover:bg-primary-500 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md transition active:scale-95'>
										<Send size={15} />
									</button>
								</div>
							</section>

							<div className='pointer-events-none mt-auto h-6' />
						</motion.div>
					</main>

					{/* Mobile builder controls stay reachable while the content scrolls. */}
					<nav className='grid shrink-0 grid-cols-4 border-t border-zinc-200 bg-white/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-zinc-950/95'>
						<button
							type='button'
							onClick={() => heroPromptRef.current?.focus()}
							className='text-primary-600 active:bg-primary-50 dark:text-primary-400 dark:active:bg-primary-950/30 flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition'>
							<Sparkles size={18} />
							Describe
						</button>
						<button
							type='button'
							onClick={() =>
								templatesSectionRef.current?.scrollIntoView({
									behavior: 'smooth',
									block: 'start',
								})
							}
							className='flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold text-zinc-500 transition active:bg-zinc-100 dark:text-zinc-400 dark:active:bg-zinc-900'>
							<Layers size={18} />
							Templates
						</button>
						<button
							type='button'
							onClick={openPreview}
							className='flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold text-zinc-500 transition active:bg-zinc-100 dark:text-zinc-400 dark:active:bg-zinc-900'>
							<Play size={18} />
							Preview
						</button>
						<button
							type='button'
							onClick={() => {
								setActiveSidebarTab('agent');
								setIsSettingsOpen(true);
							}}
							className='flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold text-zinc-500 transition active:bg-zinc-100 dark:text-zinc-400 dark:active:bg-zinc-900'>
							<SlidersHorizontal size={18} />
							Configure
						</button>
					</nav>

				</>
			) : (
				// Premium Chat Interface View (from user screenshot)
				<div className='flex min-h-0 flex-1 flex-col bg-zinc-50/20 dark:bg-zinc-950/80'>
					{/* Responsive Chat Header */}
					{/* Mobile Chat Header */}
					<header className='border-zinc-150 flex min-h-14 shrink-0 items-center justify-between gap-2 border-b bg-white px-3 md:hidden dark:border-zinc-800 dark:bg-zinc-900'>
						<button
							aria-label='Back to agent builder'
							onClick={() => (currentAgentId ? navigate(paths.agents(workspaceId)) : setIsPreviewMode(false))}
							type='button'
							className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 active:bg-zinc-100 dark:text-zinc-400 dark:active:bg-zinc-800'>
							<ChevronRight size={20} className='rotate-180' />
						</button>
						<div className='flex min-w-0 flex-1 items-center gap-2'>
							<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white dark:border dark:border-white/10 dark:bg-zinc-900'>
								<AgentIconComponent
									size={17}
									className={agentColorTextClass(agentIconColor)}
								/>
							</div>
							<div className='min-w-0'>
								<p className='truncate text-sm font-black text-zinc-900 dark:text-white'>
									{agentName}
								</p>
								<p
									className={`flex items-center gap-1 text-[10px] font-bold ${chatStatusColor}`}>
									<span className={`h-1.5 w-1.5 rounded-full ${chatStatusDot}`} />{' '}
									{chatStatus}
								</p>
							</div>
						</div>
						<div className='flex shrink-0 items-center gap-1'>
							<button
								aria-label='Share'
								onClick={() =>
									void copyToClipboard(
										window.location.href,
										'Share link copied to clipboard!',
									)
								}
								type='button'
								className='flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 active:bg-zinc-100 dark:text-zinc-400 dark:active:bg-zinc-800'>
								<Share size={18} />
							</button>
							<button
								aria-label='Settings'
								onClick={() => {
									setActiveSidebarTab('agent');
									setIsSettingsOpen(true);
								}}
								type='button'
								className='text-primary-600 active:bg-primary-50 dark:text-primary-400 dark:active:bg-primary-950/30 flex h-10 w-10 items-center justify-center rounded-xl'>
								<SlidersHorizontal size={18} />
							</button>
						</div>
					</header>

					{/* Desktop Chat Header */}
					<header className='hidden h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 shadow-2xs backdrop-blur-md md:flex dark:border-white/10 dark:bg-zinc-950/90'>
						<div className='flex min-w-0 items-center gap-3'>
							{/* Back button */}
							<button
								aria-label='Close'
								onClick={() => (currentAgentId ? navigate(paths.agents(workspaceId)) : setIsPreviewMode(false))}
								className='flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:bg-white/[0.07] dark:hover:text-white'>
								<X size={16} />
							</button>

							{/* Agent Avatar */}
							<div
								className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-md dark:border dark:border-white/10 dark:bg-zinc-900`}>
								<AgentIconComponent
									size={20}
									className={agentColorTextClass(agentIconColor)}
								/>
							</div>

							{/* Agent name & status */}
							<div className='flex min-w-0 flex-col'>
								<div className='flex items-center gap-1.5'>
									<span className='truncate text-[14px] font-black tracking-tight text-zinc-900 dark:text-white'>
										{agentName}
									</span>
									<button
										type='button'
										title='Rename agent'
										onClick={() => {
											setActiveSidebarTab('agent');
											setIsSettingsOpen(true);
										}}
										className='text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300'>
										<SquarePen size={12} />
									</button>
								</div>
								<div className='flex items-center gap-1.5'>
									<span className={`h-2 w-2 rounded-full ${chatStatusDot}`} />
									<span className={`text-[11px] font-bold ${chatStatusColor}`}>
										{chatStatus}
									</span>
								</div>
							</div>
						</div>

						{/* Action Buttons Right */}
						<div className='flex items-center gap-2'>
							<MainAppBarPillButton
								onClick={() =>
									void copyToClipboard(
										window.location.href,
										'Share link copied to clipboard!',
									)
								}>
								<Share2 size={14} />
								<span>Share</span>
							</MainAppBarPillButton>

							

							<div className='relative'>
								<MainAppBarIconButton
									title='More options'
									onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}>
									<MoreHorizontal size={14} />
								</MainAppBarIconButton>
								<AnimatePresence>
									{isMoreDropdownOpen && (
										<>
											{/* Click outside backdrop */}
											<div
												className='fixed inset-0 z-40'
												onClick={() => setIsMoreDropdownOpen(false)}
											/>

											{/* Dropdown Menu */}
											<motion.div
												initial={{ opacity: 0, y: 8, scale: 0.95 }}
												animate={{ opacity: 1, y: 0, scale: 1 }}
												exit={{ opacity: 0, y: 8, scale: 0.95 }}
												transition={{ duration: 0.15, ease: 'easeOut' }}
												className='absolute right-0 z-50 mt-2 w-52 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-zinc-900'>
												<button
													disabled={isTyping}
													onClick={() => {
														setIsMoreDropdownOpen(false);
														// Leaves the stored session intact — it stays in the
														// aside's Recents; the next message opens a new one.
														newSession();
														loadedSessionRef.current = null;
														setChatHistory([]);
														toast.success('Chat history cleared!');
													}}
													className='flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-white/[0.04]'>
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
															tools: [
																...(toolBindings ?? []).map(
																	(b) =>
																		nodeFor(b.node_type)
																			?.name ?? b.node_type,
																),
																...(workflowTools ?? []).map(
																	(w) => w.name,
																),
															],
														};
														const dataStr =
															'data:text/json;charset=utf-8,' +
															encodeURIComponent(
																JSON.stringify(
																	agentConfig,
																	null,
																	2,
																),
															);
														const downloadAnchor =
															document.createElement('a');
														downloadAnchor.setAttribute(
															'href',
															dataStr,
														);
														downloadAnchor.setAttribute(
															'download',
															`${agentName.toLowerCase().replace(/\s+/g, '-')}-config.json`,
														);
														document.body.appendChild(downloadAnchor);
														downloadAnchor.click();
														downloadAnchor.remove();
														toast.success(
															'Agent configuration exported!',
														);
													}}
													className='flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/[0.04]'>
													<FileJson size={13} />
													Export Agent JSON
												</button>

																									<button
														disabled={!currentAgentId || duplicateAgentMutation.isPending}
														onClick={() => {
															setIsMoreDropdownOpen(false);
															if (!currentAgentId) return;
															duplicateAgentMutation.mutate(currentAgentId, {
																onSuccess: (copy) => {
																	toast.success(`"${copy.name}" created.`);
																	navigate(paths.editAgent(workspaceId, copy.id));
																},
															});
														}}
														className='flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-white/[0.04]'>
														<Copy size={13} />
														Duplicate Agent
													</button>

													<div className='my-1 border-t border-zinc-100 dark:border-white/5' />

													<button
														onClick={handleDeleteAgent}
													className='flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20'>
													<Trash2 size={13} />
													Delete Agent
												</button>
											</motion.div>
										</>
									)}
								</AnimatePresence>
							</div>

														<button
								onClick={() => {
									setActiveSidebarTab('agent');
									setIsSettingsOpen(true);
								}}
								className='bg-primary-400 text-primary-950 shadow-primary-500/20 hover:bg-primary-500 flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-bold shadow-md transition active:scale-95 dark:shadow-none'>
								<SlidersHorizontal size={13} />
								<span>Settings</span>
							</button>
						</div>
					</header>

					{/* Chat Message Box */}
					<div className='relative min-h-0 flex-1'>
						<div
							ref={chatScrollRef}
							onScroll={handleChatScroll}
							className='mx-auto h-full w-full max-w-4xl space-y-6 overflow-y-auto px-4 py-6 md:px-8'>
							{conversationId &&
							loadedSessionRef.current !== conversationId &&
							isSessionError ? (
								<div
									role='alert'
									className='mx-auto max-w-sm rounded-xl border border-rose-200 p-4 text-center text-sm text-zinc-700 dark:border-rose-900 dark:text-zinc-200'>
									<p>Could not load this chat.</p>
									<button
										type='button'
										onClick={() => void refetchSession()}
										className='bg-primary-400 text-primary-950 mt-3 min-h-10 rounded-lg px-4 text-xs font-bold'>
										Retry
									</button>
								</div>
							) : conversationId &&
							  loadedSessionRef.current !== conversationId &&
							  isSessionPending ? (
								<div
									role='status'
									className='flex items-center justify-center gap-2 py-12 text-sm text-zinc-500'>
									<Loader2 size={16} className='animate-spin' /> Loading chat…
								</div>
							) : isMobile &&
							  chatHistory.filter((m) => m.sender === 'user').length === 0 ? (
								<div className='flex flex-col items-center justify-center px-2 pt-8 pb-4 select-none'>
									{/* Centered Fire/Flame Logo */}
									<div className='mb-6 flex items-center justify-center'>
										<img
											src={LogoFyr}
											alt='Fyr Logo'
											className='h-[88px] w-[88px] object-contain'
										/>
									</div>

									{/* Centered Title */}
									<h2 className='mb-6 px-4 text-center text-[22px] font-black tracking-tight text-zinc-900 dark:text-white'>
										{agentName}
									</h2>

									{/* Row of circular buttons */}
									<div className='flex w-full max-w-sm flex-wrap items-center justify-center gap-3.5 px-4'>
										<button
											aria-label='Draft a research question'
											title='Research question'
											type='button'
											onClick={() =>
												useSuggestedPrompt(
													'Research this topic and summarize the key findings: ',
												)
											}
											className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-orange-100 bg-orange-50/60 text-orange-500 shadow-2xs transition hover:scale-105 active:scale-95 dark:border-orange-500/20 dark:bg-orange-500/10'>
											<Flame size={18} />
										</button>
										<button
											aria-label='Draft a comparison request'
											title='Compare options'
											type='button'
											onClick={() =>
												useSuggestedPrompt(
													'Compare these options in a clear table: ',
												)
											}
											className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50/60 text-blue-500 shadow-2xs transition hover:scale-105 active:scale-95 dark:border-blue-500/20 dark:bg-blue-500/10'>
											<FileText size={18} />
										</button>
										<button
											aria-label='Draft a structured plan request'
											title='Make a plan'
											type='button'
											onClick={() =>
												useSuggestedPrompt('Make a step-by-step plan for: ')
											}
											className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50/60 text-zinc-500 shadow-2xs transition hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800'>
											<Layers size={18} />
										</button>
										<button
											aria-label='Draft a web research question'
											title='Web research question'
											type='button'
											onClick={() =>
												useSuggestedPrompt(
													'What should I know about this topic? Include sources if available: ',
												)
											}
											className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50/60 text-zinc-500 shadow-2xs transition hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800'>
											<Globe size={18} />
										</button>
										<button
											aria-label='Draft a file request'
											title='Ask for a file'
											type='button'
											onClick={() =>
												useSuggestedPrompt(
													'Create a downloadable file containing: ',
												)
											}
											className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50/60 text-zinc-500 shadow-2xs transition hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800'>
											<Download size={18} />
										</button>
										<button
											aria-label='Draft an image request'
											title='Describe an image'
											type='button'
											onClick={() =>
												useSuggestedPrompt(
													'Help me describe an image for: ',
												)
											}
											className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50/60 text-zinc-500 shadow-2xs transition hover:scale-105 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800'>
											<ImageIcon size={18} />
										</button>
									</div>

									{/* Get started section */}
									{showGetStarted && (
										<div className='mt-12 w-full px-4'>
											<div className='mb-4 flex items-center justify-between'>
												<span className='text-[15px] font-black text-zinc-800 dark:text-zinc-100'>
													Get started
												</span>
												<button
													type='button'
													onClick={() => setShowGetStarted(false)}
													className='text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'>
													Dismiss
												</button>
											</div>

											{/* Horizontal scrolling grid container */}
											<div className='flex [scrollbar-width:none] gap-4 overflow-x-auto scroll-smooth pb-4 [&::-webkit-scrollbar]:hidden'>
												{/* Card 1 */}
												<button
													type='button'
													onClick={openGetStartedTrigger}
													className='border-zinc-150 flex max-w-[270px] min-w-[270px] flex-col rounded-2xl border bg-white p-5 text-left shadow-2xs transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60 dark:border-zinc-800/80 dark:bg-zinc-900'>
													<div className='mb-2 flex items-center gap-2 text-zinc-800 dark:text-zinc-200'>
														<Zap
															size={16}
															className='text-zinc-450 dark:text-zinc-400'
														/>
														<span className='text-xs font-black'>
															Set up a trigger
														</span>
													</div>
													<p className='text-[11px] leading-relaxed font-semibold text-zinc-500 dark:text-zinc-400'>
														Open trigger settings to run this agent on a
														schedule or from an event.
													</p>
												</button>

												{/* Card 2 */}
												<button
													type='button'
													onClick={openGetStartedTool}
													className='border-zinc-150 flex max-w-[270px] min-w-[270px] flex-col rounded-2xl border bg-white p-5 text-left shadow-2xs transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60 dark:border-zinc-800/80 dark:bg-zinc-900'>
													<div className='mb-2 flex items-center gap-2 text-zinc-800 dark:text-zinc-200'>
														<Layers
															size={16}
															className='text-zinc-455 dark:text-zinc-400'
														/>
														<span className='text-xs font-black'>
															Add a tool
														</span>
													</div>
													<p className='text-[11px] leading-relaxed font-semibold text-zinc-500 dark:text-zinc-400'>
														Choose a tool or workflow this agent can use
														while answering.
													</p>
												</button>
											</div>
										</div>
									)}
								</div>
							) : chatHistory.length === 0 ? (
								<div className='flex flex-col items-center justify-center px-4 pt-16 pb-8 text-center select-none'>
									<div className='mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900'>
										<AgentIconComponent
											size={30}
											className={agentColorTextClass(agentIconColor)}
										/>
									</div>
									<h2 className='text-xl font-black tracking-tight text-zinc-900 dark:text-white'>
										{agentName || 'Untitled Agent'}
									</h2>
									{agentDescription && (
										<p className='mt-2 max-w-md text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
											{agentDescription}
										</p>
									)}
								</div>
							) : (
								chatHistory.map((message, messageIdx) => {
									const isUser = message.sender === 'user';
									// Regenerate only makes sense on the reply that is actually last —
									// re-running an older turn would strand everything after it.
									const isLastMessage = messageIdx === chatHistory.length - 1;
									return (
										<div
											key={message.id}
											className={`group flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
											<div
												className={`flex max-w-[90%] gap-3 sm:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
												{/* Agent Avatar in body */}
												{!isUser && (
													<div
														className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-zinc-950 text-white dark:border-white/10 dark:bg-zinc-900`}>
														<AgentIconComponent
															size={16}
															className={agentColorTextClass(
																agentIconColor,
															)}
														/>
													</div>
												)}

												<div className='flex min-w-0 flex-col'>
													{/* What the agent did to produce this reply — collapsible steps */}
													{!isUser &&
														message.timeline &&
														message.timeline.length > 0 && (
															<TimelineSteps
																items={message.timeline}
																className='mb-1.5'
															/>
														)}

													{/* Files the agent exported — always shown, never collapsed */}
													{!isUser &&
														message.timeline &&
														message.timeline.length > 0 && (
															<div className='mb-1.5 flex flex-col gap-1.5'>
																{message.timeline.map((item) =>
																	item.kind === 'artifact' ? (
																		<ArtifactCard
																			key={item.id}
																			item={item}
																			ws={workspaceId}
																		/>
																	) : null,
																)}
															</div>
														)}

													{/* Files the member sent with this message */}
													{isUser &&
														message.attachments &&
														message.attachments.length > 0 && (
															<MessageAttachments
																attachments={message.attachments}
																ws={workspaceId}
															/>
														)}

													{/* Chat bubble */}
													<div
														className={`max-w-full min-w-0 rounded-2xl px-4 py-3 text-sm leading-relaxed font-semibold [overflow-wrap:anywhere] ${
															isUser
																? 'bg-primary-400/10 dark:bg-primary-400/25 rounded-tr-none text-zinc-950 dark:text-zinc-100'
																: 'rounded-tl-none border border-zinc-200/80 bg-white text-zinc-800 shadow-2xs dark:border-zinc-800/85 dark:bg-zinc-900/60 dark:text-zinc-200'
														}`}>
														{isUser ? (
															<p className='whitespace-pre-line'>
																{message.text}
															</p>
														) : (
															<MessageMarkdown
																text={message.text}
															/>
														)}

														{/* Structured Table for data responses */}
														{message.type === 'table' &&
															message.headers &&
															message.data && (
																<div className='mt-4 overflow-hidden rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950'>
																	<div className='overflow-x-auto'>
																		<table className='w-full text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400'>
																			<thead className='border-b border-zinc-200 bg-zinc-50/50 text-[11px] font-black tracking-wider text-zinc-600 uppercase dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400'>
																				<tr>
																					{message.headers.map(
																						(h) => (
																							<th
																								key={
																									h
																								}
																								className='px-4 py-2.5 font-bold'>
																								{h}
																							</th>
																						),
																					)}
																				</tr>
																			</thead>
																			<tbody className='divide-y divide-zinc-200/80 dark:divide-zinc-800'>
																				{message.data.map(
																					(row, rIdx) => (
																						<tr
																							key={
																								rIdx
																							}
																							className='hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20'>
																							{message.headers!.map(
																								(
																									h,
																								) => (
																									<td
																										key={
																											h
																										}
																										className='px-4 py-2.5 whitespace-nowrap text-zinc-900 dark:text-zinc-100'>
																										{
																											row[
																												h
																											]
																										}
																									</td>
																								),
																							)}
																						</tr>
																					),
																				)}
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

													{message.failed && (
														<button
															type='button'
															aria-label={`Actions for message at ${message.timestamp}`}
															onClick={regenerateLastReply}
															disabled={isTyping}
															className='mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-xs font-bold text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200'>
															<RefreshCw size={14} /> Retry response
														</button>
													)}

													{/* Action Buttons for agent messages */}
													{!isUser &&
														message.actions &&
														message.actions.length > 0 && (
															<div className='mt-3.5 flex flex-wrap gap-2.5'>
																{message.actions.map((act) => {
																	let IconComp = Sparkles;
																	if (
																		act.type === 'export_csv' ||
																		act.type === 'pdf_digest'
																	)
																		IconComp = Download;
																	if (
																		act.type === 'refine' ||
																		act.type === 'set_alert'
																	)
																		IconComp =
																			SlidersHorizontal;

																	return (
																		<button
																			key={act.label}
																			onClick={() =>
																				handleActionClick(
																					act,
																				)
																			}
																			className='inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-black text-zinc-700 shadow-2xs transition hover:bg-zinc-50 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80'>
																			<IconComp
																				size={12}
																				className='text-primary-500'
																			/>
																			<span>{act.label}</span>
																		</button>
																	);
																})}
															</div>
														)}

													{/* Timestamp + per-message actions. The toolbar rides the row's
												    hover; on touch there is none, so tapping the timestamp pins it. */}
													<div
														className={`mt-1.5 flex items-center gap-1.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
														<button
															type='button'
															onClick={() =>
																setActiveMessageId((current) =>
																	current === message.id
																		? null
																		: message.id,
																)
															}
															className='flex min-h-10 items-center gap-1 rounded-md px-2 text-[10px] font-semibold text-zinc-400 md:min-h-0 md:px-0 dark:text-zinc-500'>
															{message.timestamp}
															<MoreHorizontal
																size={14}
																className='md:hidden'
															/>
														</button>

														{message.stopped && (
															<span className='rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-black tracking-wide text-zinc-500 uppercase dark:bg-zinc-800 dark:text-zinc-400'>
																Stopped
															</span>
														)}

														<div
															className={`flex items-center gap-0.5 transition ${
																activeMessageId === message.id
																	? 'opacity-100'
																	: 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100'
															}`}>
															<button
																type='button'
																onClick={() =>
																	copyMessage(message.text)
																}
																title='Copy message'
																className='flex h-10 w-10 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 md:h-auto md:w-auto md:p-1 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'>
																<Copy size={11} />
															</button>

															{isUser && (
																<button
																	aria-label='Edit and resend message'
																	type='button'
																	onClick={() =>
																		editUserMessage(message)
																	}
																	disabled={isTyping}
																	title='Edit and resend'
																	className='flex h-10 w-10 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 md:h-auto md:w-auto md:p-1 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'>
																	<SquarePen size={11} />
																</button>
															)}

															{!isUser && isLastMessage && (
																<button
																	type='button'
																	onClick={regenerateLastReply}
																	disabled={isTyping}
																	title='Regenerate reply'
																	className='flex h-10 w-10 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 md:h-auto md:w-auto md:p-1 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'>
																	<RefreshCw size={11} />
																</button>
															)}
														</div>
													</div>
												</div>
											</div>
										</div>
									);
								})
							)}

							{/* Live scratchpad — reasoning + tool calls as they stream in, Gumloop-style */}
							{isTyping && (
								<div className='flex w-full justify-start'>
									<div className='flex max-w-[90%] flex-row gap-3 sm:max-w-[80%]'>
										<div
											className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-zinc-950 text-white dark:border-white/10 dark:bg-zinc-900`}>
											<AgentIconComponent
												size={16}
												className={agentColorTextClass(agentIconColor)}
											/>
										</div>
										<div className='min-w-0 flex-1'>
											{streamTimeline.length === 0 ? (
												<div className='inline-flex items-center gap-1.5 rounded-2xl rounded-tl-none border border-zinc-200/80 bg-white px-4 py-3 shadow-2xs dark:border-zinc-800/85 dark:bg-zinc-900/60'>
													<div className='bg-primary-400 h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:-0.3s]' />
													<div className='bg-primary-400 h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:-0.15s]' />
													<div className='bg-primary-400 h-2.5 w-2.5 animate-bounce rounded-full' />
												</div>
											) : (
												<>
													<div className='flex flex-col gap-1.5 rounded-2xl rounded-tl-none border border-zinc-200/80 bg-white px-4 py-3 text-sm leading-relaxed shadow-2xs dark:border-zinc-800/85 dark:bg-zinc-900/60'>
														{streamTimeline.map((item) => {
															if (item.kind === 'text') {
																return (
																	<span
																		key={item.id}
																		className='whitespace-pre-line text-zinc-700 dark:text-zinc-300'>
																		{item.text}
																		<span className='ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-current align-middle' />
																	</span>
																);
															}
															if (item.kind === 'tool') {
																return (
																	<ToolStepLine
																		key={item.id}
																		item={item}
																	/>
																);
															}
															return null;
														})}
													</div>
													{streamTimeline.some(
														(item) => item.kind === 'artifact',
													) && (
														<div className='mt-1.5 flex flex-col gap-1.5'>
															{streamTimeline.map((item) =>
																item.kind === 'artifact' ? (
																	<ArtifactCard
																		key={item.id}
																		item={item}
																		ws={workspaceId}
																	/>
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
						</div>
						{showLatestButton && (
							<button
								type='button'
								onClick={jumpToLatest}
								className='absolute right-4 bottom-3 z-10 flex min-h-11 items-center gap-1 rounded-full border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'>
								<ArrowDown size={14} /> Latest message
							</button>
						)}
					</div>

					{/* Chat Footer Input Area */}
					<input
						ref={attachmentInputRef}
						type='file'
						multiple
						disabled={isTyping}
						accept={ATTACHMENT_EXTENSIONS.join(',')}
						onChange={(event) => selectChatAttachments(event.target.files)}
						className='hidden'
						aria-label='Choose files to attach'
					/>
					{isMobile ? (
						<footer className='border-zinc-150 dark:border-zinc-850 border-t bg-zinc-50/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl dark:bg-zinc-950/95'>
							<div className='mx-auto flex w-full max-w-4xl flex-col gap-3'>
								<ChatAttachmentTray
									files={chatAttachments}
									busy={isTyping}
									onRemove={removeChatAttachment}
								/>
								{/* Chat Input Container */}
								<div className='flex flex-col rounded-2xl border border-zinc-200 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60'>
									{/* Input Text Area */}
									<textarea
										ref={mobileComposerRef}
										rows={1}
										value={chatInput}
										onChange={(e) => {
											updateChatInput(e.target.value);
											autoSizeComposer(e.currentTarget);
										}}
										onKeyDown={(e) => {
											if (
												e.nativeEvent.isComposing ||
												e.nativeEvent.keyCode === 229
											)
												return;
											if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
												e.preventDefault();
												if (
													(chatInput.trim() || chatAttachments.length) &&
													!isTyping
												) {
													sendChatMessage(chatInput);
													updateChatInput('');
												}
											}
										}}
										placeholder='Send a message to your agent'
										className='placeholder:text-zinc-450 max-h-32 w-full resize-none overflow-y-auto border-none bg-transparent px-1 text-base font-semibold text-zinc-800 outline-none focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500'
									/>
									{/* Bottom Controls Row */}
									<div className='mt-2 flex items-center justify-between border-t border-zinc-100/50 pt-2 dark:border-zinc-800/50'>
										{/* Plus button */}
										<button
											aria-label='Attach files'
											type='button'
											disabled={isTyping}
											onClick={() => attachmentInputRef.current?.click()}
											className='flex h-11 w-11 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-50 disabled:opacity-50 dark:text-zinc-500 dark:hover:bg-zinc-800'>
											<Plus size={18} />
										</button>

										{/* Right controls: Loader, Mic, Send */}
										<div className='flex items-center gap-2.5'>
											{/* Loading spinner — only while a turn is actually in flight */}
											{isTyping && (
												<div
													className='flex size-4 h-4 w-4 shrink-0 animate-spin items-center justify-center rounded-full border border-zinc-200 border-t-zinc-400'
													style={{
														borderTopColor: '#3b82f6',
														borderWidth: '1.5px',
													}}
												/>
											)}

											{/* Mic */}
											<button
												aria-label='Voice input'
												type='button'
												onClick={() =>
													toast.info('Voice input is not supported yet.')
												}
												className='flex h-11 w-11 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-50 dark:text-zinc-500 dark:hover:bg-zinc-800'>
												<Mic size={18} />
											</button>

											{/* Send button — becomes Stop for the duration of a turn */}
											<button
												type='button'
												aria-label={
													isTyping ? 'Stop generating' : 'Send message'
												}
												onClick={() => {
													if (isTyping) {
														stopStreaming();
														return;
													}
													if (
														chatInput.trim() ||
														chatAttachments.length
													) {
														sendChatMessage(chatInput);
														updateChatInput('');
													}
												}}
												title={
													isTyping ? 'Stop generating' : 'Send message'
												}
												className={`flex h-11 w-11 items-center justify-center rounded-full shadow-2xs transition hover:opacity-90 active:scale-95 ${
													isTyping
														? 'bg-zinc-900 text-white dark:bg-zinc-200 dark:text-zinc-900'
														: 'from-primary-400 to-primary-400 text-primary-950 bg-linear-to-tr'
												}`}>
												{isTyping ? (
													<Square
														size={12}
														strokeWidth={3}
														className='fill-current'
													/>
												) : (
													<ArrowUp size={16} strokeWidth={2.5} />
												)}
											</button>
										</div>
									</div>
								</div>

								{/* Footer link */}
								<div
									className={`mt-1 items-center justify-center gap-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 ${isMobileKeyboardOpen ? 'hidden' : 'flex'}`}>
									<span>Having Trouble?</span>
									<button
										onClick={() =>
											window.open(
												'https://docs.agent1o1.com',
												'_blank',
												'noopener,noreferrer',
											)
										}
										className='hover:text-zinc-700 dark:hover:text-zinc-300 underline'>
										Report an Issue or Bug
									</button>
								</div>
							</div>
						</footer>
					) : (
						<footer className='border-t border-zinc-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-zinc-950/90'>
							<div className='mx-auto flex w-full max-w-4xl flex-col gap-3'>
								<ChatAttachmentTray
									files={chatAttachments}
									busy={isTyping}
									onRemove={removeChatAttachment}
								/>
								<div className='focus-within:border-primary-500/50 focus-within:ring-primary-500/5 relative flex items-center rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xs focus-within:ring-4 dark:border-zinc-800 dark:bg-zinc-900/60'>
									{/* Left attachments & skill checkbox */}
									<div className='flex items-center gap-1 px-1.5'>
										<button
											type='button'
											onClick={() => attachmentInputRef.current?.click()}
											title='Attach a text file'
											className='flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-500'>
											<Paperclip size={18} />
										</button>
										{/* Skill checkbox */}
										<button
											onClick={() => setSkillEnabled(!skillEnabled)}
											title='Toggle Skills'
											className='flex h-9 items-center gap-1.5 rounded-lg border border-zinc-100 bg-zinc-50/50 px-2.5 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400 dark:hover:bg-zinc-800'>
											{skillEnabled ? (
												<CheckSquare
													size={14}
													className='text-primary-600 dark:text-primary-400'
												/>
											) : (
												<Square size={14} />
											)}
											<span>Skill</span>
										</button>
									</div>

									{/* Chat Input — a textarea, so Shift+Enter can open a new line.
									    It grows with the message and stops at ~6 rows. */}
									<textarea
										ref={composerRef}
										rows={1}
										value={chatInput}
										onChange={(e) => {
											updateChatInput(e.target.value);
											autoSizeComposer(e.currentTarget);
										}}
										onKeyDown={(e) => {
											if (
												e.nativeEvent.isComposing ||
												e.nativeEvent.keyCode === 229
											)
												return;
											if (e.key === 'Enter' && !e.shiftKey) {
												e.preventDefault();
												if (
													(chatInput.trim() || chatAttachments.length) &&
													!isTyping
												) {
													sendChatMessage(chatInput);
													updateChatInput('');
													// The box grew with the draft — put it back to one row.
													requestAnimationFrame(() => {
														if (composerRef.current)
															autoSizeComposer(composerRef.current);
													});
												}
											}
										}}
										placeholder='Send a message to your agent...'
										className='max-h-[9rem] flex-1 resize-none self-center border-none bg-transparent px-3 py-1.5 text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500'
									/>

									{/* Right features: Mic & Send */}
									<div className='flex items-center gap-3 px-1.5'>

										{/* Mic icon */}
										<button
											type='button'
											disabled
											title='Voice input is not supported yet'
											className='flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-500'>
											<Mic size={18} />
										</button>

										{/* Send Button — turns into Stop while the agent is replying */}
										<button
											aria-label={
												isTyping ? 'Stop generating' : 'Send message'
											}
											onClick={() => {
												if (isTyping) {
													stopStreaming();
													return;
												}
												if (chatInput.trim() || chatAttachments.length) {
													sendChatMessage(chatInput);
													updateChatInput('');
												}
											}}
											title={isTyping ? 'Stop generating' : 'Send message'}
											className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-md transition active:scale-95 ${
												isTyping
													? 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white'
													: 'bg-primary-400 text-primary-950 hover:bg-primary-500'
											}`}>
											{isTyping ? (
												<Square
													size={13}
													strokeWidth={3}
													className='fill-current'
												/>
											) : (
												<ArrowUp size={16} strokeWidth={2.5} />
											)}
										</button>
									</div>
								</div>

																<p className='text-center text-[10px] font-bold text-zinc-400 dark:text-zinc-500'>
									Agent can make mistakes. Please verify important information.
								</p>
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
							onClick={() => closeSettingsDrawer()}
							className='fixed inset-0 z-50 bg-black/15 backdrop-blur-xs'
						/>

						{/* Sidebar Drawer */}
						<motion.div
							ref={settingsDrawerRef}
							role='dialog'
							aria-modal='true'
							aria-label='Agent settings'
							initial={{ x: '100%' }}
							animate={{ x: 0 }}
							exit={{ x: '100%' }}
							transition={{ type: 'spring', damping: 25, stiffness: 220 }}
							className='fixed top-0 right-0 bottom-0 z-55 flex w-full max-w-[480px] flex-col overflow-hidden border-l border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900'>
							{/* Header Tabs */}
							<div className='flex h-16 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 bg-white px-3 dark:border-white/10 dark:bg-zinc-900'>
								<div className='no-scrollbar flex h-full min-w-0 flex-1 items-end gap-1 overflow-x-auto'>
									{/* Tab: Agent */}
									<button
										onClick={(event) => {
											setActiveSidebarTab('agent');
											event.currentTarget.scrollIntoView({
												block: 'nearest',
												inline: 'center',
												behavior: 'smooth',
											});
										}}
										className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-4 text-xs font-bold whitespace-nowrap transition-all ${
											activeSidebarTab === 'agent'
												? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400'
												: 'border-transparent text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
										}`}>
										<Bot size={14} />
										<span>Agent</span>
									</button>
									{/* Tab: Chat Details */}
									<button
										onClick={(event) => {
											setActiveSidebarTab('chatDetails');
											event.currentTarget.scrollIntoView({
												block: 'nearest',
												inline: 'center',
												behavior: 'smooth',
											});
										}}
										className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-4 text-xs font-bold whitespace-nowrap transition-all ${
											activeSidebarTab === 'chatDetails'
												? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400'
												: 'border-transparent text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
										}`}>
										<MessageSquare size={14} />
										<span>Chats</span>
									</button>
									{/* Tab: Data (knowledge / memory / runs / analytics) */}
									<button
										onClick={(event) => {
											setActiveSidebarTab('data');
											event.currentTarget.scrollIntoView({
												block: 'nearest',
												inline: 'center',
												behavior: 'smooth',
											});
										}}
										className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-4 text-xs font-bold whitespace-nowrap transition-all ${
											activeSidebarTab === 'data'
												? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400'
												: 'border-transparent text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
										}`}>
										<Database size={14} />
										<span>Data</span>
									</button>
								</div>

								{/* Top Right Action (Back/Undo & Save) */}
								<div className='flex shrink-0 items-center gap-1'>
									<button
										onClick={() => closeSettingsDrawer()}
										title='Go back'
										className='flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:hover:text-white md:h-8 md:w-8 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'>
										<Undo2 size={14} />
									</button>
									<button
										onClick={async () => {
											if (await handleSaveAgent()) closeSettingsDrawer();
										}}
										className='bg-primary-400 text-primary-950 shadow-primary-500/20 hover:bg-primary-500 flex h-11 items-center gap-1 rounded-lg px-3 text-[11px] font-bold shadow-md transition active:scale-95 md:h-8 dark:shadow-none'>
										<CheckCircle2 size={13} />
										<span>Save</span>
									</button>
								</div>
							</div>

							{/* Settings Body - Render conditionally based on activeSidebarTab */}
														{activeSidebarTab === 'agent' && (
								<div className='flex-1 space-y-4 overflow-y-auto bg-zinc-50/40 p-4 dark:bg-zinc-950/20'>
									{/* Personalization Section */}
									<div className='space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/40'>
										{/* Section Header */}
										<div className='flex items-center gap-2.5 border-b border-zinc-100 pb-2 dark:border-zinc-800/80'>
											<ChevronDown
												size={18}
												className='cursor-pointer text-zinc-500'
											/>
											<div className='bg-primary-100 text-primary-600 dark:bg-primary-400/10 dark:text-primary-400 flex h-8 w-8 items-center justify-center rounded-xl'>
												<Users size={16} />
											</div>
											<h3 className='text-sm font-black text-zinc-950 dark:text-white'>
												Personalization
											</h3>
										</div>

										{/* Content Layout */}
										<div className='grid grid-cols-1 items-start gap-6 md:grid-cols-12'>
											{/* Left side: Avatar and Popover Icon Selector Grid */}
											<div className='relative flex flex-col items-start space-y-3 md:col-span-5'>
												{/* Subheader Title */}
												<div className='space-y-0.5'>
													<h4 className='text-xs font-black text-zinc-950 dark:text-white'>
														Icon & Name
													</h4>
													<p className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
														Choose an icon and give your agent a name.
													</p>
												</div>

												{/* Large Chosen Icon Avatar Box */}
												<div
													onClick={() =>
														setIsIconPickerOpen(!isIconPickerOpen)
													}
													className='relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-2xl border border-zinc-200 bg-white p-2.5 shadow-2xs select-none dark:border-zinc-700 dark:bg-zinc-950/45'>
													<AgentIconComponent
														size={44}
														className={agentColorTextClass(
															agentIconColor,
														)}
													/>
													{/* Pencil edit badge overlay */}
													<div className='bg-primary-400 text-primary-950 shadow-primary-500/10 absolute -right-1 -bottom-1 flex h-6.5 w-6.5 cursor-pointer items-center justify-center rounded-full border border-white shadow-md dark:border-zinc-900'>
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
															className='relative mt-1.5 w-full max-w-[280px] space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60'>
															{/* Top pointer speech-bubble triangle */}
															<div className='absolute -top-1.5 left-9 h-3 w-3 rotate-45 border-t border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900' />

															{/* Icons Grid (10 icons) */}
															<div className='relative z-10 grid grid-cols-5 gap-2'>
																{AGENT_ICONS.map(
																	(iconName) => {
																		const Icon =
																			AGENT_ICON_COMPONENTS[iconName];
																		const isSelected =
																			agentIcon === iconName;
																		return (
																			<button
																				key={iconName}
																				type='button'
																				title={iconName}
																				onClick={() =>
																					setAgentIcon(iconName)
																				}
																				className={`flex h-9 w-9 items-center justify-center rounded-xl border transition active:scale-95 ${
																					isSelected
																						? 'border-primary-600 bg-primary-50 text-primary-600 dark:border-primary-400 dark:bg-primary-400/10 dark:text-primary-400'
																						: 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
																				}`}>
																				<Icon size={16} />
																			</button>
																		);
																	},
																)}
															</div>

															{/* Colors Selector */}
															<div className='relative z-10 space-y-1.5'>
																<span className='text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
																	Color
																</span>
																<div className='flex items-center gap-2.5'>
																	{AGENT_COLORS.map((color) => {
																		const isSelected =
																			agentIconColor === color;
																		return (
																			<button
																				key={color}
																				type='button'
																				onClick={() =>
																					setAgentIconColor(color)
																				}
																				className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${AGENT_COLOR_SWATCHES[color]} ${
																					isSelected
																						? 'ring-primary-500 bg-clip-content p-[1px] ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900'
																						: 'border-zinc-200 dark:border-zinc-700'
																				}`}
																				title={color}>
																				{color === 'rainbow' && (
																					<div className='from-primary-400 h-full w-full rounded-full bg-gradient-to-tr via-emerald-500 to-rose-500' />
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
											<div className='w-full space-y-4 pt-12 md:col-span-7 md:pt-0'>
												{/* Agent Name input field */}
												<div className='w-full space-y-1.5'>
													<label className='text-[11px] font-black text-zinc-500 dark:text-zinc-400'>
														Agent Name
													</label>
													<div className='focus-within:border-primary-500/50 focus-within:ring-primary-500/5 relative flex items-center rounded-xl border border-zinc-200 bg-white px-3.5 py-3 shadow-2xs focus-within:ring-4 dark:border-zinc-800 dark:bg-zinc-950/20'>
														<input
															type='text'
															value={agentName}
															onChange={(e) =>
																setAgentName(
																	e.target.value.substring(0, 50),
																)
															}
															className='flex-1 border-none bg-transparent p-0 text-xs font-semibold text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-100'
															placeholder='Name your agent...'
														/>
														<span className='shrink-0 text-[10px] font-bold text-zinc-400 dark:text-zinc-500'>
															{agentName.length} / 50
														</span>
													</div>
												</div>

												{/* Description textarea box */}
												<div className='w-full space-y-1.5'>
													<div className='flex flex-col'>
														<label className='text-[11px] font-black text-zinc-600 dark:text-zinc-300'>
															Description
														</label>
														<span className='mt-0.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
															Describe what your agent does and how it
															helps you.
														</span>
													</div>
													{/* Border wrapping both textarea and character count at bottom right */}
													<div className='focus-within:border-primary-500/50 focus-within:ring-primary-500/5 relative flex flex-col rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs focus-within:ring-4 dark:border-zinc-800 dark:bg-zinc-950/20'>
														<textarea
															rows={4}
															value={agentDescription}
															onChange={(e) =>
																setAgentDescription(
																	e.target.value.substring(
																		0,
																		500,
																	),
																)
															}
															className='w-full resize-none border-none bg-transparent p-0 text-xs font-semibold text-zinc-800 outline-none focus:ring-0 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-500'
															placeholder='Describe agent capability...'
														/>
														<span className='mt-2 self-end text-right text-[10px] font-bold text-zinc-400 dark:text-zinc-500'>
															{agentDescription.length} / 500
														</span>
													</div>
												</div>
											</div>
										</div>
									</div>


									{/* Agent Preferences Section */}
									<div className='space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40'>
										{/* Preferences Header */}
										<div className='flex items-center justify-between'>
											<div className='flex cursor-pointer items-center gap-1.5'>
												<ChevronDown size={16} className='text-zinc-500' />
												<h3 className='text-sm font-black text-zinc-900 dark:text-white'>
													Agent Preferences
												</h3>
											</div>
											<button
												type='button'
												disabled
												title='Advanced preferences are not available yet'
												className='inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-bold text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'>
												<span>Advanced</span>
												<SlidersHorizontal size={10} />
											</button>
										</div>

										{/* Model Selector Card */}
										<div className='relative'>
											<button
												type='button'
												onClick={() => setIsModelPickerOpen((v) => !v)}
												className='flex w-full cursor-pointer items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/20 dark:hover:border-zinc-700'>
												<div className='flex items-center gap-3'>
													<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/5 dark:text-blue-400'>
														<Sparkles size={16} fill='currentColor' />
													</div>
													<div className='flex flex-col text-left'>
														<span className='text-[10px] font-black tracking-wide text-zinc-400 uppercase'>
															Model
														</span>
														<span className='text-xs font-black text-zinc-800 dark:text-zinc-200'>
															{modelOptions.find(
																(m) => m.id === agentModel,
															)?.label ?? 'Select a model'}
														</span>
													</div>
												</div>
												<ChevronDown
													size={14}
													className={`text-zinc-400 transition-transform ${isModelPickerOpen ? 'rotate-180' : ''}`}
												/>
											</button>

											{isModelPickerOpen && (
												<>
													<div
														className='fixed inset-0 z-10'
														onClick={() => setIsModelPickerOpen(false)}
													/>
													<div className='absolute right-0 left-0 z-20 mt-1.5 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900'>
														{modelOptions.map((option) => (
															<button
																key={option.id}
																type='button'
																disabled={!option.isAvailable}
																onClick={() => {
																	setAgentModel(option.id);
																	setIsModelPickerOpen(false);
																}}
																className={`flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
																	option.id === agentModel
																		? 'bg-primary-50 dark:bg-primary-950/30'
																		: 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
																}`}>
																<div className='flex w-full items-center justify-between'>
																	<span className='text-xs font-black text-zinc-800 dark:text-zinc-200'>
																		{option.label}
																	</span>
																	<span className='rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>
																		{option.isAvailable ? option.tier : 'No API key'}
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

																				{/* Instructions */}
										<div className='flex flex-col gap-1.5'>
											<label
												htmlFor='agent-instructions'
												className='text-[11px] font-black text-zinc-600 dark:text-zinc-300'>
												Instructions
											</label>
											<span className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
												The agent's system prompt: its role, how it works, and what it must never do.
											</span>
											<div className='flex items-center gap-2'>
												<input
													type='text'
													value={instructionsChange}
													onChange={(e) => setInstructionsChange(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === 'Enter') {
															e.preventDefault();
															void handleImproveInstructions();
														}
													}}
													placeholder='What should change? (optional)'
													disabled={improveInstructionsMutation.isPending}
													className='focus:border-primary-500/50 focus:ring-primary-500/5 h-8 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 outline-none placeholder:text-zinc-400 focus:ring-4 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950/25 dark:text-zinc-200 dark:placeholder:text-zinc-500'
												/>
												<button
													type='button'
													onClick={() => void handleImproveInstructions()}
													disabled={improveInstructionsMutation.isPending}
													className='bg-primary-500/10 text-primary-600 hover:bg-primary-500/15 dark:text-primary-400 flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-black transition-colors disabled:opacity-60'>
													<Sparkles size={13} />
													{improveInstructionsMutation.isPending ? 'Rewriting…' : 'Improve with AI'}
												</button>
											</div>
											<textarea
												id='agent-instructions'
												rows={14}
												value={agentInstructions}
												onChange={(e) => setAgentInstructions(e.target.value)}
												placeholder='You are an agent that...'
												className='focus:border-primary-500/50 focus:ring-primary-500/5 min-h-[240px] w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 outline-none placeholder:text-zinc-400 focus:ring-4 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/25 dark:text-zinc-200 dark:placeholder:text-zinc-500'
											/>
											<span className='text-right text-[10px] font-bold text-zinc-400 dark:text-zinc-500'>
												{agentInstructions.length.toLocaleString()} characters
											</span>
										</div>

										{/* Allow Self-Updates Row */}
										<div className='flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
											<div className='flex items-center gap-3'>
												<div className='bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400 flex h-9 w-9 items-center justify-center rounded-xl'>
													<SquarePen size={16} />
												</div>
												<div className='flex flex-col pr-4'>
													<span className='text-xs font-black text-zinc-800 dark:text-zinc-200'>
														Allow Self-Updates
													</span>
													<span className='mt-0.5 text-[10px] leading-normal font-semibold text-zinc-400 dark:text-zinc-400'>
														Let the agent update its own instructions when
														you correct it. Each change is a new version.
													</span>
												</div>
											</div>
											<button
												type='button'
												role='switch'
												aria-checked={allowSelfUpdates}
												aria-label='Allow self updates'
												onClick={() =>
													setAllowSelfUpdates(!allowSelfUpdates)
												}
												className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
													allowSelfUpdates
														? 'bg-primary-400 dark:bg-primary-400'
														: 'bg-zinc-200 dark:bg-zinc-800'
												}`}>
												<span
													className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
														allowSelfUpdates
															? 'translate-x-4'
															: 'translate-x-0'
													}`}
												/>
											</button>
										</div>
									</div>

									{/* Tags Section */}
									<AgentTagsPanel ws={workspaceId} agentId={currentAgentId} />

									{/* Triggers Section */}
									<div className='space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-2'>
												<div className='bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400 flex h-7 w-7 items-center justify-center rounded-lg'>
													<Zap size={14} fill='currentColor' />
												</div>
												<h4 className='text-xs font-black text-zinc-900 dark:text-white'>
													Triggers
												</h4>
											</div>
											<button
												onClick={openTriggerPanel}
												className='text-primary-600 dark:border-primary-500/20 dark:text-primary-400 flex min-h-11 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black hover:bg-zinc-50 md:min-h-0 dark:bg-zinc-900 dark:hover:bg-zinc-800'>
												<Plus size={10} />
												<span>Trigger</span>
											</button>
										</div>

										{(agentTriggers ?? []).length === 0 &&
											!isTriggerPanelOpen && (
												<p className='pl-9 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
													Define events or conditions that activate this
													agent.
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
																<span className='rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-black text-zinc-600 uppercase dark:bg-zinc-800 dark:text-zinc-400'>
																	{trigger.type}
																</span>
																<button
																	type='button'
																	role='switch'
																	aria-checked={trigger.is_active}
																	aria-label={`${trigger.is_active ? 'Disable' : 'Enable'} ${trigger.type} trigger`}
																	disabled={
																		updateTriggerMutation.isPending
																	}
																	onClick={() =>
																		handleToggleTrigger(
																			trigger.id,
																			trigger.is_active,
																		)
																	}
																	className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg disabled:opacity-50 md:h-7 md:w-8'>
																	<span
																		className={`relative inline-flex h-4 w-7 rounded-full border-2 border-transparent transition-colors ${trigger.is_active ? 'bg-primary-400' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
																		<span
																			className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition duration-200 ${
																				trigger.is_active
																					? 'translate-x-3'
																					: 'translate-x-0'
																			}`}
																		/>
																	</span>
																</button>
															</div>
															<div className='flex items-center gap-2'>
																<button
																	aria-label={`Fire ${trigger.type} trigger now`}
																	disabled={
																		fireTriggerMutation.isPending
																	}
																	onClick={() =>
																		handleFireTrigger(
																			trigger.id,
																		)
																	}
																	title='Fire now'
																	className='hover:text-primary-600 dark:hover:text-primary-400 flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 disabled:opacity-50 md:h-7 md:w-7'>
																	<Play size={12} />
																</button>
																<button
																	aria-label={`Delete ${trigger.type} trigger`}
																	onClick={() =>
																		setPendingDeleteTriggerId(
																			trigger.id,
																		)
																	}
																	title='Delete trigger'
																	className='flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 hover:text-rose-500 md:h-7 md:w-7'>
																	<Trash2 size={12} />
																</button>
															</div>
														</div>
														{pendingDeleteTriggerId === trigger.id && (
															<div className='flex flex-wrap items-center justify-end gap-2 rounded-lg bg-rose-50 p-2 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'>
																<span className='mr-auto'>
																	Delete this trigger?
																</span>
																<button
																	type='button'
																	onClick={() =>
																		setPendingDeleteTriggerId(
																			null,
																		)
																	}
																	className='min-h-11 rounded-lg px-3 md:min-h-0'>
																	Cancel
																</button>
																<button
																	type='button'
																	disabled={
																		deleteTriggerMutation.isPending
																	}
																	onClick={() =>
																		handleDeleteTrigger(
																			trigger.id,
																		)
																	}
																	className='min-h-11 rounded-lg bg-rose-600 px-3 font-bold text-white disabled:opacity-50 md:min-h-0'>
																	{deleteTriggerMutation.isPending
																		? 'Deleting…'
																		: 'Delete'}
																</button>
															</div>
														)}
														{trigger.token && (
															<button
																aria-label='Copy'
																onClick={() =>
																	handleCopyWebhookUrl(
																		webhookUrlFor(trigger),
																	)
																}
																className='hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1.5 truncate text-left text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
																<Copy
																	size={10}
																	className='shrink-0'
																/>
																<span className='truncate'>
																	{webhookUrlFor(trigger)}
																</span>
															</button>
														)}
													</div>
												))}
											</div>
										)}

										{isTriggerPanelOpen && (
											<div className='ml-9 space-y-2.5 rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
												<div className='flex gap-1.5'>
													{(
														[
															'schedule',
															'webhook',
															'event',
														] as TAgentTriggerType[]
													).map((t) => (
														<button
															key={t}
															type='button'
															onClick={() => setNewTriggerType(t)}
															className={`min-h-11 rounded-lg px-2.5 py-1 text-[10px] font-black capitalize transition md:min-h-0 ${
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
														onChange={(e) =>
															setNewTriggerCron(e.target.value)
														}
														placeholder='Cron expression (0 9 * * *)'
														className='focus:border-primary-500/50 min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 font-mono text-base text-zinc-800 outline-none md:min-h-0 md:text-[11px] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
													/>
												)}
												{newTriggerType === 'event' && (
													<input
														type='text'
														value={newTriggerEventName}
														onChange={(e) =>
															setNewTriggerEventName(e.target.value)
														}
														placeholder='Event name'
														className='focus:border-primary-500/50 min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-base font-semibold text-zinc-800 outline-none md:min-h-0 md:text-[11px] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
													/>
												)}
												<input
													type='text'
													value={newTriggerInitialMessage}
													onChange={(e) =>
														setNewTriggerInitialMessage(e.target.value)
													}
													placeholder='Initial message (optional)'
													className='focus:border-primary-500/50 min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-base font-semibold text-zinc-800 outline-none md:min-h-0 md:text-[11px] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
												/>
												<div className='flex justify-end gap-2'>
													<button
														onClick={() => setIsTriggerPanelOpen(false)}
														className='min-h-11 rounded-lg px-2.5 py-1 text-[10px] font-bold text-zinc-500 hover:bg-zinc-100 md:min-h-0 dark:hover:bg-zinc-800'>
														Cancel
													</button>
													<button
														onClick={() => void handleCreateTrigger()}
														disabled={createTriggerMutation.isPending}
														className='bg-primary-400 text-primary-950 hover:bg-primary-500 min-h-11 rounded-lg px-3 py-1 text-[10px] font-black disabled:opacity-60 md:min-h-0'>
														{createTriggerMutation.isPending
															? 'Creating…'
															: 'Create'}
													</button>
												</div>
											</div>
										)}
									</div>

									{/* Apps Section */}
									<div className='space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-2'>
												<div className='flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/5 dark:text-blue-400'>
													<Layers size={14} />
												</div>
												<div className='flex items-center gap-2'>
													<h4 className='text-xs font-black text-zinc-900 dark:text-white'>
														Tools
													</h4>
													<span className='inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-bold text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400'>
														<span>
															{(toolBindings ?? []).length +
																(workflowTools ?? []).length}{' '}
															attached
														</span>
													</span>
												</div>
											</div>
											<button
												onClick={openToolDrawer}
												className='text-primary-600 dark:border-primary-500/20 dark:text-primary-400 flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800'>
												<Plus size={10} />
												<span>Tool</span>
											</button>
										</div>

										{/* Attached tools — node bindings first, then whole workflows */}
										{(toolBindings ?? []).length === 0 &&
											(workflowTools ?? []).length === 0 && (
												<p className='pl-9 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
													Attach nodes or workflows to let this agent act
													outside the chat.
												</p>
											)}

										<div className='space-y-2 pl-9'>
											{(toolBindings ?? []).map((binding) => {
												const node = nodeFor(binding.node_type);
												return (
													<div
														key={binding.id}
														className='flex items-center justify-between border-b border-zinc-100 py-2 last:border-0 dark:border-zinc-800/80'>
														<div className='flex items-center gap-3'>
															<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white'>
																<Wrench size={15} />
															</div>
															<div className='flex flex-col'>
																<span className='text-xs font-black text-zinc-800 dark:text-zinc-200'>
																	{node?.name ??
																		binding.node_type}
																</span>
																<span className='mt-0.5 text-[10px] leading-tight font-semibold text-zinc-400 dark:text-zinc-500'>
																	{node?.description ??
																		binding.node_type}
																</span>
																{/* A node that talks to a third party is inert until the
																    workspace has credentials for it. */}
																{node &&
																	'requires_connector' in node &&
																	node.requires_connector && (
																		<span className='mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:bg-amber-500/5 dark:text-amber-400'>
																			Needs a connector
																			credential
																		</span>
																	)}
															</div>
														</div>
														<button
															onClick={() =>
																deleteToolBindingMutation.mutate(
																	String(binding.id),
																)
															}
															title='Remove tool'
															className='cursor-pointer p-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400'>
															<Trash2 size={14} />
														</button>
													</div>
												);
											})}

											{(workflowTools ?? []).map((workflow) => (
												<div
													key={workflow.id}
													className='flex items-center justify-between border-b border-zinc-100 py-2 last:border-0 dark:border-zinc-800/80'>
													<div className='flex items-center gap-3'>
														<div className='bg-primary-500 flex h-8 w-8 items-center justify-center rounded-lg text-white'>
															<GitMerge size={15} />
														</div>
														<div className='flex flex-col'>
															<span className='text-xs font-black text-zinc-800 dark:text-zinc-200'>
																{workflow.name}
															</span>
															<span className='mt-0.5 text-[10px] leading-tight font-semibold text-zinc-400 dark:text-zinc-500'>
																{workflow.description ||
																	'Workflow, callable as one tool.'}
															</span>
														</div>
													</div>
													<button
														onClick={() =>
															detachWorkflowMutation.mutate(
																String(workflow.id),
															)
														}
														title='Remove tool'
														className='cursor-pointer p-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400'>
														<Trash2 size={14} />
													</button>
												</div>
											))}
										</div>
									</div>

									{/* Skills Section */}
									<div className='space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-2'>
												<div className='bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400 flex h-7 w-7 items-center justify-center rounded-lg'>
													<Cpu size={14} />
												</div>
												<h4 className='text-xs font-black text-zinc-900 dark:text-white'>
													Skills
												</h4>
											</div>
											<button
												onClick={openSkillPanel}
												className='text-primary-600 dark:border-primary-500/20 dark:text-primary-400 flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800'>
												<Plus size={10} />
												<span>Skill</span>
											</button>
										</div>

										{(attachedSkills ?? []).length === 0 &&
											!isSkillPanelOpen && (
												<p className='pl-9 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
													Add custom skills to extend your agent's
													abilities.
												</p>
											)}

										{(attachedSkills ?? []).length > 0 && (
											<div className='space-y-2 pl-9'>
												{(attachedSkills ?? []).map((skill) => (
													<div
														key={skill.id}
														className='flex items-center justify-between border-b border-zinc-100 py-1.5 last:border-0 dark:border-zinc-800/80'>
														<div className='flex min-w-0 flex-col'>
															<span className='text-xs font-black text-zinc-800 dark:text-zinc-200'>
																{skill.name}
															</span>
															{skill.description && (
																<span className='truncate text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
																	{skill.description}
																</span>
															)}
														</div>
														<button
															onClick={() =>
																handleDetachSkill(skill.id)
															}
															title='Remove skill'
															className='shrink-0 text-zinc-400 hover:text-rose-500'>
															<X size={13} />
														</button>
													</div>
												))}
											</div>
										)}

										{isSkillPanelOpen && (
											<div className='ml-9 space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
												{availableSkillsToAttach.length > 0 && (
													<div className='space-y-1.5'>
														<span className='text-[10px] font-black tracking-wider text-zinc-400 uppercase'>
															Attach existing
														</span>
														{availableSkillsToAttach.map((skill) => (
															<button
																key={skill.id}
																onClick={() =>
																	handleAttachSkill(skill.id)
																}
																className='flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800'>
																<span className='text-[11px] font-bold text-zinc-700 dark:text-zinc-300'>
																	{skill.name}
																</span>
																<Plus
																	size={11}
																	className='text-primary-500'
																/>
															</button>
														))}
													</div>
												)}

												<div className='space-y-1.5'>
													<span className='text-[10px] font-black tracking-wider text-zinc-400 uppercase'>
														Create new
													</span>
													<input
														type='text'
														value={newSkillName}
														onChange={(e) =>
															setNewSkillName(e.target.value)
														}
														placeholder='Skill name'
														className='focus:border-primary-500/50 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-800 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
													/>
													<textarea
														rows={2}
														value={newSkillInstructions}
														onChange={(e) =>
															setNewSkillInstructions(e.target.value)
														}
														placeholder='Instructions for this skill...'
														className='focus:border-primary-500/50 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-800 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
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
														disabled={
															!newSkillName.trim() ||
															!newSkillInstructions.trim()
														}
														className='bg-primary-400 text-primary-950 hover:bg-primary-500 rounded-lg px-3 py-1 text-[10px] font-black disabled:opacity-40'>
														Create & Attach
													</button>
												</div>
											</div>
										)}
									</div>

									{/* Subagents Section */}
									<div className='space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-2'>
												<div className='bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400 flex h-7 w-7 items-center justify-center rounded-lg'>
													<Users size={14} />
												</div>
												<h4 className='text-xs font-black text-zinc-900 dark:text-white'>
													Subagents
												</h4>
											</div>
											<button
												type='button'
												disabled
												title='Subagents are not available yet'
												className='text-primary-600 dark:border-primary-500/20 dark:text-primary-400 flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-900'>
												<Plus size={10} />
												<span>Subagent</span>
											</button>
										</div>
										<p className='pl-9 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
											Delegate tasks to specialized subagents.
										</p>

										{/* Subagent Item */}
										<div className='flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 py-2 pl-9 dark:border-zinc-800 dark:bg-zinc-950/20'>
											<div className='flex items-center gap-3'>
												<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-white dark:border dark:border-zinc-700 dark:bg-zinc-800'>
													<Bot size={15} />
												</div>
												<div className='flex flex-col'>
													<span className='text-xs font-black text-zinc-800 dark:text-zinc-200'>
														Competitor Research Agent (Me)
													</span>
													<span className='mt-0.5 text-[10px] leading-tight font-semibold text-zinc-400 dark:text-zinc-500'>
														Enables me to clone myself as a subagent to
														research competitors.
													</span>
												</div>
											</div>
											<button
												type='button'
												disabled
												title='Subagents are not available yet'
												className='p-1 text-zinc-400 disabled:cursor-not-allowed disabled:opacity-50'>
												<MoreHorizontal size={14} />
											</button>
										</div>
									</div>

									{/* Bottom Autosave footer banner */}
									<div className='bg-primary-400/5 border-primary-500/10 dark:bg-primary-400/5 dark:border-primary-500/10 flex gap-3 rounded-xl border p-3.5'>
										<Sparkles
											size={16}
											className='text-primary-500 mt-0.5 shrink-0'
										/>
										<div className='flex flex-col'>
											<span className='text-primary-700 dark:text-primary-400 text-xs font-bold'>
												Changes are saved automatically
											</span>
											<span className='mt-1 text-[10px] leading-normal font-semibold text-zinc-500 dark:text-zinc-400'>
												Your agent will use the latest configuration for all
												new conversations.
											</span>
										</div>
									</div>
								</div>
							)}

							{/* Chats Tab */}
														{activeSidebarTab === 'chatDetails' && (
								<div className='flex-1 overflow-y-auto bg-zinc-50/40 p-4 dark:bg-zinc-950/20'>
									<AgentChatsPanel
										ws={workspaceId}
										agentId={currentAgentId}
										activeSessionId={conversationId ?? null}
										onOpen={(sessionId) => {
											closeSettingsDrawer();
											openSession(sessionId);
										}}
									/>
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
							onClick={() => closeToolDrawer()}
							className='fixed inset-0 z-60 bg-black/20 backdrop-blur-xs'
						/>

						{/* Add App Drawer Container */}
						<motion.div
							ref={toolDrawerRef}
							role='dialog'
							aria-modal='true'
							aria-label='Add a tool'
							initial={{ x: '100%' }}
							animate={{ x: 0 }}
							exit={{ x: '100%' }}
							transition={{ type: 'spring', damping: 25, stiffness: 220 }}
							className='shadow-3xl fixed top-0 right-0 bottom-0 z-65 flex w-full max-w-[440px] flex-col overflow-hidden border-l border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900'>
							{/* Drawer Header */}
							<div className='flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-5 dark:border-white/10 dark:bg-zinc-900'>
								<h3 className='text-[16px] font-black text-zinc-900 dark:text-white'>
									Add a tool
								</h3>
								<button
									aria-label='Close'
									onClick={() => closeToolDrawer()}
									className='flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:text-zinc-200 md:h-8 md:w-8 dark:text-zinc-500 dark:hover:bg-zinc-800'>
									<X size={18} />
								</button>
							</div>

							{/* Search & Tabs Filter Box */}
							<div className='space-y-3 border-b border-zinc-100 p-4 dark:border-white/10 dark:bg-zinc-900'>
								<div className='flex flex-col gap-3 md:flex-row md:items-center'>
									{/* Search Input */}
									<div className='focus-within:border-primary-500/50 focus-within:ring-primary-500/5 relative flex min-w-0 flex-1 items-center rounded-xl border border-zinc-200 bg-zinc-50/50 p-2 focus-within:ring-4 dark:border-zinc-800 dark:bg-zinc-950/20'>
										<Search
											size={15}
											className='ml-1.5 shrink-0 text-zinc-400'
										/>
										<input
											aria-label='Search available tools'
											type='text'
											value={appSearchQuery}
											onChange={(e) => setAppSearchQuery(e.target.value)}
											placeholder={
												toolTab === 'nodes'
													? `Search ${(nodeCatalog ?? []).length} nodes`
													: `Search ${(workspaceWorkflows ?? []).length} workflows`
											}
											className='min-w-0 flex-1 border-none bg-transparent px-2.5 text-base font-semibold text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 md:text-xs dark:text-zinc-100 dark:placeholder:text-zinc-500'
										/>
									</div>

									{/* The two kinds of tool this backend supports */}
									<div role='group' aria-label='Tool type' className='grid w-full grid-cols-2 rounded-lg bg-zinc-100 p-0.5 md:flex md:w-auto md:shrink-0 dark:bg-zinc-950/45'>
										<button
											aria-pressed={toolTab === 'nodes'}
											onClick={() => setToolTab('nodes')}
											className={`min-h-11 rounded-md px-3 py-1.5 text-[10px] font-black transition md:min-h-0 ${
												toolTab === 'nodes'
													? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-white'
													: 'text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300'
											}`}>
											Nodes
										</button>
										<button
											aria-pressed={toolTab === 'workflows'}
											onClick={() => setToolTab('workflows')}
											className={`min-h-11 rounded-md px-3 py-1.5 text-[10px] font-black transition md:min-h-0 ${
												toolTab === 'workflows'
													? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-white'
													: 'text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300'
											}`}>
											Workflows
										</button>
									</div>
								</div>
							</div>

							{/* Attachable tools. Each row attaches on click — there is no
							    staged selection to save, so the drawer has no footer. */}
							<div className='flex-1 space-y-3 overflow-y-auto p-4 dark:bg-zinc-950/10'>
								<h4 className='pl-1 text-[10px] font-black tracking-widest text-zinc-400 uppercase'>
									{toolTab === 'nodes'
										? 'Available nodes'
										: 'Workspace workflows'}
								</h4>

								<div className='space-y-1.5'>
									{toolTab === 'nodes' && !isToolListPending && !isToolListError &&
										attachableNodes.map((node) => (
											<div
												key={node.type}
												className='flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40'>
												<div className='flex min-w-0 items-center gap-3'>
													<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white shadow-2xs'>
														<Wrench size={16} />
													</div>
													<div className='flex min-w-0 flex-col'>
														<span className='text-xs font-black text-zinc-900 dark:text-zinc-100'>
															{node.name}
														</span>
														<span className='mt-0.5 text-[9px] leading-tight font-semibold text-zinc-400 dark:text-zinc-500'>
															{node.description}
														</span>
													</div>
												</div>
												<button
													aria-label={`Add ${node.name}`}
													onClick={() => handleAttachNode(node)}
													disabled={createToolBindingMutation.isPending}
													className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 shadow-2xs transition hover:bg-zinc-50 hover:text-zinc-900 active:scale-90 disabled:opacity-50 md:h-7 md:w-7 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'>
													<Plus size={14} />
												</button>
											</div>
										))}

									{toolTab === 'workflows' && !isToolListPending && !isToolListError &&
										attachableWorkflows.map((workflow) => (
											<div
												key={workflow.id}
												className='flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40'>
												<div className='flex min-w-0 items-center gap-3'>
													<div className='bg-primary-500 flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-2xs'>
														<GitMerge size={16} />
													</div>
													<div className='flex min-w-0 flex-col'>
														<span className='text-xs font-black text-zinc-900 dark:text-zinc-100'>
															{workflow.name}
														</span>
														<span className='mt-0.5 text-[9px] leading-tight font-semibold text-zinc-400 dark:text-zinc-500'>
															{workflow.description ||
																'No description provided.'}
														</span>
													</div>
												</div>
												<button
													aria-label={`Add ${workflow.name}`}
													onClick={() => handleAttachWorkflow(workflow)}
													disabled={attachWorkflowMutation.isPending}
													className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 shadow-2xs transition hover:bg-zinc-50 hover:text-zinc-900 active:scale-90 disabled:opacity-50 md:h-7 md:w-7 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'>
													<Plus size={14} />
												</button>
											</div>
										))}

									{isToolListPending ? (
										<div role='status' className='flex items-center justify-center gap-2 py-8 text-xs font-bold text-zinc-500'>
											<Loader2 size={14} className='animate-spin' /> Loading tools…
										</div>
									) : isToolListError ? (
										<div role='alert' className='py-8 text-center text-xs font-bold text-zinc-500'>
											<p>Could not load {toolTab === 'nodes' ? 'nodes' : 'workflows'}.</p>
											<button type='button' onClick={retryToolList} className='bg-primary-400 text-primary-950 mt-3 min-h-11 rounded-lg px-4'>Retry</button>
										</div>
									) : ((toolTab === 'nodes' && attachableNodes.length === 0) ||
										(toolTab === 'workflows' && attachableWorkflows.length === 0)) ? (
										<div className='py-8 text-center text-xs font-bold text-zinc-400 dark:text-zinc-500'>
											{appSearchQuery.trim()
												? `Nothing matches "${appSearchQuery}"`
												: toolTab === 'nodes' && (nodeCatalog ?? []).length === 0
													? 'No nodes available.'
													: toolTab === 'workflows' && (workspaceWorkflows ?? []).length === 0
														? 'No workflows in this workspace.'
														: 'Everything here is already attached.'}
										</div>
									) : null}
								</div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
};

export default BuildPage;
