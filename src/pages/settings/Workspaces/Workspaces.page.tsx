import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Search,
	Plus,
	MoreVertical,
	LogOut,
	Sun,
	Moon,
	Trash2,
	Edit2,
	UserPlus,
	ArrowRight,
	Zap,
	Info,
	Check,
	X,
	Layers,
	Cpu,
	Crown,
} from 'lucide-react';
import useDarkMode from '@/hooks/useDarkMode';
import DARK_MODE from '@/constants/darkMode.constant';
import { LogoLight, LogoDark } from '@/assets/images';
import { useAuth } from '@/context/authContext';
import type { TWorkspace } from '@/types/workspace.type';
import { useWorkflowShellStore } from '@/store/workflowShell.store';

import {
	useWorkspaces,
	useCreateWorkspace,
	useUpdateWorkspace,
	useDeleteWorkspace,
	useLeaveWorkspace,
} from '@/api/modules/workspaces';
import Spinner from '@/components/ui/Spinner';
import { useConfirm } from '@/context/confirmContext';

// ─── helpers ───────────────────────────────────────────────────────────────────
const getInitials = (name: string) =>
	name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();

const slugify = (v: string) =>
	v
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

// ─── types ─────────────────────────────────────────────────────────────────────
interface ITeammate {
	name: string;
	initials: string;
	color: string;
}

interface IWorkspaceCard {
	id: string;
	name: string;
	tier: 'Free' | 'Pro' | 'Enterprise';
	role: 'Owner' | 'Admin' | 'Member';
	activeFlowsCount: number;
	totalNodes: number;
	activeAgentsCount: number;
	members: ITeammate[];
	gradientFrom: string;
	gradientTo: string;
	accentColor: string;
	lastActive: string;
	hasActiveRuns: boolean;
}

interface IInvitation {
	id: string;
	name: string;
	inviter: string;
	membersCount: number;
	gradientFrom: string;
	gradientTo: string;
}

const GRADIENTS = [
	{ from: '#ff7a59', to: '#ff4d8d', accent: 'oklch(0.7 0.2 25)' },
	{ from: '#ff6a3d', to: '#ff9a3d', accent: 'oklch(0.72 0.2 30)' },
	{ from: '#7c5cff', to: '#b06cff', accent: 'oklch(0.66 0.21 292)' },
	{ from: '#16d6c5', to: '#0ea5a0', accent: 'oklch(0.78 0.15 168)' },
	{ from: '#f12711', to: '#f5af19', accent: 'oklch(0.74 0.18 42)' },
	{ from: '#8e2de2', to: '#4a00e0', accent: 'oklch(0.55 0.22 292)' },
];

const THEME_OPTIONS = [
	{ label: 'Sunset', from: '#ff7a59', to: '#ff4d8d' },
	{ label: 'Cosmic', from: '#7c5cff', to: '#b06cff' },
	{ label: 'Neon', from: '#00c6ff', to: '#0072ff' },
	{ label: 'Forest', from: '#11998e', to: '#38ef7d' },
	{ label: 'Lemon', from: '#f12711', to: '#f5af19' },
	{ label: 'Cyber', from: '#8e2de2', to: '#4a00e0' },
];

