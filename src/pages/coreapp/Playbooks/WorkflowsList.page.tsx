import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Search,
	Plus,
	Folder,
	ChevronDown,
	ChevronRight,
	Play,
	Edit3,
	Copy,
	Trash2,
	FolderPlus,
	Check,
	LayoutGrid,
	List,
	Workflow,
	X,
	MoreVertical,
	GitMerge,
	Star,
	Calendar,
	Clock,
	Rocket,
	ArrowUpDown,
	CheckCircle2,
	AlertTriangle,
	FolderOpen,
	Tag,
} from 'lucide-react';
import { OutletContextType } from './_layouts/Playbooks.layout';
import { useConfirm } from '@/context/confirm';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import pages from '@/Routes/pages';
import paths from '@/Routes/paths';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import { useWorkspaceContext } from '@/context/workspace';
import {
	useFolders,
	useCreateFolder,
	useUpdateFolder,
	useDeleteFolder,
	useMoveWorkflows,
} from '@/api/modules/folders';
import {
	useWorkflows,
	useCreateWorkflow,
	useUpdateWorkflow,
	useDeleteWorkflow,
	useDuplicateWorkflow,
	useToggleFavorite,
	useActivateWorkflow,
	useExecuteWorkflow,
} from '@/api/modules/workflows';
import { useTags } from '@/api/modules/tags';
import type { TTag } from '@/types/tag.type';
import WorkflowTagsModal from './_partial/WorkflowTagsModal.partial';

interface IWorkflow {
	id: string;
	title: string;
	description: string;
	status: 'active' | 'inactive';
	hasUnpublishedChanges: boolean;
	lastRun: string;
	lastRunAt: number;
	folderId: string | null;
	apps: string[];
	starred?: boolean;
	lastEdited: string;
	updatedAt: number;
	nodesCount: number;
	tags: TTag[];
}

interface IFolder {
	id: string;
	name: string;
	color: string;
}

const ROOT_FOLDER_ID = '__root__';

type TListTab = 'all' | 'starred' | 'published' | 'drafts';
type TSortOption = 'updated' | 'name' | 'lastRun' | 'nodes';
type TMenuAnchor = { top: number; left: number; flip: boolean };

const LIST_TABS: { id: TListTab; label: string }[] = [
	{ id: 'all', label: 'All Workflows' },
	{ id: 'starred', label: 'Starred Favorites' },
	{ id: 'published', label: 'Published' },
	{ id: 'drafts', label: 'Drafts' },
];

const SORT_OPTIONS: { id: TSortOption; label: string }[] = [
	{ id: 'updated', label: 'Recently updated' },
	{ id: 'lastRun', label: 'Recently run' },
	{ id: 'name', label: 'Name (A–Z)' },
	{ id: 'nodes', label: 'Most nodes' },
];

const FOLDER_COLOR_OPTIONS = [
	{ label: 'Indigo', value: '#4f46e5' },
	{ label: 'Rose', value: '#f43f5e' },
	{ label: 'Violet', value: '#7c3aed' },
	{ label: 'Emerald', value: '#059669' },
	{ label: 'Amber', value: '#f59e0b' },
	{ label: 'Blue', value: '#3b82f6' },
	{ label: 'Teal', value: '#14b8a6' },
	{ label: 'Fuchsia', value: '#d946ef' },
	{ label: 'Lime', value: '#84cc16' },
	{ label: 'Slate', value: '#64748b' },
] as const;

const getInitials = (name: string) =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part.charAt(0))
		.join('')
		.toUpperCase() || 'MW';

const formatDate = (value: number | string | null | undefined) => {
	if (!value) return 'Never';
	const numericValue = typeof value === 'number' ? value : Number.NaN;
	const date =
		typeof value === 'number'
			? new Date(numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue)
			: new Date(value);
	if (Number.isNaN(date.getTime())) return 'Never';
	return date.toLocaleDateString();
};

const toTimestamp = (value: number | string | null | undefined) => {
	if (!value) return 0;
	if (typeof value === 'number') return value < 1_000_000_000_000 ? value * 1000 : value;
	const parsed = new Date(value).getTime();
	return Number.isNaN(parsed) ? 0 : parsed;
};

const getAppNames = (nodeTypes: string[] | undefined) =>
	(nodeTypes ?? []).map((type) => type.toLowerCase()).slice(0, 4);

const AppBadge = ({ name }: { name: string }) => (
	<span className='text-primary-600 shadow-3xs border-primary-100/60 bg-primary-50/30 hover:border-primary-200/50 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/20 rounded-full border px-2.5 py-0.5 text-[10px] font-bold capitalize transition-all duration-200 dark:border-zinc-800/80 dark:bg-zinc-800/20'>
		{name}
	</span>
);

const TagChip = ({ tag, onClick }: { tag: TTag; onClick?: (e: React.MouseEvent) => void }) => (
	<button
		type='button'
		onClick={onClick}
		title={`Show workflows tagged "${tag.name}"`}
		className='flex cursor-pointer items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600 transition hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'>
		<span
			className='h-1.5 w-1.5 shrink-0 rounded-full'
			style={{ backgroundColor: tag.color || '#94a3b8' }}
		/>
		{tag.name}
	</button>
);

const WorkflowsListPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const navigate = useNavigate();
	const { confirm } = useConfirm();
	const { activeWorkspaceId: fallbackWorkspaceId } = useWorkflowShellStore();
	const { workspaces, activeWorkspace, activeWorkspaceId } = useWorkspaceContext();

	const currentWorkspaceId = activeWorkspaceId || fallbackWorkspaceId;

	const workspaceSummary = useMemo(
		() => workspaces.find((workspace) => workspace.id === activeWorkspaceId),
		[activeWorkspaceId, workspaces],
	);

	const workspaceName = activeWorkspace?.name ?? workspaceSummary?.name ?? 'Workspace';
	const workspaceSlug = activeWorkspace?.slug ?? workspaceSummary?.slug;
	const workspaceRole = activeWorkspace?.role ?? workspaceSummary?.role ?? null;
	const hasWorkspace = Boolean(activeWorkspaceId);

	// Fetch folders + workflows from the backend
	const { data: apiFolders } = useFolders(currentWorkspaceId);
	const { data: apiWorkflowsResponse } = useWorkflows(currentWorkspaceId);
	const { data: workspaceTags } = useTags(currentWorkspaceId);

	// Mutations
	const createWorkflowMutation = useCreateWorkflow(currentWorkspaceId);
	const updateWorkflowMutation = useUpdateWorkflow(currentWorkspaceId);
	const deleteWorkflowMutation = useDeleteWorkflow(currentWorkspaceId);
	const duplicateWorkflowMutation = useDuplicateWorkflow(currentWorkspaceId);
	const toggleFavoriteMutation = useToggleFavorite(currentWorkspaceId);
	const activateWorkflowMutation = useActivateWorkflow(currentWorkspaceId);
	const executeWorkflowMutation = useExecuteWorkflow(currentWorkspaceId);
	const createFolderMutation = useCreateFolder(currentWorkspaceId);
	const updateFolderMutation = useUpdateFolder(currentWorkspaceId);
	const deleteFolderMutation = useDeleteFolder(currentWorkspaceId);
	const moveWorkflowsMutation = useMoveWorkflows(currentWorkspaceId);

	// Map backend folders → view model
	const folders = useMemo<IFolder[]>(() => {
		if (!apiFolders || apiFolders.length === 0) return [];
		return apiFolders.map((f) => ({
			id: f.id,
			name: f.name,
			color: f.color || '#4f46e5',
		}));
	}, [apiFolders]);

	// Map backend workflows → view model.
	const workflows = useMemo<IWorkflow[]>(() => {
		if (!apiWorkflowsResponse || apiWorkflowsResponse.length === 0) return [];
		return apiWorkflowsResponse.map((w): IWorkflow => {
			return {
				id: w.id,
				title: w.name,
				description: w.description || 'No description provided.',
				status: w.is_published ? 'active' : 'inactive',
				hasUnpublishedChanges: w.has_unpublished_changes ?? false,
				lastRun: formatDate(w.last_run_at),
				lastRunAt: toTimestamp(w.last_run_at),
				folderId: w.folder_id || null,
				apps: getAppNames(w.node_types),
				starred: w.is_favorite ?? false,
				lastEdited: formatDate(w.updated_at),
				updatedAt: toTimestamp(w.updated_at),
				nodesCount: w.nodes_count ?? 0,
				tags: w.tags ?? [],
			};
		});
	}, [apiWorkflowsResponse]);

	const activeWorkflowCount = useMemo(
		() => workflows.filter((w) => w.status === 'active').length,
		[workflows],
	);

	const favoriteWorkflowCount = useMemo(
		() => workflows.filter((w) => w.starred).length,
		[workflows],
	);

	const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

	// Expand the first folder by default once folders are available
	const didInitExpand = useRef(false);
	useEffect(() => {
		if (didInitExpand.current || folders.length === 0) return;
		const initialExpand: Record<string, boolean> = {};
		folders.forEach((f, idx) => {
			initialExpand[f.id] = idx === 0;
		});
		setExpandedFolders((current) => ({ ...current, ...initialExpand }));
		didInitExpand.current = true;
	}, [folders]);

	const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

	const [newFolderName, setNewFolderName] = useState('');
	const [newFolderColor, setNewFolderColor] = useState('#4f46e5');
	const [editingFolder, setEditingFolder] = useState<IFolder | null>(null);
	const [editFolderName, setEditFolderName] = useState('');
	const [editFolderColor, setEditFolderColor] = useState('#4f46e5');

	const [renamingId, setRenamingId] = useState<string | null>(null);
	const [renameValue, setRenameValue] = useState('');
	const renameInputRef = useRef<HTMLInputElement>(null);

	const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
	const [menuAnchor, setMenuAnchor] = useState<TMenuAnchor | null>(null);
	const menuAnchorRef = useRef<TMenuAnchor | null>(null);
	const [activeFolderMenuId, setActiveFolderMenuId] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<TListTab>('all');
	const [sortBy, setSortBy] = useState<TSortOption>('updated');
	const [searchQuery, setSearchQuery] = useState('');
	// The backend's workflow list takes no filters, so tag filtering is page-side.
	const [tagFilter, setTagFilter] = useState<string>('');
	const [taggingWorkflowId, setTaggingWorkflowId] = useState<string | null>(null);
	const [isGridView, setIsGridView] = useState(true);
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
	const [draggedWorkflowId, setDraggedWorkflowId] = useState<string | null>(null);
	const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.workspace.subPages!.playbooks }]} />);
		return () => setHeaderLeft(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (renamingId && renameInputRef.current) {
			renameInputRef.current.focus();
			renameInputRef.current.select();
		}
	}, [renamingId]);

	useEffect(() => {
		const handleGlobalClick = () => {
			setActiveMenuId(null);
			setActiveFolderMenuId(null);
			setMenuAnchor(null);
		};
		const handleReposition = () => {
			setActiveMenuId((current) => (menuAnchorRef.current ? null : current));
			setMenuAnchor(null);
		};
		window.addEventListener('click', handleGlobalClick);
		window.addEventListener('scroll', handleReposition, true);
		window.addEventListener('resize', handleReposition);
		return () => {
			window.removeEventListener('click', handleGlobalClick);
			window.removeEventListener('scroll', handleReposition, true);
			window.removeEventListener('resize', handleReposition);
		};
	}, []);

	useEffect(() => {
		menuAnchorRef.current = menuAnchor;
	}, [menuAnchor]);

	const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
		setToast({ message, type });
		setTimeout(() => setToast(null), 3000);
	};

	const filteredWorkflows = useMemo(() => {
		const matched = workflows.filter((w) => {
			if (activeTab === 'starred' && !w.starred) return false;
			if (activeTab === 'published' && w.status !== 'active') return false;
			if (activeTab === 'drafts' && w.status === 'active') return false;
			if (tagFilter && !w.tags.some((tag) => String(tag.id) === tagFilter)) return false;
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				if (
					!w.title.toLowerCase().includes(query) &&
					!w.description.toLowerCase().includes(query) &&
					!w.apps.some((app) => app.includes(query)) &&
					!w.tags.some((tag) => tag.name.toLowerCase().includes(query))
				)
					return false;
			}
			return true;
		});

		return [...matched].sort((a, b) => {
			switch (sortBy) {
				case 'name':
					return a.title.localeCompare(b.title);
				case 'lastRun':
					return b.lastRunAt - a.lastRunAt;
				case 'nodes':
					return b.nodesCount - a.nodesCount;
				case 'updated':
				default:
					return b.updatedAt - a.updatedAt;
			}
		});
	}, [workflows, activeTab, tagFilter, searchQuery, sortBy]);

	const matchCount = filteredWorkflows.length;

	const folderGrouped = useMemo(() => {
		const grouped: Record<string, IWorkflow[]> = { [ROOT_FOLDER_ID]: [] };
		folders.forEach((f) => {
			grouped[f.id] = [];
		});
		filteredWorkflows.forEach((w) => {
			const groupId = w.folderId && grouped[w.folderId] ? w.folderId : ROOT_FOLDER_ID;
			grouped[groupId].push(w);
		});
		return grouped;
	}, [filteredWorkflows, folders]);

	const workflowGroups = useMemo<IFolder[]>(() => {
		if (filteredWorkflows.length === 0) return [];
		if (folderGrouped[ROOT_FOLDER_ID].length === 0) return folders;
		return [{ id: ROOT_FOLDER_ID, name: 'Root workflows', color: '#475569' }, ...folders];
	}, [filteredWorkflows, folderGrouped, folders]);

	const handleQuickCreateWorkflow = (folderId?: string) => {
		if (!hasWorkspace || createWorkflowMutation.isPending) return;
		createWorkflowMutation.mutate(
			{ name: 'Untitled Workflow', folder_id: folderId },
			{ onSuccess: (res) => navigate(paths.editPlaybook(currentWorkspaceId, res.id)) },
		);
	};

	const handleCreateFolder = async (e: React.FormEvent) => {
		e.preventDefault();
		// Guarded here rather than via `disabled`, so the buttons look unchanged.
		if (!newFolderName.trim() || createFolderMutation.isPending) return;
		try {
			const res = await createFolderMutation.mutateAsync({
				type: 'workflow',
				name: newFolderName.trim(),
				color: newFolderColor,
			});
			setExpandedFolders((prev) => ({ ...prev, [res.id]: true }));
			setNewFolderName('');
			setNewFolderColor('#4f46e5');
			setIsCreateFolderOpen(false);
			triggerToast(`Folder "${res.name}" created successfully!`);
		} catch {
			// Error is surfaced by the mutation hook
		}
	};

	const openEditFolder = (folder: IFolder) => {
		setEditingFolder(folder);
		setEditFolderName(folder.name);
		setEditFolderColor(folder.color);
	};

	const handleUpdateFolder = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingFolder || !editFolderName.trim() || updateFolderMutation.isPending) return;
		try {
			const res = await updateFolderMutation.mutateAsync({
				id: editingFolder.id,
				body: {
					name: editFolderName.trim(),
					color: editFolderColor,
				},
			});
			setEditingFolder(null);
			triggerToast(`Folder "${res.name}" updated successfully!`);
		} catch {
			// Error is surfaced by the mutation hook
		}
	};

	const handleDeleteFolder = async (folder: IFolder) => {
		setActiveFolderMenuId(null);
		const count = (folderGrouped[folder.id] || []).length;
		const confirmed = await confirm({
			title: 'Delete Folder',
			message: (
				<>
					Are you sure you want to delete{' '}
					<strong className='font-semibold text-zinc-800 dark:text-zinc-200'>
						"{folder.name}"
					</strong>
					?{' '}
					{count > 0
						? `Its ${count} workflow${count === 1 ? '' : 's'} will move to root level.`
						: 'This action cannot be undone.'}
				</>
			),
		});
		if (!confirmed) return;
		try {
			await deleteFolderMutation.mutateAsync(folder.id);
			triggerToast(`Deleted folder "${folder.name}"`, 'info');
		} catch {
			// Error is surfaced by the mutation hook
		}
	};

	// Publishing a version is what makes a workflow live; this backend has no
	// unpublish counterpart, so the action is one-way by design.
	const handlePublish = async (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		const wf = workflows.find((w) => w.id === id);
		if (!wf) return;
		try {
			await activateWorkflowMutation.mutateAsync(id);
			triggerToast(`Published "${wf.title}"`);
		} catch {
			// Error is surfaced by the mutation hook
		}
	};

	const handleToggleStar = async (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		const wf = workflows.find((w) => w.id === id);
		if (!wf) return;
		try {
			await toggleFavoriteMutation.mutateAsync({ id, is_favorite: !wf.starred });
		} catch {
			// Error is surfaced by the mutation hook
		}
	};

	const handleRunNow = async (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (executeWorkflowMutation.isPending) return;
		const wf = workflows.find((w) => w.id === id);
		try {
			await executeWorkflowMutation.mutateAsync({ id });
			triggerToast(`Workflow "${wf?.title || 'workflow'}" run started!`, 'info');
		} catch {
			// Error is surfaced by the mutation hook
		}
	};

	const handleDuplicate = async (workflow: IWorkflow, e: React.MouseEvent) => {
		e.stopPropagation();
		if (duplicateWorkflowMutation.isPending) return;
		try {
			await duplicateWorkflowMutation.mutateAsync(workflow.id);
			triggerToast(`Duplicated "${workflow.title}"`);
		} catch {
			// Error is surfaced by the mutation hook
		}
	};

	const handleDelete = async (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		const wf = workflows.find((w) => w.id === id);
		const confirmed = await confirm({
			title: 'Delete Workflow',
			message: (
				<>
					Are you sure you want to delete{' '}
					<strong className='font-semibold text-zinc-800 dark:text-zinc-200'>
						{wf ? `"${wf.title}"` : 'this workflow'}
					</strong>
					? This action cannot be undone.
				</>
			),
		});
		if (!confirmed) return;
		try {
			await deleteWorkflowMutation.mutateAsync(id);
			if (wf) triggerToast(`Deleted workflow "${wf.title}"`, 'info');
		} catch {
			// Error is surfaced by the mutation hook
		}
	};

	const handleMoveWorkflow = async (workflow: IWorkflow, folderId: string | null) => {
		setActiveMenuId(null);
		try {
			await moveWorkflowsMutation.mutateAsync({
				workflow_ids: [workflow.id],
				folder_id: folderId,
			});
			if (folderId) setExpandedFolders((prev) => ({ ...prev, [folderId]: true }));
			const folderName = folders.find((folder) => folder.id === folderId)?.name;
			triggerToast(
				folderName
					? `Moved "${workflow.title}" to "${folderName}"`
					: `Moved "${workflow.title}" to root level`,
			);
		} catch {
			// Error is surfaced by the mutation hook
		}
	};

	// Drag and drop handlers
	const handleDragStart = (e: React.DragEvent, workflowId: string) => {
		setDraggedWorkflowId(workflowId);
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', workflowId);
	};

	const handleDragEnd = () => {
		setDraggedWorkflowId(null);
		setDragOverFolderId(null);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	};

	const handleDragEnter = (folderId: string) => {
		setDragOverFolderId(folderId);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		// Only clear if we're leaving the folder entirely, not entering a child element
		if (e.currentTarget === e.target) {
			setDragOverFolderId(null);
		}
	};

	const handleDropOnFolder = async (e: React.DragEvent, folderId: string) => {
		e.preventDefault();
		e.stopPropagation();

		const workflowId = e.dataTransfer.getData('text/plain');
		if (!workflowId || workflowId === '') return;

		const workflow = workflows.find((w) => w.id === workflowId);
		const targetFolderId = folderId === ROOT_FOLDER_ID ? null : folderId;
		if (!workflow || workflow.folderId === targetFolderId) return;

		setDragOverFolderId(null);
		await handleMoveWorkflow(workflow, targetFolderId);
	};

	const menuItemClass =
		'text-text-main flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold transition-colors hover:bg-slate-50 dark:hover:bg-white/5';

	const renderMoveWorkflowMenu = (workflow: IWorkflow) => {
		if (!workflow.folderId && folders.length === 0) return null;
		return (
			<div className='border-border-main my-1 max-h-44 overflow-y-auto border-y py-1'>
				<p className='text-text-muted px-3 py-1 text-[9px] font-black tracking-wider uppercase'>
					Move to folder
				</p>
				{workflow.folderId && (
					<button
						type='button'
						onClick={() => handleMoveWorkflow(workflow, null)}
						className={menuItemClass}>
						<Workflow size={12} className='text-primary-500' /> Root level
					</button>
				)}
				{folders
					.filter((folder) => folder.id !== workflow.folderId)
					.map((folder) => (
						<button
							key={folder.id}
							type='button'
							onClick={() => handleMoveWorkflow(workflow, folder.id)}
							className={menuItemClass}>
							<Folder
								size={12}
								style={{ color: folder.color }}
								className='shrink-0'
							/>{' '}
							<span className='truncate'>{folder.name}</span>
						</button>
					))}
			</div>
		);
	};

	const renderWorkflowMenu = (workflow: IWorkflow, portaled = false) => (
		<motion.div
			initial={{ opacity: 0, scale: 0.95, y: 5 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95, y: 5 }}
			onClick={(e) => e.stopPropagation()}
			className={`border-border-main bg-bg-card z-50 w-52 rounded-xl border p-1.5 text-left shadow-2xl ${
				portaled ? '' : 'absolute right-0 mt-2'
			}`}>
			<button
				type='button'
				onClick={() => {
					setActiveMenuId(null);
					navigate(paths.editPlaybook(currentWorkspaceId, workflow.id));
				}}
				className={menuItemClass}>
				<Edit3 size={12} className='text-primary-500' /> Open editor
			</button>
			<button
				type='button'
				onClick={(e) => {
					setActiveMenuId(null);
					handleRunNow(workflow.id, e);
				}}
				className={menuItemClass}>
				<Play size={12} className='fill-emerald-500/10 text-emerald-500' /> Run now
			</button>
			{(workflow.status !== 'active' || workflow.hasUnpublishedChanges) && (
				<button
					type='button'
					onClick={(e) => {
						setActiveMenuId(null);
						handlePublish(workflow.id, e);
					}}
					className={menuItemClass}>
					<Rocket size={12} className='text-violet-500' />{' '}
					{workflow.status === 'active' ? 'Publish changes' : 'Publish'}
				</button>
			)}
			<button
				type='button'
				onClick={(e) => {
					setActiveMenuId(null);
					handleToggleStar(workflow.id, e);
				}}
				className={menuItemClass}>
				<Star
					size={12}
					className={
						workflow.starred ? 'fill-amber-500 text-amber-500' : 'text-amber-500'
					}
				/>{' '}
				{workflow.starred ? 'Remove from starred' : 'Add to starred'}
			</button>
			<button
				type='button'
				onClick={() => {
					setRenameValue(workflow.title);
					setRenamingId(workflow.id);
					setActiveMenuId(null);
				}}
				className={menuItemClass}>
				<Edit3 size={12} className='text-slate-400' /> Rename
			</button>
			<button
				type='button'
				onClick={() => {
					setActiveMenuId(null);
					setTaggingWorkflowId(workflow.id);
				}}
				className={menuItemClass}>
				<Tag size={12} className='text-fuchsia-500' /> Manage tags
			</button>
			{renderMoveWorkflowMenu(workflow)}
			<button
				type='button'
				onClick={(e) => {
					setActiveMenuId(null);
					handleDuplicate(workflow, e);
				}}
				className={menuItemClass}>
				<Copy size={12} className='text-blue-500' /> Duplicate
			</button>
			<button
				type='button'
				onClick={(e) => {
					setActiveMenuId(null);
					handleDelete(workflow.id, e);
				}}
				className='flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10'>
				<Trash2 size={12} /> Delete
			</button>
		</motion.div>
	);

	// The list view lives inside a horizontally scrolling table, which would clip
	// an absolutely positioned menu — so rows anchor theirs to the viewport.
	const renderWorkflowMenuTrigger = (workflow: IWorkflow, anchored = false) => (
		<div className='relative'>
			<button
				type='button'
				aria-label={`Open actions for ${workflow.title}`}
				onClick={(e) => {
					e.stopPropagation();
					if (activeMenuId === workflow.id) {
						setActiveMenuId(null);
						setMenuAnchor(null);
						return;
					}
					if (anchored) {
						const rect = e.currentTarget.getBoundingClientRect();
						const flip = window.innerHeight - rect.bottom < 280;
						setMenuAnchor({
							top: flip ? rect.top - 6 : rect.bottom + 6,
							left: Math.min(rect.right, window.innerWidth - 12),
							flip,
						});
					} else {
						setMenuAnchor(null);
					}
					setActiveMenuId(workflow.id);
				}}
				className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white ${
					activeMenuId === workflow.id
						? 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white'
						: ''
				}`}>
				<MoreVertical size={16} />
			</button>
			{anchored ? (
				menuAnchor &&
				activeMenuId === workflow.id &&
				createPortal(
					<div
						className='fixed z-[120]'
						style={{
							top: menuAnchor.top,
							left: menuAnchor.left,
							transform: `translateX(-100%)${menuAnchor.flip ? ' translateY(-100%)' : ''}`,
						}}>
						<AnimatePresence>{renderWorkflowMenu(workflow, true)}</AnimatePresence>
					</div>,
					document.body,
				)
			) : (
				<AnimatePresence>
					{activeMenuId === workflow.id && renderWorkflowMenu(workflow)}
				</AnimatePresence>
			)}
		</div>
	);

	const renderTagChips = (workflow: IWorkflow) =>
		workflow.tags.map((tag) => (
			<TagChip
				key={tag.id}
				tag={tag}
				onClick={(e) => {
					e.stopPropagation();
					setTagFilter(String(tag.id));
				}}
			/>
		));

	const renderStarButton = (workflow: IWorkflow) => (
		<motion.button
			type='button'
			whileHover={{ scale: 1.15 }}
			whileTap={{ scale: 0.9 }}
			aria-label={`${workflow.starred ? 'Remove' : 'Add'} ${workflow.title} ${workflow.starred ? 'from' : 'to'} starred workflows`}
			onClick={(e) => handleToggleStar(workflow.id, e)}
			className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition-colors ${
				workflow.starred
					? 'shadow-3xs border-amber-500/10 bg-amber-500/5 text-amber-500'
					: 'border-transparent text-slate-300 hover:bg-slate-100/80 hover:text-slate-500 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-white'
			}`}>
			<Star size={15} className={workflow.starred ? 'fill-amber-500' : ''} />
		</motion.button>
	);

	const renderRenameInput = (workflow: IWorkflow) => (
		<div
			className='flex items-center gap-1.5'
			onClick={(e) => e.stopPropagation()}
			onKeyDown={(e) => e.stopPropagation()}>
			<input
				aria-label={`Rename ${workflow.title}`}
				ref={renameInputRef}
				value={renameValue}
				onChange={(e) => setRenameValue(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === 'Enter') handleRenameSubmit(workflow.id);
					if (e.key === 'Escape') setRenamingId(null);
				}}
				onBlur={() => handleRenameSubmit(workflow.id)}
				className='border-primary-500 h-8 w-full rounded-lg border bg-white px-2 text-xs font-semibold text-slate-900 transition outline-none dark:bg-zinc-950 dark:text-white'
			/>
			<button
				type='button'
				onClick={() => handleRenameSubmit(workflow.id)}
				className='h-8 shrink-0 rounded-lg bg-slate-900 px-3 text-[10px] font-black text-white dark:bg-zinc-200 dark:text-slate-950'>
				Save
			</button>
		</div>
	);

	const renderPublishControl = (workflow: IWorkflow) => {
		if (workflow.status === 'active' && !workflow.hasUnpublishedChanges) {
			return (
				<span className='flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400'>
					<CheckCircle2 size={11} /> Published
				</span>
			);
		}
		return (
			<button
				type='button'
				aria-label={`Publish ${workflow.title}`}
				onClick={(e) => handlePublish(workflow.id, e)}
				disabled={activateWorkflowMutation.isPending}
				className='border-primary-300/70 bg-primary-100/50 text-primary-800 hover:bg-primary-100 dark:border-primary-500/20 dark:bg-primary-950/40 dark:text-primary-300 flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black transition disabled:cursor-not-allowed disabled:opacity-60'>
				{workflow.hasUnpublishedChanges && workflow.status === 'active' ? (
					<>
						<AlertTriangle size={11} /> Publish changes
					</>
				) : (
					<>
						<Rocket size={11} /> Publish
					</>
				)}
			</button>
		);
	};

	const handleRenameSubmit = async (id: string) => {
		const value = renameValue.trim();
		setRenamingId(null);
		if (!value) return;
		const wf = workflows.find((w) => w.id === id);
		if (wf && wf.title === value) return;
		try {
			await updateWorkflowMutation.mutateAsync({ id, body: { name: value } });
			triggerToast('Workflow renamed successfully!');
		} catch {
			// Error is surfaced by the mutation hook
		}
	};

	// Looked up live so the modal's chips follow the list refetch after each sync.
	const taggingWorkflow = workflows.find((w) => w.id === taggingWorkflowId);

	const modals = (
		<AnimatePresence>
			{isCreateFolderOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className='fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 font-sans backdrop-blur-md'
					onClick={() => setIsCreateFolderOpen(false)}>
					<motion.div
						initial={{ scale: 0.95, y: 15 }}
						animate={{ scale: 1, y: 0 }}
						exit={{ scale: 0.95, y: 15 }}
						transition={{ duration: 0.2 }}
						className='relative max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-y-auto rounded-3xl border border-slate-200/50 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/95'
						onClick={(e) => e.stopPropagation()}>
						<button
							aria-label='Close create folder dialog'
							onClick={() => setIsCreateFolderOpen(false)}
							className='hover:text-slate-655 dark:text-zinc-550 absolute top-4.5 right-4.5 text-slate-400 transition dark:hover:text-zinc-300'>
							<X size={18} />
						</button>
						<h3 className='mb-5 flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white'>
							<FolderPlus className='text-primary-600 h-5 w-5' /> Create Folder
						</h3>
						<form onSubmit={handleCreateFolder} className='space-y-4'>
							<div>
								<label
									htmlFor='new-folder-name'
									className='mb-1.5 block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
									Folder Name
								</label>
								<input
									id='new-folder-name'
									aria-label='Folder name'
									type='text'
									required
									placeholder='e.g. Lead Processing'
									value={newFolderName}
									onChange={(e) => setNewFolderName(e.target.value)}
									className='border-slate-205 bg-slate-55/50 focus:border-primary-500 focus:ring-primary-500/10 h-10 w-full rounded-xl border px-3.5 text-xs font-semibold text-slate-900 transition outline-none focus:bg-white focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white dark:focus:bg-zinc-900'
								/>
							</div>
							<div>
								<p className='mb-2.5 block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
									Select Theme Color
								</p>
								<div className='flex items-center gap-2.5'>
									{FOLDER_COLOR_OPTIONS.map((color) => (
										<button
											aria-label={`Use ${color.label} folder color`}
											key={color.value}
											type='button'
											title={color.label}
											onClick={() => setNewFolderColor(color.value)}
											style={{ backgroundColor: color.value }}
											className={`h-7.5 w-7.5 cursor-pointer rounded-full border transition ${newFolderColor === color.value ? 'ring-primary-500 scale-110 border-slate-800 ring-2 dark:border-white' : 'border-slate-200/50 hover:scale-105'}`}
										/>
									))}
								</div>
							</div>
							<div className='flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end'>
								<button
									type='button'
									onClick={() => setIsCreateFolderOpen(false)}
									className='h-9.5 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'>
									Cancel
								</button>
								<button
									type='submit'
									className='from-primary-400 to-primary-400 text-primary-950 shadow-primary-500/10 h-9.5 cursor-pointer rounded-xl bg-gradient-to-r px-5 text-xs font-bold shadow-sm transition-all hover:brightness-110'>
									Create Folder
								</button>
							</div>
						</form>
					</motion.div>
				</motion.div>
			)}

			{editingFolder && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className='fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 font-sans backdrop-blur-md'
					onClick={() => setEditingFolder(null)}>
					<motion.div
						initial={{ scale: 0.95, y: 15 }}
						animate={{ scale: 1, y: 0 }}
						exit={{ scale: 0.95, y: 15 }}
						transition={{ duration: 0.2 }}
						className='relative max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-y-auto rounded-3xl border border-slate-200/50 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/95'
						onClick={(e) => e.stopPropagation()}>
						<button
							aria-label='Close edit folder dialog'
							onClick={() => setEditingFolder(null)}
							className='hover:text-slate-655 dark:text-zinc-550 absolute top-4.5 right-4.5 text-slate-400 transition dark:hover:text-zinc-300'>
							<X size={18} />
						</button>
						<h3 className='mb-5 flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white'>
							<Edit3 className='text-primary-600 h-5 w-5' /> Edit Folder
						</h3>
						<form onSubmit={handleUpdateFolder} className='space-y-4'>
							<div>
								<label
									htmlFor='edit-folder-name'
									className='mb-1.5 block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
									Folder Name
								</label>
								<input
									id='edit-folder-name'
									aria-label='Edit folder name'
									type='text'
									required
									value={editFolderName}
									onChange={(e) => setEditFolderName(e.target.value)}
									className='border-slate-205 bg-slate-55/50 focus:border-primary-500 focus:ring-primary-500/10 h-10 w-full rounded-xl border px-3.5 text-xs font-semibold text-slate-900 transition outline-none focus:bg-white focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white dark:focus:bg-zinc-900'
								/>
							</div>
							<div>
								<p className='mb-2.5 block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
									Select Theme Color
								</p>
								<div className='flex items-center gap-2.5'>
									{FOLDER_COLOR_OPTIONS.map((color) => (
										<button
											aria-label={`Use ${color.label} folder color`}
											key={color.value}
											type='button'
											title={color.label}
											onClick={() => setEditFolderColor(color.value)}
											style={{ backgroundColor: color.value }}
											className={`h-7.5 w-7.5 cursor-pointer rounded-full border transition ${editFolderColor === color.value ? 'ring-primary-500 scale-110 border-slate-800 ring-2 dark:border-white' : 'border-slate-200/50 hover:scale-105'}`}
										/>
									))}
								</div>
							</div>
							<div className='flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end'>
								<button
									type='button'
									onClick={() => setEditingFolder(null)}
									className='h-9.5 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'>
									Cancel
								</button>
								<button
									type='submit'
									className='from-primary-400 to-primary-400 text-primary-950 shadow-primary-500/10 h-9.5 cursor-pointer rounded-xl bg-gradient-to-r px-5 text-xs font-bold shadow-sm transition-all hover:brightness-110'>
									Save Changes
								</button>
							</div>
						</form>
					</motion.div>
				</motion.div>
			)}

			{taggingWorkflow && (
				<WorkflowTagsModal
					ws={currentWorkspaceId}
					workflowId={taggingWorkflow.id}
					workflowTitle={taggingWorkflow.title}
					attached={taggingWorkflow.tags}
					onClose={() => setTaggingWorkflowId(null)}
				/>
			)}
		</AnimatePresence>
	);

	// ─── Empty state ────────────────────────────────────────────────────────────
	if (workflows.length === 0 && folders.length === 0) {
		return (
			<Container className='relative flex min-h-screen items-center justify-center overflow-x-hidden overflow-y-auto bg-[#fafbfe] !p-0 dark:bg-[#07090e]'>
				<div className='pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:4rem_4rem] opacity-50 dark:bg-[linear-gradient(to_right,#161b26_1px,transparent_1px),linear-gradient(to_bottom,#161b26_1px,transparent_1px)] dark:opacity-80' />
				<div className='z-10 mx-auto flex w-full max-w-xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6'>
					<div className='border-primary-500/20 bg-primary-400/5 text-primary-600 shadow-primary-500/5 dark:bg-primary-400/10 dark:text-primary-400 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-md'>
						<GitMerge size={24} className='rotate-90' />
					</div>
					<h1 className='mt-5 text-2xl font-black tracking-tight text-slate-900 dark:text-white'>
						Create your first workflow
					</h1>
					<p className='mt-2 max-w-md text-sm leading-relaxed font-semibold text-slate-500 dark:text-zinc-400'>
						Build an automation, connect the steps, and run it when you are ready.
					</p>
					<div className='mt-6 flex w-full flex-col items-center gap-2.5 sm:w-auto sm:flex-row'>
						<button
							type='button'
							onClick={() => handleQuickCreateWorkflow()}
							disabled={!hasWorkspace || createWorkflowMutation.isPending}
							className='from-primary-400 to-primary-400 text-primary-950 shadow-primary-500/15 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-5 text-xs font-black shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto'>
							<Plus size={15} strokeWidth={3} />
							Create Workflow
						</button>
						<button
							type='button'
							onClick={() => setIsCreateFolderOpen(true)}
							disabled={!hasWorkspace}
							className='dark:border-border-main dark:bg-bg-card flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:text-white dark:hover:bg-zinc-950/20'>
							<FolderPlus size={15} />
							New Folder
						</button>
					</div>
				</div>
				{modals}
			</Container>
		);
	}

	return (
		<Container className='relative min-h-screen overflow-x-hidden overflow-y-auto bg-[#f8f9fc] !p-0 dark:bg-zinc-950'>
			{/* Toast */}
			<AnimatePresence>
				{toast && (
					<motion.div
						initial={{ opacity: 0, y: -20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -20, scale: 0.95 }}
						className='border-primary-500/20 dark:border-primary-500/15 fixed inset-x-4 top-4 z-[110] flex items-center gap-3 rounded-2xl border bg-white/95 px-4.5 py-3 shadow-2xl backdrop-blur-md sm:inset-x-auto sm:top-6 sm:right-6 sm:max-w-sm dark:bg-zinc-900/95'>
						{toast.type === 'success' ? (
							<div className='flex h-6.5 w-6.5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
								<Check size={14} className='stroke-[3]' />
							</div>
						) : (
							<div className='flex h-6.5 w-6.5 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400'>
								<Workflow size={14} className='stroke-[3]' />
							</div>
						)}
						<span className='text-xs font-bold text-slate-800 dark:text-zinc-200'>
							{toast.message}
						</span>
					</motion.div>
				)}
			</AnimatePresence>

			<div className='relative z-10 mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 md:p-8'>
				{/* Header */}
				<header className='border-border-main bg-bg-card dark:border-border-main dark:bg-bg-card relative mt-4 flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border p-6 shadow-sm transition-all duration-300 sm:mt-0 lg:flex-row lg:items-center'>
					{/* Banner background glow effect */}
					<div className='bg-primary-400/5 absolute -top-24 -right-24 h-48 w-48 rounded-full blur-3xl' />
					<div className='bg-primary-400/5 absolute -bottom-24 -left-24 h-48 w-48 rounded-full blur-3xl' />

					<div className='relative z-10 flex min-w-0 items-center gap-4.5'>
						<div className='group relative shrink-0'>
							{/* Soft glowing ring */}
							<div className='bg-primary-400/10 absolute -inset-0.5 rounded-full opacity-85 blur transition duration-300 group-hover:opacity-100' />
							{/* Circular initials avatar */}
							<div className='bg-primary-100/60 text-primary-900 dark:bg-primary-950/60 relative flex h-14 w-14 items-center justify-center rounded-full text-base font-black shadow-sm dark:text-white'>
								{getInitials(workspaceName)}
							</div>
							{/* Yellow status indicator dot */}
							<span className='border-bg-card absolute -right-0.5 -bottom-0.5 flex h-4.5 w-4.5 rounded-full border-[3px] bg-[#CFF54A] shadow-xs' />
						</div>
						<div className='min-w-0'>
							<div className='flex flex-wrap items-center gap-2.5'>
								<h1 className='truncate text-2xl font-black tracking-tight text-slate-900 dark:text-white'>
									Workflows
								</h1>
								{workspaceRole && (
									<span className='bg-primary-100/70 text-primary-900 dark:bg-primary-950/40 dark:text-primary-300 rounded-md px-2 py-0.5 text-[9px] font-black tracking-wide uppercase'>
										{workspaceRole}
									</span>
								)}
							</div>
							<p className='mt-1 max-w-xl text-xs leading-relaxed font-semibold text-slate-500 dark:text-zinc-400'>
								{workspaceSlug ? `@${workspaceSlug} • ` : ''}Manage workspace
								workflows, logic rules, automation triggers, and organize them into
								folders.
							</p>
						</div>
					</div>

					<div className='relative z-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
						<motion.button
							type='button'
							whileHover={{ scale: 1.02, y: -1 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => setIsCreateFolderOpen(true)}
							disabled={!hasWorkspace}
							className='dark:border-border-main dark:bg-bg-card flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white dark:hover:bg-zinc-950/20'>
							<Folder size={14} className='text-primary-450 dark:text-[#CFF54A]' />
							New Folder
						</motion.button>
						<motion.button
							type='button'
							whileHover={{ scale: 1.02, y: -1 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => handleQuickCreateWorkflow()}
							disabled={!hasWorkspace || createWorkflowMutation.isPending}
							className='shadow-primary-500/10 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#CFF54A] px-4.5 text-xs font-black text-black shadow-md transition-all hover:bg-[#B7E52F] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#CFF54A] dark:text-black dark:hover:bg-[#B7E52F]'>
							<Plus size={15} strokeWidth={2.5} />
							New Workflow
						</motion.button>
					</div>
				</header>

				{/* Summary Stats */}
				<section className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
					{[
						{
							label: 'Workflows',
							value: workflows.length,
							desc: 'Total integrations',
							icon: Workflow,
						},
						{
							label: 'Active',
							value: activeWorkflowCount,
							desc: 'Running processes',
							icon: Play,
						},
						{
							label: 'Folders',
							value: folders.length,
							desc: 'Organized groups',
							icon: Folder,
						},
						{
							label: 'Favorites',
							value: favoriteWorkflowCount,
							desc: 'Starred items',
							icon: Star,
						},
					].map((stat) => {
						const IconComponent = stat.icon;
						return (
							<motion.div
								key={stat.label}
								whileHover={{ y: -4, scale: 1.01 }}
								transition={{ type: 'spring', stiffness: 400, damping: 25 }}
								className='border-border-main bg-bg-card dark:border-border-main dark:bg-bg-card group hover:border-primary-300/60 relative flex items-center justify-between overflow-hidden rounded-2xl border p-5 shadow-xs transition-all duration-300 hover:shadow-sm'>
								<div>
									<div className='text-[10px] font-black tracking-wider text-slate-800 uppercase dark:text-white'>
										{stat.label}
									</div>
									<div className='text-3.5xl mt-1 font-black tracking-tight text-slate-900 dark:text-white'>
										{stat.value}
									</div>
									<div className='mt-0.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-400'>
										{stat.desc}
									</div>
								</div>
								<div className='bg-primary-100/50 text-primary-800 dark:bg-primary-950/40 dark:text-primary-400 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105'>
									<IconComponent size={20} />
								</div>
							</motion.div>
						);
					})}
				</section>

				{/* Controls */}
				<section className='flex flex-col gap-4 pt-2 lg:flex-row lg:items-center lg:justify-between'>
					<div className='flex flex-wrap items-center gap-6 border-b border-slate-200/40 pb-0.5 dark:border-zinc-800/40'>
						{LIST_TABS.map((tab) => (
							<button
								key={tab.id}
								type='button'
								onClick={() => setActiveTab(tab.id)}
								className={`relative cursor-pointer pb-3 text-sm font-bold transition-colors duration-300 ${
									activeTab === tab.id
										? 'text-slate-900 dark:text-white'
										: 'text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300'
								}`}>
								{tab.label}
								{activeTab === tab.id && (
									<motion.div
										layoutId='activeTabUnderline'
										className='absolute right-0 bottom-0 left-0 h-[3px] rounded-full bg-[#CFF54A]'
										transition={{ type: 'spring', stiffness: 380, damping: 30 }}
									/>
								)}
							</button>
						))}
					</div>

					<div className='border-border-main bg-bg-card dark:bg-bg-card grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-2xl border p-2.5 shadow-sm sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:dark:bg-transparent'>
						{/* Search box */}
						<div className='group relative col-span-2 w-full sm:w-80'>
							<Search className='group-focus-within:text-primary-500 absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors dark:text-zinc-500' />
							<input
								aria-label='Search workspace workflows'
								value={searchQuery}
								onChange={(event) => setSearchQuery(event.target.value)}
								placeholder='Search workflows by title or description...'
								className='dark:placeholder-zinc-450 border-border-main sm:bg-bg-card dark:border-border-main sm:dark:bg-bg-card h-11 w-full rounded-xl border bg-slate-50/70 pr-9 pl-10 text-xs font-semibold text-slate-900 placeholder-slate-400 transition-all outline-none focus:border-[#CFF54A] focus:bg-white focus:ring-[3px] focus:ring-[rgba(207,245,74,0.14)] sm:h-10 sm:shadow-2xs dark:bg-zinc-950/50 dark:text-white'
							/>
							{searchQuery && (
								<button
									type='button'
									aria-label='Clear search'
									onClick={() => setSearchQuery('')}
									className='absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300'>
									<X size={14} />
								</button>
							)}
						</div>

						{/* Sort selector */}
						<div className='relative min-w-0'>
							<ArrowUpDown className='pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-zinc-500' />
							<select
								aria-label='Sort workflows'
								value={sortBy}
								onChange={(event) => setSortBy(event.target.value as TSortOption)}
								className='border-border-main sm:bg-bg-card dark:border-border-main sm:dark:bg-bg-card h-10 w-full cursor-pointer appearance-none truncate rounded-xl border bg-slate-50/70 pr-8 pl-9 text-xs font-bold text-slate-700 transition outline-none focus:border-[#CFF54A] sm:shadow-2xs dark:bg-zinc-950/50 dark:text-white'>
								{SORT_OPTIONS.map((option) => (
									<option key={option.id} value={option.id}>
										{option.label}
									</option>
								))}
							</select>
							<ChevronDown className='pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-zinc-500' />
						</div>

						{/* Grid / List toggle selector */}
						<div className='border-border-main dark:border-border-main flex h-10 items-center gap-1 rounded-xl border bg-slate-50/70 p-1 sm:h-auto sm:gap-1.5 sm:border-0 sm:bg-transparent sm:p-0 dark:bg-zinc-950/50 sm:dark:bg-transparent'>
							<button
								type='button'
								aria-label='Grid view'
								onClick={() => setIsGridView(true)}
								className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-transparent transition-all duration-300 sm:h-10 sm:w-10 sm:rounded-xl ${
									isGridView
										? 'bg-primary-400 text-primary-950 sm:border-primary-400 sm:bg-primary-100/10 dark:bg-primary-400 dark:text-primary-950 sm:dark:border-primary-400 sm:dark:bg-primary-950/20 shadow-sm sm:text-slate-900 sm:dark:text-white'
										: 'sm:border-border-main sm:bg-bg-card sm:dark:border-border-main sm:dark:bg-bg-card text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-white'
								}`}>
								<LayoutGrid size={16} />
							</button>
							<button
								type='button'
								aria-label='List view'
								onClick={() => setIsGridView(false)}
								className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-transparent transition-all duration-300 sm:h-10 sm:w-10 sm:rounded-xl ${
									!isGridView
										? 'bg-primary-400 text-primary-950 sm:border-primary-400 sm:bg-primary-100/10 dark:bg-primary-400 dark:text-primary-950 sm:dark:border-primary-400 sm:dark:bg-primary-950/20 shadow-sm sm:text-slate-900 sm:dark:text-white'
										: 'sm:border-border-main sm:bg-bg-card sm:dark:border-border-main sm:dark:bg-bg-card text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-white'
								}`}>
								<List size={16} />
							</button>
						</div>

						{/* Tag filter — only once the workspace has tags */}
						{(workspaceTags ?? []).length > 0 && (
							<div className='relative col-span-2 min-w-0 sm:col-auto'>
								<Tag className='pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-zinc-500' />
								<select
									aria-label='Filter workflows by tag'
									value={tagFilter}
									onChange={(event) => setTagFilter(event.target.value)}
									className='border-border-main sm:bg-bg-card dark:border-border-main sm:dark:bg-bg-card h-10 w-full cursor-pointer appearance-none truncate rounded-xl border bg-slate-50/70 pr-8 pl-9 text-xs font-bold text-slate-700 transition outline-none focus:border-[#CFF54A] sm:shadow-2xs dark:bg-zinc-950/50 dark:text-white'>
									<option value=''>All tags</option>
									{(workspaceTags ?? []).map((tag) => (
										<option key={tag.id} value={String(tag.id)}>
											{tag.name}
										</option>
									))}
								</select>
								<ChevronDown className='pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-zinc-500' />
							</div>
						)}
					</div>
				</section>

				{matchCount === 0 && (
					<div className='border-border-main bg-bg-card dark:border-border-main dark:bg-bg-card flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center'>
						<div className='bg-primary-100/50 text-primary-800 dark:bg-primary-950/40 dark:text-primary-400 flex h-11 w-11 items-center justify-center rounded-xl'>
							<Search size={18} />
						</div>
						<p className='text-sm font-black text-slate-800 dark:text-white'>
							No workflows match these filters
						</p>
						<p className='max-w-sm text-xs font-semibold text-slate-500 dark:text-zinc-400'>
							{searchQuery
								? `Nothing found for "${searchQuery}".`
								: tagFilter
									? 'No workflow in this tab has that tag.'
									: 'Try a different tab to see more workflows.'}
						</p>
						<div className='flex flex-wrap items-center justify-center gap-2 pt-1'>
							{searchQuery && (
								<button
									type='button'
									onClick={() => setSearchQuery('')}
									className='dark:border-border-main dark:bg-bg-card flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:text-white dark:hover:bg-zinc-950/20'>
									<X size={13} /> Clear search
								</button>
							)}
							{tagFilter && (
								<button
									type='button'
									onClick={() => setTagFilter('')}
									className='dark:border-border-main dark:bg-bg-card flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:text-white dark:hover:bg-zinc-950/20'>
									<Tag size={13} /> Clear tag filter
								</button>
							)}
							{activeTab !== 'all' && (
								<button
									type='button'
									onClick={() => setActiveTab('all')}
									className='dark:border-border-main dark:bg-bg-card flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:text-white dark:hover:bg-zinc-950/20'>
									<Workflow size={13} /> Show all workflows
								</button>
							)}
						</div>
					</div>
				)}

				{/* Workflow groups */}
				<div className='space-y-6'>
					{workflowGroups.map((folder) => {
						const groupedItems = folderGrouped[folder.id] || [];
						const isRootGroup = folder.id === ROOT_FOLDER_ID;
						const isExpanded = isRootGroup || !!expandedFolders[folder.id];
						return (
							<div key={folder.id} className='space-y-3.5'>
								{isRootGroup ? (
									<div
										onDragOver={handleDragOver}
										onDragEnter={() => handleDragEnter(ROOT_FOLDER_ID)}
										onDragLeave={handleDragLeave}
										onDrop={(e) => handleDropOnFolder(e, ROOT_FOLDER_ID)}
										className={`relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border px-3.5 py-3 shadow-sm transition-all duration-300 sm:px-5 sm:py-4 ${
											dragOverFolderId === ROOT_FOLDER_ID
												? 'border-primary-400 bg-soft-accent-bg dark:border-primary-400 dark:bg-primary-400/10'
												: 'border-border-main bg-bg-card dark:border-border-main dark:bg-bg-card'
										}`}>
										<div className='bg-primary-400 absolute top-0 bottom-0 left-0 w-1 sm:hidden' />
										<div className='flex min-w-0 items-center gap-2.5 sm:gap-3'>
											<div className='text-primary-800 bg-primary-100/50 dark:bg-primary-950/40 dark:text-primary-400 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs sm:h-10 sm:w-10'>
												<Workflow size={17} />
											</div>
											<div className='min-w-0'>
												<h2 className='text-xs font-extrabold text-slate-800 dark:text-white'>
													<span className='sm:hidden'>
														Unfiled workflows
													</span>
													<span className='hidden sm:inline'>
														Workflows without folders
													</span>
												</h2>
												<p className='mt-0.5 hidden text-[10px] font-semibold text-slate-400 sm:block dark:text-zinc-400'>
													Move these into folders when you need more
													organization.
												</p>
											</div>
										</div>
										<span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#CFF54A] text-[10px] font-black text-black shadow-xs dark:bg-[#CFF54A] dark:text-black'>
											{groupedItems.length}
										</span>
									</div>
								) : (
									<div
										onDragOver={handleDragOver}
										onDragEnter={() => handleDragEnter(folder.id)}
										onDragLeave={handleDragLeave}
										onDrop={(e) => handleDropOnFolder(e, folder.id)}
										className={`group/folder relative flex items-center overflow-hidden rounded-2xl border shadow-xs transition-all duration-300 ${
											dragOverFolderId === folder.id
												? 'border-primary-400 bg-soft-accent-bg dark:bg-primary-400/10 dark:border-primary-400'
												: 'border-border-main bg-bg-card hover:border-primary-200 dark:border-border-main dark:bg-bg-card'
										}`}>
										<div
											className='absolute top-0 bottom-0 left-0 w-1'
											style={{ backgroundColor: folder.color }}
										/>

										<button
											aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${folder.name}`}
											onClick={() =>
												setExpandedFolders((prev) => ({
													...prev,
													[folder.id]: !isExpanded,
												}))
											}
											className='group/btn flex min-w-0 flex-1 cursor-pointer items-center justify-between py-4 pr-3.5 pl-6 text-left'>
											<div className='flex min-w-0 items-center gap-3.5'>
												<span className='text-slate-400 transition-transform duration-300 group-hover/btn:translate-x-0.5 dark:text-zinc-400'>
													{isExpanded ? (
														<ChevronDown
															size={14}
															className='rotate-0 transition-transform duration-300'
														/>
													) : (
														<ChevronRight
															size={14}
															className='rotate-0 transition-transform duration-300'
														/>
													)}
												</span>
												<div
													className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs'
													style={{
														backgroundColor: `${folder.color}1a`,
														color: folder.color,
													}}>
													{isExpanded ? (
														<FolderOpen size={16} />
													) : (
														<Folder size={16} />
													)}
												</div>
												<span className='truncate text-xs font-bold tracking-wide text-slate-800 dark:text-white'>
													{folder.name}
												</span>
											</div>
											<span className='shadow-3xs flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 dark:bg-zinc-950/40 dark:text-zinc-400'>
												{groupedItems.length}
											</span>
										</button>
										<div className='relative mr-4 shrink-0'>
											<button
												type='button'
												aria-label={`Open actions for ${folder.name}`}
												onClick={(e) => {
													e.stopPropagation();
													setActiveFolderMenuId(
														activeFolderMenuId === folder.id
															? null
															: folder.id,
													);
												}}
												className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white ${
													activeFolderMenuId === folder.id
														? 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white'
														: ''
												}`}>
												<MoreVertical size={14} />
											</button>
											<AnimatePresence>
												{activeFolderMenuId === folder.id && (
													<motion.div
														initial={{ opacity: 0, scale: 0.95, y: 5 }}
														animate={{ opacity: 1, scale: 1, y: 0 }}
														exit={{ opacity: 0, scale: 0.95, y: 5 }}
														onClick={(e) => e.stopPropagation()}
														className='border-border-main bg-bg-card absolute right-0 z-50 mt-2 w-52 rounded-xl border p-1.5 text-left shadow-2xl'>
														<button
															type='button'
															onClick={() => {
																setActiveFolderMenuId(null);
																handleQuickCreateWorkflow(
																	folder.id,
																);
															}}
															className={menuItemClass}>
															<Plus
																size={12}
																className='text-primary-500'
															/>{' '}
															New workflow here
														</button>
														<button
															type='button'
															onClick={() => {
																setActiveFolderMenuId(null);
																openEditFolder(folder);
															}}
															className={menuItemClass}>
															<Edit3
																size={12}
																className='text-slate-400'
															/>{' '}
															Rename / recolor
														</button>
														<button
															type='button'
															onClick={() =>
																setExpandedFolders((prev) => ({
																	...prev,
																	[folder.id]: !isExpanded,
																}))
															}
															className={menuItemClass}>
															{isExpanded ? (
																<ChevronRight
																	size={12}
																	className='text-slate-400'
																/>
															) : (
																<ChevronDown
																	size={12}
																	className='text-slate-400'
																/>
															)}
															{isExpanded ? 'Collapse' : 'Expand'}
														</button>
														<button
															type='button'
															onClick={() =>
																handleDeleteFolder(folder)
															}
															className='flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10'>
															<Trash2 size={12} /> Delete folder
														</button>
													</motion.div>
												)}
											</AnimatePresence>
										</div>
									</div>
								)}

								<AnimatePresence initial={false}>
									{isExpanded && (
										<motion.div
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											transition={{ duration: 0.2, ease: 'easeInOut' }}
											className='overflow-visible'>
											{groupedItems.length === 0 ? (
												<div className='border-border-main bg-bg-card text-text-muted dark:border-border-main dark:bg-bg-card rounded-2xl border border-dashed p-8 text-center text-sm font-semibold'>
													No workflows in this folder matching your
													current filters.
												</div>
											) : isGridView ? (
												<div className='grid grid-cols-1 gap-4 pt-1 pb-4 sm:grid-cols-2 xl:grid-cols-3'>
													{groupedItems.map((wf) => (
														<div
															key={wf.id}
															role='link'
															tabIndex={0}
															draggable={renamingId !== wf.id}
															onDragStart={(e) =>
																handleDragStart(e, wf.id)
															}
															onDragEnd={handleDragEnd}
															onClick={() =>
																navigate(
																	paths.editPlaybook(
																		currentWorkspaceId,
																		wf.id,
																	),
																)
															}
															onKeyDown={(e) => {
																if (e.key === 'Enter') {
																	navigate(
																		paths.editPlaybook(
																			currentWorkspaceId,
																			wf.id,
																		),
																	);
																}
															}}
															className={`group border-border-main bg-bg-card hover:border-primary-300/85 dark:border-border-main dark:bg-bg-card relative flex min-h-[220px] cursor-pointer flex-col justify-between rounded-2xl border p-5.5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
																draggedWorkflowId === wf.id
																	? 'opacity-50'
																	: ''
															}`}>
															<div className='bg-primary-400 absolute right-0 bottom-0 left-0 h-1.5 rounded-b-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-10' />

															<div className='flex flex-col gap-3.5'>
																<div className='flex items-start justify-between gap-4'>
																	<div className='flex min-w-0 items-center gap-3.5'>
																		<div className='bg-primary-100/50 text-primary-800 dark:bg-primary-950/40 dark:text-primary-400 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs transition-all duration-300 group-hover:scale-105'>
																			<Workflow size={18} />
																		</div>
																		<div className='min-w-0'>
																			<div className='flex flex-wrap items-center gap-2'>
																				{renamingId ===
																				wf.id ? (
																					renderRenameInput(
																						wf,
																					)
																				) : (
																					<h3 className='group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate text-sm font-black tracking-wide text-slate-900 transition-colors duration-200 dark:text-white'>
																						{wf.title}
																					</h3>
																				)}
																				<span
																					className={`shadow-3xs flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black tracking-wider capitalize ${
																						wf.status ===
																						'active'
																							? 'border-primary-200 bg-primary-100/50 text-primary-800 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300'
																							: 'dark:bg-border-main border-slate-200 bg-slate-100 text-slate-500 dark:border-transparent dark:text-zinc-300'
																					}`}>
																					{wf.status ===
																						'active' && (
																						<span className='relative flex h-1.5 w-1.5'>
																							<span className='bg-primary-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75'></span>
																							<span className='bg-primary-500 relative inline-flex h-1.5 w-1.5 rounded-full'></span>
																						</span>
																					)}
																					{wf.status ===
																					'active'
																						? 'published'
																						: 'draft'}
																				</span>
																				{wf.hasUnpublishedChanges && (
																					<span className='shadow-3xs flex shrink-0 items-center gap-1 rounded-full border border-amber-300/60 bg-amber-50 px-2 py-0.5 text-[9px] font-black tracking-wider text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400'>
																						<AlertTriangle
																							size={9}
																						/>{' '}
																						Unpublished
																					</span>
																				)}
																			</div>
																			<p className='mt-1 line-clamp-1 text-[10px] font-bold text-slate-400 dark:text-zinc-400'>
																				{wf.folderId
																					? (folders.find(
																							(f) =>
																								f.id ===
																								wf.folderId,
																						)?.name ??
																						'Workspace workflow')
																					: 'Root level workflow'}
																			</p>
																		</div>
																	</div>

																	<div
																		className='relative z-25 flex shrink-0 items-center gap-1'
																		onClick={(e) =>
																			e.stopPropagation()
																		}>
																		{renderStarButton(wf)}
																		{renderWorkflowMenuTrigger(
																			wf,
																		)}
																	</div>
																</div>

																<div className='flex flex-col gap-2 pl-0.5'>
																	<p className='line-clamp-2 min-h-[32px] text-xs leading-relaxed font-semibold text-slate-500 dark:text-zinc-400'>
																		{wf.description}
																	</p>

																	<div className='mt-1 flex flex-wrap gap-1.5'>
																		{wf.apps.length > 0 ? (
																			wf.apps.map((app) => (
																				<AppBadge
																					key={app}
																					name={app}
																				/>
																			))
																		) : (
																			<span className='bg-primary-100/50 text-primary-800 dark:bg-primary-950/40 dark:text-primary-400 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold'>
																				<span className='h-1 w-1 rounded-full bg-[#CFF54A]' />
																				Empty Workflow
																			</span>
																		)}
																	</div>
																	{wf.tags.length > 0 && (
																		<div className='flex flex-wrap gap-1.5'>
																			{renderTagChips(wf)}
																		</div>
																	)}
																</div>
															</div>

															<div className='border-border-main dark:border-border-main mt-5 flex items-center justify-between gap-3 border-t pt-4'>
																<div className='flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400 dark:text-zinc-400'>
																	<div className='flex items-center gap-1.5 truncate'>
																		<Calendar
																			size={12}
																			className='text-slate-400/80 dark:text-zinc-400'
																		/>
																		<span>
																			Updated {wf.lastEdited}
																		</span>
																	</div>
																	<div className='flex items-center gap-1.5 truncate'>
																		<Clock
																			size={12}
																			className='text-slate-400/80 dark:text-zinc-400'
																		/>
																		<span>
																			Run {wf.lastRun}
																		</span>
																	</div>
																</div>
																<div
																	className='flex shrink-0 items-center gap-2'
																	onClick={(e) =>
																		e.stopPropagation()
																	}>
																	<span className='bg-primary-100/50 text-primary-800 dark:bg-primary-950/40 dark:text-primary-400 flex items-center gap-1.5 rounded-full px-2.5 py-0.75 text-[10px] font-black'>
																		<GitMerge
																			size={11}
																			className='text-primary-800 dark:text-primary-400 rotate-90'
																		/>
																		<span>
																			{wf.nodesCount}{' '}
																			{wf.nodesCount === 1
																				? 'node'
																				: 'nodes'}
																		</span>
																	</span>
																	{renderPublishControl(wf)}
																</div>
															</div>
														</div>
													))}
												</div>
											) : (
												<div className='overflow-x-auto rounded-2xl border border-slate-200/60 bg-white/80 shadow-2xs backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/40'>
													<table className='w-full min-w-[640px] border-collapse text-left text-xs'>
														<thead>
															<tr className='border-b border-slate-200/60 bg-slate-50/50 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:border-zinc-800/40 dark:bg-zinc-900/20 dark:text-zinc-500'>
																<th className='w-10 px-3 py-4' />
																<th className='px-4 py-4'>
																	Workflow Name
																</th>
																<th className='hidden px-4 py-4 xl:table-cell'>
																	Integrations
																</th>
																<th className='hidden px-4 py-4 lg:table-cell'>
																	Nodes
																</th>
																<th className='hidden px-4 py-4 lg:table-cell'>
																	Updated
																</th>
																<th className='hidden px-4 py-4 xl:table-cell'>
																	Last Run
																</th>
																<th className='px-4 py-4'>
																	Status
																</th>
																<th className='px-4 py-4 text-right'>
																	Actions
																</th>
															</tr>
														</thead>
														<tbody className='divide-y divide-slate-100 dark:divide-zinc-800/40'>
															{groupedItems.map((wf) => (
																<tr
																	key={wf.id}
																	draggable={renamingId !== wf.id}
																	onDragStart={(e) =>
																		handleDragStart(e, wf.id)
																	}
																	onDragEnd={handleDragEnd}
																	onClick={() =>
																		navigate(
																			paths.editPlaybook(
																				currentWorkspaceId,
																				wf.id,
																			),
																		)
																	}
																	className={`cursor-pointer transition-colors duration-200 hover:bg-slate-50/50 dark:hover:bg-zinc-900/20 ${
																		draggedWorkflowId === wf.id
																			? 'opacity-50'
																			: ''
																	}`}>
																	<td
																		className='px-3 py-4'
																		onClick={(e) =>
																			e.stopPropagation()
																		}>
																		{renderStarButton(wf)}
																	</td>
																	<td className='max-w-[260px] px-4 py-4 font-extrabold text-slate-800 dark:text-zinc-200'>
																		{renamingId === wf.id ? (
																			renderRenameInput(wf)
																		) : (
																			<div className='flex min-w-0 flex-col'>
																				<span className='truncate'>
																					{wf.title}
																				</span>
																				<span className='mt-0.5 truncate text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
																					{wf.description}
																				</span>
																				{wf.tags.length > 0 && (
																					<div className='mt-1.5 flex flex-wrap gap-1'>
																						{renderTagChips(wf)}
																					</div>
																				)}
																			</div>
																		)}
																	</td>
																	<td className='hidden px-4 py-4 xl:table-cell'>
																		<div className='flex items-center gap-1.5'>
																			{wf.apps.length > 0 ? (
																				wf.apps.map(
																					(app) => (
																						<AppBadge
																							key={
																								app
																							}
																							name={
																								app
																							}
																						/>
																					),
																				)
																			) : (
																				<span className='dark:text-zinc-650 font-semibold text-slate-400'>
																					None
																				</span>
																			)}
																		</div>
																	</td>
																	<td className='hidden px-4 py-4 font-semibold text-slate-500 lg:table-cell dark:text-zinc-400'>
																		{wf.nodesCount}
																	</td>
																	<td className='hidden px-4 py-4 font-semibold text-slate-500 lg:table-cell dark:text-zinc-400'>
																		{wf.lastEdited}
																	</td>
																	<td className='hidden px-4 py-4 font-semibold text-slate-500 xl:table-cell dark:text-zinc-400'>
																		{wf.lastRun}
																	</td>
																	<td className='px-4 py-4'>
																		<div className='flex flex-col items-start gap-1'>
																			<span
																				className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase ${
																					wf.status ===
																					'active'
																						? 'bg-emerald-500/5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
																						: 'bg-slate-105 text-slate-450 dark:bg-zinc-900 dark:text-zinc-500'
																				}`}>
																				<span
																					className={`h-1.5 w-1.5 rounded-full ${wf.status === 'active' ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-slate-400 dark:bg-zinc-600'}`}
																				/>
																				{wf.status ===
																				'active'
																					? 'published'
																					: 'draft'}
																			</span>
																			{wf.hasUnpublishedChanges && (
																				<span className='inline-flex items-center gap-1 text-[9px] font-black tracking-wider text-amber-600 uppercase dark:text-amber-400'>
																					<AlertTriangle
																						size={9}
																					/>{' '}
																					Unpublished
																					changes
																				</span>
																			)}
																		</div>
																	</td>
																	<td
																		className='px-4 py-4 text-right whitespace-nowrap'
																		onClick={(e) =>
																			e.stopPropagation()
																		}>
																		<div className='flex items-center justify-end gap-2'>
																			{renderPublishControl(
																				wf,
																			)}
																			<button
																				type='button'
																				onClick={(e) =>
																					handleRunNow(
																						wf.id,
																						e,
																					)
																				}
																				className='flex cursor-pointer items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-[10px] font-black text-emerald-600 transition hover:bg-emerald-500/10 dark:text-emerald-400'>
																				<Play size={11} />{' '}
																				Run
																			</button>
																			{renderWorkflowMenuTrigger(
																				wf,
																				true,
																			)}
																		</div>
																	</td>
																</tr>
															))}
														</tbody>
													</table>
												</div>
											)}
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						);
					})}
				</div>
			</div>

			{modals}
		</Container>
	);
};

export default WorkflowsListPage;
