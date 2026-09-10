import { useEffect, useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Bot,
	Cpu,
	Search,
	Settings2,
	Trash2,
	MessageSquare,
	Play,
	Sparkles,
	Layers,
	Terminal,
	Megaphone,
	Briefcase,
	MoreHorizontal,
} from 'lucide-react';
import { OutletContextType } from './_layouts/Agents.layout';
import { useConfirm } from '@/context/confirmContext';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import pages from '@/Routes/pages';
import { useWorkspaceContext } from '@/context/workspaceContext';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import { useAgents, useUpdateAgent, useDeleteAgent } from '@/api/modules/agents';

interface IAgentItem {
	id: string;
	name: string;
	description: string;
	model: string;
	isActive: boolean;
	skillsCount: number;
	conversationsCount: number;
	category: string;
}

const getModelColor = (model: string) => {
	const lower = model.toLowerCase();
	if (lower.includes('gpt')) return '#10A37F'; // OpenAI green
	if (lower.includes('gemini')) return '#7C3AED'; // Gemini purple
	if (lower.includes('claude')) return '#D97706'; // Claude amber
	return '#6366F1'; // Default indigo
};

const getAgentHeaderIcon = (id: string) => {
	if (id === 'agent-2') {
		return { IconComponent: Cpu, bgClass: 'bg-primary-400 text-primary-950 shadow-primary-500/20' };
	}
	if (id === 'agent-3') {
		return { IconComponent: Briefcase, bgClass: 'bg-amber-600 text-white shadow-amber-600/20' };
	}
	return { IconComponent: Briefcase, bgClass: 'bg-primary-400 text-primary-950 shadow-primary-500/20' };
};

const getCategoryIcon = (category: string) => {
	switch (category) {
		case 'Sales':
			return Megaphone;
		case 'Development':
			return Terminal;
		case 'Operations':
			return Briefcase;
		default:
			return Layers;
	}
};

const AgentsListPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const navigate = useNavigate();
	const { confirm } = useConfirm();

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.app.subPages.agents }]} />);
		return () => setHeaderLeft(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const { activeWorkspaceId } = useWorkspaceContext();
	const { activeWorkspaceId: fallbackWorkspaceId } = useWorkflowShellStore();
	const currentWorkspaceId = activeWorkspaceId || fallbackWorkspaceId;

	const { data: apiAgents, isLoading } = useAgents(currentWorkspaceId);
	const updateAgentMutation = useUpdateAgent(currentWorkspaceId);
	const deleteAgentMutation = useDeleteAgent(currentWorkspaceId);

	// Map backend agents → view model
	const agents = useMemo<IAgentItem[]>(() => {
		if (!apiAgents || apiAgents.length === 0) return [];
		return apiAgents.map((a) => ({
			id: a.id,
			name: a.name,
			description: a.description || 'No description provided.',
			model: a.model,
			isActive: a.is_active,
			skillsCount: a.skills_count ?? 0,
			conversationsCount: a.conversations_count ?? 0,
			category: a.category || 'Uncategorized',
		}));
	}, [apiAgents]);

	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<
		'All' | 'Active' | 'Development' | 'Sales' | 'Operations'
	>('All');

	const filteredAgents = useMemo(() => {
		return agents.filter((agent) => {
			const matchesSearch =
				agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
				agent.model.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesCategory =
				selectedCategory === 'All' ||
				(selectedCategory === 'Active' && agent.isActive) ||
				(selectedCategory !== 'Active' && agent.category === selectedCategory);

			return matchesSearch && matchesCategory;
		});
	}, [agents, searchQuery, selectedCategory]);

	const handleToggleActive = (id: string) => {
		const agent = agents.find((a) => a.id === id);
		if (!agent) return;
		updateAgentMutation.mutate({ agentId: id, body: { is_active: !agent.isActive } });
	};

	const handleDelete = async (id: string) => {
		const agent = agents.find((a) => a.id === id);
		const confirmed = await confirm({
			title: 'Delete Agent',
			message: (
				<>
					Are you sure you want to delete{' '}
					<strong className='font-semibold text-zinc-800 dark:text-zinc-200'>
						{agent ? `"${agent.name}"` : 'this agent'}
					</strong>
					? This action cannot be undone.
				</>
			),
		});
		if (!confirmed) return;
		deleteAgentMutation.mutate(id);
	};

	return (
		<Container className='relative overflow-x-hidden overflow-y-auto bg-[#f8f9fc] !p-0 dark:bg-zinc-950'>
			{/* Ambient decorative blur glows */}
			<div className='pointer-events-none absolute top-[-10%] right-[-10%] -z-10 h-[45%] w-[45%] rounded-full bg-gradient-to-tr from-primary-400/5 to-primary-400/5 blur-[120px]' />
			<div className='pointer-events-none absolute bottom-[-10%] left-[-10%] -z-10 h-[45%] w-[45%] rounded-full bg-gradient-to-br from-primary-500/5 to-primary-500/0 blur-[120px]' />

			<div className='mx-auto flex w-full max-w-7xl flex-col space-y-8 p-4 sm:p-6 md:p-8'>
				{/* Header Section */}
				<div className='flex flex-col justify-between gap-6 md:flex-row md:items-center'>
					<div>
						<h1 className='bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 bg-clip-text text-3xl font-black tracking-tight text-transparent dark:from-white dark:via-zinc-200 dark:to-white'>
							Agents
						</h1>
						<p className='mt-1 text-xs font-black tracking-widest text-primary-600 uppercase dark:text-primary-400'>
							AI ASSISTANT ORCHESTRATION
						</p>
						<p className='mt-0.5 text-xs font-semibold text-slate-500 dark:text-zinc-400'>
							Deploy and manage autonomous AI agents to automate your workflows.
						</p>
					</div>

					{/* Right decorative orbit card containing Build Agent button */}
					<div className='flex items-center gap-5 rounded-3xl border border-border-main bg-bg-card p-3 pr-6 shadow-sm backdrop-blur-md dark:border-border-main dark:bg-bg-card'>
						<div className='relative flex h-14 w-20 items-center justify-center overflow-hidden'>
							{/* Concentric dashed orbits */}
							<div className='absolute h-18 w-18 animate-[spin_40s_linear_infinite] rounded-full border border-dashed border-primary-300/40 dark:border-primary-500/20' />
							<div className='absolute h-12 w-12 animate-[spin_20s_linear_infinite_reverse] rounded-full border border-dashed border-blue-300/40 dark:border-blue-500/20' />

							{/* Floating robot head inside gradient bubble */}
							<div className='relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-300 shadow-md shadow-primary-500/20'>
								<div className='absolute -inset-0.5 rounded-full bg-gradient-to-br from-primary-400 to-primary-300 opacity-50 blur-xs' />
								<Bot className='relative h-5 w-5 text-white' />
							</div>
						</div>

						<button
							onClick={() => navigate(pages.agent.subPages.addAgent.to)}
							className='flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-400 to-primary-400 px-5 text-xs font-black text-primary-950 shadow-lg shadow-primary-500/20 transition-all hover:from-primary-400 hover:to-primary-400 hover:shadow-xl hover:shadow-primary-500/30 active:scale-95 dark:shadow-none'>
							<Sparkles size={14} className='animate-pulse' />
							<span>Build Agent</span>
						</button>
					</div>
				</div>

				{/* Stats overview row */}
				<div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
					{/* Card 1: Active Agents */}
					<div className='group relative overflow-hidden rounded-2xl border border-border-main bg-bg-card p-5 shadow-xs backdrop-blur-md dark:border-border-main dark:bg-bg-card'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
								<Briefcase size={16} />
							</div>
							<span className='text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
								Active Agents
							</span>
						</div>
						<div className='mt-3.5 flex items-center justify-between'>
							<div className='flex items-baseline gap-1.5'>
								<span className='text-3xl font-black text-slate-900 dark:text-white'>
									{agents.filter((a) => a.isActive).length}
								</span>
								<span className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>
									active
								</span>
							</div>

							{/* Custom green SVG sparkline */}
							<div className='h-8 w-24'>
								<svg
									className='h-full w-full text-primary-500'
									viewBox='0 0 100 30'
									fill='none'
									xmlns='http://www.w3.org/2000/svg'>
									<defs>
										<linearGradient id='green-grad' x1='0' y1='0' x2='0' y2='1'>
											<stop
												offset='0%'
												stopColor='#C4EE3D'
												stopOpacity='0.2'
											/>
											<stop
												offset='100%'
												stopColor='#C4EE3D'
												stopOpacity='0'
											/>
										</linearGradient>
									</defs>
									<path
										d='M 0 25 C 15 25, 20 15, 35 18 C 50 21, 55 28, 65 18 C 75 8, 80 5, 90 12 C 95 16, 98 10, 100 8'
										fill='none'
										stroke='currentColor'
										strokeWidth='1.8'
										strokeLinecap='round'
										strokeLinejoin='round'
									/>
									<path
										d='M 0 25 C 15 25, 20 15, 35 18 C 50 21, 55 28, 65 18 C 75 8, 80 5, 90 12 C 95 16, 98 10, 100 8 L 100 30 L 0 30 Z'
										fill='url(#green-grad)'
									/>
								</svg>
							</div>
						</div>
						<div className='mt-3 flex items-center gap-1.5'>
							<span className='relative flex h-1.5 w-1.5'>
								<span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75'></span>
								<span className='relative inline-flex h-1.5 w-1.5 rounded-full bg-primary-500'></span>
							</span>
							<span className='text-[10px] font-black text-primary-600 dark:text-primary-400'>
								All agents responding
							</span>
						</div>
					</div>

					{/* Card 2: Total Chats */}
					<div className='group relative overflow-hidden rounded-2xl border border-border-main bg-bg-card p-5 shadow-xs backdrop-blur-md dark:border-border-main dark:bg-bg-card'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
								<MessageSquare size={16} />
							</div>
							<span className='text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
								Total Chats
							</span>
						</div>
						<div className='mt-3.5 flex items-center justify-between'>
							<div className='flex items-baseline gap-1.5'>
								<span className='text-3xl font-black text-slate-900 dark:text-white'>
									{agents.reduce((acc, a) => acc + a.conversationsCount, 0)}
								</span>
								<span className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>
									chats
								</span>
							</div>

							{/* Custom purple SVG bar chart */}
							<div className='flex h-8 items-end justify-end gap-1'>
								<div className='h-[35%] w-1.5 rounded-t-sm bg-primary-300 dark:bg-primary-800/60' />
								<div className='h-[55%] w-1.5 rounded-t-sm bg-primary-400 dark:bg-primary-700/80' />
								<div className='h-[40%] w-1.5 rounded-t-sm bg-primary-300 dark:bg-primary-400/70' />
								<div className='h-[80%] w-1.5 rounded-t-sm bg-primary-400' />
								<div className='h-[65%] w-1.5 rounded-t-sm bg-primary-400' />
								<div className='h-[100%] w-1.5 rounded-t-sm bg-primary-700' />
							</div>
						</div>
						<div className='text-slate-450 mt-3.5 text-[10px] font-bold dark:text-zinc-500'>
							Assisted user inquiries handled
						</div>
					</div>

					{/* Card 3: Active Models */}
					<div className='group relative overflow-hidden rounded-2xl border border-border-main bg-bg-card p-5 shadow-xs backdrop-blur-md dark:border-border-main dark:bg-bg-card'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
								<Cpu size={16} />
							</div>
							<span className='text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
								Active Models
							</span>
						</div>
						<div className='mt-3.5 flex items-center justify-between'>
							<div className='flex items-baseline gap-1.5'>
								<span className='text-3xl font-black text-slate-900 dark:text-white'>
									{new Set(agents.map((a) => a.model)).size}
								</span>
								<span className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>
									LLM engines
								</span>
							</div>

							{/* Custom blue radar waves SVG */}
							<div className='relative flex h-8 w-20 items-center justify-end overflow-hidden'>
								<svg
									className='h-12 w-16 text-primary-500/30'
									viewBox='0 0 100 100'
									fill='none'
									xmlns='http://www.w3.org/2000/svg'>
									<circle
										cx='90'
										cy='50'
										r='15'
										stroke='currentColor'
										strokeWidth='1.5'
										strokeDasharray='3 3'
									/>
									<circle
										cx='90'
										cy='50'
										r='30'
										stroke='currentColor'
										strokeWidth='1.5'
									/>
									<circle
										cx='90'
										cy='50'
										r='45'
										stroke='currentColor'
										strokeWidth='1.5'
										strokeDasharray='4 4'
									/>
									<circle
										cx='90'
										cy='50'
										r='60'
										stroke='currentColor'
										strokeWidth='1.5'
									/>
									<circle
										cx='90'
										cy='50'
										r='75'
										stroke='currentColor'
										strokeWidth='1.5'
										strokeDasharray='5 5'
									/>
								</svg>
							</div>
						</div>
						<div className='mt-3 flex items-center gap-1.5 text-[10px] font-black text-primary-600 dark:text-primary-400'>
							<span className='h-1.5 w-1.5 rounded-full bg-primary-500' />
							<span>Multi-model cognitive pipelines</span>
						</div>
					</div>
				</div>

				{/* Search & Categories Bar */}
				<div className='flex flex-col gap-5 xl:flex-row xl:items-center'>
					<div className='group relative flex-1'>
						<Search className='absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400 transition-colors duration-200 group-focus-within:text-primary-500 dark:text-zinc-500' />
						<input
							type='search'
							aria-label='Search agents'
							placeholder='Search agents by name, description, or model...'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className='dark:placeholder:text-zinc-500 block h-12 w-full rounded-2xl border border-border-main bg-bg-card pr-12 pl-12 text-xs font-semibold text-slate-900 shadow-xs transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-primary-500/80 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:border-border-main dark:bg-bg-card dark:text-zinc-100 dark:focus:border-primary-500 dark:focus:bg-zinc-950/40 dark:focus:ring-primary-500/15'
						/>
						<span className='absolute top-3.5 right-4 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-bold text-slate-400 shadow-2xs dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-500'>
							⌘K
						</span>
					</div>

					{/* Category tabs */}
					<div className='no-scrollbar relative flex gap-2 overflow-x-auto pb-1 xl:pb-0'>
						{(
							[
								{ id: 'All', label: 'All', icon: Layers },
								{ id: 'Active', label: 'Active', icon: Play },
								{ id: 'Development', label: 'Development', icon: Terminal },
								{ id: 'Sales', label: 'Sales & Marketing', icon: Megaphone },
								{ id: 'Operations', label: 'Operations', icon: Briefcase },
							] as const
						).map((cat) => {
							const isActive = selectedCategory === cat.id;
							const TabIcon = cat.icon;
							return (
								<button
									key={cat.id}
									type='button'
									onClick={() => {
										setSelectedCategory(cat.id);
									}}
									className={`flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-2xl px-5 text-xs font-bold transition-all duration-200 ${
										isActive
											? 'bg-gradient-to-r from-primary-400 to-primary-400 text-primary-950 shadow-md shadow-primary-500/20 dark:from-primary-400 dark:to-primary-400 dark:shadow-none'
											: 'text-slate-600 border border-border-main bg-bg-card hover:bg-zinc-50/50 hover:text-slate-800 dark:border-border-main dark:bg-bg-card dark:text-zinc-400 dark:hover:bg-zinc-955/40'
									}`}>
									<TabIcon
										size={14}
										className={
											isActive
												? 'text-primary-950'
												: 'text-slate-500 dark:text-zinc-400'
										}
									/>
									<span>{cat.label}</span>
								</button>
							);
						})}
					</div>
				</div>

				{/* Agent List Cards */}
				{isLoading ? (
					<div className='flex items-center justify-center rounded-3xl border border-border-main bg-bg-card py-16 text-xs font-semibold text-slate-400 dark:text-zinc-500'>
						Loading agents…
					</div>
				) : filteredAgents.length === 0 ? (
					<div className='flex flex-col items-center justify-center gap-2 rounded-3xl border border-border-main bg-bg-card py-16 text-center'>
						<Bot size={28} className='text-slate-300 dark:text-zinc-600' />
						<p className='text-sm font-bold text-slate-700 dark:text-zinc-300'>
							No agents yet
						</p>
						<p className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>
							Build your first agent to get started.
						</p>
					</div>
				) : (
				<div className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
					<AnimatePresence mode='popLayout'>
						{filteredAgents.map((agent) => {
							const modelColor = getModelColor(agent.model);
							const { IconComponent, bgClass } = getAgentHeaderIcon(agent.id);
							const CategoryIcon = getCategoryIcon(agent.category);
							return (
								<motion.article
									key={agent.id}
									layout
									initial={{ opacity: 0, scale: 0.96, y: 10 }}
									animate={{ opacity: 1, scale: 1, y: 0 }}
									exit={{ opacity: 0, scale: 0.96, y: 10 }}
									whileHover={{ y: -6, scale: 1.01 }}
									transition={{ type: 'spring', stiffness: 350, damping: 25 }}
									className='group relative flex flex-col justify-between rounded-3xl border border-border-main bg-bg-card p-6 shadow-xs backdrop-blur-md transition-all duration-300 hover:border-primary-500/35 hover:bg-bg-card/80 hover:shadow-xl dark:border-border-main dark:bg-bg-card dark:hover:border-primary-500/35 dark:hover:bg-bg-card/85 dark:hover:shadow-none'>
									{/* Brand background glow behind card */}
									<div
										className='pointer-events-none absolute -inset-px -z-10 rounded-3xl opacity-0 blur-md transition-all duration-500 group-hover:opacity-15'
										style={{
											background: `radial-gradient(circle at 50% 50%, ${modelColor} 0%, transparent 70%)`,
										}}
									/>

									{/* Brand Top Row */}
									<div className='flex items-start justify-between gap-4'>
										<div
											className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:rotate-2 ${bgClass}`}>
											<IconComponent className='h-5 w-5' />
										</div>

										{/* Active/Inactive Status Switch & Options Menu */}
										<div className='flex items-center gap-2'>
											<button
												onClick={() => handleToggleActive(agent.id)}
												aria-label={agent.isActive ? 'Active' : 'Inactive'}
												className={`flex h-8 cursor-pointer items-center justify-center rounded-xl px-3.5 text-xs font-semibold transition-all ${
													agent.isActive
														? 'border border-primary-500/20 bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'
														: 'border border-border-main bg-bg-card text-slate-450 dark:border-border-main dark:bg-zinc-950/40 dark:text-zinc-500'
												} active:scale-95`}>
												<span className='flex items-center gap-1.5'>
													<span
														className={`relative flex h-1.5 w-1.5 rounded-full ${agent.isActive ? 'bg-primary-500' : 'bg-slate-400 dark:bg-zinc-500'}`}>
														{agent.isActive && (
															<span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75'></span>
														)}
													</span>
													<span>
														{agent.isActive ? 'Active' : 'Inactive'}
													</span>
												</span>
											</button>

											<button
												className='dark:hover:bg-zinc-950/60 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-border-main bg-bg-card text-slate-400 hover:bg-slate-50 dark:border-border-main dark:bg-bg-card'
												title='More options'
												aria-label='More options'>
												<MoreHorizontal size={14} />
											</button>
										</div>
									</div>

									{/* Card Content */}
									<div className='mt-5 text-left'>
										<h2 className='text-md font-bold tracking-tight text-slate-900 dark:text-white'>
											{agent.name}
										</h2>
										<p className='mt-2 line-clamp-2 min-h-[32px] text-xs leading-relaxed font-semibold text-slate-400 dark:text-zinc-500'>
											{agent.description}
										</p>
									</div>

									{/* Brand Info Tags */}
									<div className='mt-4 flex flex-wrap gap-2'>
										<span className='inline-flex items-center gap-1 rounded-lg border border-slate-200/50 bg-slate-50/50 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400'>
											<Cpu size={11} className='text-primary-500' />
											{agent.model}
										</span>
										<span className='inline-flex items-center gap-1 rounded-lg border border-slate-200/50 bg-slate-50/50 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400'>
											<MessageSquare size={11} className='text-primary-500' />
											{agent.conversationsCount} chats
										</span>
										<span className='inline-flex items-center gap-1 rounded-lg border border-slate-200/50 bg-slate-50/50 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400'>
											<CategoryIcon size={11} className='text-primary-500' />
											{agent.category}
										</span>
									</div>

									{/* Divider */}
									<div className='my-4 border-t border-slate-100 dark:border-zinc-800/60' />

									{/* Action Footer */}
									<div className='flex items-center justify-between gap-3'>
										<button
											onClick={() =>
												navigate(
													`${pages.agent.subPages.editAgent.to}/${agent.id}`,
												)
											}
											className='dark:text-zinc-300 dark:hover:bg-zinc-955/60 flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-border-main bg-bg-card px-3.5 text-[11px] font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 dark:border-border-main dark:bg-bg-card'>
											<Settings2
												size={12}
												className='text-slate-500 dark:text-zinc-400'
											/>
											Configure
										</button>

										<div className='flex items-center gap-2'>
											<button
												onClick={() =>
													alert(
														`Starting interactive run with Agent: ${agent.name}`,
													)
												}
												className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-primary-400 text-primary-950 shadow-md shadow-primary-500/10 transition-transform hover:scale-105 hover:bg-primary-500 active:scale-95'
												title='Run agent'>
												<Play size={12} className='fill-current' />
											</button>
											<button
												onClick={() => handleDelete(agent.id)}
												className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 active:scale-95 dark:border-zinc-800 dark:hover:border-rose-900/30 dark:hover:bg-rose-950/20'
												title='Delete agent'>
												<Trash2 size={12} />
											</button>
										</div>
									</div>
								</motion.article>
							);
						})}
					</AnimatePresence>
				</div>
				)}

				{/* Bottom Banner Section */}
				<div className='flex flex-col justify-between gap-4 rounded-3xl border border-border-main bg-bg-card p-6 shadow-sm backdrop-blur-md sm:flex-row sm:items-center dark:border-border-main dark:bg-bg-card'>
					<div className='flex items-center gap-4'>
						<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400'>
							<Sparkles size={20} />
						</div>
						<div>
							<h3 className='text-sm font-bold text-slate-900 dark:text-white'>
								Want to build your own agent from scratch?
							</h3>
							<p className='text-slate-450 text-xs font-semibold dark:text-zinc-500'>
								Create a custom AI agent tailored to your specific business needs.
							</p>
						</div>
					</div>
					<button
						onClick={() => navigate(pages.agent.subPages.addAgent.to)}
						className='hover:text-primary-700 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary-200 bg-white px-5 text-xs font-bold text-primary-600 shadow-2xs transition-all hover:border-primary-300 hover:bg-primary-50 dark:border-primary-900/50 dark:bg-bg-card dark:text-primary-400 dark:hover:bg-zinc-950/60'>
						<span>Build Custom Agent</span>
						<span className='text-sm font-semibold'>→</span>
					</button>
				</div>
			</div>
		</Container>
	);
};

export default AgentsListPage;
