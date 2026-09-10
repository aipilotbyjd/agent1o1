import { ChangeEvent, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import Fuse from 'fuse.js';
import classNames from 'classnames';
import {
	Search,
	Workflow,
	Bot,
	FileText,
	Layout,
	Zap,
	Plus,
	UserPlus,
	Settings,
	Clock,
	ArrowRight,
	Folder,
	Layers,
	History,
	Command,
} from 'lucide-react';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import pages, { TPage, TPages } from '@/Routes/pages';
import { useGlobalSearchStore } from '@/store/globalSearch.store';
import { MOCK_AGENT_TEMPLATES, MOCK_TEMPLATE_COLLECTIONS } from '@/mocks/templates.mock';

// ─── Types ────────────────────────────────────────────────────────────────────
type TSearchCategory =
	| 'Pages'
	| 'Workflows'
	| 'Agents'
	| 'Templates'
	| 'Files'
	| 'History'
	| 'Quick Actions'
	| 'Recent Searches';

interface TSearchItem {
	id: string;
	label: string;
	description?: string;
	category: TSearchCategory;
	icon: React.ReactNode;
	iconBg?: string;
	to?: string;
	action?: () => void;
	badge?: string;
	keywords?: string[];
}

// ─── Recent Searches Helper ──────────────────────────────────────────────────
const STORAGE_KEY = 'agent101_recent_searches';
const MAX_RECENT = 8;

const getRecentSearches = (): string[] => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as string[]) : [];
	} catch {
		return [];
	}
};

const addRecentSearch = (query: string) => {
	const current = getRecentSearches().filter((s) => s !== query);
	current.unshift(query);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(current.slice(0, MAX_RECENT)));
};

const clearRecentSearches = () => {
	localStorage.removeItem(STORAGE_KEY);
};

// ─── Flatten Pages ────────────────────────────────────────────────────────────
const getFlattenPages = (pagesList: TPages, parentId?: string): TPage[] => {
	return Object.values(pagesList).flatMap((page) => {
		const { subPages, ...pageData } = page;
		const currentPage: TPage = { ...pageData, parentId };
		const subPagesArray = subPages ? getFlattenPages(subPages, page.id) : [];
		return [currentPage, ...subPagesArray];
	});
};

