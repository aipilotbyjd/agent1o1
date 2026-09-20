import Dropdown, {
	DropdownDivider,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '@/components/ui/Dropdown';

import { useNavigate } from 'react-router';
import { useWorkspaceContext } from '@/context/workspace';
import { useAuth } from '@/context/auth';
import pages from '@/Routes/pages';
import {
	Check,
	PlusCircle,
	UserPlus,
	Users,
	Settings,
	CreditCard,
	LogOut,
	ChevronDown,
	LayoutGrid,
} from 'lucide-react';

const getInitials = (name: string) =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part.charAt(0))
		.join('')
		.toUpperCase() || 'MW';

const getWorkspaceColor = (name: string) => {
	const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
	const gradients = [
		'from-primary-400 to-primary-400 shadow-primary-500/25',
		'from-emerald-500 to-teal-600 shadow-emerald-500/25',
		'from-amber-500 to-orange-600 shadow-amber-500/25',
		'from-fuchsia-500 to-primary-400 shadow-fuchsia-500/25',
		'from-cyan-500 to-blue-600 shadow-cyan-500/25',
		'from-rose-500 to-red-600 shadow-rose-500/25',
	];
	return gradients[hash % gradients.length];
};

const workspaceSettingsPages = pages.workspaceSettings.subPages!;

