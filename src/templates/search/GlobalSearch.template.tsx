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
	X,
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
import paths, { buildPath } from '@/Routes/paths';
import { useWorkflows } from '@/api/modules/workflows';
import { useAgents } from '@/api/modules/agents';
import { useWorkflowTemplates } from '@/api/modules/templates';
import { useArtifacts } from '@/api/modules/artifacts';
import type { TWorkflow } from '@/types/workflow.type';
import type { TAgent } from '@/types/agent.type';
import type { TWorkflowTemplate } from '@/types/template.type';
import type { TArtifact } from '@/types/artifact.type';
import useResolvePath from '@/hooks/useResolvePath';
import { useGlobalSearchStore } from '@/store/globalSearch.store';

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

const removeRecentSearch = (query: string) => {
	const current = getRecentSearches().filter((s) => s !== query);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
	return current;
};

// ─── Flatten Pages ────────────────────────────────────────────────────────────
const getFlattenPages = (pagesList: TPages | undefined, parentId?: string): TPage[] => {
	return Object.values(pagesList ?? {}).flatMap((page) => {
		const { subPages, ...pageData } = page;
		const currentPage: TPage = { ...pageData, parentId };
		const subPagesArray = subPages ? getFlattenPages(subPages, page.id) : [];
		return [currentPage, ...subPagesArray];
	});
};

/**
 * A result has to be navigable on click. Anything still carrying an unfilled
 * param once the workspace id is substituted (the editors, which need a
 * playbook or agent id) has no meaningful destination from a search box.
 */
const workspacePages = pages.workspace.subPages!;
const settingsPages = pages.settings.subPages!;

const isNavigable = (to: string) => !to.includes('/:');