const getFlattenedPageItems = (): TSearchItem[] => {
	const flattenPages = [
		...getFlattenPages(pages.apps as TPages),
		pages.app as TPage,
		...getFlattenPages(pages.app.subPages as TPages, pages.app.id),
		pages.settings as TPage,
		...getFlattenPages(pages.settings.subPages as TPages, pages.settings.id),
		pages.editor as TPage,
		...getFlattenPages(pages.editor.subPages as TPages, pages.editor.id),
		pages.agent as TPage,
		...getFlattenPages(pages.agent.subPages as TPages, pages.agent.id),
		pages.onboarding as TPage,
		...getFlattenPages(pages.onboarding.subPages as TPages, pages.onboarding.id),
	];

	return flattenPages.map((item) => ({
		id: `page-${item.id}`,
		label: item.text,
		description: item.to,
		category: 'Pages' as TSearchCategory,
		icon: item.icon ? (
			<Icon icon={item.icon} className='text-zinc-400 dark:text-zinc-500' />
		) : (
			<Layout size={16} className='text-zinc-400' />
		),
		to: item.to,
		keywords: [item.to, item.text],
	}));
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_WORKFLOWS: TSearchItem[] = [
	{
		id: 'wf-1',
		label: 'Customer Onboarding Flow',
		description: 'Automates new user signup, welcome email, and CRM entry',
		category: 'Workflows',
		icon: <Workflow size={16} className='text-emerald-500' />,
		iconBg: 'bg-emerald-500/10',
		to: '/editor/edit-workflow/wf-1',
		badge: 'active',
		keywords: ['customer', 'onboarding', 'signup', 'welcome', 'email'],
	},
	{
		id: 'wf-2',
		label: 'Slack Notification on Webhook',
		description: 'Sends Slack alerts when a webhook is received',
		category: 'Workflows',
		icon: <Workflow size={16} className='text-emerald-500' />,
		iconBg: 'bg-emerald-500/10',
		to: '/editor/edit-workflow/wf-2',
		badge: 'active',
		keywords: ['slack', 'notification', 'webhook', 'alert'],
	},
	{
		id: 'wf-3',
		label: 'Stripe Payment to CRM Sync',
		description: 'Maps Stripe transactions to customer profiles in CRM',
		category: 'Workflows',
		icon: <Workflow size={16} className='text-emerald-500' />,
		iconBg: 'bg-emerald-500/10',
		to: '/editor/edit-workflow/wf-3',
		badge: 'inactive',
		keywords: ['stripe', 'payment', 'crm', 'sync', 'transaction'],
	},
	{
		id: 'wf-4',
		label: 'Daily Database Backup Reminder',
		description: 'Flags missed nightly backups and notifies the team',
		category: 'Workflows',
		icon: <Workflow size={16} className='text-emerald-500' />,
		iconBg: 'bg-emerald-500/10',
		to: '/editor/edit-workflow/wf-4',
		badge: 'active',
		keywords: ['database', 'backup', 'nightly', 'notification'],
	},
	{
		id: 'wf-5',
		label: 'Lead Enrichment Pipeline',
		description: 'Parses social data for inbound email leads',
		category: 'Workflows',
		icon: <Workflow size={16} className='text-emerald-500' />,
		iconBg: 'bg-emerald-500/10',
		to: '/editor/edit-workflow/wf-5',
		badge: 'inactive',
		keywords: ['lead', 'enrichment', 'social', 'email', 'pipeline'],
	},
	{
		id: 'wf-6',
		label: 'Multi-Channel Error Alert',
		description: 'Broadcasts critical logs to Slack & Email',
		category: 'Workflows',
		icon: <Workflow size={16} className='text-emerald-500' />,
		iconBg: 'bg-emerald-500/10',
		to: '/editor/edit-workflow/wf-6',
		badge: 'active',
		keywords: ['error', 'alert', 'slack', 'email', 'logs', 'critical'],
	},
];

const MOCK_AGENTS: TSearchItem[] = MOCK_AGENT_TEMPLATES.map((agent) => ({
	id: `agent-${agent.id}`,
	label: agent.name,
	description: agent.description,
	category: 'Agents' as TSearchCategory,
	icon: <Bot size={16} className='text-primary-500' />,
	iconBg: 'bg-primary-500/10',
	badge: agent.category,
	keywords: [agent.name, agent.description, agent.category, ...agent.tags],
}));

const MOCK_TEMPLATES: TSearchItem[] = MOCK_TEMPLATE_COLLECTIONS.map((col) => ({
	id: `template-${col.id}`,
	label: col.name,
	description: col.description,
	category: 'Templates' as TSearchCategory,
	icon: <Layers size={16} className='text-violet-500' />,
	iconBg: 'bg-violet-500/10',
	to: '/templates',
	badge: `${col.item_count} items`,
	keywords: [col.name, col.description],
}));

const MOCK_FILES: TSearchItem[] = [
	{
		id: 'file-1',
		label: 'Sales Report Q2 2026',
		description: 'PDF · 2.4 MB · Updated 2 days ago',
		category: 'Files',
		icon: <FileText size={16} className='text-blue-500' />,
		iconBg: 'bg-blue-500/10',
		to: '/files',
		keywords: ['sales', 'report', 'q2', '2026', 'pdf'],
	},
	{
		id: 'file-2',
		label: 'API Documentation v3',
		description: 'Markdown · 156 KB · Updated 5 hours ago',
		category: 'Files',
		icon: <FileText size={16} className='text-blue-500' />,
		iconBg: 'bg-blue-500/10',
		to: '/files',
		keywords: ['api', 'documentation', 'v3', 'markdown'],
	},
	{
		id: 'file-3',
		label: 'Customer Feedback Analysis',
		description: 'CSV · 892 KB · Updated 1 week ago',
		category: 'Files',
		icon: <FileText size={16} className='text-blue-500' />,
		iconBg: 'bg-blue-500/10',
		to: '/files',
		keywords: ['customer', 'feedback', 'analysis', 'csv', 'data'],
	},
	{
		id: 'file-4',
		label: 'Skill Creator Research Brief',
		description: 'PDF · 3.1 MB · Updated 3 days ago',
		category: 'Files',
		icon: <FileText size={16} className='text-blue-500' />,
		iconBg: 'bg-blue-500/10',
		to: '/files',
		keywords: ['skill', 'creator', 'research', 'brief', 'pdf'],
	},
	{
		id: 'file-5',
		label: 'Deployment Runbook',
		description: 'Markdown · 45 KB · Updated 1 day ago',
		category: 'Files',
		icon: <FileText size={16} className='text-blue-500' />,
		iconBg: 'bg-blue-500/10',
		to: '/files',
		keywords: ['deployment', 'runbook', 'markdown', 'ops'],
	},
];

const QUICK_ACTIONS: TSearchItem[] = [
	{
		id: 'qa-create-workflow',
		label: 'Create new workflow',
		description: 'Start building a new automation from scratch',
		category: 'Quick Actions',
		icon: <Plus size={16} className='text-emerald-500' />,
		iconBg: 'bg-emerald-500/10',
		to: '/editor/add-workflow',
		keywords: ['create', 'new', 'workflow', 'automation'],
	},
	{
		id: 'qa-create-agent',
		label: 'Create new agent',
		description: 'Build a new AI agent with custom instructions',
		category: 'Quick Actions',
		icon: <Bot size={16} className='text-primary-500' />,
		iconBg: 'bg-primary-500/10',
		to: '/agent/add',
		keywords: ['create', 'new', 'agent', 'ai', 'bot'],
	},
	{
		id: 'qa-invite-team',
		label: 'Invite team members',
		description: 'Add collaborators to your workspace',
		category: 'Quick Actions',
		icon: <UserPlus size={16} className='text-amber-500' />,
		iconBg: 'bg-amber-500/10',
		to: '/settings/members',
		keywords: ['invite', 'team', 'members', 'collaborators', 'add'],
	},
	{
		id: 'qa-upload-file',
		label: 'Upload a file',
		description: 'Import documents, CSVs, or images',
		category: 'Quick Actions',
		icon: <Plus size={16} className='text-blue-500' />,
		iconBg: 'bg-blue-500/10',
		to: '/files',
		keywords: ['upload', 'file', 'import', 'document', 'csv'],
	},
	{
		id: 'qa-settings',
		label: 'Open workspace settings',
		description: 'Configure workspace preferences and integrations',
		category: 'Quick Actions',
		icon: <Settings size={16} className='text-zinc-500' />,
		iconBg: 'bg-zinc-500/10',
		to: '/settings/workspace',
		keywords: ['settings', 'workspace', 'configure', 'preferences'],
	},
	{
		id: 'qa-run-last',
		label: 'Run last workflow',
		description: 'Execute your most recently edited workflow',
		category: 'Quick Actions',
		icon: <Zap size={16} className='text-fuchsia-500' />,
		iconBg: 'bg-fuchsia-500/10',
		keywords: ['run', 'execute', 'last', 'workflow', 'recent'],
	},
];

// ─── Category config ──────────────────────────────────────────────────────────
interface TCategoryConfig {
	label: TSearchCategory;
	icon: React.ReactNode;
	bgClass: string;
	textClass: string;
	order: number;
}

const CATEGORY_CONFIG: Record<TSearchCategory, TCategoryConfig> = {
	'Quick Actions': {
		label: 'Quick Actions',
		icon: <Zap size={12} />,
		bgClass: 'bg-amber-500/10',
		textClass: 'text-amber-700 dark:text-amber-400',
		order: 0,
	},
	Pages: {
		label: 'Pages',
		icon: <Layout size={12} />,
		bgClass: 'bg-blue-500/10',
		textClass: 'text-blue-700 dark:text-blue-400',
		order: 1,
	},
	Workflows: {
		label: 'Workflows',
		icon: <Workflow size={12} />,
		bgClass: 'bg-emerald-500/10',
		textClass: 'text-emerald-700 dark:text-emerald-400',
		order: 2,
	},
	Agents: {
		label: 'Agents',
		icon: <Bot size={12} />,
		bgClass: 'bg-primary-500/10',
		textClass: 'text-primary-700 dark:text-primary-400',
		order: 3,
	},
	Templates: {
		label: 'Templates',
		icon: <Layers size={12} />,
		bgClass: 'bg-violet-500/10',
		textClass: 'text-violet-700 dark:text-violet-400',
		order: 4,
	},
	Files: {
		label: 'Files',
		icon: <Folder size={12} />,
		bgClass: 'bg-blue-500/10',
		textClass: 'text-blue-700 dark:text-blue-400',
		order: 5,
	},
	History: {
		label: 'History',
		icon: <History size={12} />,
		bgClass: 'bg-zinc-500/10',
		textClass: 'text-zinc-700 dark:text-zinc-400',
		order: 6,
	},
	'Recent Searches': {
		label: 'Recent Searches',
		icon: <Clock size={12} />,
		bgClass: 'bg-zinc-500/10',
		textClass: 'text-zinc-700 dark:text-zinc-400',
		order: 7,
	},
};

// ─── Category Icon Map ────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<TSearchCategory, React.ReactNode> = {
	Pages: <Layout size={16} className='text-blue-500' />,
	Workflows: <Workflow size={16} className='text-emerald-500' />,
	Agents: <Bot size={16} className='text-primary-500' />,
	Templates: <Layers size={16} className='text-violet-500' />,
	Files: <Folder size={16} className='text-blue-500' />,
	History: <History size={16} className='text-zinc-500' />,
	'Quick Actions': <Zap size={16} className='text-amber-500' />,
	'Recent Searches': <Clock size={16} className='text-zinc-400' />,
};