const TABS = [
	{ id: 'all', label: 'All Workspaces' },
	{ id: 'active', label: 'Active Flows' },
	{ id: 'premium', label: 'Premium' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const PLAN_TIERS = [
	{ name: 'Free', desc: 'Free forever. Basic features.' },
	{ name: 'Pro', desc: '$15/mo. Team collaboration.' },
	{ name: 'Enterprise', desc: 'Custom. Advanced SLA.' },
] as const;

type TierName = (typeof PLAN_TIERS)[number]['name'];

// ─── mapping ───────────────────────────────────────────────────────────────────
const mapApiWorkspaceToCard = (w: TWorkspace, currentUserId?: string): IWorkspaceCard => {
	const index = w.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
	const g = GRADIENTS[index % GRADIENTS.length];

	let role: 'Owner' | 'Admin' | 'Member' = 'Member';
	if (w.role === 'owner') role = 'Owner';
	else if (w.role === 'admin') role = 'Admin';
	else if (w.owner?.id && currentUserId && w.owner.id === currentUserId) role = 'Owner';

	const tier: TierName = role === 'Owner' ? 'Enterprise' : role === 'Admin' ? 'Pro' : 'Free';

	const members: ITeammate[] = w.owner
		? [
				{
					name: w.owner.name,
					initials: getInitials(w.owner.name),
					color: 'bg-primary-400',
				},
			]
		: [];

	let lastActive = 'Active now';
	if (w.created_at) {
		const diffMins = Math.floor((Date.now() - new Date(w.created_at).getTime()) / 60000);
		if (diffMins < 1) lastActive = 'Created just now';
		else if (diffMins < 60) lastActive = `Active ${diffMins}m ago`;
		else {
			const diffHours = Math.floor(diffMins / 60);
			lastActive =
				diffHours < 24
					? `Active ${diffHours}h ago`
					: `Active ${Math.floor(diffHours / 24)}d ago`;
		}
	}

	return {
		id: w.id,
		name: w.name,
		tier,
		role,
		activeFlowsCount: w.workflows_count ?? 0,
		totalNodes: 0,
		activeAgentsCount: w.agents_count ?? 0,
		members,
		gradientFrom: g.from,
		gradientTo: g.to,
		accentColor: g.accent,
		lastActive,
		hasActiveRuns: (w as any).has_active_runs ?? false,
	};
};

// ─── component ─────────────────────────────────────────────────────────────────
const WorkspacesPage = () => {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const { isDarkTheme, setDarkModeStatus } = useDarkMode();
	const { setActiveWorkspaceId } = useWorkflowShellStore();
	const { userData } = useAuth();
	const { confirm } = useConfirm();

	// API
	const { data: workspacesResponse, isLoading } = useWorkspaces();
	const createWorkspaceMutation = useCreateWorkspace();
	const updateWorkspaceMutation = useUpdateWorkspace();
	const deleteWorkspaceMutation = useDeleteWorkspace();
	const leaveWorkspaceMutation = useLeaveWorkspace();

	const [invitations, setInvitations] = useState<IInvitation[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<TabId>('all');
	const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(
		() => searchParams.get('create') === 'true',
	);
	const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
	const [selectedWorkspace, setSelectedWorkspace] = useState<IWorkspaceCard | null>(null);

	// Create form state
	const [newWspName, setNewWspName] = useState('');
	const [newWspSlug, setNewWspSlug] = useState('');
	const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
	const [newWspTier, setNewWspTier] = useState<TierName>('Free');
	const [newWspThemeIdx, setNewWspThemeIdx] = useState(0);
	const [renameWspName, setRenameWspName] = useState('');

	const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Clean ?create=true from the URL after reading it into state on mount
	useEffect(() => {
		if (searchParams.get('create') !== 'true') return;
		const newParams = new URLSearchParams(searchParams);
		newParams.delete('create');
		setSearchParams(newParams, { replace: true });
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				searchInputRef.current?.focus();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	useEffect(() => {
		const handleGlobalClick = () => setActiveMenuId(null);
		window.addEventListener('click', handleGlobalClick);
		return () => window.removeEventListener('click', handleGlobalClick);
	}, []);

	const workspaces = useMemo(
		() => (workspacesResponse?.data ?? []).map((w: TWorkspace) => mapApiWorkspaceToCard(w, userData?.id)),
		[workspacesResponse?.data, userData?.id],
	);

	const filteredWorkspaces = useMemo(() => {
		let result = workspaces;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			result = result.filter((w: IWorkspaceCard) => w.name.toLowerCase().includes(q));
		}
		if (selectedCategory === 'active') result = result.filter((w: IWorkspaceCard) => w.activeFlowsCount > 0);
		else if (selectedCategory === 'premium')
			result = result.filter((w: IWorkspaceCard) => w.tier === 'Pro' || w.tier === 'Enterprise');
		return result;
	}, [workspaces, searchQuery, selectedCategory]);

	const handleNameChange = (val: string) => {
		setNewWspName(val);
		if (!isSlugManuallyEdited) setNewWspSlug(slugify(val));
	};

	const handleSlugChange = (val: string) => {
		setNewWspSlug(slugify(val));
		setIsSlugManuallyEdited(true);
	};

	const resetCreateForm = () => {
		setNewWspName('');
		setNewWspSlug('');
		setIsSlugManuallyEdited(false);
		setNewWspTier('Free');
		setNewWspThemeIdx(0);
	};

	const closeCreateModal = () => {
		setIsCreateModalOpen(false);
		resetCreateForm();
	};

	const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
		setToast({ message, type });
		setTimeout(() => setToast(null), 3000);
	};

	const handleSelectWorkspace = (id: string) => {
		const name = workspaces.find((w: IWorkspaceCard) => w.id === id)?.name ?? 'workspace';
		triggerToast(`Entering workspace "${name}"...`, 'info');
		setActiveWorkspaceId(id);
		setTimeout(() => navigate('/dashboard'), 800);
	};

	const handleCreateWorkspace = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newWspName.trim() || !newWspSlug.trim()) return;
		try {
			const name = newWspName.trim();
			await createWorkspaceMutation.mutateAsync({ name, slug: newWspSlug.trim() });
			closeCreateModal();
			triggerToast(`Workspace "${name}" created!`);
		} catch {
			// handled by hook
		}
	};

	const handleRenameWorkspace = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!renameWspName.trim() || !selectedWorkspace) return;
		try {
			await updateWorkspaceMutation.mutateAsync({
				id: selectedWorkspace.id,
				body: { name: renameWspName.trim() },
			});
			setRenameWspName('');
			setSelectedWorkspace(null);
			setIsRenameModalOpen(false);
			triggerToast('Workspace renamed successfully');
		} catch {
			// handled by hook
		}
	};

	const handleDeleteWorkspace = async (id: string, name: string) => {
		const confirmed = await confirm({
			title: 'Delete Workspace',
			confirmText: 'Delete Workspace',
			message: (
				<>
					Are you sure you want to permanently delete workspace{' '}
					<strong className='font-semibold text-zinc-800 dark:text-zinc-200'>
						"{name}"
					</strong>
					? This action cannot be undone.
				</>
			),
		});
		if (!confirmed) return;
		try {
			await deleteWorkspaceMutation.mutateAsync(id);
			triggerToast(`Deleted workspace "${name}"`, 'info');
		} catch {
			// handled by hook
		}
	};

	const handleLeaveWorkspace = async (id: string, name: string) => {
		try {
			await leaveWorkspaceMutation.mutateAsync(id);
			triggerToast(`Left workspace "${name}"`, 'info');
		} catch {
			// handled by hook
		}
	};

	const handleAcceptInvite = (invite: IInvitation) => {
		setInvitations((prev) => prev.filter((i) => i.id !== invite.id));
		triggerToast(`Joined "${invite.name}" team workspace!`);
	};

	const handleDeclineInvite = (id: string, name: string) => {
		setInvitations((prev) => prev.filter((i) => i.id !== id));
		triggerToast(`Declined invitation from "${name}"`, 'info');
	};

	const userDisplayName =
		(userData as { name?: string } | null)?.name ??
		(userData as { email?: string } | null)?.email?.split('@')[0] ??
		'User';
	const userInitials = getInitials(userDisplayName);
	const selectedTheme = THEME_OPTIONS[newWspThemeIdx];

	return (
		<div className='relative min-h-screen overflow-x-hidden font-sans bg-zinc-50 text-slate-800 transition-colors duration-500 dark:bg-[#070911] dark:text-zinc-150'>
			<style>{`
				@keyframes wsGrow { from { transform: scaleY(0); } }
				@keyframes wsPulse {
					0%   { box-shadow: 0 0 0 0 rgba(139,92,246,0.5); }
					70%  { box-shadow: 0 0 0 9px transparent; }
					100% { box-shadow: 0 0 0 0 transparent; }
				}
				.ws-pulse-dot { animation: wsPulse 2s infinite; }
				.ws-btn-sheen { position: relative; overflow: hidden; }
				.ws-btn-sheen::after { content: ""; position: absolute; top: 0; left: -60%; width: 45%; height: 100%; transform: skewX(-20deg); background: linear-gradient(90deg,transparent,rgba(255,255,255,0.32),transparent); transition: left 0.6s cubic-bezier(0.22,0.61,0.36,1); }
				.ws-btn-sheen:hover::after { left: 130%; }
			`}</style>

			{/* ── Background Patterns ── */}
			<div className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] [background-size:24px_24px] opacity-70 dark:bg-[radial-gradient(#161c2c_1.5px,transparent_1.5px)] dark:opacity-85' />
			<div className='pointer-events-none absolute top-0 right-10 -z-10 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-primary-400/8 to-primary-500/0 blur-[120px]' />
			<div className='pointer-events-none absolute bottom-10 left-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-primary-400/4 to-cyan-500/4 blur-[100px]' />

			{/* ── Toast Notification ── */}
			<AnimatePresence>
				{toast && (
					<motion.div
						initial={{ opacity: 0, y: -20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -20, scale: 0.95 }}
						className='fixed top-6 right-6 z-[110] flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900'>
						<div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400'>
							<Check size={13} strokeWidth={3} />
						</div>
						<span className='text-xs font-bold text-slate-800 dark:text-zinc-200'>
							{toast.message}
						</span>
					</motion.div>
				)}
			</AnimatePresence>

			{/* ── Header Navigation ── */}
			<div className='sticky top-6 z-30 mx-auto w-[calc(100%-2rem)] max-w-7xl px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white/75 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60 shadow-sm'>
				{/* Brand Logo */}
				<div
					role='button'
					tabIndex={0}
					className='flex cursor-pointer items-center gap-3'
					onClick={() => navigate('/dashboard')}>
					<img
						src={isDarkTheme ? LogoDark : LogoLight}
						alt='agent1o1'
						className='h-[30px] w-auto'
					/>
					<span className='rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-zinc-850 dark:bg-zinc-950 dark:text-zinc-400'>
						v2.4
					</span>
				</div>

				{/* Navigation Right Actions */}
				<div className='flex items-center gap-3.5'>
					{/* Dark Mode Toggle */}
					<button
						onClick={() => setDarkModeStatus(isDarkTheme ? DARK_MODE.LIGHT : DARK_MODE.DARK)}
						className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200 transition-colors'>
						{isDarkTheme ? <Sun size={16} className='text-amber-400' /> : <Moon size={16} />}
					</button>

					{/* Profile / Account Indicator */}
					<div className='flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900'>
						<div className='flex h-7.5 w-7.5 items-center justify-center rounded-lg text-xs font-black text-primary-950 bg-gradient-to-tr from-primary-400 to-primary-400'>
							{userInitials}
						</div>
						<div className='hidden sm:block text-left'>
							<div className='text-xs leading-tight font-bold text-slate-800 dark:text-zinc-200'>
								{userDisplayName}
							</div>
							<div className='text-[10px] font-medium text-slate-400 dark:text-zinc-500'>
								Account
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* ── Main Content Area ── */}
			<main className='relative z-[1] mx-auto max-w-7xl px-6 pb-24 md:px-8'>
				{/* Hero Section */}
				<section className='mt-12 mb-10 flex flex-wrap items-end justify-between gap-8'>
					<div className='text-left'>
						<div className='mb-3 inline-flex items-center gap-2 text-xs font-black tracking-widest text-primary-600 uppercase dark:text-primary-400'>
							<span className='inline-block h-1.5 w-1.5 rounded-full bg-primary-400 dark:bg-primary-400 ring-2 ring-primary-500/30' />
							Workspace Orchestration
						</div>
						<h1 className='text-3.5xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-primary-400 via-primary-400 to-primary-600 dark:from-white dark:via-primary-300 dark:to-primary-400 bg-clip-text text-transparent leading-none'>
							Workspaces
						</h1>
						<p className='mt-3 max-w-xl text-xs sm:text-sm font-semibold text-slate-500 dark:text-zinc-400 leading-relaxed'>
							Welcome back! Select a workspace to orchestrate AI workflows, monitor live agents, or wire up new integrations.
						</p>
					</div>

					<button
						onClick={() => setIsCreateModalOpen(true)}
						className='ws-btn-sheen flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-primary-400 to-primary-400 px-6 text-xs font-bold text-primary-950 shadow-md shadow-primary-500/20 transition-all hover:brightness-110 active:scale-95'>
						<Plus size={16} strokeWidth={2.5} />
						Create Workspace
					</button>
				</section>

				{/* Toolbar (Filters & Search) */}
				<div className='mb-8 flex flex-wrap items-center justify-between gap-4'>
					{/* Category Tabs */}
					<div className='flex gap-1.5 rounded-xl border border-slate-200/60 bg-slate-100/60 p-1.5 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60'>
						{TABS.map((tab) => (
							<button
								key={tab.id}
								onClick={() => setSelectedCategory(tab.id)}
								className='relative z-10 cursor-pointer rounded-lg px-4.5 py-1.5 text-xs font-bold transition-colors duration-305'>
								{selectedCategory === tab.id && (
									<motion.div
										layoutId='activeTabBackground'
										className='absolute inset-0 z-[-1] rounded-lg border border-slate-200/40 bg-white dark:border-zinc-700/30 dark:bg-zinc-800 shadow-sm'
										transition={{ type: 'spring', stiffness: 380, damping: 30 }}
									/>
								)}
								<span className={selectedCategory === tab.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'}>
									{tab.label}
								</span>
							</button>
						))}
					</div>

					{/* Search Box */}
					<div className='group relative min-w-[280px] w-full md:w-80'>
						<Search className='absolute top-3 left-4 h-4 w-4 text-slate-400 transition-colors duration-200 group-focus-within:text-primary-500' />
						<input
							ref={searchInputRef}
							type='text'
							aria-label='Search workspaces'
							placeholder='Search workspaces…'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className='block h-10.5 w-full rounded-xl border border-slate-200/80 bg-white/70 pr-4 pl-11 text-xs font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:focus:border-primary-500 dark:focus:bg-zinc-900'
						/>
						{searchQuery ? (
							<button
								onClick={() => setSearchQuery('')}
								className='absolute top-3 right-4 text-slate-400 hover:text-rose-500 transition-colors'>
								<X size={14} />
							</button>
						) : (
							<kbd className='absolute top-2.5 right-4 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500'>
								⌘K
							</kbd>
						)}
					</div>
				</div>

				{/* Pending Invitations Section */}
				<AnimatePresence>
					{invitations.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className='mb-12'>
							<div className='mb-4 flex items-center gap-3'>
								<span className='ws-pulse-dot inline-block h-2 w-2 rounded-full bg-amber-500 shadow-sm' />
								<span className='text-[10px] font-black tracking-widest text-slate-400 dark:text-zinc-500 uppercase'>
									Pending Invitations · {invitations.length}
								</span>
								<div className='h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-zinc-800' />
							</div>

							<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
								{invitations.map((invite) => (
									<motion.div
										key={invite.id}
										whileHover={{ x: 3 }}
										className='relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/20 p-4 transition-all sm:flex-row sm:items-center dark:border-amber-900/30 dark:bg-amber-950/10'>
										<div
											className='absolute top-0 bottom-0 left-0 w-1'
											style={{
												background: `linear-gradient(to bottom, ${invite.gradientFrom}, ${invite.gradientTo})`,
											}}
										/>
										<div
											className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white'
											style={{
												background: `linear-gradient(135deg, ${invite.gradientFrom}, ${invite.gradientTo})`,
											}}>
											{invite.name.slice(0, 2).toUpperCase()}
										</div>
										<div className='flex-1 pl-2 sm:pl-0 text-left'>
											<div className='text-sm font-bold text-slate-800 dark:text-zinc-200'>
												{invite.name}
											</div>
											<div className='mt-0.5 text-xs text-slate-400 dark:text-zinc-500 font-semibold'>
												Invited by{' '}
												<span className='font-bold text-primary-600 dark:text-primary-400'>
													{invite.inviter}
												</span>{' '}
												• {invite.membersCount} members
											</div>
										</div>
										<div className='z-10 flex items-center gap-2 pl-2 sm:pl-0'>
											<button
												onClick={() => handleDeclineInvite(invite.id, invite.name)}
												className='flex h-8.5 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-600 transition-all hover:border-rose-500/50 hover:bg-rose-500/5 hover:text-rose-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-rose-950/20'>
												<X size={13} strokeWidth={2.5} /> Decline
											</button>
											<button
												onClick={() => handleAcceptInvite(invite)}
												className='ws-btn-sheen flex h-8.5 cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-400 to-primary-400 px-3.5 text-xs font-bold text-primary-950 shadow-sm transition-all hover:brightness-110'>
												<Check size={13} strokeWidth={3} /> Accept
											</button>
										</div>
									</motion.div>
								))}
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Workspaces Grid Section */}
				<div>
					<div className='mb-6 flex items-center gap-3'>
						<span className='text-[10px] font-black tracking-widest text-slate-400 dark:text-zinc-500 uppercase'>
							Available Workspaces · {filteredWorkspaces.length}
						</span>
						<div className='h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-zinc-800' />
					</div>

					{isLoading ? (
						<div className='flex flex-col items-center justify-center rounded-3xl border border-slate-200/60 bg-white p-20 dark:border-zinc-800/80 dark:bg-zinc-900/20'>
							<Spinner color='primary' className='h-8 w-8 text-primary-600 dark:text-primary-400' />
							<span className='mt-3 text-xs font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest'>
								Loading workspaces...
							</span>
						</div>
					) : filteredWorkspaces.length === 0 && searchQuery ? (
						<div className='flex flex-col items-center justify-center rounded-3xl border border-slate-200/60 bg-white p-20 text-center dark:border-zinc-800/80 dark:bg-zinc-900/20'>
							<Search size={32} className='mb-3 text-slate-300 dark:text-zinc-600' />
							<p className='text-sm font-bold text-slate-800 dark:text-zinc-200'>
								No workspaces match "{searchQuery}"
							</p>
							<button
								onClick={() => setSearchQuery('')}
								className='mt-3 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline'>
								Clear search
							</button>
						</div>
					) : (
						<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
							<AnimatePresence>
								{filteredWorkspaces.map((wsp: IWorkspaceCard, i: number) => (
									<WorkspaceCard
										key={wsp.id}
										wsp={wsp}
										index={i}
										activeMenuId={activeMenuId}
										onSelect={handleSelectWorkspace}
										onMenuToggle={(id) => setActiveMenuId(id)}
										onRename={(w: IWorkspaceCard) => {
											setSelectedWorkspace(w);
											setRenameWspName(w.name);
											setIsRenameModalOpen(true);
										}}
										onDelete={handleDeleteWorkspace}
										onLeave={handleLeaveWorkspace}
										onInvite={(name) => triggerToast(`Open members invite overlay for ${name}`, 'info')}
									/>
								))}
							</AnimatePresence>

							{/* Ghost card for "+ New Workspace" */}
							<motion.div
								key='add-ws'
								whileHover={{ y: -5 }}
								onClick={() => setIsCreateModalOpen(true)}
								className='group cursor-pointer rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-5 dark:border-zinc-800 dark:bg-[#10131e]/10 hover:border-primary-500/55 hover:bg-primary-500/[0.02] transition-all duration-300'>
								<div className='flex min-h-[260px] flex-col items-center justify-center text-center'>
									<div className='mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-primary-400 to-primary-400 text-primary-950 shadow-md shadow-primary-500/20 group-hover:rotate-90 transition-all duration-300'>
										<Plus size={20} strokeWidth={2.5} />
									</div>
									<b className='text-[15px] font-extrabold text-slate-800 dark:text-zinc-200'>
										New Workspace
									</b>
									<p className='mt-1 max-w-[180px] text-xs font-semibold text-slate-400 dark:text-zinc-500'>
										Spin up a fresh environment for your agents
									</p>
								</div>
							</motion.div>
						</div>
					)}
				</div>
			</main>

			{/* ── Create Modal ── */}
			<AnimatePresence>
				{isCreateModalOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs'
						onClick={closeCreateModal}>
						<motion.div
							initial={{ scale: 0.95, y: 15 }}
							animate={{ scale: 1, y: 0 }}
							exit={{ scale: 0.95, y: 15 }}
							transition={{ duration: 0.2 }}
							className='relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-zinc-800 dark:bg-[#0f111a]'
							onClick={(e) => e.stopPropagation()}>
							<button
								onClick={closeCreateModal}
								className='absolute top-6 right-6 cursor-pointer text-slate-400 hover:text-slate-650 dark:hover:text-zinc-200 transition-colors'>
								<X size={18} />
							</button>

							<h3 className='mb-6 text-lg font-black text-slate-900 dark:text-white text-left'>
								Create New Workspace
							</h3>

							<form onSubmit={handleCreateWorkspace} className='space-y-5'>
								<div>
									<ModalLabel>Workspace Name</ModalLabel>
									<input
										type='text'
										required
										aria-label='Workspace name'
										placeholder='e.g. Operations Department'
										value={newWspName}
										onChange={(e) => handleNameChange(e.target.value)}
										className='block h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-900 outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-primary-500 dark:focus:bg-zinc-950 transition-all'
									/>
								</div>

								<div>
									<ModalLabel>Workspace URL / Slug</ModalLabel>
									<div className='flex h-11 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950'>
										<span className='flex h-full items-center border-r border-slate-200 bg-slate-100 px-3 text-xs font-extrabold text-slate-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500'>
											linkflow.icu/
										</span>
										<input
											type='text'
											required
											aria-label='Workspace URL slug'
											placeholder='my-workspace'
											value={newWspSlug}
											onChange={(e) => handleSlugChange(e.target.value)}
											className='min-w-0 flex-1 bg-transparent px-3 text-xs font-semibold text-slate-900 dark:text-zinc-100 outline-none'
										/>
									</div>
								</div>

								{/* Live preview */}
								<div className='rounded-2xl border border-slate-150 bg-slate-50/50 p-4 dark:border-zinc-850 dark:bg-zinc-950/20'>
									<ModalLabel>Live Preview</ModalLabel>
									<div className='flex items-center gap-3'>
										<div
											className='flex h-11 w-11 items-center justify-center rounded-xl text-xs font-black text-white shadow-sm'
											style={{
												background: `linear-gradient(135deg, ${selectedTheme.from}, ${selectedTheme.to})`,
											}}>
											{getInitials(newWspName.trim() || 'New Workspace')}
										</div>
										<div className='text-left'>
											<div className='text-xs leading-tight font-black text-slate-800 dark:text-zinc-200'>
												{newWspName.trim() || 'Workspace Name'}
											</div>
											<div className='mt-0.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
												Plan: {newWspTier}
											</div>
										</div>
									</div>
								</div>

								{/* Plan tier */}
								<div>
									<ModalLabel>Workspace Plan Tier</ModalLabel>
									<div className='grid grid-cols-3 gap-2.5'>
										{PLAN_TIERS.map((tier) => {
											const isSelected = newWspTier === tier.name;
											return (
												<button
													key={tier.name}
													type='button'
													onClick={() => setNewWspTier(tier.name)}
													className={`flex cursor-pointer flex-col items-start rounded-xl p-3 text-left transition-all duration-200 border ${
														isSelected
															? tier.name === 'Enterprise'
																? 'border-primary-500/50 bg-primary-400/[0.06] dark:border-primary-500/40 dark:bg-primary-950/20'
																: tier.name === 'Pro'
																	? 'border-primary-500/50 bg-primary-400/[0.06] dark:border-primary-500/40 dark:bg-primary-950/20'
																	: 'border-slate-350 bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900'
															: 'border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950'
													}`}>
													<span className='text-xs font-black tracking-wider uppercase text-slate-850 dark:text-zinc-200'>
														{tier.name}
													</span>
													<span className='mt-1 text-[10px] leading-normal font-semibold text-slate-400 dark:text-zinc-550'>
														{tier.desc}
													</span>
												</button>
											);
										})}
									</div>
								</div>

								{/* Theme picker */}
								<div>
									<ModalLabel>Choose Theme</ModalLabel>
									<div className='grid grid-cols-6 gap-2.5'>
										{THEME_OPTIONS.map((item, i) => (
											<button
												key={item.label}
												type='button'
												aria-label={item.label}
												onClick={() => setNewWspThemeIdx(i)}
												title={item.label}
												className={`h-10 w-full cursor-pointer rounded-xl border transition-transform duration-200 ${
													newWspThemeIdx === i
														? 'scale-105 border-transparent ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-zinc-950'
														: 'border-transparent hover:scale-105'
												}`}
												style={{
													background: `linear-gradient(135deg, ${item.from}, ${item.to})`,
												}}
											/>
										))}
									</div>
								</div>

								{/* Footer Buttons */}
								<div className='flex items-center justify-end gap-2.5 pt-2'>
									<button
										type='button'
										onClick={closeCreateModal}
										className='cursor-pointer rounded-xl px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-650 dark:hover:text-zinc-200 transition-colors'>
										Cancel
									</button>
									<button
										type='submit'
										disabled={createWorkspaceMutation.isPending}
										className='ws-btn-sheen flex h-9.5 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-primary-400 to-primary-400 px-5 text-xs font-bold text-primary-950 shadow-md shadow-primary-500/20 transition-all hover:brightness-110 disabled:opacity-50'>
										{createWorkspaceMutation.isPending ? 'Creating...' : 'Create Workspace'}
									</button>
								</div>
							</form>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* ── Rename Modal ── */}
			<AnimatePresence>
				{isRenameModalOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs'
						onClick={() => setIsRenameModalOpen(false)}>
						<motion.div
							initial={{ scale: 0.95, y: 15 }}
							animate={{ scale: 1, y: 0 }}
							exit={{ scale: 0.95, y: 15 }}
							transition={{ duration: 0.2 }}
							className='relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-zinc-800 dark:bg-[#0f111a]'
							onClick={(e) => e.stopPropagation()}>
							<button
								onClick={() => setIsRenameModalOpen(false)}
								className='absolute top-6 right-6 cursor-pointer text-slate-400 hover:text-slate-650 dark:hover:text-zinc-200 transition-colors'>
								<X size={18} />
							</button>

							<h3 className='mb-6 text-lg font-black text-slate-900 dark:text-white text-left'>
								Rename Workspace
							</h3>

							<form onSubmit={handleRenameWorkspace} className='space-y-5'>
								<div>
									<ModalLabel>Workspace Name</ModalLabel>
									<input
										type='text'
										required
										aria-label='New workspace name'
										placeholder='e.g. Sales Department'
										value={renameWspName}
										onChange={(e) => setRenameWspName(e.target.value)}
										className='block h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-900 outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-primary-500 dark:focus:bg-zinc-950 transition-all'
									/>
								</div>

								{selectedWorkspace && (
									<div className='rounded-2xl border border-slate-150 bg-slate-50/50 p-4 dark:border-zinc-850 dark:bg-zinc-950/20'>
										<ModalLabel>Live Preview</ModalLabel>
										<div className='flex items-center gap-3'>
											<div
												className='flex h-11 w-11 items-center justify-center rounded-xl text-xs font-black text-white shadow-sm'
												style={{
													background: `linear-gradient(135deg, ${selectedWorkspace.gradientFrom}, ${selectedWorkspace.gradientTo})`,
												}}>
												{getInitials(renameWspName.trim() || 'WS')}
											</div>
											<div className='text-left'>
												<div className='text-xs leading-tight font-black text-slate-800 dark:text-zinc-200'>
													{renameWspName.trim() || 'Workspace Name'}
												</div>
												<div className='mt-0.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
													Plan: {selectedWorkspace.tier}
												</div>
											</div>
										</div>
									</div>
								)}

								<div className='flex items-center justify-end gap-2.5 pt-2'>
									<button
										type='button'
										onClick={() => setIsRenameModalOpen(false)}
										className='cursor-pointer rounded-xl px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-655 dark:hover:text-zinc-200 transition-colors'>
										Cancel
									</button>
									<button
										type='submit'
										disabled={updateWorkspaceMutation.isPending}
										className='ws-btn-sheen flex h-9.5 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-primary-400 to-primary-400 px-5 text-xs font-bold text-primary-950 shadow-md shadow-primary-500/20 transition-all hover:brightness-110 disabled:opacity-50'>
										{updateWorkspaceMutation.isPending ? 'Saving...' : 'Save'}
									</button>
								</div>
							</form>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

// ─── Modal Label Helper ────────────────────────────────────────────────────────
const ModalLabel = ({ children }: { children: React.ReactNode }) => (
	<label className='mb-2 block text-[10.5px] font-black tracking-wider uppercase text-slate-400 dark:text-zinc-500 text-left'>
		{children}
	</label>
);

// ─── Workspace Card Component ──────────────────────────────────────────────────
interface WorkspaceCardProps {
	wsp: IWorkspaceCard;
	index: number;
	activeMenuId: string | null;
	onSelect: (id: string) => void;
	onMenuToggle: (id: string | null) => void;
	onRename: (wsp: IWorkspaceCard) => void;
	onDelete: (id: string, name: string) => void;
	onLeave: (id: string, name: string) => void;
	onInvite: (name: string) => void;
}

const WorkspaceCard = ({
	wsp,
	index,
	activeMenuId,
	onSelect,
	onMenuToggle,
	onRename,
	onDelete,
	onLeave,
	onInvite,
}: WorkspaceCardProps) => {
	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{ duration: 0.3, delay: index * 0.05 }}
			whileHover={{ y: -5 }}
			onClick={() => onSelect(wsp.id)}
			className='group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_25px_rgba(0,0,0,0.01)] transition-all duration-300 dark:border-zinc-800/80 dark:bg-[#10131e]/50 hover:border-primary-500/30 hover:shadow-md hover:shadow-primary-500/20/[0.02]'>
			{/* Hover Accent Glow */}
			<div
				className='pointer-events-none absolute inset-[-30%] rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-[0.05] dark:group-hover:opacity-[0.08]'
				style={{
					background: `radial-gradient(circle, ${wsp.accentColor}, transparent 60%)`,
					filter: 'blur(50px)',
				}}
			/>

			{/* Top accent bar */}
			<div
				className='absolute top-0 right-0 left-0 h-[3px]'
				style={{
					background: `linear-gradient(to right, ${wsp.gradientFrom}, ${wsp.gradientTo})`,
				}}
			/>

			{/* Top bar header */}
			<div className='flex items-start justify-between mt-1'>
				{/* Avatar container */}
				<div className='relative shrink-0'>
					<div
						className='flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black text-white shadow-sm ring-1 ring-white/10'
						style={{
							background: `linear-gradient(135deg, ${wsp.gradientFrom}, ${wsp.gradientTo})`,
							boxShadow: `0 6px 16px -6px ${wsp.accentColor}`,
						}}>
						{getInitials(wsp.name)}
					</div>
					{wsp.hasActiveRuns && (
						<span className='absolute -top-1 -right-1 flex h-3 w-3'>
							<span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75'></span>
							<span className='relative inline-flex h-3 w-3 rounded-full border border-white bg-emerald-500 dark:border-zinc-950'></span>
						</span>
					)}
				</div>

				{/* Tier tag & option kebab menu */}
				<div className='flex items-center gap-2'>
					<span className='rounded-full border border-primary-100 bg-primary-50 px-2.5 py-0.5 text-[9px] font-black tracking-wide text-primary-600 uppercase dark:border-primary-900/30 dark:bg-primary-950/20 dark:text-primary-400 shadow-2xs'>
						{wsp.tier}
					</span>

					{/* Kebab Popover Dropdown */}
					<div className='relative'>
						<button
							aria-label='Workspace options'
							onClick={(e) => {
								e.stopPropagation();
								onMenuToggle(activeMenuId === wsp.id ? null : wsp.id);
							}}
							className='flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-transparent text-slate-400 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700 dark:hover:border-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-200 transition-colors'>
							<MoreVertical size={14} />
						</button>

						<AnimatePresence>
							{activeMenuId === wsp.id && (
								<motion.div
									initial={{ opacity: 0, scale: 0.95, y: 5 }}
									animate={{ opacity: 1, scale: 1, y: 0 }}
									exit={{ opacity: 0, scale: 0.95, y: 5 }}
									className='absolute right-0 z-50 mt-1.5 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900'>
									<button
										onClick={(e) => {
											e.stopPropagation();
											onMenuToggle(null);
											onRename(wsp);
										}}
										className='flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors'>
										<Edit2 size={12} className='text-primary-500' /> Rename
									</button>
									{wsp.role === 'Owner' ? (
										<button
											onClick={(e) => {
												e.stopPropagation();
												onMenuToggle(null);
												onDelete(wsp.id, wsp.name);
											}}
											className='flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955 dark:hover:bg-rose-950/20 transition-colors'>
											<Trash2 size={12} /> Delete
										</button>
									) : (
										<button
											onClick={(e) => {
												e.stopPropagation();
												onMenuToggle(null);
												onLeave(wsp.id, wsp.name);
											}}
											className='flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955 dark:hover:bg-rose-950/20 transition-colors'>
											<LogOut size={12} /> Leave
										</button>
									)}
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			</div>

			{/* Title & Info */}
			<div className='text-left'>
				<h3 className='mt-5 text-lg font-black tracking-tight text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors'>
					{wsp.name}
				</h3>
				<p className='mt-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500'>
					Role: <span className='font-bold text-slate-650 dark:text-zinc-350'>{wsp.role}</span> • {wsp.lastActive}
				</p>
			</div>

			{/* Metrics block */}
			<div className='my-5 grid grid-cols-2 gap-3.5 rounded-2xl border border-slate-150/60 bg-slate-50/50 p-3.5 dark:border-zinc-850 dark:bg-zinc-950/20'>
				<div className='flex items-center gap-2.5 text-left'>
					<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400 shadow-2xs'>
						<Layers size={15} />
					</div>
					<div className='min-w-0'>
						<span className='block text-[9px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
							Active Flows
						</span>
						<span className='block text-xs font-extrabold text-slate-700 dark:text-zinc-350 truncate'>
							{wsp.activeFlowsCount} flows
						</span>
					</div>
				</div>

				<div className='flex items-center gap-2.5 text-left'>
					<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400 shadow-2xs'>
						<Cpu size={15} />
					</div>
					<div className='min-w-0'>
						<span className='block text-[9px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
							Deployments
						</span>
						<span className='block text-xs font-extrabold text-slate-700 dark:text-zinc-350 truncate'>
							{wsp.activeAgentsCount} agent{wsp.activeAgentsCount !== 1 ? 's' : ''}
						</span>
					</div>
				</div>
			</div>

			{/* Card Footer */}
			<div className='flex items-center justify-between'>
				{/* Members circle avatares */}
				<div className='flex items-center -space-x-1.5'>
					{wsp.members.map((member, idx) => (
						<div
							key={idx}
							title={member.name}
							className={`flex h-7.5 w-7.5 items-center justify-center rounded-full border border-white text-[9px] font-black text-primary-950 shadow-2xs ${member.color} dark:border-zinc-950`}>
							{member.initials}
						</div>
					))}
					<button
						onClick={(e) => {
							e.stopPropagation();
							onInvite(wsp.name);
						}}
						className='flex h-7.5 w-7.5 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-slate-555 hover:scale-105 hover:bg-primary-500 hover:text-primary-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 transition-all'>
						<UserPlus size={10} />
					</button>
				</div>

				{/* Arrow enter button */}
				<button className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-primary-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-primary-400 transition-all duration-300 group-hover:border-transparent group-hover:bg-gradient-to-r group-hover:from-primary-400 group-hover:to-primary-400 group-hover:text-primary-950 group-hover:shadow-md group-hover:shadow-primary-500/10 active:scale-95'>
					<ArrowRight
						size={16}
						strokeWidth={2.5}
						className='transition-transform duration-300 group-hover:translate-x-0.5'
					/>
				</button>
			</div>
		</motion.div>
	);
};

export default WorkspacesPage;
