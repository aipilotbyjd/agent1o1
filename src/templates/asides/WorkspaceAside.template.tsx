import { useState, useEffect, useRef, useMemo } from 'react';
import {
	Activity,
	BarChart3,
	Bot,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	CreditCard,
	Home,
	PlugZap,
	Search,
	Settings,
	Sparkles,
	Users,
	Workflow,
	Zap,
	Check,
	Plus,
	Building2,
	HelpCircle,
	X,
	ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import avatar from '@/assets/avatar/avatar1.png';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import { useCreateWorkspace } from '@/api/modules/workspaces';
import { useWorkspaceContext } from '@/context/workspaceContext';
import { useGlobalSearchStore } from '@/store/globalSearch.store';
import GlobalSearch from '@/templates/search/GlobalSearch.template';

type TSidebarView =
	| 'dashboard'
	| 'agents'
	| 'skills'
	| 'artifacts'
	| 'apps'
	| 'history'
	| 'workflows'
	| 'automations'
	| 'integrations'
	| 'analytics'
	| 'team'
	| 'settings';

const navigationGroups: {
	label: string;
	items: { id: TSidebarView; label: string; icon: typeof Home; badge?: string }[];
}[] = [
	{
		label: 'Workspace',
		items: [
			{ id: 'dashboard', label: 'Dashboard', icon: Home },
			{ id: 'agents', label: 'Agents', icon: Bot, badge: 'AI' },
			{ id: 'workflows', label: 'Workflows', icon: Workflow },
			{ id: 'automations', label: 'Automations', icon: Zap },
		],
	},
	{
		label: 'Operations',
		items: [
			{ id: 'integrations', label: 'Integrations', icon: PlugZap },
			{ id: 'analytics', label: 'Analytics', icon: BarChart3 },
			{ id: 'team', label: 'Team', icon: Users },
			{ id: 'settings', label: 'Settings', icon: Settings },
		],
	},
];

const SidebarTooltip = ({ label }: { label: string }) => (
	<span className='pointer-events-none absolute top-1/2 left-[calc(100%+12px)] z-50 hidden -translate-y-1/2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold whitespace-nowrap text-zinc-900 opacity-0 shadow-2xl shadow-zinc-300/40 backdrop-blur-xl transition group-hover:block group-hover:opacity-100 dark:border-white/10 dark:bg-zinc-950/95 dark:text-white dark:shadow-black/40'>
		{label}
	</span>
);

const UsageCard = ({ collapsed }: { collapsed: boolean }) => {
	if (collapsed) {
		return (
			<div className='mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-emerald-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-emerald-300'>
				<CreditCard size={18} />
			</div>
		);
	}

	return (
		<div className='rounded-2xl border border-zinc-200 bg-zinc-50 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.045] dark:shadow-2xl dark:shadow-black/15'>
			<div className='mb-2 flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-300'>
				<span>Credits usage</span>
				<span className='text-zinc-950 dark:text-white'>4.8k / 5k</span>
			</div>
			<div className='h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10'>
				<motion.div
					initial={{ width: 0 }}
					animate={{ width: '96%' }}
					transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
					className='h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-fuchsia-300'
				/>
			</div>
			<button
				type='button'
				className='mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-100 dark:border-emerald-300/30 dark:bg-emerald-300/10 dark:text-emerald-100 dark:shadow-lg dark:shadow-emerald-950/20 dark:hover:bg-emerald-300/15'>
				<Sparkles size={15} />
				Upgrade plan
			</button>
		</div>
	);
};

/** Preview only — the API derives the real slug from the name server-side
 *  (StoreWorkspaceRequest accepts `name` and nothing else). */
const slugify = (value: string) =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

const validationSchema = Yup.object().shape({
	name: Yup.string()
		.required('Workspace name is required')
		.min(2, 'Workspace name must be at least 2 characters'),
});

const WorkspaceAsideTemplate = () => {
	const {
		activeWorkspaceView,
		closeMobileSidebar,
		setActiveWorkspaceView,
		sidebarCollapsed,
		toggleSidebar,
		setActiveWorkspaceId,
		addWorkspace,
	} = useWorkflowShellStore();

	const { workspaces: apiWorkspaces, activeWorkspaceId, switchWorkspace } = useWorkspaceContext();

	const [topDropdownOpen, setTopDropdownOpen] = useState(false);
	const [bottomDropdownOpen, setBottomDropdownOpen] = useState(false);
	const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);

	const createWorkspace = useCreateWorkspace();

	const topRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);

	// Enrich workplaces list with initials and UI gradient backgrounds
	const workspaces = useMemo(() => {
		const colorList = [
			'bg-primary-400',
			'bg-emerald-600',
			'bg-fuchsia-600',
			'bg-amber-600',
			'bg-rose-500',
			'bg-blue-600',
		];
		return apiWorkspaces.map((ws, index) => {
			const initials = ws.name.trim().slice(0, 2).toUpperCase();
			const color = colorList[index % colorList.length];
			return {
				...ws,
				initials,
				color,
				description: ws.role
					? `Role: ${ws.role.charAt(0).toUpperCase() + ws.role.slice(1)}`
					: 'Team workspace',
			};
		});
	}, [apiWorkspaces]);

	const activeWorkspace = useMemo(() => {
		return workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
	}, [workspaces, activeWorkspaceId]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (topRef.current && !topRef.current.contains(event.target as Node)) {
				setTopDropdownOpen(false);
			}
			if (bottomRef.current && !bottomRef.current.contains(event.target as Node)) {
				setBottomDropdownOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleNavigation = (id: TSidebarView) => {
		setActiveWorkspaceView(id);
		closeMobileSidebar();
	};

	const formik = useFormik({
		initialValues: {
			name: '',
			slug: '',
		},
		validationSchema,
		validateOnMount: true,
		onSubmit: async (values, actions) => {
			try {
				const workspace = await createWorkspace.mutateAsync({
					name: values.name,
				});

				const colorList = [
					'bg-primary-400',
					'bg-emerald-600',
					'bg-fuchsia-600',
					'bg-amber-600',
					'bg-rose-500',
					'bg-blue-600',
				];
				const randomColor = colorList[Math.floor(Math.random() * colorList.length)];
				const initials = values.name.trim().slice(0, 2).toUpperCase();

				addWorkspace({
					id: workspace.id,
					name: workspace.name,
					description: 'Custom workspace',
					initials,
					color: randomColor,
				});
				setActiveWorkspaceId(workspace.id);
				setIsCreateWorkspaceOpen(false);
				actions.resetForm();
			} catch {
				// useCreateWorkspace hook already displays UI toast triggers on error
			}
		},
	});

	const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const nextName = event.target.value;
		formik.setFieldValue('name', nextName);
		formik.setFieldValue('slug', slugify(nextName));
	};

	return (
		<>
			<motion.aside
				initial={false}
				animate={{ width: sidebarCollapsed ? 84 : 304 }}
				transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
				className='relative flex h-screen shrink-0 flex-col overflow-hidden border-r border-zinc-200 bg-white text-zinc-950 shadow-sm dark:border-white/10 dark:bg-[#07080b] dark:text-zinc-100 dark:shadow-2xl dark:shadow-black/35'>
				<div className='pointer-events-none absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(16,185,129,0.07),transparent)] dark:bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.18),transparent_34%),radial-gradient(circle_at_80%_18%,rgba(34,211,238,0.12),transparent_32%)]' />
				<div className='relative flex h-20 items-center justify-between px-4'>
					<div className='flex min-w-0 items-center gap-3'>
						<div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:shadow-xl dark:shadow-black/25'>
							<div className='h-5 w-5 rounded-lg bg-gradient-to-br from-emerald-300 via-cyan-300 to-white' />
						</div>
						{!sidebarCollapsed && (
							<div className='min-w-0'>
								<div className='truncate text-lg font-black tracking-tight text-zinc-950 dark:text-white'>
									agent101
								</div>
								<div className='truncate text-xs font-semibold text-zinc-500'>
									AI workflow OS
								</div>
							</div>
						)}
					</div>
					<button
						type='button'
						onClick={toggleSidebar}
						aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
						className='text-zinc-500 hover:border-zinc-300 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white transition hover:bg-zinc-50 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-400 dark:hover:border-white/15 dark:hover:bg-white/[0.07] dark:hover:text-white'>
						{sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
					</button>
				</div>

				{/* Top Workspace Switcher */}
				<div className='relative mb-3 px-3' ref={topRef}>
					<div className='relative'>
						<button
							type='button'
							onClick={() => setTopDropdownOpen(!topDropdownOpen)}
							className={[
								'group flex h-12 w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 text-left transition hover:border-zinc-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.045] dark:hover:border-white/15 dark:hover:bg-white/[0.07]',
								sidebarCollapsed ? 'justify-center px-0' : '',
							].join(' ')}>
							<div
								className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black text-primary-950 ${activeWorkspace?.color || 'bg-primary-400'}`}>
								{activeWorkspace?.initials || 'AS'}
							</div>
							{!sidebarCollapsed && (
								<>
									<div className='min-w-0 flex-1'>
										<div className='truncate text-sm font-bold text-zinc-950 dark:text-white'>
											{activeWorkspace?.name || 'Amaan Studio'}
										</div>
										<div className='truncate text-xs font-semibold text-zinc-500'>
											{activeWorkspace?.description || 'Production workspace'}
										</div>
									</div>
									<ChevronDown
										size={16}
										className={`text-zinc-500 transition-transform duration-205 ${topDropdownOpen ? 'rotate-180' : ''}`}
									/>
								</>
							)}
						</button>

						{/* Top Workspace Dropdown */}
						<AnimatePresence>
							{topDropdownOpen && (
								<motion.div
									initial={{ opacity: 0, y: 5, scale: 0.95 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0, y: 5, scale: 0.95 }}
									className='absolute right-0 left-0 z-[60] mt-2 flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white/95 p-1.5 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-[#0f111a]/95'>
									<div className='dark:text-zinc-500 px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase'>
										Switch Workspace
									</div>
									{workspaces.map((ws) => (
										<button
											key={ws.id}
											type='button'
											onClick={() => {
												switchWorkspace(ws.id);
												setTopDropdownOpen(false);
											}}
											className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-zinc-50 dark:hover:bg-white/[0.05] ${ws.id === activeWorkspaceId ? 'bg-zinc-100/50 dark:bg-white/[0.04]' : ''}`}>
											<div
												className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white ${ws.color}`}>
												{ws.initials}
											</div>
											<div className='min-w-0 flex-1'>
												<div className='flex items-center gap-2 truncate text-xs font-bold text-zinc-950 dark:text-white'>
													{ws.name}
													{ws.id === activeWorkspaceId && (
														<Check
															size={12}
															className='shrink-0 stroke-[3] text-emerald-500'
														/>
													)}
												</div>
												<div className='text-zinc-500 truncate text-[10px] font-semibold'>
													{ws.description}
												</div>
											</div>
										</button>
									))}
									<div className='my-1 border-t border-zinc-100 dark:border-white/5' />
									<button
										type='button'
										onClick={() => {
											setTopDropdownOpen(false);
											setIsCreateWorkspaceOpen(true);
										}}
										className='text-zinc-600 flex w-full items-center gap-2.5 rounded-xl p-2 text-left text-xs font-bold hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/[0.05]'>
										<Plus size={14} className='text-zinc-500' />
										Create new workspace
									</button>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>

				<div className='relative px-3'>
					<button
						type='button'
						title='Search workspace'
						onClick={() => useGlobalSearchStore.getState().open()}
						className={[
							'group hover:border-emerald-200 relative flex h-12 w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-600 shadow-sm transition hover:bg-white hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.045] dark:text-zinc-300 dark:shadow-xl dark:shadow-black/10 dark:hover:border-emerald-300/25 dark:hover:bg-white/[0.07] dark:hover:text-white',
							sidebarCollapsed ? 'justify-center px-0' : 'px-4',
						].join(' ')}>
						<Search size={18} />
						{!sidebarCollapsed && (
							<>
								<span className='min-w-0 flex-1 text-left'>Search workspace</span>
								<span className='rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px] font-bold text-zinc-400 dark:border-white/10 dark:bg-black/30 dark:text-zinc-500'>
									⌘K
								</span>
							</>
						)}
						{sidebarCollapsed && <SidebarTooltip label='Search workspace' />}
					</button>
				</div>

				<div className='relative min-h-0 flex-1 overflow-y-auto px-3 py-5'>
					<nav className='space-y-6'>
						{navigationGroups.map((group) => (
							<div key={group.label}>
								{!sidebarCollapsed && (
									<div className='dark:text-zinc-600 mb-2 px-3 text-[11px] font-bold tracking-[0.18em] text-zinc-400 uppercase'>
										{group.label}
									</div>
								)}
								<div className='space-y-1.5'>
									{group.items.map((item) => {
										const Icon = item.icon;
										const isActive = activeWorkspaceView === item.id;

										return (
											<button
												key={item.id}
												type='button'
												title={item.label}
												onClick={() => handleNavigation(item.id)}
												className={[
													'group relative flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold transition',
													isActive
														? 'bg-[#FAFDEB] text-[#111111] shadow-2xs dark:bg-zinc-800/40 dark:text-white'
														: 'hover:text-zinc-950 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/[0.055] dark:hover:text-zinc-100',
													sidebarCollapsed ? 'justify-center px-0' : '',
												].join(' ')}>
												{isActive && (
													<motion.span
														layoutId='sidebar-active-pill'
														className='absolute inset-y-1.5 left-1 w-1 rounded-full bg-[#CFF54A]'
													/>
												)}
												<motion.span
													whileHover={{
														scale: 1.08,
														rotate: isActive ? 0 : -3,
													}}
													className={[
														'flex h-8 w-8 items-center justify-center rounded-xl transition',
														isActive
															? 'text-[#111111] bg-transparent dark:text-white'
															: '',
													].join(' ')}>
													<Icon size={18} />
												</motion.span>
												{!sidebarCollapsed && (
													<>
														<span className='min-w-0 flex-1 text-left'>
															{item.label}
														</span>
														{item.badge && (
															<span className='rounded-lg border border-primary-200 bg-primary-50 px-2 py-0.5 text-[10px] text-primary-800 dark:border-primary-800/30 dark:bg-primary-950/20 dark:text-primary-400'>
																{item.badge}
															</span>
														)}
													</>
												)}
												{sidebarCollapsed && (
													<SidebarTooltip label={item.label} />
												)}
											</button>
										);
									})}
								</div>
							</div>
						))}
					</nav>
				</div>

				<div className='relative space-y-3 px-3 pb-4'>
					<div className='relative' ref={bottomRef}>
						<button
							type='button'
							onClick={() => setBottomDropdownOpen(!bottomDropdownOpen)}
							title='Switch workspace'
							className={[
								'group flex h-12 w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 text-left transition hover:border-zinc-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.045] dark:hover:border-white/15 dark:hover:bg-white/[0.07]',
								sidebarCollapsed ? 'justify-center px-0' : '',
							].join(' ')}>
							<div
								className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black text-primary-950 ${activeWorkspace?.color || 'bg-primary-400'}`}>
								{activeWorkspace?.initials || 'AS'}
							</div>
							{!sidebarCollapsed && (
								<>
									<div className='min-w-0 flex-1'>
										<div className='truncate text-sm font-bold text-zinc-950 dark:text-white'>
											{activeWorkspace?.name || 'Amaan Studio'}
										</div>
										<div className='truncate text-xs font-semibold text-zinc-500'>
											{activeWorkspace?.description || 'Production workspace'}
										</div>
									</div>
									<ChevronDown
										size={16}
										className={`text-zinc-500 transition-transform duration-200 ${bottomDropdownOpen ? 'rotate-180' : ''}`}
									/>
								</>
							)}
						</button>

						{/* Bottom Workspace Dropdown */}
						<AnimatePresence>
							{bottomDropdownOpen && (
								<motion.div
									initial={{ opacity: 0, y: -5, scale: 0.95 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0, y: -5, scale: 0.95 }}
									className='absolute right-0 bottom-full left-0 z-[60] mb-2 flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white/95 p-1.5 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-[#0f111a]/95'>
									<div className='px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
										Switch Workspace
									</div>
									{workspaces.map((ws) => (
										<button
											key={ws.id}
											type='button'
											onClick={() => {
												switchWorkspace(ws.id);
												setBottomDropdownOpen(false);
											}}
											className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-zinc-50 dark:hover:bg-white/[0.05] ${ws.id === activeWorkspaceId ? 'bg-zinc-100/50 dark:bg-white/[0.04]' : ''}`}>
											<div
												className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white ${ws.color}`}>
												{ws.initials}
											</div>
											<div className='min-w-0 flex-1'>
												<div className='flex items-center gap-2 truncate text-xs font-bold text-zinc-950 dark:text-white'>
													{ws.name}
													{ws.id === activeWorkspaceId && (
														<Check
															size={12}
															className='shrink-0 stroke-[3] text-emerald-500'
														/>
													)}
												</div>
												<div className='text-zinc-500 truncate text-[10px] font-semibold'>
													{ws.description}
												</div>
											</div>
										</button>
									))}
									<div className='my-1 border-t border-zinc-100 dark:border-white/5' />
									<button
										type='button'
										onClick={() => {
											setBottomDropdownOpen(false);
											setIsCreateWorkspaceOpen(true);
										}}
										className='text-zinc-600 flex w-full items-center gap-2.5 rounded-xl p-2 text-left text-xs font-bold hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/[0.05]'>
										<Plus size={14} className='text-zinc-500' />
										Create new workspace
									</button>
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					<UsageCard collapsed={sidebarCollapsed} />

					<div
						className={[
							'flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-2 dark:border-white/10 dark:bg-white/[0.035]',
							sidebarCollapsed ? 'justify-center' : '',
						].join(' ')}>
						<img src={avatar} alt='Amaan' className='h-9 w-9 rounded-xl object-cover' />
						{!sidebarCollapsed && (
							<div className='min-w-0 flex-1'>
								<div className='truncate text-sm font-bold text-zinc-950 dark:text-white'>
									Amaan
								</div>
								<div className='text-zinc-500 flex items-center gap-1.5 text-xs font-semibold'>
									<Activity size={12} className='text-emerald-300' />
									Online
								</div>
							</div>
						)}
					</div>
				</div>
			</motion.aside>

			{/* Create Workspace Modal Popup */}
			<AnimatePresence>
				{isCreateWorkspaceOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 font-sans text-slate-950 backdrop-blur-xs dark:bg-black/60 dark:text-zinc-50'
						onClick={() => setIsCreateWorkspaceOpen(false)}>
						<motion.div
							initial={{ scale: 0.95, y: 15 }}
							animate={{ scale: 1, y: 0 }}
							exit={{ scale: 0.95, y: 15 }}
							transition={{ duration: 0.2 }}
							className='dark:border-zinc-800 relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-2xl dark:bg-[#11131c]'
							onClick={(e) => e.stopPropagation()}>
							<button
								onClick={() => setIsCreateWorkspaceOpen(false)}
								className='hover:text-slate-600 dark:hover:text-zinc-300 absolute top-4 right-4 text-slate-400 transition dark:text-zinc-500'>
								<X size={18} />
							</button>

							<h3 className='mb-5 flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white'>
								<Building2 className='h-5 w-5 text-primary-600 dark:text-primary-400' />
								Create Workspace
							</h3>

							<form onSubmit={formik.handleSubmit} className='space-y-4'>
								<div className='space-y-1.5'>
									<label
										htmlFor='modal-ws-name'
										className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
										Workspace Name
									</label>
									<div className='group relative flex items-center'>
										<Building2 className='text-slate-400 group-focus-within:text-primary-600 absolute left-3.5 h-4.5 w-4.5 transition-colors duration-200 dark:group-focus-within:text-primary-400' />
										<input
											type='text'
											id='modal-ws-name'
											name='name'
											placeholder='e.g. Acme Automation'
											value={formik.values.name}
											onChange={handleNameChange}
											onBlur={formik.handleBlur}
											className='h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pr-4 pl-10 text-xs font-semibold text-slate-900 transition outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/25 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white'
										/>
									</div>
								</div>

								<div className='space-y-1.5'>
									<label
										htmlFor='modal-ws-slug'
										className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
										Workspace URL
									</label>
									<div className='flex h-11 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500/25 dark:border-zinc-800 dark:bg-zinc-900'>
										<span className='flex h-full items-center border-r border-slate-200 bg-slate-100/50 px-3 text-xs font-black text-slate-400 dark:border-zinc-800 dark:bg-zinc-950/40'>
											agent1o1.app/
										</span>
										<input
											type='text'
											id='modal-ws-slug'
											name='slug'
											placeholder='acme'
											readOnly
											value={formik.values.slug}
											className='min-w-0 flex-1 border-none bg-transparent px-3 text-xs font-semibold text-slate-500 outline-none focus:ring-0 dark:text-zinc-400'
										/>
									</div>
								</div>

								{formik.touched.name && formik.errors.name && (
									<div className='flex items-center gap-1.5 px-1 text-[11px] font-bold text-rose-500'>
										<HelpCircle size={13} className='shrink-0' />
										<span>{formik.errors.name}</span>
									</div>
								)}

								<div className='flex items-center justify-end gap-2.5 pt-3'>
									<button
										type='button'
										onClick={() => setIsCreateWorkspaceOpen(false)}
										className='h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-[#11131c] dark:text-zinc-200'>
										Cancel
									</button>
									<button
										type='submit'
										disabled={!formik.isValid || createWorkspace.isPending}
										className='bg-primary-400 flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black text-primary-950 transition hover:bg-primary-500 disabled:pointer-events-none disabled:opacity-50'>
										{createWorkspace.isPending
											? 'Creating...'
											: 'Create Workspace'}
										<ArrowRight className='h-3.5 w-3.5' />
									</button>
								</div>
							</form>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			<GlobalSearch />
		</>
	);
};

export default WorkspaceAsideTemplate;
