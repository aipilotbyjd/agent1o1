import { useState, useMemo, useEffect, useRef } from 'react';
import {
	Search,
	Filter,
	Plus,
	Folder,
	ChevronDown,
	ChevronRight,
	Play,
	Edit3,
	Copy,
	Trash2,
	FolderPlus,
	Cloud,
	Sliders,
	Moon,
	Sun,
	Check,
	LayoutGrid,
	List,
	Workflow,
	X,
	Activity,
	HeartPulse,
	ShieldCheck,
	Link2,
	MoreVertical,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WorkspaceSidebar from '@/templates/asides/AppAside.template';
import useDarkMode from '@/hooks/useDarkMode';
import DARK_MODE from '@/constants/darkMode.constant';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import Wrapper from '@/components/layout/Wrapper';
import { useConfirm } from '@/context/confirmContext';

// Interface declarations
interface IWorkflow {
	id: string;
	title: string;
	description: string;
	status: 'active' | 'inactive';
	lastRun: string;
	successRate: number;
	author: string;
	folderId: string | null;
	apps: string[];
	starred?: boolean;
	shared?: boolean;
	lastEdited: string;
}

interface IFolder {
	id: string;
	name: string;
	color: string;
}

// Custom SVGs for high fidelity app icons matching the design
const AppBrandIcon = ({ name, className = 'w-4 h-4' }: { name: string; className?: string }) => {
	switch (name.toLowerCase()) {
		case 'loop':
			return (
				<div className='border-blue-150 flex h-6 w-6 items-center justify-center rounded-full border bg-blue-50'>
					<svg className={className} viewBox='0 0 24 24' fill='none'>
						<path
							d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15.5h-2v-2h2v2zm0-4h-2V7h2v6.5z'
							fill='#2563EB'
						/>
					</svg>
				</div>
			);
		case 'runner':
			return (
				<div className='border-orange-150 flex h-6 w-6 items-center justify-center rounded-full border bg-orange-50'>
					<svg className={className} viewBox='0 0 24 24' fill='none'>
						<path
							d='M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 21.5h2.1l1.8-8.2 2.1 2v7.7h2v-9.6l-2.1-2 1-4.8c1.5 1.8 3.7 2.9 6.2 2.9v-2c-2 0-3.8-1-4.9-2.5l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.6.1-.9.2L5 5.1v6.4h2V7.8l2.8 1.1z'
							fill='#EA580C'
						/>
					</svg>
				</div>
			);
		case 'slack':
			return (
				<div className='border-slate-150 flex h-6 w-6 items-center justify-center rounded-full border bg-slate-50'>
					<svg className={className} viewBox='0 0 24 24' fill='none'>
						<path
							d='M5.042 15.165a2.528 2.528 0 0 1-2.52-2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zM6.302 15.165a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.043a2.528 2.528 0 0 1-2.522 2.52H8.822a2.528 2.528 0 0 1-2.52-2.52v-5.043z'
							fill='#E01E5A'
						/>
						<path
							d='M8.822 5.043a2.528 2.528 0 0 1-2.52-2.52A2.528 2.528 0 0 1 8.822 0a2.528 2.528 0 0 1 2.52 2.522v2.52h-2.52z'
							fill='#36C5F0'
						/>
						<path
							d='M8.822 6.302a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.8a2.528 2.528 0 0 1-2.522-2.522V8.822a2.528 2.528 0 0 1 2.522-2.52h5.043z'
							fill='#36C5F0'
						/>
						<path
							d='M18.958 8.822a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52v-2.52z'
							fill='#2EB67D'
						/>
						<path
							d='M17.698 8.822a2.528 2.528 0 0 1-2.52 2.52H10.13a2.528 2.528 0 0 1-2.521-2.52V3.8a2.528 2.528 0 0 1 2.521-2.522h5.044a2.528 2.528 0 0 1 2.52 2.522v5.043z'
							fill='#2EB67D'
						/>
						<path
							d='M15.178 18.958a2.528 2.528 0 0 1 2.52 2.52 2.528 2.528 0 0 1-2.52 2.522 2.528 2.528 0 0 1-2.522-2.522v-2.52h2.52z'
							fill='#ECB22E'
						/>
						<path
							d='M15.178 17.698a2.528 2.528 0 0 1-2.52-2.52V10.13a2.528 2.528 0 0 1 2.52-2.521h5.043a2.528 2.528 0 0 1 2.522 2.52v5.044a2.528 2.528 0 0 1-2.522 2.52h-5.043z'
							fill='#ECB22E'
						/>
					</svg>
				</div>
			);
		case 'link':
			return (
				<div className='border-emerald-150 flex h-6 w-6 items-center justify-center rounded-full border bg-emerald-50'>
					<svg className={className} viewBox='0 0 24 24' fill='none'>
						<path
							d='M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z'
							fill='#10B981'
						/>
					</svg>
				</div>
			);
		default:
			return (
				<div className='border-primary-100 flex h-6 w-6 items-center justify-center rounded-full border bg-primary-50'>
					<Workflow className={`${className} text-primary-600`} />
				</div>
			);
	}
};

// Custom sparkline chart
const Sparkline = () => (
	<svg className='h-8 w-16 text-emerald-500' viewBox='0 0 80 30' fill='none'>
		<path
			d='M5 25 C 20 25, 25 15, 40 18 C 55 20, 60 5, 75 8'
			stroke='currentColor'
			strokeWidth='2.5'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
	</svg>
);

const workspaceData: Record<string, { folders: IFolder[]; workflows: IWorkflow[] }> = {
	'amaan-studio': {
		folders: [
			{ id: 'sales', name: 'Sales Operations', color: '#4f46e5' },
			{ id: 'marketing', name: 'Marketing Automations', color: '#f43f5e' },
			{ id: 'ai', name: 'AI Core Agents', color: '#7c3aed' },
		],
		workflows: [
			{
				id: 'wf-1',
				title: 'sasa',
				description: 'sasa',
				status: 'inactive',
				lastRun: 'Never',
				successRate: 100.0,
				author: 'Amaan',
				folderId: 'sales',
				apps: ['loop'],
				starred: false,
				shared: false,
				lastEdited: 'Never',
			},
			{
				id: 'wf-2',
				title: 'sahil',
				description:
					'Triggers on signup webhook, enriches company profiles, and logs priority alerts to Slack.',
				status: 'inactive',
				lastRun: '12 mins ago',
				successRate: 98.4,
				author: 'Amaan',
				folderId: 'sales',
				apps: ['loop', 'runner', 'slack', 'link'],
				starred: true,
				shared: true,
				lastEdited: '12 mins ago',
			},
			{
				id: 'wf-3',
				title: 'sahil (Copy)',
				description:
					'Triggers on signup webhook, enriches company profiles, and logs priority alerts to Slack.',
				status: 'inactive',
				lastRun: 'Never',
				successRate: 98.4,
				author: 'Amaan',
				folderId: 'sales',
				apps: ['loop', 'runner', 'slack', 'link'],
				starred: true,
				shared: true,
				lastEdited: 'Never',
			},
			{
				id: 'wf-4',
				title: 'Email campaign automation',
				description:
					'Syncs customer signup events to HubSpot and trigger warm email campaigns.',
				status: 'active',
				lastRun: '2 hours ago',
				successRate: 99.1,
				author: 'Amaan',
				folderId: 'marketing',
				apps: ['loop', 'slack'],
				starred: false,
				shared: false,
				lastEdited: '2 hours ago',
			},
			{
				id: 'wf-5',
				title: 'Jira issue classifier',
				description: 'LLM classification of customer bugs with Slack notifications.',
				status: 'active',
				lastRun: '1 hour ago',
				successRate: 97.5,
				author: 'Amaan',
				folderId: 'ai',
				apps: ['loop', 'slack', 'runner'],
				starred: false,
				shared: true,
				lastEdited: '1 hour ago',
			},
			{
				id: 'wf-6',
				title: 'Slack sync manager',
				description: 'Weekly team performance summary and analytics dashboard builder.',
				status: 'inactive',
				lastRun: 'Never',
				successRate: 100.0,
				author: 'Amaan',
				folderId: 'ai',
				apps: ['loop', 'link'],
				starred: false,
				shared: false,
				lastEdited: 'Yesterday',
			},
		],
	},
	personal: {
		folders: [
			{ id: 'quick-scripts', name: 'Quick Scripts', color: '#059669' },
			{ id: 'sandbox-runs', name: 'Sandbox Runs', color: '#f59e0b' },
		],
		workflows: [
			{
				id: 'wf-p1',
				title: 'Google Calendar Sync',
				description:
					'Automatically reads and syncs calendar schedules to maintain consistent task tracking.',
				status: 'active',
				lastRun: '15 mins ago',
				successRate: 100.0,
				author: 'Amaan',
				folderId: 'quick-scripts',
				apps: ['loop', 'link'],
				starred: true,
				shared: false,
				lastEdited: '15 mins ago',
			},
			{
				id: 'wf-p2',
				title: 'Stock Price Alert',
				description:
					'Scrapes financial pages hourly and dispatches alerts on sudden market fluctuations.',
				status: 'inactive',
				lastRun: 'Never',
				successRate: 95.8,
				author: 'Amaan',
				folderId: 'quick-scripts',
				apps: ['runner'],
				starred: false,
				shared: false,
				lastEdited: 'Never',
			},
			{
				id: 'wf-p3',
				title: 'Airtable DB Backup Sync',
				description:
					'Fetches operational ledger rows and creates backup files in structured sheets.',
				status: 'active',
				lastRun: '2 hours ago',
				successRate: 98.2,
				author: 'Amaan',
				folderId: 'sandbox-runs',
				apps: ['loop', 'link'],
				starred: true,
				shared: true,
				lastEdited: '2 hours ago',
			},
		],
	},
	'ai-lab': {
		folders: [
			{ id: 'ai-agents', name: 'AI Assistant Pipelines', color: 'bg-fuchsia-600' },
			{ id: 'ai-prompts', name: 'Prompt Chains', color: 'bg-primary-400' },
		],
		workflows: [
			{
				id: 'wf-a1',
				title: 'Customer Support Agent',
				description:
					'Auto-responds to queries using LLM logic with context from documents.',
				status: 'active',
				lastRun: '5 mins ago',
				successRate: 98.2,
				author: 'Amaan',
				folderId: 'ai-agents',
				apps: ['loop', 'runner', 'slack'],
				starred: true,
				shared: true,
				lastEdited: '5 mins ago',
			},
			{
				id: 'wf-a2',
				title: 'Auto Blogger Agent',
				description:
					'Researches hot topics and drafts formatted articles in the workspace directory.',
				status: 'inactive',
				lastRun: 'Never',
				successRate: 92.4,
				author: 'Amaan',
				folderId: 'ai-agents',
				apps: ['loop', 'link'],
				starred: false,
				shared: false,
				lastEdited: 'Never',
			},
			{
				id: 'wf-a3',
				title: 'Code Reviewer Bot',
				description: 'Scans PRs for syntax issues, formatting bugs, and security leaks.',
				status: 'active',
				lastRun: '1 hour ago',
				successRate: 100.0,
				author: 'Amaan',
				folderId: 'ai-prompts',
				apps: ['slack', 'link'],
				starred: true,
				shared: false,
				lastEdited: '1 hour ago',
			},
		],
	},
};

export default function WorkspaceListPage() {
	const { activeWorkspaceId } = useWorkflowShellStore();
	const { confirm } = useConfirm();

	const [folders, setFolders] = useState<IFolder[]>([]);
	const [workflows, setWorkflows] = useState<IWorkflow[]>([]);
	const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

	// Update folders and workflows state when workspace changes
	useEffect(() => {
		const currentData = workspaceData[activeWorkspaceId] || workspaceData['amaan-studio'];
		setFolders(currentData.folders);
		setWorkflows(currentData.workflows);

		// Expand the first folder and collapse the rest
		if (currentData.folders.length > 0) {
			const initialExpand: Record<string, boolean> = {};
			currentData.folders.forEach((f, idx) => {
				initialExpand[f.id] = idx === 0;
			});
			setExpandedFolders(initialExpand);
		}
	}, [activeWorkspaceId]);

	// Modals open states
	const [isCreateWorkflowOpen, setIsCreateWorkflowOpen] = useState(false);
	const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

	// Modal form states
	const [newWfTitle, setNewWfTitle] = useState('');
	const [newWfDesc, setNewWfDesc] = useState('');
	const [newWfFolderId, setNewWfFolderId] = useState<string>('');
	const [newWfApps, setNewWfApps] = useState<string[]>([]);

	const [newFolderName, setNewFolderName] = useState('');
	const [newFolderColor, setNewFolderColor] = useState('#4f46e5');

	const handleCreateWorkflow = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newWfTitle.trim()) return;

		const newWf: IWorkflow = {
			id: `wf-${Date.now()}`,
			title: newWfTitle.trim(),
			description: newWfDesc.trim() || 'No description provided.',
			status: 'inactive',
			lastRun: 'Never',
			successRate: 100.0,
			author: 'Amaan',
			folderId: newWfFolderId || null,
			apps: newWfApps.length > 0 ? newWfApps : ['loop'],
			starred: false,
			shared: false,
			lastEdited: 'Never',
		};

		setWorkflows((prev) => [newWf, ...prev]);

		// If folder selected, expand that folder
		if (newWfFolderId) {
			setExpandedFolders((prev) => ({ ...prev, [newWfFolderId]: true }));
		}

		// Reset inputs
		setNewWfTitle('');
		setNewWfDesc('');
		setNewWfFolderId('');
		setNewWfApps([]);
		setIsCreateWorkflowOpen(false);

		triggerToast(`Workflow "${newWf.title}" created successfully!`);
	};

	const handleCreateFolder = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newFolderName.trim()) return;

		const folderId = `folder-${Date.now()}`;
		const newFolder: IFolder = {
			id: folderId,
			name: newFolderName.trim(),
			color: newFolderColor,
		};

		setFolders((prev) => [...prev, newFolder]);
		setExpandedFolders((prev) => ({ ...prev, [folderId]: true }));

		// Reset inputs
		setNewFolderName('');
		setNewFolderColor('#4f46e5');
		setIsCreateFolderOpen(false);

		triggerToast(`Folder "${newFolder.name}" created successfully!`);
	};

	// Inline renaming state
	const [renamingId, setRenamingId] = useState<string | null>(null);
	const [renameValue, setRenameValue] = useState('');
	const renameInputRef = useRef<HTMLInputElement>(null);

	// Context menu active card
	const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

	// Filter and Search states
	const [activeTab, setActiveTab] = useState<'mine' | 'shared' | 'starred'>('mine');
	const [searchQuery, setSearchQuery] = useState('');
	const [showFilterDropdown, setShowFilterDropdown] = useState(false);
	const [isGridView, setIsGridView] = useState(true);

	const { isDarkTheme, setDarkModeStatus } = useDarkMode();

	// Default to light theme when this page mounts
	useEffect(() => {
		setDarkModeStatus(DARK_MODE.LIGHT);
	}, [setDarkModeStatus]);

	// Toast Success notification
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

	const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
		setToast({ message, type });
		setTimeout(() => setToast(null), 3000);
	};

	// Focus rename input on toggle
	useEffect(() => {
		if (renamingId && renameInputRef.current) {
			renameInputRef.current.focus();
			renameInputRef.current.select();
		}
	}, [renamingId]);

	// Close context menu on click outside
	useEffect(() => {
		const handleGlobalClick = () => {
			setActiveMenuId(null);
			setShowFilterDropdown(false);
		};
		window.addEventListener('click', handleGlobalClick);
		return () => window.removeEventListener('click', handleGlobalClick);
	}, []);

	// Default open menu state for "sasa" card as requested in the screenshot
	useEffect(() => {
		// Set active menu for 'wf-1' (sasa) on mount to match screenshot exactly
		setActiveMenuId('wf-1');
	}, []);

	// Filter logic
	const filteredWorkflows = useMemo(() => {
		return workflows.filter((w) => {
			// Tab filtering
			if (activeTab === 'starred' && !w.starred) return false;
			if (activeTab === 'shared' && !w.shared) return false;

			// Search query filtering
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				const matchTitle = w.title.toLowerCase().includes(query);
				const matchDesc = w.description.toLowerCase().includes(query);
				if (!matchTitle && !matchDesc) return false;
			}
			return true;
		});
	}, [workflows, activeTab, searchQuery]);

	// Group workflows by folder
	const folderGrouped = useMemo(() => {
		const grouped: Record<string, IWorkflow[]> = {};
		folders.forEach((f) => {
			grouped[f.id] = [];
		});
		filteredWorkflows.forEach((w) => {
			if (w.folderId && grouped[w.folderId]) {
				grouped[w.folderId].push(w);
			}
		});
		return grouped;
	}, [filteredWorkflows, folders]);

	// Actions
	const handleToggleStatus = (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setWorkflows((prev) =>
			prev.map((w) =>
				w.id === id ? { ...w, status: w.status === 'active' ? 'inactive' : 'active' } : w,
			),
		);
		const wf = workflows.find((w) => w.id === id);
		if (wf) {
			triggerToast(`Workflow status updated!`, 'success');
		}
	};

	const handleToggleStar = (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, starred: !w.starred } : w)));
	};

	const handleRunNow = (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		const wf = workflows.find((w) => w.id === id);
		triggerToast(`Running "${wf?.title || 'workflow'}"...`, 'info');
		setTimeout(() => {
			triggerToast(`Workflow "${wf?.title || 'workflow'}" run successful!`, 'success');
		}, 1500);
	};

	const handleDuplicate = (workflow: IWorkflow, e: React.MouseEvent) => {
		e.stopPropagation();
		const copy: IWorkflow = {
			...workflow,
			id: `wf-${Date.now()}`,
			title: `${workflow.title} (Copy)`,
			lastRun: 'Never',
			lastEdited: 'Never',
			status: 'inactive',
		};
		setWorkflows((prev) => [...prev, copy]);
		triggerToast(`Duplicated "${workflow.title}"`);
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
		setWorkflows((prev) => prev.filter((w) => w.id !== id));
		if (wf) {
			triggerToast(`Deleted workflow "${wf.title}"`, 'info');
		}
	};

	const handleRenameSubmit = (id: string) => {
		if (renameValue.trim()) {
			setWorkflows((prev) =>
				prev.map((w) => (w.id === id ? { ...w, title: renameValue.trim() } : w)),
			);
			triggerToast('Workflow renamed successfully!');
		}
		setRenamingId(null);
	};

	return (
		<div
			className={`flex h-screen w-screen overflow-hidden ${isDarkTheme ? 'dark text-zinc-150 bg-[#0a0b10]' : 'bg-[#f8f9fc] text-slate-800'}`}>
			{/* Left Workspace Sidebar */}
			<WorkspaceSidebar />

			{/* Main Workspace Dashboard Content Panel */}
			<Wrapper className='relative flex min-w-0 flex-1 flex-col overflow-y-auto border-none! bg-[#f8f9fc] font-sans md:border-s-0! dark:bg-[#0a0b10]'>
				{/* Top ambient color glows */}
				<div className='pointer-events-none absolute top-0 right-10 -z-10 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-primary-400/5 to-blue-500/5 blur-[120px]' />
				<div className='pointer-events-none absolute bottom-10 left-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-primary-400/5 to-cyan-500/5 blur-[100px]' />

				{/* Toast Notifications */}
				<AnimatePresence>
					{toast && (
						<motion.div
							initial={{ opacity: 0, y: -20, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: -20, scale: 0.95 }}
							className='fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-2xl border border-primary-500/20 bg-white/90 px-4 py-3 shadow-2xl backdrop-blur-md dark:bg-zinc-900/90'>
							{toast.type === 'success' ? (
								<div className='flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500'>
									<Check size={14} className='stroke-[3]' />
								</div>
							) : (
								<div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-500'>
									<Activity size={14} className='stroke-[3]' />
								</div>
							)}
							<span className='text-slate-850 text-xs font-black dark:text-zinc-200'>
								{toast.message}
							</span>
						</motion.div>
					)}
				</AnimatePresence>

				{/* MAIN PADDED CONTAINER */}
				<div className='mx-auto w-full max-w-7xl flex-1 space-y-6 p-6 md:p-8'>
					{/* TOP HEADER SECTION */}
					<header className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
						{/* Title block */}
						<div className='flex items-center gap-3'>
							<h1 className='text-[26px] font-black tracking-tight text-slate-900 dark:text-white'>
								Workflows
							</h1>
							<div className='mt-1 flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-zinc-500'>
								<Cloud size={14} className='text-slate-400 dark:text-zinc-500' />
								<span>Workspace auto-saved</span>
								<span>&bull;</span>
								<span>8 total nodes</span>
							</div>
							<span className='border-amber-250 ml-2 rounded-full border bg-amber-50 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-amber-700 uppercase dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400'>
								Draft
							</span>
						</div>

						{/* Action Controls */}
						<div className='flex items-center gap-2'>
							{/* Library View Pill */}
							<button className='flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 dark:border-zinc-800 dark:bg-[#11131c] dark:text-zinc-200 dark:hover:bg-zinc-800/60'>
								<svg
									className='h-3.5 w-3.5 text-primary-600'
									viewBox='0 0 24 24'
									fill='none'>
									<path
										d='M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26l1.48-1.48c-.46-.83-.72-1.78-.72-2.78 0-3.31 2.69-6 6-6zm6.76 1.74l-1.48 1.48c.46.83.72 1.78.72 2.78 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z'
										fill='currentColor'
									/>
								</svg>
								Library View
							</button>

							{/* Settings Sliders Icon */}
							<button className='hover:text-slate-750 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-[#11131c] dark:text-zinc-400 dark:hover:bg-zinc-800/60'>
								<Sliders size={15} />
							</button>

							{/* Theme Toggle Button */}
							<button
								onClick={() =>
									setDarkModeStatus(
										isDarkTheme ? DARK_MODE.LIGHT : DARK_MODE.DARK,
									)
								}
								className='hover:text-slate-750 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-[#11131c] dark:text-zinc-400 dark:hover:bg-zinc-800/60'>
								{isDarkTheme ? <Sun size={15} /> : <Moon size={15} />}
							</button>

							{/* Save Button */}
							<button className='flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-[#11131c] dark:text-zinc-200 dark:hover:bg-zinc-800/60'>
								<Check size={14} className='stroke-[3] text-emerald-500' />
								Save
							</button>

							{/* Publish Button */}
							<button className='border-emerald-250 flex h-9 items-center gap-1.5 rounded-full border bg-emerald-50 px-4 text-xs font-black text-emerald-700 shadow-sm transition hover:bg-emerald-100/60 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'>
								<svg className='h-3.5 w-3.5 fill-current' viewBox='0 0 24 24'>
									<path d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z' />
								</svg>
								Publish
							</button>

							{/* Create Workflow Button */}
							<button
								onClick={() => setIsCreateWorkflowOpen(true)}
								className='flex h-9 items-center gap-1.5 rounded-full bg-teal-600 px-4 text-xs font-black text-white shadow-md shadow-teal-500/10 transition hover:bg-teal-500 active:scale-95'>
								<Plus size={14} strokeWidth={3} />
								Create Workflow
							</button>
						</div>
					</header>

					{/* 4 STATS CARDS SECTION */}
					<section className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
						{/* Card 1: Active Workflows */}
						<div className='dark:border-zinc-800 relative flex min-h-[110px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:bg-[#11131c]'>
							<div>
								<span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
									Active Workflows
								</span>
								<span className='mt-2 block text-2xl font-black text-slate-900 dark:text-white'>
									4 / 8
								</span>
							</div>
							<span className='mt-1 block text-xs font-semibold text-slate-500 dark:text-zinc-400'>
								Running auto triggers
							</span>
							<div className='absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-xl border border-primary-100 bg-primary-50 text-primary-600 dark:border-primary-500/25 dark:bg-primary-400/10 dark:text-primary-400'>
								<Workflow size={14} />
							</div>
						</div>

						{/* Card 2: Runs */}
						<div className='dark:border-zinc-800 relative flex min-h-[110px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:bg-[#11131c]'>
							<div>
								<span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
									Runs (Last 24h)
								</span>
								<span className='mt-2 block text-2xl font-black text-slate-900 dark:text-white'>
									1,280
								</span>
							</div>
							<span className='dark:text-emerald-450 mt-1 block flex items-center gap-1 text-xs font-bold text-teal-600'>
								+14% spike today
							</span>
							<div className='absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-600 dark:border-teal-500/25 dark:bg-teal-500/10 dark:text-teal-400'>
								<HeartPulse size={14} />
							</div>
						</div>

						{/* Card 3: Avg Success Rate */}
						<div className='dark:border-zinc-800 relative flex min-h-[110px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:bg-[#11131c]'>
							<div>
								<span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
									Avg Success Rate
								</span>
								<span className='mt-2 block text-2xl font-black text-slate-900 dark:text-white'>
									98.7%
								</span>
							</div>
							<span className='mt-1 block text-xs font-semibold text-slate-500 dark:text-zinc-400'>
								Operational safety
							</span>
							<div className='absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400'>
								<ShieldCheck size={14} />
							</div>
						</div>

						{/* Card 4: Active Connections */}
						<div className='dark:border-zinc-800 relative flex min-h-[110px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:bg-[#11131c]'>
							<div>
								<span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
									Active Connections
								</span>
								<span className='mt-2 block text-2xl font-black text-slate-900 dark:text-white'>
									8 Linked Apps
								</span>
							</div>
							<span className='mt-1 block text-xs font-semibold text-slate-500 dark:text-zinc-400'>
								Oauth credentials active
							</span>
							<div className='absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400'>
								<Link2 size={14} />
							</div>
						</div>
					</section>

					{/* FILTERS & SEARCH ROW */}
					<div className='flex flex-col gap-4 border-t border-slate-200/60 pt-5 md:flex-row md:items-center md:justify-between dark:border-zinc-800'>
						{/* Tab Switches (Mine, Shared, Starred) */}
						<div className='flex items-center gap-1 self-start rounded-full border border-slate-200/75 bg-slate-100/60 p-1 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60'>
							{[
								{ id: 'mine', label: 'Mine' },
								{ id: 'shared', label: 'Shared with me' },
								{ id: 'starred', label: 'Starred' },
							].map((tab) => (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id as any)}
									className={`rounded-full px-4 py-1.5 text-xs font-black transition-all ${
										activeTab === tab.id
											? 'bg-white text-slate-900 shadow-sm dark:bg-[#11131c] dark:text-white'
											: 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
									}`}>
									{tab.label}
								</button>
							))}
						</div>

						{/* Search input and Action buttons */}
						<div className='flex flex-wrap items-center gap-2'>
							{/* Search input */}
							<div className='relative min-w-[240px]'>
								<Search className='absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-zinc-500' />
								<input
									type='text'
									placeholder='Search workflows...'
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className='h-9 w-full rounded-full border border-slate-200/80 bg-white pr-8 pl-9 text-xs font-semibold text-slate-900 placeholder-slate-400 transition outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/25 md:w-60 dark:border-zinc-800 dark:bg-[#11131c] dark:text-white dark:placeholder-zinc-500'
								/>
								{searchQuery ? (
									<button
										onClick={() => setSearchQuery('')}
										className='dark:hover:text-zinc-350 absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500'>
										<X size={12} />
									</button>
								) : (
									<span className='text-slate-350 dark:text-zinc-650 border-slate-150 dark:border-zinc-800 absolute top-1/2 right-3 -translate-y-1/2 rounded border px-1 py-0.5 text-[9px] font-bold'>
										⌘K
									</span>
								)}
							</div>

							{/* Filter Dropdown Toggle */}
							<div className='relative'>
								<button
									onClick={(e) => {
										e.stopPropagation();
										setShowFilterDropdown(!showFilterDropdown);
									}}
									className='flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-[#11131c] dark:text-zinc-200'>
									<Filter size={12} />
									<span>Filter</span>
									<ChevronDown
										size={11}
										className={`transition ${showFilterDropdown ? 'rotate-180' : ''}`}
									/>
								</button>

								<AnimatePresence>
									{showFilterDropdown && (
										<motion.div
											initial={{ opacity: 0, y: 8, scale: 0.95 }}
											animate={{ opacity: 1, y: 0, scale: 1 }}
											exit={{ opacity: 0, y: 8, scale: 0.95 }}
											className='dark:border-zinc-800 absolute right-0 z-40 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:bg-[#11131c]'
											onClick={(e) => e.stopPropagation()}>
											<div className='mb-1 border-b border-slate-100 px-2.5 py-1.5 text-[9px] font-black tracking-wider text-slate-400 uppercase dark:border-zinc-800 dark:text-zinc-500'>
												Filter Workflows
											</div>
											<button
												onClick={() => {
													const currentData =
														workspaceData[activeWorkspaceId] ||
														workspaceData['amaan-studio'];
													setWorkflows(currentData.workflows);
													setShowFilterDropdown(false);
												}}
												className='text-slate-655 dark:text-zinc-350 w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800/60'>
												Reset All Filters
											</button>
										</motion.div>
									)}
								</AnimatePresence>
							</div>

							{/* Grid/List views */}
							<div className='flex items-center rounded-full border border-slate-200/80 bg-slate-100/50 p-0.5 dark:border-zinc-800 dark:bg-zinc-900/50'>
								<button
									onClick={() => setIsGridView(true)}
									className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
										isGridView
											? 'bg-white text-slate-900 shadow-sm dark:bg-[#11131c] dark:text-white'
											: 'text-slate-400 dark:text-zinc-500'
									}`}>
									<LayoutGrid size={13} />
								</button>
								<button
									onClick={() => setIsGridView(false)}
									className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
										!isGridView
											? 'bg-white text-slate-900 shadow-sm dark:bg-[#11131c] dark:text-white'
											: 'text-slate-400 dark:text-zinc-500'
									}`}>
									<List size={13} />
								</button>
							</div>

							{/* + Folder button */}
							<button
								onClick={() => setIsCreateFolderOpen(true)}
								className='flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-[#11131c] dark:text-zinc-200'>
								<FolderPlus
									size={13}
									className='text-slate-400 dark:text-zinc-500'
								/>
								<span>Folder</span>
							</button>

							{/* + Create Workflow button (violet) */}
							<button
								onClick={() => setIsCreateWorkflowOpen(true)}
								className='bg-primary-400 flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-black text-primary-950 shadow-md shadow-primary-500/10 transition hover:bg-primary-500 active:scale-95'>
								<Plus size={14} strokeWidth={3} />
								Create Workflow
							</button>
						</div>
					</div>

					{/* ACCORDION FOLDERS & GRID SECTION */}
					<div className='space-y-4'>
						{folders.map((folder) => {
							const groupedItems = folderGrouped[folder.id] || [];
							const isExpanded = !!expandedFolders[folder.id];

							return (
								<div key={folder.id} className='space-y-3'>
									{/* Folder Header Row */}
									<button
										onClick={() =>
											setExpandedFolders((prev) => ({
												...prev,
												[folder.id]: !isExpanded,
											}))
										}
										className='dark:border-zinc-800 group flex w-full items-center justify-between rounded-2xl border border-slate-200/60 bg-white p-3.5 text-left shadow-sm transition select-none hover:bg-slate-50/50 dark:bg-[#11131c] dark:hover:bg-zinc-800/20'>
										<div className='flex items-center gap-3'>
											<span className='text-slate-400 transition group-hover:scale-105 dark:text-zinc-500'>
												{isExpanded ? (
													<ChevronDown size={14} />
												) : (
													<ChevronRight size={14} />
												)}
											</span>
											<div
												style={{ backgroundColor: folder.color }}
											className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm'>
												<Folder size={14} className='fill-white/10' />
											</div>
											<span className='text-slate-805 dark:text-zinc-250 text-xs font-black'>
												{folder.name}
											</span>
											<span className='rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400 dark:bg-zinc-900 dark:text-zinc-500'>
												{groupedItems.length}{' '}
												{groupedItems.length === 1
													? 'workflow'
													: 'workflows'}
											</span>
										</div>
									</button>

									{/* Folder cards grid (or list if toggled) */}
									<AnimatePresence initial={false}>
										{isExpanded && (
											<motion.div
												initial={{ height: 0, opacity: 0 }}
												animate={{ height: 'auto', opacity: 1 }}
												exit={{ height: 0, opacity: 0 }}
												transition={{ duration: 0.22 }}
												className='overflow-hidden'>
												{groupedItems.length === 0 ? (
													<div className='dark:text-zinc-550 dark:border-zinc-800 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400'>
														No workflows in this folder matching your
														current filters.
													</div>
												) : isGridView ? (
													<div className='grid grid-cols-1 gap-6 pt-1 pb-4 md:grid-cols-2 lg:grid-cols-3'>
														{groupedItems.map((wf) => {
															return (
																<div
																	key={wf.id}
																	className='dark:border-zinc-800 hover:border-slate-350 group/card relative flex min-h-[220px] flex-col justify-between rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition duration-200 hover:shadow-md dark:bg-[#11131c] dark:hover:border-zinc-700'>
																	{/* Card Top Row: Apps Stack + Star & Menu */}
																	<div className='flex items-center justify-between'>
																		{/* App Icons overlapping stack */}
																		<div className='flex items-center -space-x-1.5'>
																			{wf.apps.map((app) => (
																				<AppBrandIcon
																					key={app}
																					name={app}
																				/>
																			))}
																		</div>

																		{/* Card actions */}
																		<div
																			className='flex items-center gap-1'
																			onClick={(e) =>
																				e.stopPropagation()
																			}>
																			<button
																				onClick={(e) =>
																					handleToggleStar(
																						wf.id,
																						e,
																					)
																				}
																				className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
																					wf.starred
																						? 'text-amber-500'
																						: 'text-slate-350 dark:text-zinc-650 dark:hover:text-zinc-450 hover:text-slate-500'
																				}`}>
																				{wf.starred ? (
																					<span className='text-base select-none'>
																						★
																					</span>
																				) : (
																					<span className='text-lg select-none'>
																						☆
																					</span>
																				)}
																			</button>

																			{/* 3-dots Menu Button */}
																			<div className='relative'>
																				<button
																					onClick={(
																						e,
																					) => {
																						e.stopPropagation();
																						setActiveMenuId(
																							activeMenuId ===
																								wf.id
																								? null
																								: wf.id,
																						);
																					}}
																					className={`hover:text-slate-650 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 dark:hover:bg-zinc-800 ${
																						activeMenuId ===
																						wf.id
																							? 'bg-slate-100 dark:bg-zinc-800'
																							: ''
																					}`}>
																					<MoreVertical
																						size={14}
																					/>
																				</button>

																				{/* Context Menu Dropdown */}
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
																							className='absolute right-0 z-50 mt-1.5 w-40 rounded-xl border border-slate-200 bg-white/95 p-1 text-left font-sans shadow-2xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95'>
																							<button
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
																								className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800'>
																								<Play
																									size={
																										11
																									}
																									className='fill-emerald-500/20 text-emerald-500'
																								/>
																								Run
																								Now
																							</button>
																							<button
																								onClick={() => {
																									setActiveMenuId(
																										null,
																									);
																									triggerToast(
																										'Opening visual canvas editor...',
																										'info',
																									);
																								}}
																								className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800'>
																								<Edit3
																									size={
																										11
																									}
																									className='text-primary-500'
																								/>
																								Open
																								Editor
																							</button>
																							<button
																								onClick={() => {
																									setRenameValue(
																										wf.title,
																									);
																									setRenamingId(
																										wf.id,
																									);
																									setActiveMenuId(
																										null,
																									);
																								}}
																								className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800'>
																								<Folder className='h-3 w-3 text-slate-400' />
																								Rename
																							</button>
																							<button
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
																								className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800'>
																								<Copy
																									size={
																										11
																									}
																									className='text-slate-400'
																								/>
																								Duplicate
																							</button>
																							<button
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
																								className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-black text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20'>
																								<Trash2
																									size={
																										11
																									}
																									className='text-rose-500'
																								/>
																								Delete
																							</button>
																						</motion.div>
																					)}
																				</AnimatePresence>
																			</div>
																		</div>
																	</div>

																	{/* Card Title & Desc */}
																	<div className='mt-4 flex-1'>
																		{renamingId === wf.id ? (
																			<div
																				className='flex items-center gap-1.5'
																				onClick={(e) =>
																					e.stopPropagation()
																				}>
																				<input
																					ref={
																						renameInputRef
																					}
																					value={
																						renameValue
																					}
																					onChange={(e) =>
																						setRenameValue(
																							e.target
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
																					className='dark:bg-zinc-150 h-8 shrink-0 rounded-lg bg-slate-900 px-3 text-[10px] font-black text-white dark:text-slate-950'>
																					Save
																				</button>
																			</div>
																		) : (
																			<h3 className='text-slate-850 hover:text-primary-600 cursor-pointer text-sm font-black transition select-none dark:text-white dark:hover:text-primary-400'>
																				{wf.title}
																			</h3>
																		)}
																		<p className='mt-1.5 line-clamp-3 text-xs leading-relaxed font-semibold text-slate-400 select-none dark:text-zinc-500'>
																			{wf.description}
																		</p>
																	</div>

																	{/* Card Success metrics & Sparkline graph */}
																	<div className='mt-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800'>
																		<div className='flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-600 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400'>
																			<Check
																				size={11}
																				className='stroke-[3]'
																			/>
																			<span>
																				{wf.successRate}%
																				success
																			</span>
																		</div>

																		{/* Wavy line sparkline */}
																		<Sparkline />
																	</div>

																	{/* Card Bottom row: Author details & shared state & switch */}
																	<div className='mt-3 flex items-center justify-between'>
																		<div className='flex items-center gap-2'>
																			<div className='dark:text-zinc-350 flex h-6 w-6 items-center justify-center rounded-full border border-slate-300/35 bg-slate-200 text-[9px] font-black text-slate-700 uppercase select-none dark:bg-zinc-800'>
																				{wf.author.slice(
																					0,
																					1,
																				)}
																			</div>
																			<span className='text-slate-450 text-[10px] font-bold dark:text-zinc-500'>
																				{wf.author} &bull;{' '}
																				{wf.lastRun}
																			</span>
																		</div>

																		<div
																			className='flex items-center gap-2.5'
																			onClick={(e) =>
																				e.stopPropagation()
																			}>
																			{wf.shared && (
																				<span className='text-slate-450 flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-black tracking-wider uppercase dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500'>
																					<svg
																						className='h-2.5 w-2.5 fill-current'
																						viewBox='0 0 24 24'>
																						<path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z' />
																					</svg>
																					Shared
																				</span>
																			)}

																			{/* iOS Style Switch Status Toggle */}
																			<button
																				onClick={(e) =>
																					handleToggleStatus(
																						wf.id,
																						e,
																					)
																				}
																				className={`h-5 w-9 rounded-full p-0.5 transition duration-200 ${
																					wf.status ===
																					'active'
																						? 'bg-blue-600 dark:bg-blue-500'
																						: 'bg-slate-250 dark:bg-zinc-800'
																				}`}>
																				<div
																					className={`h-4 w-4 rounded-full bg-white shadow-sm transition duration-200 ${
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
															);
														})}
													</div>
												) : (
													/* List View Table Layout inside Folder */
													<div className='dark:border-zinc-800 overflow-hidden rounded-2xl border border-slate-200/60 bg-white pt-1 shadow-sm dark:bg-[#11131c]'>
														<table className='w-full border-collapse text-left text-xs'>
															<thead>
																<tr className='dark:border-zinc-800 border-b border-slate-100 bg-slate-50/50 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-zinc-900/30 dark:text-zinc-500'>
																	<th className='px-5 py-3'>
																		Workflow Name
																	</th>
																	<th className='px-5 py-3'>
																		Integrations
																	</th>
																	<th className='px-5 py-3'>
																		Last Run
																	</th>
																	<th className='px-5 py-3'>
																		Success Rate
																	</th>
																	<th className='px-5 py-3 text-right'>
																		Actions
																	</th>
																</tr>
															</thead>
															<tbody className='dark:divide-zinc-800 divide-y divide-slate-100'>
																{groupedItems.map((wf) => (
																	<tr
																		key={wf.id}
																		className='hover:bg-slate-50/55 dark:hover:bg-zinc-800/10'>
																		<td className='text-slate-805 dark:text-zinc-250 px-5 py-3 font-extrabold'>
																			{wf.title}
																		</td>
																		<td className='px-5 py-3'>
																			<div className='flex items-center gap-1'>
																				{wf.apps.map(
																					(app) => (
																						<span
																							key={
																								app
																							}
																							className='rounded bg-slate-100 px-2 py-0.5 text-[10px] capitalize dark:bg-zinc-800'>
																							{app}
																						</span>
																					),
																				)}
																			</div>
																		</td>
																		<td className='text-slate-450 px-5 py-3 dark:text-zinc-500'>
																			{wf.lastRun}
																		</td>
																		<td className='px-5 py-3 font-bold text-emerald-600'>
																			{wf.successRate}%
																		</td>
																		<td className='px-5 py-3 text-right'>
																			<button
																				onClick={(e) =>
																					handleRunNow(
																						wf.id,
																						e,
																					)
																				}
																				className='mr-3 text-xs font-black text-blue-600 hover:text-blue-500 dark:text-blue-400'>
																				Run
																			</button>
																			<button
																				onClick={(e) =>
																					handleDelete(
																						wf.id,
																						e,
																					)
																				}
																				className='text-xs font-black text-rose-600 hover:text-rose-500'>
																				Delete
																			</button>
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

				{/* MODALS SECTION */}
				<AnimatePresence>
					{/* Create Workflow Modal */}
					{isCreateWorkflowOpen && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 font-sans backdrop-blur-xs dark:bg-black/60'
							onClick={() => setIsCreateWorkflowOpen(false)}>
							<motion.div
								initial={{ scale: 0.95, y: 15 }}
								animate={{ scale: 1, y: 0 }}
								exit={{ scale: 0.95, y: 15 }}
								transition={{ duration: 0.2 }}
								className='dark:border-zinc-800 relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:bg-[#11131c]'
								onClick={(e) => e.stopPropagation()}>
								<button
									onClick={() => setIsCreateWorkflowOpen(false)}
									className='hover:text-slate-650 dark:hover:text-zinc-350 absolute top-4 right-4 text-slate-400 transition dark:text-zinc-500'>
									<X size={18} />
								</button>

								<h3 className='mb-5 flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white'>
									<Workflow className='h-5 w-5 text-primary-600' />
									Create Workflow
								</h3>

								<form onSubmit={handleCreateWorkflow} className='space-y-4'>
									<div>
										<label className='mb-1.5 block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
											Workflow Name
										</label>
										<input
											type='text'
											required
											placeholder='e.g. Lead Sync Manager'
											value={newWfTitle}
											onChange={(e) => setNewWfTitle(e.target.value)}
											className='dark:border-zinc-805 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-900 transition outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/25 dark:bg-zinc-900 dark:text-white'
										/>
									</div>

									<div>
										<label className='mb-1.5 block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
											Description
										</label>
										<textarea
											placeholder='e.g. Syncs signup details to Slack...'
											value={newWfDesc}
											onChange={(e) => setNewWfDesc(e.target.value)}
											rows={3}
											className='dark:border-zinc-805 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-semibold text-slate-900 transition outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/25 dark:bg-zinc-900 dark:text-white'
										/>
									</div>

									<div>
										<label className='mb-1.5 block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
											Assign to Folder
										</label>
										<select
											value={newWfFolderId}
											onChange={(e) => setNewWfFolderId(e.target.value)}
											className='dark:border-zinc-805 text-slate-905 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold transition outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/25 dark:bg-zinc-900 dark:text-white'>
											<option value=''>No Folder (Root level)</option>
											{folders.map((f) => (
												<option key={f.id} value={f.id}>
													{f.name}
												</option>
											))}
										</select>
									</div>

									<div>
										<label className='mb-2 block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
											Select App Integrations
										</label>
										<div className='flex flex-wrap gap-2'>
											{['loop', 'runner', 'slack', 'link'].map((app) => {
												const isSelected = newWfApps.includes(app);
												return (
													<button
														key={app}
														type='button'
														onClick={() => {
															setNewWfApps((prev) =>
																isSelected
																	? prev.filter((a) => a !== app)
																	: [...prev, app],
															);
														}}
														className={`rounded-full border px-3 py-1.5 text-[10px] font-black tracking-wider uppercase transition ${
															isSelected
																? 'border-primary-200 text-primary-700 bg-primary-50 dark:border-primary-500/25 dark:bg-primary-400/10 dark:text-primary-400'
																: 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-zinc-800 dark:bg-[#11131c] dark:text-zinc-400 dark:hover:bg-zinc-800/40'
														}`}>
														{app}
													</button>
												);
											})}
										</div>
									</div>

									<div className='flex items-center justify-end gap-2.5 pt-2'>
										<button
											type='button'
											onClick={() => setIsCreateWorkflowOpen(false)}
											className='h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-[#11131c] dark:text-zinc-200'>
											Cancel
										</button>
										<button
											type='submit'
											className='bg-primary-400 hover:bg-primary-500 h-10 rounded-xl px-4 text-xs font-black text-primary-950 transition'>
											Create Workflow
										</button>
									</div>
								</form>
							</motion.div>
						</motion.div>
					)}

					{/* Create Folder Modal */}
					{isCreateFolderOpen && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 font-sans backdrop-blur-xs dark:bg-black/60'
							onClick={() => setIsCreateFolderOpen(false)}>
							<motion.div
								initial={{ scale: 0.95, y: 15 }}
								animate={{ scale: 1, y: 0 }}
								exit={{ scale: 0.95, y: 15 }}
								transition={{ duration: 0.2 }}
								className='dark:border-zinc-800 relative w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:bg-[#11131c]'
								onClick={(e) => e.stopPropagation()}>
								<button
									onClick={() => setIsCreateFolderOpen(false)}
									className='hover:text-slate-655 dark:hover:text-zinc-350 absolute top-4 right-4 text-slate-400 transition dark:text-zinc-500'>
									<X size={18} />
								</button>

								<h3 className='mb-5 flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white'>
									<FolderPlus className='h-5 w-5 text-primary-600' />
									Create Folder
								</h3>

								<form onSubmit={handleCreateFolder} className='space-y-4'>
									<div>
										<label className='mb-1.5 block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
											Folder Name
										</label>
										<input
											type='text'
											required
											placeholder='e.g. Lead Processing'
											value={newFolderName}
											onChange={(e) => setNewFolderName(e.target.value)}
											className='h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-900 transition outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/25 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white'
										/>
									</div>

									<div>
										<label className='mb-2 block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
											Select Theme Color
										</label>
										<div className='flex items-center gap-2'>
											{[
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
											].map((color) => {
												const isSelected = newFolderColor === color.value;
												return (
													<button
														key={color.value}
														type='button'
														title={color.label}
														onClick={() =>
															setNewFolderColor(color.value)
														}
														style={{ backgroundColor: color.value }}
														className={`h-7 w-7 rounded-full border-2 transition ${
															isSelected
																? 'scale-110 border-slate-800 shadow-md dark:border-white'
																: 'border-transparent hover:scale-105'
														}`}
													/>
												);
											})}
										</div>
									</div>

									<div className='flex items-center justify-end gap-2.5 pt-2'>
										<button
											type='button'
											onClick={() => setIsCreateFolderOpen(false)}
											className='h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-[#11131c] dark:text-zinc-200'>
											Cancel
										</button>
										<button
											type='submit'
											className='bg-primary-400 h-10 rounded-xl px-4 text-xs font-black text-primary-950 transition hover:bg-primary-500'>
											Create Folder
										</button>
									</div>
								</form>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</Wrapper>
		</div>
	);
}