// ─── Build all searchable items ───────────────────────────────────────────────
const buildSearchItems = (): TSearchItem[] => [
	...QUICK_ACTIONS,
	...getFlattenedPageItems(),
	...MOCK_WORKFLOWS,
	...MOCK_AGENTS,
	...MOCK_TEMPLATES,
	...MOCK_FILES,
];

const ALL_SEARCH_ITEMS = buildSearchItems();

// ─── Fuse.js setup ────────────────────────────────────────────────────────────
const fuse = new Fuse(ALL_SEARCH_ITEMS, {
	keys: [
		{ name: 'label', weight: 2 },
		{ name: 'description', weight: 1 },
		{ name: 'keywords', weight: 1.5 },
	],
	threshold: 0.35,
	distance: 200,
	minMatchCharLength: 1,
});

// ─── Component ────────────────────────────────────────────────────────────────
const GlobalSearch = () => {
	const { isOpen, close } = useGlobalSearchStore();
	const navigate = useNavigate();
	const [query, setQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const itemsContainerRef = useRef<HTMLDivElement>(null);

	// Recent searches state
	const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);

	// Reset state when modal opens/closes
	const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
	if (isOpen !== prevIsOpen) {
		setPrevIsOpen(isOpen);
		if (!isOpen) {
			// Reset state when closing
			setTimeout(() => {
				setQuery('');
				setSelectedIndex(0);
			}, 200);
		} else {
			setQuery('');
			setSelectedIndex(0);
			setRecentSearches(getRecentSearches());
		}
	}

	// ⌘K keyboard shortcut to open from anywhere
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.metaKey && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				useGlobalSearchStore.getState().open();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	// Auto-focus input when modal opens
	useEffect(() => {
		if (isOpen) {
			setTimeout(() => inputRef.current?.focus(), 50);
		}
	}, [isOpen]);

	// Search results
	const results = useMemo(() => {
		const trimmed = query.trim();
		if (!trimmed) return [];
		const fuseResults = fuse.search(trimmed);
		return fuseResults.map((r) => r.item);
	}, [query]);

	// Group results by category
	const groupedResults = useMemo(() => {
		const groups: Record<TSearchCategory, TSearchItem[]> = {} as Record<
			TSearchCategory,
			TSearchItem[]
		>;

		// Maintain order by adding categories in order
		Object.values(CATEGORY_CONFIG)
			.sort((a, b) => a.order - b.order)
			.forEach((cfg) => {
				groups[cfg.label] = [];
			});

		results.forEach((item) => {
			if (groups[item.category]) {
				groups[item.category].push(item);
			}
		});

		// Remove empty categories
		return Object.fromEntries(
			Object.entries(groups).filter(([, items]) => items.length > 0),
		) as Record<TSearchCategory, TSearchItem[]>;
	}, [results]);

	// Flatten results for keyboard navigation (maintain grouped order)
	const flatResults = useMemo(() => {
		const flat: { item: TSearchItem; category: TSearchCategory }[] = [];
		Object.entries(groupedResults).forEach(([, items]) => {
			items.forEach((item) => {
				flat.push({ item, category: item.category });
			});
		});
		return flat;
	}, [groupedResults]);

	// Reset selection index when results change
	const [prevResultsLength, setPrevResultsLength] = useState(flatResults.length);
	if (flatResults.length !== prevResultsLength) {
		setPrevResultsLength(flatResults.length);
		setSelectedIndex(0);
	}

	// Scroll selected item into view
	useEffect(() => {
		if (!itemsContainerRef.current || flatResults.length === 0) return;
		const container = itemsContainerRef.current;
		const selectedEl = container.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null;
		if (selectedEl) {
			selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		}
	}, [selectedIndex, flatResults.length]);

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		setQuery(e.target.value);
	};

	const handleNavigate = useCallback(
		(item: TSearchItem) => {
			if (item.to) {
				navigate(item.to);
			} else if (item.action) {
				item.action();
			}
			if (query.trim()) addRecentSearch(query.trim());
			close();
		},
		[navigate, close, query],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				setSelectedIndex((prev) => Math.max(prev - 1, 0));
			} else if (e.key === 'Enter') {
				e.preventDefault();
				const selected = flatResults[selectedIndex];
				if (selected) handleNavigate(selected.item);
			}
		},
		[flatResults, selectedIndex, handleNavigate],
	);

	const handleRecentSearchClick = (searchTerm: string) => {
		setQuery(searchTerm);
		addRecentSearch(searchTerm);
	};

	const hasResults =
		query.trim().length > 0 && Object.keys(groupedResults).length > 0;
	const isEmptyResult = query.trim().length > 0 && Object.keys(groupedResults).length === 0;

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={(val) => {
				const open = typeof val === 'function' ? val(isOpen) : val;
				if (!open) close();
			}}
			rounded='rounded-2xl'
			isScrollable={false}
			size='lg'
		>
			<ModalHeader hasCloseButton={false}>
				<div className='flex w-full items-center gap-3'>
					<Search size={18} className='shrink-0 text-zinc-400' />
					<input
						ref={inputRef}
						value={query}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						placeholder='Search workflows, agents, files, pages...'
						className='w-full border-0 bg-transparent p-0 text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white dark:placeholder:text-zinc-500'
						aria-label='Search everything'
					/>
					<Badge color='zinc' variant='outline' className='font-mono text-xs shrink-0'>
						ESC
					</Badge>
				</div>
			</ModalHeader>

			<ModalBody className='pt-0 max-h-[60vh] overflow-y-auto' ref={itemsContainerRef}>
				{/* Recent Searches (when no query) */}
				{!query.trim() && recentSearches.length > 0 && (
					<div className='mb-4'>
						<div className='flex items-center justify-between px-1 py-2'>
							<div className='flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400'>
								<Clock size={13} />
								<span>Recent searches</span>
							</div>
							<button
								type='button'
								onClick={() => {
									clearRecentSearches();
									setRecentSearches([]);
								}}
								className='text-[10px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors'
							>
								Clear
							</button>
						</div>
						<div className='flex flex-wrap gap-2'>
							{recentSearches.map((term) => (
								<button
									key={term}
									type='button'
									onClick={() => handleRecentSearchClick(term)}
									className='flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 shadow-xs transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-white'
								>
									<Clock size={11} className='text-zinc-400' />
									{term}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Shortcut hints when no query and no recent searches */}
				{!query.trim() && recentSearches.length === 0 && (
					<div className='flex flex-col items-center justify-center py-10 text-center'>
						<div className='mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800/60'>
							<Command size={24} className='text-zinc-400' />
						</div>
						<p className='text-sm font-bold text-zinc-700 dark:text-zinc-300'>
							Search everything
						</p>
						<p className='mt-1 text-xs text-zinc-400 dark:text-zinc-500'>
							Type to search workflows, agents, files, pages, and more
						</p>
						<div className='mt-4 flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500'>
							<div className='flex items-center gap-1'>
								<kbd className='rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'>
									↑↓
								</kbd>
								<span>navigate</span>
							</div>
							<div className='flex items-center gap-1'>
								<kbd className='rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'>
									↵
								</kbd>
								<span>select</span>
							</div>
							<div className='flex items-center gap-1'>
								<kbd className='rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'>
									esc
								</kbd>
								<span>close</span>
							</div>
						</div>
					</div>
				)}

				{/* Empty search results */}
				{isEmptyResult && (
					<div className='flex flex-col items-center justify-center py-10 text-center'>
						<div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/60'>
							<Search size={18} className='text-zinc-400' />
						</div>
						<p className='text-sm font-bold text-zinc-600 dark:text-zinc-400'>
							No results for &ldquo;{query}&rdquo;
						</p>
						<p className='mt-1 text-xs text-zinc-400 dark:text-zinc-500'>
							Try a different search term or browse the navigation menu
						</p>
					</div>
				)}

				{/* Grouped search results */}
				{hasResults && (
					<div className='flex flex-col gap-4'>
						{Object.entries(groupedResults).map(([category, items]) => {
							const cfg = CATEGORY_CONFIG[category as TSearchCategory];
							return (
								<div key={category}>
									<div className='flex items-center gap-2 px-1 py-1.5'>
										<span
											className={classNames(
												'flex h-5 w-5 items-center justify-center rounded-md',
												cfg?.bgClass || 'bg-zinc-500/10',
											)}
										>
											{CATEGORY_ICONS[category as TSearchCategory] || (
												<Layout size={12} className='text-zinc-400' />
											)}
										</span>
										<span
											className={classNames(
												'text-[11px] font-bold tracking-wide',
												cfg?.textClass || 'text-zinc-500',
											)}
										>
											{category}
										</span>
										<span className='text-[10px] font-semibold text-zinc-300 dark:text-zinc-600'>
											{items.length}
										</span>
									</div>
									<div className='flex flex-col gap-0.5'>
										{items.map((item, idx) => {
											const globalIdx = flatResults.findIndex(
												(fr) => fr.item.id === item.id,
											);
											const isSelected = globalIdx === selectedIndex;

											return (
												<button
													key={item.id}
													type='button'
													data-index={globalIdx}
													className={classNames(
														'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150',
														isSelected
															? 'bg-primary-50/80 shadow-xs dark:bg-zinc-800/60'
															: 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30',
													)}
													onMouseEnter={() => setSelectedIndex(globalIdx)}
													onClick={() => handleNavigate(item)}
												>
													{/* Icon */}
													<div
														className={classNames(
															'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
															item.iconBg || 'bg-zinc-100 dark:bg-zinc-800',
														)}
													>
														{item.icon}
													</div>

													{/* Content */}
													<div className='min-w-0 flex-1'>
														<div className='flex items-center gap-2'>
															<span className='truncate text-sm font-bold text-zinc-800 dark:text-zinc-100'>
																{item.label}
															</span>
															{item.badge && (
																<span
																	className={classNames(
																		'shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase',
																		item.badge === 'active'
																			? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
																			: item.badge === 'inactive'
																				? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
																				: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
																	)}
																>
																	{item.badge}
																</span>
															)}
														</div>
														{item.description && (
															<p className='mt-0.5 truncate text-xs font-medium text-zinc-400 dark:text-zinc-500'>
																{item.description}
															</p>
														)}
													</div>

													{/* Arrow indicator on hover/select */}
													<div
														className={classNames(
															'shrink-0 transition-all duration-150',
															isSelected
																? 'opacity-100 translate-x-0'
																: 'opacity-0 -translate-x-1',
														)}
													>
														<ArrowRight
															size={14}
															className='text-primary-500'
														/>
													</div>
												</button>
											);
										})}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</ModalBody>

			<ModalFooter>
				<ModalFooterChild>
					<div className='flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500'>
						<div className='flex items-center gap-1.5'>
							<kbd className='rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'>
								↑↓
							</kbd>
							<span>navigate</span>
						</div>
						<div className='flex items-center gap-1.5'>
							<kbd className='rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'>
								↵
							</kbd>
							<span>select</span>
						</div>
						<div className='flex items-center gap-1.5'>
							<kbd className='rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'>
								esc
							</kbd>
							<span>close</span>
						</div>
					</div>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default GlobalSearch;
