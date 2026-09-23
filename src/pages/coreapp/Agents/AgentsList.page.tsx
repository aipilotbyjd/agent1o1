import { useEffect, useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOutletContext, useNavigate, useParams } from 'react-router';
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
	Copy,
} from 'lucide-react';
import { OutletContextType } from './_layouts/Agents.layout';
import { useConfirm } from '@/context/confirm';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import pages from '@/Routes/pages';
import paths from '@/Routes/paths';
import { useWorkspaceContext } from '@/context/workspace';
import { agentKeys, useAgents, useDeleteAgent, useDuplicateAgent } from '@/api/modules/agents';
import ListSkeletonPart from '@/parts/ListSkeleton.part';
import type { TAgent } from '@/types/agent.type';
import { notify } from '@/api/core';

interface IAgentItem {
	id: string;
	name: string;
	description: string;
	model: string;
	tags: string[];
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
		return {
			IconComponent: Cpu,
			bgClass: 'bg-primary-400 text-primary-950 shadow-primary-500/20',
		};
	}
	if (id === 'agent-3') {
		return { IconComponent: Briefcase, bgClass: 'bg-amber-600 text-white shadow-amber-600/20' };
	}
	return {
		IconComponent: Briefcase,
		bgClass: 'bg-primary-400 text-primary-950 shadow-primary-500/20',
	};
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
		setHeaderLeft(<Breadcrumb list={[{ ...pages.workspace.subPages!.agents }]} />);
		return () => setHeaderLeft(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	/** The URL is the source of truth for the workspace; the context covers the
	 *  first render, before the route param is available. */
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { activeWorkspaceId } = useWorkspaceContext();
	const currentWorkspaceId = workspaceId || activeWorkspaceId;

	const { data: apiAgents, isLoading } = useAgents(currentWorkspaceId);
	const deleteAgentMutation = useDeleteAgent(currentWorkspaceId);
	const duplicateAgentMutation = useDuplicateAgent(currentWorkspaceId);
	const queryClient = useQueryClient();

	const agents = useMemo<IAgentItem[]>(() => {
		if (!apiAgents || apiAgents.length === 0) return [];
		return apiAgents.map((a) => ({
			id: a.id,
			name: a.name,
			description: a.description || 'No description provided.',
			model: a.model ?? 'No model set',
			tags: a.tags?.map((t) => t.name) ?? [],
		}));
	}, [apiAgents]);

	const categories = useMemo(() => {
		const seen = new Set<string>();
		agents.forEach((a) => a.tags.forEach((t) => seen.add(t)));
		return ['All', ...Array.from(seen).sort()];
	}, [agents]);

	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string>('All');

	const filteredAgents = useMemo(() => {
		return agents.filter((agent) => {
			const matchesSearch =
				agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
				agent.model.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesCategory =
				selectedCategory === 'All' || agent.tags.includes(selectedCategory);

			return matchesSearch && matchesCategory;
		});
	}, [agents, searchQuery, selectedCategory]);

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

		// Pull the card now instead of after the round trip. The dialog above is
		// the safety net, so a failure rolls the list back rather than offering
		// an undo the backend could not honour anyway.
		const listKey = agentKeys.list(currentWorkspaceId);
		const previousAgents = queryClient.getQueryData<TAgent[]>(listKey);
		queryClient.setQueryData<TAgent[]>(listKey, (rows) =>
			(rows ?? []).filter((row) => String(row.id) !== String(id)),
		);

		deleteAgentMutation.mutate(id, {
			onSuccess: () => notify.success(agent ? `"${agent.name}" deleted.` : 'Agent deleted.'),
			// No toast here — query-client.ts already reports the failure globally.
			onError: () => {
				if (previousAgents) queryClient.setQueryData(listKey, previousAgents);
			},
		});
	};

	return (
		<Container
			breakpoint={null}
			className='relative max-w-full min-w-0 overflow-x-hidden overflow-y-auto bg-[#f8f9fc] !p-0 dark:bg-zinc-950'>
			{/* Ambient decorative blur glows */}
			<div className='from-primary-400/5 to-primary-400/5 pointer-events-none absolute top-[-10%] right-[-10%] -z-10 h-[45%] w-[45%] rounded-full bg-gradient-to-tr blur-[120px]' />
			<div className='from-primary-500/5 to-primary-500/0 pointer-events-none absolute bottom-[-10%] left-[-10%] -z-10 h-[45%] w-[45%] rounded-full bg-gradient-to-br blur-[120px]' />

			<div className='mx-auto flex w-full max-w-7xl min-w-0 flex-col space-y-6 p-3 sm:space-y-8 sm:p-6 md:p-8'>
				{/* Header Section */}
				<div className='flex min-w-0 flex-col justify-between gap-5 md:flex-row md:items-center'>
					<div className='min-w-0'>
						<h1 className='bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 bg-clip-text text-3xl font-black tracking-tight text-transparent dark:from-white dark:via-zinc-200 dark:to-white'>
							Agents
						</h1>
						<p className='text-primary-600 dark:text-primary-400 mt-1 text-xs font-black tracking-widest uppercase'>
							AI ASSISTANT ORCHESTRATION
						</p>
						<p className='mt-0.5 text-xs font-semibold text-slate-500 dark:text-zinc-400'>
							Deploy and manage autonomous AI agents to automate your workflows.
						</p>
					</div>

					{/* Right decorative orbit card containing Build Agent button */}
					<div className='border-border-main bg-bg-card dark:border-border-main dark:bg-bg-card flex w-full min-w-0 items-center gap-3 rounded-2xl border p-3 shadow-sm backdrop-blur-md sm:w-auto sm:gap-5 sm:rounded-3xl sm:pr-6'>
						<div className='relative flex h-14 w-16 shrink-0 items-center justify-center overflow-hidden sm:w-20'>
							{/* Concentric dashed orbits */}
							<div className='border-primary-300/40 dark:border-primary-500/20 absolute h-18 w-18 animate-[spin_40s_linear_infinite] rounded-full border border-dashed' />
							<div className='absolute h-12 w-12 animate-[spin_20s_linear_infinite_reverse] rounded-full border border-dashed border-blue-300/40 dark:border-blue-500/20' />

							{/* Floating robot head inside gradient bubble */}
							<div className='from-primary-500 to-primary-300 shadow-primary-500/20 relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br shadow-md'>
								<div className='from-primary-400 to-primary-300 absolute -inset-0.5 rounded-full bg-gradient-to-br opacity-50 blur-xs' />
								<Bot className='relative h-5 w-5 text-white' />
							</div>
						</div>

						<button
							onClick={() => navigate(paths.newAgent(currentWorkspaceId))}
							className='from-primary-400 to-primary-400 text-primary-950 shadow-primary-500/20 hover:from-primary-400 hover:to-primary-400 hover:shadow-primary-500/30 flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-4 text-xs font-black shadow-lg transition-all hover:shadow-xl active:scale-95 sm:flex-none sm:px-5 dark:shadow-none'>
							<Sparkles size={14} className='animate-pulse' />
							<span>Build Agent</span>
						</button>
					</div>
				</div>

				{/* Stats overview row */}
				<div className='grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3'>
					{/* Card 1: Total Agents */}
					<div className='group border-border-main bg-bg-card dark:border-border-main dark:bg-bg-card relative min-w-0 overflow-hidden rounded-2xl border p-4 shadow-xs backdrop-blur-md sm:p-5'>
						<div className='flex items-center gap-3'>
							<div className='border-primary-500/20 bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border'>
								<Briefcase size={16} />
							</div>
							<span className='text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
								Total Agents
							</span>
						</div>
						<div className='mt-3.5 flex items-center justify-between'>
							<div className='flex items-baseline gap-1.5'>
								<span className='text-3xl font-black text-slate-900 dark:text-white'>
									{agents.length}
								</span>
								<span className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>
									agents
								</span>
							</div>

							{/* Custom green SVG sparkline */}
							<div className='h-8 w-20 shrink-0 sm:w-24'>
								<svg
									className='text-primary-500 h-full w-full'
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
								<span className='bg-primary-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75'></span>
								<span className='bg-primary-500 relative inline-flex h-1.5 w-1.5 rounded-full'></span>
							</span>
							<span className='text-primary-600 dark:text-primary-400 text-[10px] font-black'>
								In this workspace
							</span>
						</div>
					</div>

					{/* Card 2: Tagged Agents */}
					<div className='group border-border-main bg-bg-card dark:border-border-main dark:bg-bg-card relative min-w-0 overflow-hidden rounded-2xl border p-4 shadow-xs backdrop-blur-md sm:p-5'>
						<div className='flex items-center gap-3'>
							<div className='border-primary-500/20 bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border'>
								<MessageSquare size={16} />
							</div>
							<span className='text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
								Tagged Agents
							</span>
						</div>
						<div className='mt-3.5 flex items-center justify-between'>
							<div className='flex items-baseline gap-1.5'>
								<span className='text-3xl font-black text-slate-900 dark:text-white'>
									{agents.filter((a) => a.tags.length > 0).length}
								</span>
								<span className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>
									tagged
								</span>
							</div>

							{/* Custom purple SVG bar chart */}
							<div className='flex h-8 items-end justify-end gap-1'>
								<div className='bg-primary-300 dark:bg-primary-800/60 h-[35%] w-1.5 rounded-t-sm' />
								<div className='bg-primary-400 dark:bg-primary-700/80 h-[55%] w-1.5 rounded-t-sm' />
								<div className='bg-primary-300 dark:bg-primary-400/70 h-[40%] w-1.5 rounded-t-sm' />
								<div className='bg-primary-400 h-[80%] w-1.5 rounded-t-sm' />
								<div className='bg-primary-400 h-[65%] w-1.5 rounded-t-sm' />
								<div className='bg-primary-700 h-[100%] w-1.5 rounded-t-sm' />
							</div>
						</div>
						<div className='text-slate-450 mt-3.5 text-[10px] font-bold dark:text-zinc-500'>
							Agents grouped by tag
						</div>
					</div>

					{/* Card 3: Active Models */}
					<div className='group border-border-main bg-bg-card dark:border-border-main dark:bg-bg-card relative min-w-0 overflow-hidden rounded-2xl border p-4 shadow-xs backdrop-blur-md sm:p-5'>
						<div className='flex items-center gap-3'>
							<div className='border-primary-500/20 bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border'>
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
									className='text-primary-500/30 h-12 w-16'
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
						<div className='text-primary-600 dark:text-primary-400 mt-3 flex items-center gap-1.5 text-[10px] font-black'>
							<span className='bg-primary-500 h-1.5 w-1.5 rounded-full' />
							<span>Multi-model cognitive pipelines</span>
						</div>
					</div>
				</div>

				{/* Search & Categories Bar */}
				<div className='flex min-w-0 flex-col gap-4 sm:gap-5 xl:flex-row xl:items-center'>
					<div className='group relative w-full min-w-0 flex-1'>
						<Search className='group-focus-within:text-primary-500 absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400 transition-colors duration-200 dark:text-zinc-500' />
						<input
							type='search'
							aria-label='Search agents'
							placeholder='Search agents by name, description, or model...'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className='border-border-main bg-bg-card focus:border-primary-500/80 focus:ring-primary-500/10 dark:border-border-main dark:bg-bg-card dark:focus:border-primary-500 dark:focus:ring-primary-500/15 block h-12 w-full rounded-2xl border pr-12 pl-12 text-xs font-semibold text-slate-900 shadow-xs transition-all duration-200 outline-none placeholder:text-slate-400 focus:bg-white focus:ring-4 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-950/40'
						/>
						<span className='absolute top-3.5 right-4 hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-bold text-slate-400 shadow-2xs sm:inline dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-500'>
							⌘K
						</span>
					</div>

					{/* Category tabs */}
					<div className='no-scrollbar relative flex max-w-full min-w-0 gap-2 overflow-x-auto pb-1 xl:pb-0'>
						{categories
							.map((id) => ({ id, label: id, icon: getCategoryIcon(id) }))
							.map((cat) => {
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
												? 'from-primary-400 to-primary-400 text-primary-950 shadow-primary-500/20 dark:from-primary-400 dark:to-primary-400 bg-gradient-to-r shadow-md dark:shadow-none'
												: 'border-border-main bg-bg-card dark:border-border-main dark:bg-bg-card dark:hover:bg-zinc-955/40 border text-slate-600 hover:bg-zinc-50/50 hover:text-slate-800 dark:text-zinc-400'
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
					<div className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
						<ListSkeletonPart count={6} />
					</div>
				) : filteredAgents.length === 0 ? (
					<div className='border-border-main bg-bg-card flex flex-col items-center justify-center gap-2 rounded-3xl border py-16 text-center'>
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
								const primaryTag = agent.tags[0];
								const CategoryIcon = getCategoryIcon(primaryTag ?? '');
								return (
									<motion.article
										key={agent.id}
										layout
										initial={{ opacity: 0, scale: 0.96, y: 10 }}
										animate={{ opacity: 1, scale: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.96, y: 10 }}
										whileHover={{ y: -6, scale: 1.01 }}
										transition={{ type: 'spring', stiffness: 350, damping: 25 }}
										className='group border-border-main bg-bg-card hover:border-primary-500/35 hover:bg-bg-card/80 dark:border-border-main dark:bg-bg-card dark:hover:border-primary-500/35 dark:hover:bg-bg-card/85 relative flex flex-col justify-between rounded-3xl border p-6 shadow-xs backdrop-blur-md transition-all duration-300 hover:shadow-xl dark:hover:shadow-none'>
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

											{/* The old Active/Inactive switch is gone: this backend has no
										    `is_active` column and UpdateAgentRequest has no rule for it,
										    so the PATCH was silently discarded. The "More options" button
										    beside it opened nothing, and had nothing left to open -
										    Configure, Run, Duplicate and Delete are already buttons in
										    the card footer. */}
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
												<MessageSquare
													size={11}
													className='text-primary-500'
												/>
												{agent.tags.length}{' '}
												{agent.tags.length === 1 ? 'tag' : 'tags'}
											</span>
											<span className='inline-flex items-center gap-1 rounded-lg border border-slate-200/50 bg-slate-50/50 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400'>
												<CategoryIcon
													size={11}
													className='text-primary-500'
												/>
												{primaryTag ?? 'Untagged'}
											</span>
										</div>

										{/* Divider */}
										<div className='my-4 border-t border-slate-100 dark:border-zinc-800/60' />

										{/* Action Footer */}
										<div className='flex items-center justify-between gap-3'>
											<button
												onClick={() =>
													navigate(
														paths.editAgent(
															currentWorkspaceId,
															agent.id,
														),
													)
												}
												className='dark:hover:bg-zinc-955/60 border-border-main bg-bg-card dark:border-border-main dark:bg-bg-card flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 text-[11px] font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 dark:text-zinc-300'>
												<Settings2
													size={12}
													className='text-slate-500 dark:text-zinc-400'
												/>
												Configure
											</button>

											<div className='flex items-center gap-2'>
												<button
													// The builder opens on its chat surface, which is where an agent is
													// actually run; Configure lands on that same screen's settings panel.
													onClick={() =>
														navigate(
															paths.editAgent(
																currentWorkspaceId,
																agent.id,
															),
														)
													}
													className='bg-primary-400 text-primary-950 shadow-primary-500/10 hover:bg-primary-500 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl shadow-md transition-transform hover:scale-105 active:scale-95'
													title='Run agent'>
													<Play size={12} className='fill-current' />
												</button>
												<button
													onClick={() =>
														duplicateAgentMutation.mutate(agent.id)
													}
													disabled={duplicateAgentMutation.isPending}
													className='hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 dark:hover:border-primary-900/30 dark:hover:bg-primary-950/20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800'
													title='Duplicate agent'>
													<Copy size={12} />
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
				<div className='border-border-main bg-bg-card dark:border-border-main dark:bg-bg-card flex flex-col justify-between gap-4 rounded-3xl border p-6 shadow-sm backdrop-blur-md sm:flex-row sm:items-center'>
					<div className='flex items-center gap-4'>
						<div className='bg-primary-100 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400 flex h-12 w-12 shrink-0 items-center justify-center rounded-full'>
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
						onClick={() => navigate(paths.newAgent(currentWorkspaceId))}
						className='hover:text-primary-700 border-primary-200 text-primary-600 hover:border-primary-300 hover:bg-primary-50 dark:border-primary-900/50 dark:bg-bg-card dark:text-primary-400 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white px-5 text-xs font-bold shadow-2xs transition-all dark:hover:bg-zinc-950/60'>
						<span>Build Custom Agent</span>
						<span className='text-sm font-semibold'>→</span>
					</button>
				</div>
			</div>
		</Container>
	);
};

export default AgentsListPage;