const DropdownWorkspaceSwitcherExample = () => {
	const navigate = useNavigate();
	const authContext = useAuth();

	let workspaces: { id: string; name: string; slug: string; [key: string]: unknown }[] = [];
	let activeWorkspaceId: string | undefined = undefined;
	let switchWorkspace: ((id: string) => void) | undefined = undefined;

	try {
		const workspaceCtx = useWorkspaceContext();
		workspaces = workspaceCtx.workspaces || [];
		activeWorkspaceId = workspaceCtx.activeWorkspaceId;
		switchWorkspace = workspaceCtx.switchWorkspace;
	} catch {
		// safe fallback if not wrapped in WorkspaceProvider
	}

	/** Every settings route is workspace-scoped (`/:workspaceId/settings/...`).
	 *  These items used to navigate to bare `/settings/*` paths, which match no
	 *  route at all and fell through to the 404 page. */
	const goToSettings = (to: string) => {
		if (!activeWorkspaceId) return;
		navigate(to.replace(':workspaceId', activeWorkspaceId));
	};

	const hasWorkspaces = workspaces && workspaces.length > 0;
	const activeWorkspace = hasWorkspaces
		? workspaces.find((w) => w.id === activeWorkspaceId)
		: null;

	const handleSignOut = async () => {
		if (authContext?.onLogout) {
			await authContext.onLogout(true);
		}
	};

	const renderWorkspaceAvatar = (name: string, isSelected: boolean) => {
		const initials = getInitials(name);
		const gradientClass = getWorkspaceColor(name);
		return (
			<div
				className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${gradientClass} text-xs font-black text-white shadow-sm transition-transform duration-300 select-none group-hover:scale-105`}>
				{initials}
				{isSelected && (
					<span className='absolute -top-0.5 -right-0.5 flex h-2 w-2'>
						<span className='bg-primary-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75'></span>
						<span className='bg-primary-400 relative inline-flex h-2 w-2 rounded-full'></span>
					</span>
				)}
			</div>
		);
	};

	const activeColorGradient = getWorkspaceColor(activeWorkspace?.name || 'agent1o1');

	return (
		<Dropdown>
			<DropdownToggle>
				<button
					type='button'
					className='group hover:border-primary-500/40 hover:text-primary-600 dark:hover:border-primary-500/30 dark:hover:text-primary-400 flex h-9 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white pr-3.5 pl-2 text-xs font-extrabold text-slate-700 shadow-xs transition-all duration-300 select-none hover:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900'>
					{/* Circular initials avatar with a premium dynamic gradient background */}
					<div
						className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr ${activeColorGradient} text-[10px] font-black text-white shadow-2xs transition-transform duration-300 group-hover:scale-105`}>
						{getInitials(activeWorkspace?.name || 'agent1o1')}
					</div>
					<span className='max-w-[100px] truncate font-extrabold tracking-wide'>
						{activeWorkspace?.name || 'agent1o1'}
					</span>
					<ChevronDown
						size={12}
						className='group-hover:text-primary-500 dark:group-hover:text-primary-400 ml-0.5 shrink-0 text-slate-400 transition-transform duration-300 group-aria-expanded:rotate-180 group-[.show]:rotate-180 dark:text-white'
					/>
				</button>
			</DropdownToggle>
			<DropdownMenu className='max-w-xs min-w-xs rounded-2xl border border-slate-100 bg-white/95 p-3 shadow-2xl backdrop-blur-md transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950/95'>
				<div className='flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
					<LayoutGrid size={11} className='text-primary-500/80' />
					<span>Workspaces</span>
				</div>

				<div className='mt-1 flex flex-col gap-1'>
					{hasWorkspaces ? (
						workspaces.map((wsp) => {
							const isSelected = wsp.id === activeWorkspaceId;
							return (
								<DropdownItem
									key={wsp.id}
									onClick={() => switchWorkspace?.(wsp.id)}
									className={`group flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-300 ${
										isSelected
											? 'border-primary-500/20 bg-primary-400/5 dark:border-primary-500/10 dark:bg-primary-950/20 shadow-2xs'
											: 'border-transparent hover:border-slate-100 hover:bg-slate-50/50 dark:hover:border-zinc-900 dark:hover:bg-zinc-900/50'
									}`}>
									<div className='shrink-0'>
										{renderWorkspaceAvatar(wsp.name, isSelected)}
									</div>
									<div className='flex min-w-0 flex-1 flex-col'>
										<div className='group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate text-[12.5px] font-bold text-slate-900 transition-colors duration-200 dark:text-white'>
											{wsp.name}
										</div>
										<div className='mt-0.5 truncate text-[10.5px] font-semibold text-slate-400 dark:text-zinc-500'>
											{wsp.slug}.linkflow.icu
										</div>
									</div>
									{isSelected && (
										<div className='bg-primary-100/50 text-primary-600 dark:bg-primary-400/20 dark:text-primary-400 mr-1 shrink-0 rounded-full p-1 shadow-2xs'>
											<Check size={11} strokeWidth={3.5} />
										</div>
									)}
								</DropdownItem>
							);
						})
					) : (
						<>
							<DropdownItem className='group border-primary-500/20 bg-primary-400/5 dark:border-primary-500/10 dark:bg-primary-950/20 flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-300'>
								<div className='shrink-0'>
									{renderWorkspaceAvatar('GitHub', true)}
								</div>
								<div className='flex min-w-0 flex-1 flex-col'>
									<div className='truncate text-[12.5px] font-bold text-slate-900 dark:text-white'>
										GitHub
									</div>
									<div className='mt-0.5 truncate text-[10.5px] font-semibold text-slate-400 dark:text-zinc-500'>
										github.com
									</div>
								</div>
								<div className='bg-primary-100/50 text-primary-600 dark:bg-primary-400/20 dark:text-primary-400 mr-1 shrink-0 rounded-full p-1 shadow-2xs'>
									<Check size={11} strokeWidth={3.5} />
								</div>
							</DropdownItem>
							<DropdownItem className='group flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-all duration-300 hover:border-slate-100 hover:bg-slate-50/50 dark:hover:border-zinc-900 dark:hover:bg-zinc-900/50'>
								<div className='shrink-0'>
									{renderWorkspaceAvatar('GitLab', false)}
								</div>
								<div className='flex min-w-0 flex-1 flex-col'>
									<div className='truncate text-[12.5px] font-bold text-slate-900 dark:text-white'>
										GitLab
									</div>
									<div className='mt-0.5 truncate text-[10.5px] font-semibold text-slate-400 dark:text-zinc-500'>
										gitlab.com
									</div>
								</div>
							</DropdownItem>
						</>
					)}
				</div>

				<DropdownDivider className='my-2 border-slate-100/80 dark:border-zinc-800/80' />

				<div className='flex flex-col gap-0.5'>
					<DropdownItem
						onClick={() => navigate('/workspaces?create=true')}
						className='group hover:border-primary-500/30 hover:bg-primary-500/5 hover:text-primary-600 dark:hover:border-primary-500/20 dark:hover:bg-primary-500/5 dark:hover:text-primary-400 relative flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-3 py-2.5 text-xs font-bold text-slate-600 transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-400'>
						<PlusCircle
							size={14.5}
							className='group-hover:text-primary-500 dark:group-hover:text-primary-400 text-slate-400 transition-transform duration-300 group-hover:rotate-90 dark:text-zinc-500'
						/>
						<span>Add a workspace</span>
					</DropdownItem>

					<DropdownDivider className='my-2 border-slate-100/80 dark:border-zinc-800/80' />

					<DropdownItem
						onClick={() => goToSettings(workspaceSettingsPages.members.to)}
						className='group hover:text-primary-600 dark:hover:text-primary-400 relative flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-xs font-bold text-slate-700 transition-all duration-300 hover:bg-slate-50/50 dark:text-zinc-300 dark:hover:bg-zinc-900/30'>
						<UserPlus
							size={14.5}
							className='group-hover:text-primary-500 dark:group-hover:text-primary-400 text-slate-400 transition-all duration-300 group-hover:scale-110 dark:text-zinc-500'
						/>
						<span className='transition-transform duration-300 group-hover:translate-x-0.5'>
							Invite members
						</span>
					</DropdownItem>
					<DropdownItem
						onClick={() => goToSettings(workspaceSettingsPages.members.to)}
						className='group hover:text-primary-600 dark:hover:text-primary-400 relative flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-xs font-bold text-slate-700 transition-all duration-300 hover:bg-slate-50/50 dark:text-zinc-300 dark:hover:bg-zinc-900/30'>
						<Users
							size={14.5}
							className='group-hover:text-primary-500 dark:group-hover:text-primary-400 text-slate-400 transition-all duration-300 group-hover:scale-110 dark:text-zinc-500'
						/>
						<span className='transition-transform duration-300 group-hover:translate-x-0.5'>
							Manage members
						</span>
					</DropdownItem>
					<DropdownItem
						onClick={() => goToSettings(workspaceSettingsPages.workspace.to)}
						className='group hover:text-primary-600 dark:hover:text-primary-400 relative flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-xs font-bold text-slate-700 transition-all duration-300 hover:bg-slate-50/50 dark:text-zinc-300 dark:hover:bg-zinc-900/30'>
						<Settings
							size={14.5}
							className='group-hover:text-primary-500 dark:group-hover:text-primary-400 text-slate-400 transition-all duration-300 group-hover:scale-110 dark:text-zinc-500'
						/>
						<span className='transition-transform duration-300 group-hover:translate-x-0.5'>
							Workspace settings
						</span>
					</DropdownItem>
					<DropdownItem
						onClick={() => goToSettings(workspaceSettingsPages.billing.to)}
						className='group hover:text-primary-600 dark:hover:text-primary-400 relative flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-xs font-bold text-slate-700 transition-all duration-300 hover:bg-slate-50/50 dark:text-zinc-300 dark:hover:bg-zinc-900/30'>
						<CreditCard
							size={14.5}
							className='group-hover:text-primary-500 dark:group-hover:text-primary-400 text-slate-400 transition-all duration-300 group-hover:scale-110 dark:text-zinc-500'
						/>
						<span className='transition-transform duration-300 group-hover:translate-x-0.5'>
							Billing & subscription
						</span>
					</DropdownItem>

					<DropdownDivider className='my-2 border-slate-100/80 dark:border-zinc-800/80' />

					<DropdownItem
						onClick={handleSignOut}
						className='group relative flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-xs font-bold text-rose-600 transition-all duration-300 hover:bg-rose-500/5 dark:text-rose-400 dark:hover:bg-rose-500/5'>
						<LogOut
							size={14.5}
							className='text-rose-500 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-rose-600 dark:text-rose-400 dark:group-hover:text-rose-400'
						/>
						<span className='transition-transform duration-300 group-hover:translate-x-0.5'>
							Sign out
						</span>
					</DropdownItem>
				</div>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownWorkspaceSwitcherExample;
