import { useState, useMemo, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router';
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
} from 'lucide-react';
import { OutletContextType } from './_layouts/Workflows.layout';
import { useConfirm } from '@/context/confirmContext';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import pages from '@/Routes/pages';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import { useWorkspaceContext } from '@/context/workspaceContext';
import {
	useFolders,
	useCreateFolder,
	useUpdateFolder,
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
	useDeactivateWorkflow,
	useExecuteWorkflow,
} from '@/api/modules/workflows';

interface IWorkflow {
	id: string;
	title: string;
	description: string;
	status: 'active' | 'inactive';
	lastRun: string;
	folderId: string | null;
	apps: string[];
	starred?: boolean;
	lastEdited: string;
	nodesCount: number;
}

interface IFolder {
	id: string;
	name: string;
	color: string;
}

const ROOT_FOLDER_ID = '__root__';
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

const getAppNames = (nodes: { type?: string }[] | undefined) => {
	const names = (nodes ?? [])
		.map((node) => node.type?.toLowerCase())
		.filter((type): type is string => Boolean(type));
	return Array.from(new Set(names)).slice(0, 4);
};

const AppBadge = ({ name }: { name: string }) => (
	<span className='text-primary-600 shadow-3xs rounded-full border border-primary-100/60 bg-primary-50/30 px-2.5 py-0.5 text-[10px] font-bold capitalize transition-all duration-200 hover:border-primary-200/50 hover:bg-primary-50 dark:border-zinc-800/80 dark:bg-zinc-800/20 dark:text-primary-400 dark:hover:bg-primary-950/20'>
		{name}
	</span>
);

const WorkflowsListPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const navigate = useNavigate();
	const { confirm } = useConfirm();
	const [searchParams, setSearchParams] = useSearchParams();
	const { activeWorkspaceId: fallbackWorkspaceId } = useWorkflowShellStore();
	const { workspaces, activeWorkspace, activeWorkspaceId, role } = useWorkspaceContext();

	const currentWorkspaceId = activeWorkspaceId || fallbackWorkspaceId;

	const workspaceSummary = useMemo(
		() => workspaces.find((workspace) => workspace.id === activeWorkspaceId),
		[activeWorkspaceId, workspaces],
	);

	const workspaceName = activeWorkspace?.name ?? workspaceSummary?.name ?? 'Workspace';
	const workspaceSlug = activeWorkspace?.slug ?? workspaceSummary?.slug;
	const workspaceRole = role ?? workspaceSummary?.role ?? null;
	const hasWorkspace = Boolean(activeWorkspaceId);

	// Fetch folders + workflows from the backend
	const { data: apiFolders } = useFolders(currentWorkspaceId);
	const { data: apiWorkflowsResponse } = useWorkflows(currentWorkspaceId);

	// Mutations
	const createWorkflowMutation = useCreateWorkflow(currentWorkspaceId);
	const updateWorkflowMutation = useUpdateWorkflow(currentWorkspaceId);
	const deleteWorkflowMutation = useDeleteWorkflow(currentWorkspaceId);
	const duplicateWorkflowMutation = useDuplicateWorkflow(currentWorkspaceId);
	const toggleFavoriteMutation = useToggleFavorite(currentWorkspaceId);
	const activateWorkflowMutation = useActivateWorkflow(currentWorkspaceId);
	const deactivateWorkflowMutation = useDeactivateWorkflow(currentWorkspaceId);
	const executeWorkflowMutation = useExecuteWorkflow(currentWorkspaceId);
	const createFolderMutation = useCreateFolder(currentWorkspaceId);
	const updateFolderMutation = useUpdateFolder(currentWorkspaceId);
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

	// Map backend workflows → view model
	const workflows = useMemo<IWorkflow[]>(() => {
		if (!apiWorkflowsResponse?.data || apiWorkflowsResponse.data.length === 0) return [];
		return apiWorkflowsResponse.data.map((w): IWorkflow => {
			return {
				id: w.id,
				title: w.name,
				description: w.description || 'No description provided.',
				status: w.is_active ? 'active' : 'inactive',
				lastRun: formatDate(w.last_executed_at),
				folderId: w.folder_id || null,
				apps: getAppNames(w.nodes),
				starred: w.is_favorite || false,
				lastEdited: formatDate(w.updated_at),
				nodesCount: w.nodes?.length ?? 0,
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

	const [isCreateWorkflowOpen, setIsCreateWorkflowOpen] = useState(
		() => searchParams.get('create') === 'true',
	);
	const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

	const [newWfTitle, setNewWfTitle] = useState('');
	const [newWfDesc, setNewWfDesc] = useState('');
	const [newWfFolderId, setNewWfFolderId] = useState<string>('');

	useEffect(() => {
		if (searchParams.get('create') !== 'true') return;
		const nextParams = new URLSearchParams(searchParams);
		nextParams.delete('create');
		setSearchParams(nextParams, { replace: true });
	}, [searchParams, setSearchParams]);

	const [newFolderName, setNewFolderName] = useState('');
	const [newFolderColor, setNewFolderColor] = useState('#4f46e5');
	const [editingFolder, setEditingFolder] = useState<IFolder | null>(null);
	const [editFolderName, setEditFolderName] = useState('');
	const [editFolderColor, setEditFolderColor] = useState('#4f46e5');

	const [renamingId, setRenamingId] = useState<string | null>(null);
	const [renameValue, setRenameValue] = useState('');
	const renameInputRef = useRef<HTMLInputElement>(null);

	const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<'all' | 'starred'>('all');
	const [searchQuery, setSearchQuery] = useState('');
	const [isGridView, setIsGridView] = useState(true);
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
	const [draggedWorkflowId, setDraggedWorkflowId] = useState<string | null>(null);
	const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.app.subPages.workflows }]} />);
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
		};
		window.addEventListener('click', handleGlobalClick);
		return () => window.removeEventListener('click', handleGlobalClick);
	}, []);

	const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
		setToast({ message, type });
		setTimeout(() => setToast(null), 3000);
	};

	const filteredWorkflows = useMemo(() => {
		return workflows.filter((w) => {
			if (activeTab === 'starred' && !w.starred) return false;
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				if (
					!w.title.toLowerCase().includes(query) &&
					!w.description.toLowerCase().includes(query)
				)
					return false;
			}
			return true;
		});
	}, [workflows, activeTab, searchQuery]);

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
		if (folderGrouped[ROOT_FOLDER_ID].length === 0) return folders;
		return [{ id: ROOT_FOLDER_ID, name: 'Root workflows', color: '#475569' }, ...folders];
	}, [folderGrouped, folders]);

	const handleCreateWorkflow = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newWfTitle.trim()) return;
		try {
			const res = await createWorkflowMutation.mutateAsync({
				name: newWfTitle.trim(),
				description: newWfDesc.trim() || undefined,
				folder_id: newWfFolderId || undefined,
				nodes: [],
				connections: [],
			});
			if (newWfFolderId) setExpandedFolders((prev) => ({ ...prev, [newWfFolderId]: true }));
			setNewWfTitle('');
			setNewWfDesc('');
			setNewWfFolderId('');
			setIsCreateWorkflowOpen(false);
			triggerToast(`Workflow "${res.name}" created successfully!`);
			navigate(`${pages.editor.subPages.editWorkflow.to}/${currentWorkspaceId}/${res.id}`);
		} catch {
			// Error is surfaced by the mutation hook
		}
	};

	const handleQuickCreateWorkflow = async () => {
		if (!hasWorkspace || createWorkflowMutation.isPending) return;
		try {
			const res = await createWorkflowMutation.mutateAsync({
				name: 'Untitled Workflow',
				nodes: [],
				connections: [],
			});
			navigate(`${pages.editor.subPages.editWorkflow.to}/${currentWorkspaceId}/${res.id}`);
		} catch {
			// Error is surfaced by the mutation hook
		}
	};

	const handleCreateFolder = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newFolderName.trim()) return;
		try {
			const res = await createFolderMutation.mutateAsync({
				name: newFolderName.trim(),
				color: newFolderColor,
			});
			setExpandedFolders((prev) => ({ ...prev, [res.id]: true }));
			setNewFolderName('');
			setNewFolderColor('bg-primary-400');
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
		if (!editingFolder || !editFolderName.trim()) return;
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

	const handleToggleStatus = async (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		const wf = workflows.find((w) => w.id === id);
		if (!wf) return;
		try {
			if (wf.status === 'active') await deactivateWorkflowMutation.mutateAsync(id);
			else await activateWorkflowMutation.mutateAsync(id);
			triggerToast('Workflow status updated!');
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
		try {
			await duplicateWorkflowMutation.mutateAsync({
				id: workflow.id,
				body: { name: `${workflow.title} (Copy)` },
			});
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

	const handleDragLeave = (e: React.DragEvent, folderId: string) => {
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
		if (!workflow || workflow.folderId === folderId) return;

		setDragOverFolderId(null);
		await handleMoveWorkflow(workflow, folderId === ROOT_FOLDER_ID ? null : folderId);
	};

	const renderMoveWorkflowMenu = (workflow: IWorkflow) => {
		if (!workflow.folderId && folders.length === 0) return null;
		return (
			<div className='my-1 max-h-44 overflow-y-auto border-y border-slate-100 py-1 dark:border-zinc-800/60'>
				<p className='text-slate-450 px-3 py-1 text-[9px] font-black tracking-wider uppercase dark:text-zinc-500'>
					Move to folder
				</p>
				{workflow.folderId && (
					<button
						onClick={() => handleMoveWorkflow(workflow, null)}
						className='dark:hover:bg-zinc-800 flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-black text-slate-700 hover:bg-slate-50 dark:text-zinc-200'>
						<Workflow size={11} className='text-primary-500' /> Root level
					</button>
				)}
				{folders
					.filter((folder) => folder.id !== workflow.folderId)
					.map((folder) => (
						<button
							key={folder.id}
							onClick={() => handleMoveWorkflow(workflow, folder.id)}
							className='dark:hover:bg-zinc-800 flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-black text-slate-700 hover:bg-slate-50 dark:text-zinc-200'>
							<Folder size={11} className='text-slate-400' /> {folder.name}
						</button>
					))}
			</div>
		);
	};

	const renderMoveWorkflowSelect = (workflow: IWorkflow) => {
		if (!workflow.folderId && folders.length === 0) return null;
		return (
			<select
				aria-label={`Move ${workflow.title} to folder`}
				value={workflow.folderId || ''}
				onClick={(e) => e.stopPropagation()}
				onChange={(e) => handleMoveWorkflow(workflow, e.target.value || null)}
				className='dark:text-zinc-355 mr-3 max-w-32 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10.5px] font-bold text-slate-600 transition outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 dark:border-zinc-800 dark:bg-zinc-900'>
				<option value=''>Root level</option>
				{folders.map((folder) => (
					<option key={folder.id} value={folder.id}>
						{folder.name}
					</option>
				))}
			</select>
		);
	};

	const renderWorkflowOrganizationActions = (workflow: IWorkflow) => (
		<>
			<button
				onClick={() => {
					setRenameValue(workflow.title);
					setRenamingId(workflow.id);
					setActiveMenuId(null);
				}}
				className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800'>
				<Folder className='h-3 w-3 text-slate-400' /> Rename
			</button>
			{renderMoveWorkflowMenu(workflow)}
			<button
				onClick={(e) => {
					setActiveMenuId(null);
					handleDuplicate(workflow, e);
				}}
				className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800'>
				<Copy size={11} className='text-slate-400' /> Duplicate
			</button>
		</>
	);

	const renderWorkflowListActions = (workflow: IWorkflow) => (
		<>
			{renderMoveWorkflowSelect(workflow)}
			<button
				onClick={(e) => handleRunNow(workflow.id, e)}
				className='hover:text-primary-500 mr-3 text-xs font-bold text-primary-600 dark:text-primary-400 dark:hover:text-primary-300'>
				Run
			</button>
			<button
				onClick={(e) => handleDelete(workflow.id, e)}
				className='text-rose-605 text-xs font-bold transition-colors hover:text-rose-500'>
				Delete
			</button>
		</>
	);

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

	// ─── Empty state ────────────────────────────────────────────────────────────
	if (workflows.length === 0) {
		return (
			<Container className='relative flex min-h-screen items-center justify-center overflow-x-hidden overflow-y-auto bg-[#fafbfe] !p-0 dark:bg-[#07090e]'>
				<div className='pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:4rem_4rem] opacity-50 dark:bg-[linear-gradient(to_right,#161b26_1px,transparent_1px),linear-gradient(to_bottom,#161b26_1px,transparent_1px)] dark:opacity-80' />
				<div className='z-10 mx-auto flex w-full max-w-xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6'>
					<div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-primary-500/20 bg-primary-400/5 text-primary-600 shadow-md shadow-primary-500/5 dark:bg-primary-400/10 dark:text-primary-400'>
						<GitMerge size={24} className='rotate-90' />
					</div>
					<h1 className='mt-5 text-2xl font-black tracking-tight text-slate-900 dark:text-white'>
						Create your first workflow
					</h1>
					<p className='mt-2 max-w-md text-sm leading-relaxed font-semibold text-slate-500 dark:text-zinc-400'>
						Build an automation, connect the steps, and run it when you are ready.
					</p>
					<button
						onClick={() => navigate(pages.editor.subPages.addWorkflow.to)}
						className='mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-400 to-primary-400 px-5 text-xs font-black text-primary-950 shadow-md shadow-primary-500/15 transition hover:brightness-110 active:scale-[0.98] sm:w-auto'>
						<Plus size={15} strokeWidth={3} />
						Create Workflow
					</button>
				</div>
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
						className='fixed inset-x-4 top-4 z-[110] flex items-center gap-3 rounded-2xl border border-primary-500/20 bg-white/95 px-4.5 py-3 shadow-2xl backdrop-blur-md sm:inset-x-auto sm:top-6 sm:right-6 sm:max-w-sm dark:border-primary-500/15 dark:bg-zinc-900/95'>
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
				<header className='relative mt-4 sm:mt-0 flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-border-main bg-bg-card p-6 shadow-sm transition-all duration-300 lg:flex-row lg:items-center dark:border-border-main dark:bg-bg-card'>
					{/* Banner background glow effect */}
					<div className='absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary-400/5 blur-3xl' />
					<div className='absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-primary-400/5 blur-3xl' />

					<div className='relative z-10 flex min-w-0 items-center gap-4.5'>
						<div className='group relative shrink-0'>
							{/* Soft glowing ring */}
							<div className='absolute -inset-0.5 rounded-full bg-primary-400/10 opacity-85 blur transition duration-300 group-hover:opacity-100' />
							{/* Circular initials avatar */}
							<div className='relative flex h-14 w-14 items-center justify-center rounded-full bg-primary-100/60 text-base font-black text-primary-900 shadow-sm dark:bg-primary-950/60 dark:text-white'>
								{getInitials(workspaceName)}
							</div>
							{/* Yellow status indicator dot */}
							<span className='absolute -right-0.5 -bottom-0.5 flex h-4.5 w-4.5 rounded-full border-[3px] border-bg-card bg-[#CFF54A] shadow-xs' />
						</div>
						<div className='min-w-0'>
							<div className='flex flex-wrap items-center gap-2.5'>
								<h1 className='truncate text-2xl font-black tracking-tight text-slate-900 dark:text-white'>
									Workflows
								</h1>
								{workspaceRole && (
									<span className='rounded-md bg-primary-100/70 px-2 py-0.5 text-[9px] font-black tracking-wide text-primary-900 uppercase dark:bg-primary-950/40 dark:text-primary-300'>
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
							className='flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-border-main dark:bg-bg-card dark:text-white dark:hover:bg-zinc-950/20'>
							<Folder size={14} className='text-primary-450 dark:text-[#CFF54A]' />
							New Folder
						</motion.button>
						<motion.button
							type='button'
							whileHover={{ scale: 1.02, y: -1 }}
							whileTap={{ scale: 0.98 }}
							onClick={handleQuickCreateWorkflow}
							disabled={!hasWorkspace || createWorkflowMutation.isPending}
							className='flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#CFF54A] px-4.5 text-xs font-black text-black shadow-md shadow-primary-500/10 transition-all hover:bg-[#B7E52F] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#CFF54A] dark:text-black dark:hover:bg-[#B7E52F]'>
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
								className='relative flex items-center justify-between overflow-hidden rounded-2xl border border-border-main bg-bg-card p-5 shadow-xs transition-all duration-300 dark:border-border-main dark:bg-bg-card group hover:shadow-sm hover:border-primary-300/60'
							>
								<div>
									<div className='text-[10px] font-black tracking-wider uppercase text-slate-800 dark:text-white'>
										{stat.label}
									</div>
									<div className='text-3.5xl mt-1 font-black tracking-tight text-slate-900 dark:text-white'>
										{stat.value}
									</div>
									<div className='mt-0.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-400'>
										{stat.desc}
									</div>
								</div>
								<div className='flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100/50 text-primary-800 dark:bg-primary-950/40 dark:text-primary-400 transition-all duration-300 group-hover:scale-105'>
									<IconComponent size={20} />
								</div>
							</motion.div>
						);
					})}
				</section>

				{/* Controls */}
				<section className='flex flex-col gap-4 pt-2 lg:flex-row lg:items-center lg:justify-between'>
					<div className='flex items-center gap-6 border-b border-slate-200/40 pb-0.5 dark:border-zinc-800/40'>
						<button
							type='button'
							onClick={() => setActiveTab('all')}
							className={`relative pb-3 text-sm font-bold transition-colors duration-300 cursor-pointer ${
								activeTab === 'all'
									? 'text-slate-900 dark:text-white'
									: 'text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300'
							}`}
						>
							All Workflows
							{activeTab === 'all' && (
								<motion.div
									layoutId='activeTabUnderline'
									className='absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[#CFF54A]'
									transition={{ type: 'spring', stiffness: 380, damping: 30 }}
								/>
							)}
						</button>
						<button
							type='button'
							onClick={() => setActiveTab('starred')}
							className={`relative pb-3 text-sm font-bold transition-colors duration-300 cursor-pointer ${
								activeTab === 'starred'
									? 'text-slate-900 dark:text-white'
									: 'text-slate-450 hover:text-slate-650 dark:text-zinc-550 dark:hover:text-zinc-350'
							}`}
						>
							Starred Favorites
							{activeTab === 'starred' && (
								<motion.div
									layoutId='activeTabUnderline'
									className='absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[#CFF54A]'
									transition={{ type: 'spring', stiffness: 380, damping: 30 }}
								/>
							)}
						</button>
					</div>

					<div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
						{/* Search box */}
						<div className='group relative w-full sm:w-80'>
							<Search className='absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary-500 dark:text-zinc-500' />
							<input
								aria-label='Search workspace workflows'
								value={searchQuery}
								onChange={(event) => setSearchQuery(event.target.value)}
								placeholder='Search workflows by title or description...'
								className='dark:placeholder-zinc-450 h-10 w-full rounded-xl border border-border-main bg-bg-card pr-9 pl-10 text-xs font-semibold text-slate-900 placeholder-slate-400 shadow-2xs transition-all outline-none focus:border-[#CFF54A] focus:ring-[4px] focus:ring-[rgba(207,245,74,0.18)] dark:border-border-main dark:bg-bg-card dark:text-white'
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

						{/* Grid / List toggle selector */}
						<div className='flex items-center gap-1.5'>
							<button
								type='button'
								aria-label='Grid view'
								onClick={() => setIsGridView(true)}
								className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border transition-all duration-300 ${
									isGridView
										? 'border-primary-400 bg-primary-100/10 text-slate-900 dark:border-primary-400 dark:bg-primary-950/20 dark:text-white'
										: 'border-border-main bg-bg-card text-slate-400 hover:text-slate-655 dark:border-border-main dark:bg-bg-card dark:text-zinc-500'
								}`}
							>
								<LayoutGrid size={16} />
							</button>
							<button
								type='button'
								aria-label='List view'
								onClick={() => setIsGridView(false)}
								className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border transition-all duration-300 ${
									!isGridView
										? 'border-primary-400 bg-primary-100/10 text-slate-900 dark:border-primary-400 dark:bg-primary-950/20 dark:text-white'
										: 'border-border-main bg-bg-card text-slate-400 hover:text-slate-[#655] dark:border-border-main dark:bg-bg-card dark:text-zinc-500'
								}`}
							>
								<List size={16} />
							</button>
						</div>
					</div>
				</section>

				{/* Workflow groups */}
				<div className='space-y-6'>
					{workflowGroups.map((folder) => {
						const groupedItems = folderGrouped[folder.id] || [];
						const isRootGroup = folder.id === ROOT_FOLDER_ID;
						const isExpanded = isRootGroup || !!expandedFolders[folder.id];
						return (
							<div key={folder.id} className='space-y-3.5'>
								{isRootGroup ? (
									<div className='shadow-sm flex items-center justify-between gap-3 rounded-2xl border border-border-main bg-bg-card px-5 py-4 transition-all duration-300 dark:border-border-main dark:bg-bg-card'>
										<div className='flex min-w-0 items-center gap-3'>
											<div className='text-primary-800 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100/50 shadow-xs dark:bg-primary-950/40 dark:text-primary-400'>
												<Workflow size={17} />
											</div>
											<div className='min-w-0'>
												<h2 className='text-xs font-extrabold text-slate-800 dark:text-white'>
													Workflows without folders
												</h2>
												<p className='mt-0.5 hidden text-[10px] font-semibold text-slate-400 sm:block dark:text-zinc-400'>
													Move these into folders when you need more
													organization.
												</p>
											</div>
										</div>
										<span className='shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-[#CFF54A] text-[10px] font-black text-black shadow-xs dark:bg-[#CFF54A] dark:text-black'>
											{groupedItems.length}
										</span>
									</div>
								) : (
									<div
										onDragOver={handleDragOver}
										onDragEnter={() => handleDragEnter(folder.id)}
										onDragLeave={(e) => handleDragLeave(e, folder.id)}
										onDrop={(e) => handleDropOnFolder(e, folder.id)}
										className={`group/folder relative flex items-center overflow-hidden rounded-2xl border shadow-xs transition-all duration-300 ${
											dragOverFolderId === folder.id
												? 'border-primary-400 bg-soft-accent-bg dark:bg-primary-400/10 dark:border-primary-400'
												: 'border-border-main bg-bg-card hover:border-primary-200 dark:border-border-main dark:bg-bg-card'
										}`}>
										<div
											className='absolute top-0 bottom-0 left-0 w-1 bg-[#CFF54A]'
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
												<span className='dark:text-zinc-400 text-slate-400 transition-transform duration-300 group-hover/btn:translate-x-0.5'>
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
													className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100/50 text-primary-800 shadow-xs dark:bg-primary-950/40 dark:text-primary-400'>
													<Folder size={16} />
												</div>
												<span className='truncate text-xs font-bold tracking-wide text-slate-800 dark:text-white'>
													{folder.name}
												</span>
											</div>
											<span className='shrink-0 rounded-full bg-slate-100 dark:bg-zinc-950/40 text-[10px] font-bold text-slate-500 h-6 w-6 flex items-center justify-center shadow-3xs dark:text-zinc-400'>
												{groupedItems.length}
											</span>
										</button>
										<button
											aria-label={`Edit ${folder.name}`}
											onClick={() => openEditFolder(folder)}
											className='mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-white'>
											<Edit3 size={14} />
										</button>
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
												<div className='rounded-2xl border border-dashed border-border-main bg-bg-card p-8 text-center text-sm font-semibold text-text-muted dark:border-border-main dark:bg-bg-card'>
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
															draggable
															onDragStart={(e) => handleDragStart(e, wf.id)}
															onDragEnd={handleDragEnd}
															onClick={() =>
																navigate(
																	`${pages.editor.subPages.editWorkflow.to}/${currentWorkspaceId}/${wf.id}`,
																)
															}
															onKeyDown={(e) => {
																if (e.key === 'Enter') {
																	navigate(
																		`${pages.editor.subPages.editWorkflow.to}/${currentWorkspaceId}/${wf.id}`,
																	);
																}
															}}
															className='group relative flex min-h-[220px] cursor-pointer flex-col justify-between rounded-2xl border border-border-main bg-bg-card p-5.5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary-300/85 hover:shadow-md dark:border-border-main dark:bg-bg-card'>
															{/* Bottom interactive line */}
															<div className='absolute right-0 bottom-0 left-0 h-1.5 rounded-b-2xl bg-primary-400 opacity-0 transition-opacity duration-300 group-hover:opacity-10' />

															<div className='flex flex-col gap-3.5'>
																<div className='flex items-start justify-between gap-4'>
																	<div className='flex min-w-0 items-center gap-3.5'>
																		<div
																			className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100/50 text-primary-800 shadow-xs transition-all duration-300 group-hover:scale-105 dark:bg-primary-950/40 dark:text-primary-400'>
																			<Workflow size={18} />
																		</div>
																		<div className='min-w-0'>
																			<div className='flex flex-wrap items-center gap-2'>
																				{renamingId ===
																				wf.id ? (
																					<div
																						className='flex items-center gap-1.5'
																						onClick={(
																							e,
																						) =>
																							e.stopPropagation()
																						}
																						onKeyDown={(
																							e,
																						) =>
																							e.stopPropagation()
																						}>
																						<input
																							aria-label={`Rename ${wf.title}`}
																							ref={
																								renameInputRef
																							}
																							value={
																								renameValue
																							}
																							onChange={(
																								e,
																							) =>
																								setRenameValue(
																									e
																										.target
																										.value,
																								)
																							}
																							onKeyDown={(
																								e,
																							) =>
																								e.key ===
																									'Enter' &&
																								handleRenameSubmit(
																									wf.id,
																								)
																							}
																							onBlur={() =>
																								handleRenameSubmit(
																									wf.id,
																								)
																							}
																							className='h-8 w-full rounded-lg border border-primary-500 bg-white px-2 text-xs font-semibold text-slate-900 transition outline-none dark:bg-zinc-950 dark:text-white'
																						/>
																						<button
																							onClick={() =>
																								handleRenameSubmit(
																									wf.id,
																								)
																							}
																							className='h-8 shrink-0 rounded-lg bg-slate-900 px-3 text-[10px] font-black text-white dark:bg-zinc-200 dark:text-slate-950'>
																							Save
																						</button>
																					</div>
																				) : (
																					<h3 className='truncate text-sm font-black tracking-wide text-slate-900 transition-colors duration-200 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400'>
																						{wf.title}
																					</h3>
																				)}
																				<span
																					className={`shadow-3xs flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black tracking-wider capitalize ${
																						wf.status ===
																						'active'
																							? 'border-primary-200 bg-primary-100/50 text-primary-800 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300'
																							: 'border-slate-200 bg-slate-100 text-slate-500 dark:border-transparent dark:bg-border-main dark:text-zinc-300'
																					}`}>
																					{wf.status ===
																						'active' && (
																						<span className='relative flex h-1.5 w-1.5'>
																							<span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75'></span>
																							<span className='relative inline-flex h-1.5 w-1.5 rounded-full bg-primary-500'></span>
																						</span>
																					)}
																					{wf.status}
																				</span>
																			</div>
																			<p className='dark:text-zinc-400 mt-1 line-clamp-1 text-[10px] font-bold text-slate-400'>
																				Created workspace
																				workflow
																			</p>
																		</div>
																	</div>

																	<div className='relative z-25 flex shrink-0 items-center gap-1'>
																		<motion.button
																			type='button'
																			whileHover={{
																				scale: 1.15,
																			}}
																			whileTap={{
																				scale: 0.9,
																			}}
																			aria-label={`${wf.starred ? 'Remove' : 'Add'} ${wf.title} ${wf.starred ? 'from' : 'to'} starred workflows`}
																			onClick={(e) =>
																				handleToggleStar(
																					wf.id,
																					e,
																				)
																			}
																			className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition-colors ${
																				wf.starred
																					? 'shadow-3xs border-amber-500/10 bg-amber-500/5 text-amber-500'
																					: 'border-transparent text-slate-300 hover:bg-slate-100/80 hover:text-slate-500 dark:hover:bg-zinc-800'
																			}`}>
																			<Star
																				size={15}
																				className={
																					wf.starred
																						? 'fill-amber-500'
																						: ''
																				}
																			/>
																		</motion.button>
																		<div className='relative'>
																			<button
																				type='button'
																				aria-label={`Open actions for ${wf.title}`}
																				onClick={(e) => {
																					e.stopPropagation();
																					setActiveMenuId(
																						activeMenuId ===
																							wf.id
																							? null
																							: wf.id,
																					);
																				}}
																				className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 ${
																					activeMenuId ===
																					wf.id
																						? 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-white'
																						: ''
																				}`}>
																				<MoreVertical
																					size={16}
																				/>
																			</button>
																			<AnimatePresence>
																				{activeMenuId ===
																					wf.id && (
																					<motion.div
																						initial={{
																							opacity: 0,
																							scale: 0.95,
																							y: 5,
																						}}
																						animate={{
																							opacity: 1,
																							scale: 1,
																							y: 0,
																						}}
																						exit={{
																							opacity: 0,
																							scale: 0.95,
																							y: 5,
																						}}
																						onClick={(
																							e,
																						) =>
																							e.stopPropagation()
																						}
																						className='absolute right-0 z-50 mt-2 w-48 rounded-xl border border-slate-200/80 bg-white/95 p-1.5 text-left shadow-2xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/95'>
																						<button
																							type='button'
																							onClick={(
																								e,
																							) => {
																								setActiveMenuId(
																									null,
																								);
																								handleRunNow(
																									wf.id,
																									e,
																								);
																							}}
																							className='flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800'>
																							<Play
																								size={
																									12
																								}
																								className='fill-emerald-500/10 text-emerald-500'
																							/>
																							Run now
																						</button>
																						<button
																							type='button'
																							onClick={() => {
																								setActiveMenuId(
																									null,
																								);
																								navigate(
																									`${pages.editor.subPages.editWorkflow.to}/${currentWorkspaceId}/${wf.id}`,
																								);
																							}}
																							className='flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800'>
																							<Edit3
																								size={
																									12
																								}
																								className='text-primary-500'
																							/>
																							Open
																							editor
																						</button>
																						{renderWorkflowOrganizationActions(
																							wf,
																						)}
																						<button
																							type='button'
																							onClick={(
																								e,
																							) => {
																								setActiveMenuId(
																									null,
																								);
																								handleDuplicate(
																									wf,
																									e,
																								);
																							}}
																							className='flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800'>
																							<Copy
																								size={
																									12
																								}
																								className='text-blue-500'
																							/>
																							Duplicate
																						</button>
																						<button
																							type='button'
																							onClick={(
																								e,
																							) => {
																								setActiveMenuId(
																									null,
																								);
																								handleDelete(
																									wf.id,
																									e,
																								);
																							}}
																							className='flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20'>
																							<Trash2
																								size={
																									12
																								}
																							/>
																							Delete
																						</button>
																					</motion.div>
																				)}
																			</AnimatePresence>
																		</div>
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
																			<span className='inline-flex items-center gap-1.5 rounded-full bg-primary-100/50 px-2.5 py-0.5 text-[9px] font-bold text-primary-800 dark:bg-primary-950/40 dark:text-primary-400'>
																				<span className='h-1 w-1 rounded-full bg-[#CFF54A]' />
																				Empty Workflow
																			</span>
																		)}
																	</div>
																</div>
															</div>

															<div className='mt-5 flex items-center justify-between gap-3 border-t border-border-main pt-4 dark:border-border-main'>
																<div className='dark:text-zinc-400 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400'>
																	<div className='flex items-center gap-1.5 truncate'>
																		<Calendar
																			size={12}
																			className='dark:text-zinc-400 text-slate-400/80'
										/>
																		<span>
																			Updated {wf.lastEdited}
																		</span>
																	</div>
																	<div className='flex items-center gap-1.5 truncate'>
																		<Clock
																			size={12}
																			className='dark:text-zinc-400 text-slate-400/80'
																		/>
																		<span>
																			Run {wf.lastRun}
																		</span>
																	</div>
																</div>
																<div
																	className='flex shrink-0 items-center gap-3'
																	onClick={(e) =>
																		e.stopPropagation()
																	}>
																	<span className='flex items-center gap-1.5 rounded-full bg-primary-100/50 px-2.5 py-0.75 text-[10px] font-black text-primary-800 dark:bg-primary-950/40 dark:text-primary-400'>
																		<GitMerge
																			size={11}
																			className='rotate-90 text-primary-800 dark:text-primary-400'
																		/>
																		<span>
																			{wf.nodesCount}{' '}
																			{wf.nodesCount === 1
																				? 'node'
																				: 'nodes'}
																		</span>
																	</span>

																	<button
																		aria-label={`${wf.status === 'active' ? 'Deactivate' : 'Activate'} ${wf.title}`}
																		onClick={(e) =>
																			handleToggleStatus(
																				wf.id,
																				e,
																			)
																		}
																		className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-305 ${
																			wf.status === 'active'
																				? 'bg-primary-400 shadow-sm shadow-primary-500/20 dark:bg-primary-400'
																				: 'bg-slate-200 dark:bg-zinc-800'
																		}`}>
																		<div
																			className={`h-4 w-4 rounded-full bg-white shadow-xs transition-transform duration-300 ${
																				wf.status ===
																				'active'
																					? 'translate-x-4'
																					: 'translate-x-0'
																			}`}
																		/>
																	</button>
																</div>
															</div>
														</div>
													))}
												</div>
											) : (
												<div className='overflow-x-auto rounded-2xl border border-slate-200/60 bg-white/80 shadow-2xs backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/40'>
													<table className='w-full min-w-[820px] border-collapse text-left text-xs'>
														<thead>
															<tr className='dark:border-zinc-800/40 border-b border-slate-200/60 bg-slate-50/50 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-zinc-900/20 dark:text-zinc-500'>
																<th className='px-6 py-4'>
																	Workflow Name
																</th>
																<th className='px-6 py-4'>
																	Integrations
																</th>
																<th className='px-6 py-4'>
																	Updated
																</th>
																<th className='px-6 py-4'>
																	Last Run
																</th>
																<th className='px-6 py-4'>
																	Status
																</th>
																<th className='px-6 py-4 text-right'>
																	Actions
																</th>
															</tr>
														</thead>
														<tbody className='divide-y divide-slate-100 dark:divide-zinc-800/40'>
															{groupedItems.map((wf) => (
																<tr
																	key={wf.id}
																	onClick={() =>
																		navigate(
																			`${pages.editor.subPages.editWorkflow.to}/${currentWorkspaceId}/${wf.id}`,
																		)
																	}
																	className='cursor-pointer transition-colors duration-200 hover:bg-slate-50/50 dark:hover:bg-zinc-900/20'>
																	<td className='px-6 py-4 font-extrabold text-slate-800 dark:text-zinc-200'>
																		{wf.title}
																	</td>
																	<td className='px-6 py-4'>
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
																	<td className='px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400'>
																		{wf.lastEdited}
																	</td>
																	<td className='px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400'>
																		{wf.lastRun}
																	</td>
																	<td className='px-6 py-4'>
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
																			{wf.status}
																		</span>
																	</td>
																	<td
																		className='px-6 py-4 text-right whitespace-nowrap'
																		onClick={(e) =>
																			e.stopPropagation()
																		}>
																		{renderWorkflowListActions(
																			wf,
																		)}
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

			{/* Modals */}
			<AnimatePresence>
				{isCreateWorkflowOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 font-sans backdrop-blur-md'
						onClick={() => setIsCreateWorkflowOpen(false)}>
						<motion.div
							initial={{ scale: 0.95, y: 15 }}
							animate={{ scale: 1, y: 0 }}
							exit={{ scale: 0.95, y: 15 }}
							transition={{ duration: 0.2 }}
							className='dark:border-zinc-800/60 relative max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200/50 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:bg-zinc-950/95'
							onClick={(e) => e.stopPropagation()}>
							<button
								aria-label='Close create workflow dialog'
								onClick={() => setIsCreateWorkflowOpen(false)}
								className='absolute top-4.5 right-4.5 text-slate-400 transition hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300'>
								<X size={18} />
							</button>
							<h3 className='mb-5 flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white'>
								<Workflow className='h-5 w-5 text-primary-600' /> Create Workflow
							</h3>
							<form onSubmit={handleCreateWorkflow} className='space-y-4'>
								<div>
									<label
										htmlFor='new-workflow-name'
										className='mb-1.5 block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
										Workflow Name
									</label>
									<input
										id='new-workflow-name'
										aria-label='Workflow name'
										type='text'
										required
										placeholder='e.g. Lead Sync Manager'
										value={newWfTitle}
										onChange={(e) => setNewWfTitle(e.target.value)}
										className='bg-slate-55/50 h-10 w-full rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-900 transition outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/10 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white dark:focus:bg-zinc-900'
									/>
								</div>
								<div>
									<label
										htmlFor='new-workflow-description'
										className='mb-1.5 block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
										Description
									</label>
									<textarea
										id='new-workflow-description'
										aria-label='Workflow description'
										placeholder='e.g. Syncs signup details to Slack...'
										value={newWfDesc}
										onChange={(e) => setNewWfDesc(e.target.value)}
										rows={3}
										className='bg-slate-55/50 w-full resize-none rounded-xl border border-slate-200 p-3.5 text-xs font-semibold text-slate-900 transition outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/10 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white dark:focus:bg-zinc-900'
									/>
								</div>
								<div>
									<label
										htmlFor='new-workflow-folder'
										className='mb-1.5 block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
										Assign to Folder
									</label>
									<select
										id='new-workflow-folder'
										value={newWfFolderId}
										onChange={(e) => setNewWfFolderId(e.target.value)}
										className='bg-slate-55/50 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-900 transition outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/25 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white'>
										<option value=''>No Folder (Root level)</option>
										{folders.map((f) => (
											<option key={f.id} value={f.id}>
												{f.name}
											</option>
										))}
									</select>
								</div>
								<div className='flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end'>
									<button
										type='button'
										onClick={() => setIsCreateWorkflowOpen(false)}
										className='dark:hover:bg-zinc-800 h-9.5 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'>
										Cancel
									</button>
									<button
										type='submit'
										className='h-9.5 cursor-pointer rounded-xl bg-gradient-to-r from-primary-400 to-primary-400 px-5 text-xs font-bold text-primary-950 shadow-sm shadow-[#7c3aed]/10 transition-all hover:brightness-110'>
										Create Workflow
									</button>
								</div>
							</form>
						</motion.div>
					</motion.div>
				)}

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
							className='dark:border-zinc-800/60 relative max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-y-auto rounded-3xl border border-slate-200/50 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:bg-zinc-950/95'
							onClick={(e) => e.stopPropagation()}>
							<button
								aria-label='Close create folder dialog'
								onClick={() => setIsCreateFolderOpen(false)}
								className='hover:text-slate-655 dark:text-zinc-550 absolute top-4.5 right-4.5 text-slate-400 transition dark:hover:text-zinc-300'>
								<X size={18} />
							</button>
							<h3 className='mb-5 flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white'>
								<FolderPlus className='h-5 w-5 text-primary-600' /> Create Folder
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
										className='border-slate-205 bg-slate-55/50 h-10 w-full rounded-xl border px-3.5 text-xs font-semibold text-slate-900 transition outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/10 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white dark:focus:bg-zinc-900'
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
												className={`h-7.5 w-7.5 rounded-full cursor-pointer border transition ${newFolderColor === color.value ? 'scale-110 border-slate-800 ring-2 ring-primary-500 dark:border-white' : 'border-slate-200/50 hover:scale-105'}`}
											/>
										))}
									</div>
								</div>
								<div className='flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end'>
									<button
										type='button'
										onClick={() => setIsCreateFolderOpen(false)}
										className='dark:hover:bg-zinc-800 h-9.5 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'>
										Cancel
									</button>
									<button
										type='submit'
										className='h-9.5 cursor-pointer rounded-xl bg-gradient-to-r from-primary-400 to-primary-400 px-5 text-xs font-bold text-primary-950 shadow-sm shadow-primary-500/10 transition-all hover:brightness-110'>
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
							className='dark:border-zinc-800/60 relative max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-y-auto rounded-3xl border border-slate-200/50 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:bg-zinc-950/95'
							onClick={(e) => e.stopPropagation()}>
							<button
								aria-label='Close edit folder dialog'
								onClick={() => setEditingFolder(null)}
								className='hover:text-slate-655 dark:text-zinc-550 absolute top-4.5 right-4.5 text-slate-400 transition dark:hover:text-zinc-300'>
								<X size={18} />
							</button>
							<h3 className='mb-5 flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white'>
								<Edit3 className='h-5 w-5 text-primary-600' /> Edit Folder
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
										className='border-slate-205 bg-slate-55/50 h-10 w-full rounded-xl border px-3.5 text-xs font-semibold text-slate-900 transition outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/10 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white dark:focus:bg-zinc-900'
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
												className={`h-7.5 w-7.5 rounded-full cursor-pointer border transition ${editFolderColor === color.value ? 'scale-110 border-slate-800 ring-2 ring-primary-500 dark:border-white' : 'border-slate-200/50 hover:scale-105'}`}
											/>
										))}
									</div>
								</div>
								<div className='flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end'>
									<button
										type='button'
										onClick={() => setEditingFolder(null)}
										className='dark:hover:bg-zinc-800 h-9.5 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'>
										Cancel
									</button>
									<button
										type='submit'
										className='h-9.5 cursor-pointer rounded-xl bg-gradient-to-r from-primary-400 to-primary-400 px-5 text-xs font-bold text-primary-950 shadow-sm shadow-primary-500/10 transition-all hover:brightness-110'>
										Save Changes
									</button>
								</div>
							</form>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</Container>
	);
};

export default WorkflowsListPage;