const getFlattenedPageItems = (workspaceId: string): TSearchItem[] => {
	const flattenPages = [
		pages.workspace as TPage,
		...getFlattenPages(pages.workspace.subPages as TPages, pages.workspace.id),
		pages.settings as TPage,
		...getFlattenPages(pages.settings.subPages as TPages, pages.settings.id),
		pages.welcome as TPage,
		...getFlattenPages(pages.welcome.subPages as TPages, pages.welcome.id),
	]
		.map((page) => ({ ...page, to: buildPath(page.to, { workspaceId }) }))
		.filter((page) => isNavigable(page.to));

	const textById = new Map(flattenPages.map((p) => [p.id, p.text]));

	return flattenPages.map((item) => ({
		id: `page-${item.id}`,
		label: item.text,
		description: item.parentId ? textById.get(item.parentId) : undefined,
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

// ─── Live workspace records ──────────────────────────────────────────────────
// These used to be four hardcoded arrays whose `to` values pointed at pre-port
// paths (`/editor/edit-workflow/:id`, `/files`, `/templates`) that match no
// route, so every result 404-ed. They are now built from the same queries the
// list pages use, and routed through `paths`.

type TLiveRecords = {
	workflows?: TWorkflow[];
	agents?: TAgent[];
	templates?: TWorkflowTemplate[];
	artifacts?: TArtifact[];
};

const workflowItems = (workspaceId: string, rows: TWorkflow[] = []): TSearchItem[] =>
	rows.map((w) => ({
		id: `wf-${w.id}`,
		label: w.name,
		description: w.description ?? undefined,
		category: 'Workflows' as TSearchCategory,
		icon: <Workflow size={16} className='text-emerald-500' />,
		iconBg: 'bg-emerald-500/10',
		to: paths.editPlaybook(workspaceId, w.id),
		badge: w.status,
		keywords: [w.name, w.description ?? ''],
	}));

const agentItems = (workspaceId: string, rows: TAgent[] = []): TSearchItem[] =>
	rows.map((a) => ({
		id: `agent-${a.id}`,
		label: a.name,
		description: a.description ?? undefined,
		category: 'Agents' as TSearchCategory,
		icon: <Bot size={16} className='text-primary-500' />,
		iconBg: 'bg-primary-500/10',
		to: paths.editAgent(workspaceId, a.id),
		keywords: [a.name, a.description ?? ''],
	}));

const templateItems = (workspaceId: string, rows: TWorkflowTemplate[] = []): TSearchItem[] =>
	rows.map((t) => ({
		id: `tpl-${t.id}`,
		label: t.name,
		description: t.description ?? undefined,
		category: 'Templates' as TSearchCategory,
		icon: <Layers size={16} className='text-violet-500' />,
		iconBg: 'bg-violet-500/10',
		to: buildPath(workspacePages.blueprints.to, { workspaceId }),
		keywords: [t.name, t.category ?? ''],
	}));

const artifactItems = (workspaceId: string, rows: TArtifact[] = []): TSearchItem[] =>
	rows.map((f) => ({
		id: `file-${f.id}`,
		label: f.filename,
		description: f.agent?.name ? `Generated by ${f.agent.name}` : undefined,
		category: 'Files' as TSearchCategory,
		icon: <FileText size={16} className='text-blue-500' />,
		iconBg: 'bg-blue-500/10',
		to: buildPath(workspacePages.artifacts.to, { workspaceId }),
		keywords: [f.filename, f.mime_type],
	}));

/** Quick actions are workspace-scoped, so they cannot be a module constant. */
const getQuickActions = (workspaceId: string): TSearchItem[] => [
	{
		id: 'qa-create-workflow',
		label: 'Create new playbook',
		description: 'Start building a new automation from scratch',
		category: 'Quick Actions',
		icon: <Plus size={16} className='text-emerald-500' />,
		iconBg: 'bg-emerald-500/10',
		to: paths.newPlaybook(workspaceId),
		keywords: ['create', 'new', 'workflow', 'playbook', 'automation'],
	},
	{
		id: 'qa-create-agent',
		label: 'Create new agent',
		description: 'Build a new AI agent with custom instructions',
		category: 'Quick Actions',
		icon: <Bot size={16} className='text-primary-500' />,
		iconBg: 'bg-primary-500/10',
		to: paths.newAgent(workspaceId),
		keywords: ['create', 'new', 'agent', 'ai', 'bot'],
	},
	{
		id: 'qa-invite-team',
		label: 'Invite team members',
		description: 'Add collaborators to your workspace',
		category: 'Quick Actions',
		icon: <UserPlus size={16} className='text-amber-500' />,
		iconBg: 'bg-amber-500/10',
		to: buildPath(settingsPages.members.to, { workspaceId }),
		keywords: ['invite', 'team', 'members', 'collaborators', 'add'],
	},
	{
		id: 'qa-upload-file',
		label: 'Browse generated files',
		description: 'Documents, exports and images your agents produced',
		category: 'Quick Actions',
		icon: <FileText size={16} className='text-blue-500' />,
		iconBg: 'bg-blue-500/10',
		to: buildPath(workspacePages.artifacts.to, { workspaceId }),
		keywords: ['file', 'artifact', 'document', 'export', 'download'],
	},
	{
		id: 'qa-settings',
		label: 'Open workspace settings',
		description: 'Configure workspace preferences and integrations',
		category: 'Quick Actions',
		icon: <Settings size={16} className='text-zinc-500' />,
		iconBg: 'bg-zinc-500/10',
		to: buildPath(settingsPages.workspace.to, { workspaceId }),
		keywords: ['settings', 'workspace', 'configure', 'preferences'],
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
		bgClass: 'bg-cyan-500/10',
		textClass: 'text-cyan-700 dark:text-cyan-400',
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
	Files: <Folder size={16} className='text-cyan-500' />,
	History: <History size={16} className='text-zinc-500' />,
	'Quick Actions': <Zap size={16} className='text-amber-500' />,
	'Recent Searches': <Clock size={16} className='text-zinc-400' />,
};

// ─── Build all searchable items ───────────────────────────────────────────────
const buildSearchItems = (workspaceId: string, live: TLiveRecords): TSearchItem[] => [
	...getQuickActions(workspaceId),
	...getFlattenedPageItems(workspaceId),
	...workflowItems(workspaceId, live.workflows),
	...agentItems(workspaceId, live.agents),
	...templateItems(workspaceId, live.templates),
	...artifactItems(workspaceId, live.artifacts),
];

const FUSE_OPTIONS = {
	keys: [
		{ name: 'label', weight: 2 },
		{ name: 'description', weight: 1 },
		{ name: 'keywords', weight: 1.5 },
	],
	threshold: 0.35,
	distance: 200,
	minMatchCharLength: 1,
};

// ─── Component ────────────────────────────────────────────────────────────────
const GlobalSearch = () => {
	const { isOpen, close } = useGlobalSearchStore();
	const navigate = useNavigate();
	const { workspaceId } = useResolvePath();

	// Page results are URL templates until the workspace id is substituted, so
	// the index is rebuilt when the active workspace changes.
	// Only the open dialog needs the index. These hooks take no options object -
	// each one is `enabled: !!ws` internally - so passing an empty workspace id
	// while the dialog is closed is what keeps them from firing on every page.
	const searchWs = isOpen ? workspaceId : '';
	const { data: workflows } = useWorkflows(searchWs);
	const { data: agents } = useAgents(searchWs);
	const { data: templates } = useWorkflowTemplates(searchWs);
	// ArtifactService.list returns `{ artifacts, meta }`, not a bare array.
	const { data: artifactPage } = useArtifacts(searchWs);

	const allSearchItems = useMemo(
		() =>
			buildSearchItems(workspaceId, {
				workflows,
				agents,
				templates,
				artifacts: artifactPage?.artifacts,
			}),
		[workspaceId, workflows, agents, templates, artifactPage],
	);
	const fuse = useMemo(() => new Fuse(allSearchItems, FUSE_OPTIONS), [allSearchItems]);
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
	}, [query, fuse]);

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
			contentClassName='mx-4 sm:mx-auto'
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
						className='w-full border-0 bg-transparent p-0 text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-white dark:placeholder:text-zinc-500'
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
								<div
									key={term}
									className='group flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white pr-1.5 pl-3 text-xs font-semibold text-zinc-600 shadow-xs transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-white'
								>
									<button
										type='button'
										onClick={() => handleRecentSearchClick(term)}
										className='flex items-center gap-1.5 py-1.5'
									>
										<Clock size={11} className='text-zinc-400' />
										{term}
									</button>
									<button
										type='button'
										aria-label={`Remove "${term}" from recent searches`}
										onClick={() => setRecentSearches(removeRecentSearch(term))}
										className='rounded-full p-0.5 text-zinc-300 opacity-100 transition-opacity hover:text-zinc-600 sm:opacity-0 sm:group-hover:opacity-100 dark:text-zinc-600 dark:hover:text-zinc-300'
									>
										<X size={11} />
									</button>
								</div>
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
										{items.map((item) => {
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
														'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150',
														isSelected
															? 'border-primary-500/20 bg-primary-50/80 shadow-xs dark:border-primary-400/20 dark:bg-zinc-800/60'
															: 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/30',
													)}
													onMouseEnter={() => setSelectedIndex(globalIdx)}
													onClick={() => handleNavigate(item)}
												>
													{/* Icon */}
													<div
														className={classNames(
															'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-black/5 dark:ring-white/5',
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
					{/* Full hint set — hidden on narrow screens where it would crowd the footer */}
					<div className='hidden items-center gap-3 text-xs text-zinc-400 sm:flex dark:text-zinc-500'>
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
					{/* Compact hint on narrow screens */}
					<div className='flex items-center gap-1.5 text-xs text-zinc-400 sm:hidden dark:text-zinc-500'>
						<kbd className='rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'>
							esc
						</kbd>
						<span>to close</span>
					</div>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default GlobalSearch;
