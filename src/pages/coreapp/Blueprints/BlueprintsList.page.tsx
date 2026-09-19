import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Search,
	Workflow,
	Cpu,
	Layers,
	Sparkles,
	ChevronDown,
	Users,
	Play,
	Trash2,
	MoreHorizontal,
} from 'lucide-react';
import { OutletContextType } from './_layouts/Blueprints.layout';
import { useConfirm } from '@/context/confirm';
import { notify } from '@/api/core';
import Container from '@/components/layout/Container';
import Breadcrumb from '@/components/layout/Breadcrumb';
import pages from '@/Routes/pages';
import { useWorkspaceContext } from '@/context/workspace';
import {
	useWorkflowTemplates,
	useDeleteWorkflowTemplate,
	useUseWorkflowTemplate,
	useAgentTemplates,
	useDeleteAgentTemplate,
	useUseAgentTemplate,
	useTemplateCollections,
	useDeleteTemplateCollection,
	useUseTemplateCollection,
} from '@/api/modules/templates';
import type { TWorkflowTemplate, TAgentTemplate, TTemplateCollection } from '@/types/template.type';
import { formatUsageCount } from './_helper/blueprints.constants';

type TTab = 'workflows' | 'agents' | 'collections';

/** Page paths are templates (`/:workspaceId/...`). */
const useWorkspacePath = (ws: string) => (to: string) => to.replace(':workspaceId', ws);

const BlueprintsListPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const navigate = useNavigate();
	const { confirm } = useConfirm();

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.workspace.subPages!.blueprints }]} />);
		return () => setHeaderLeft(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { activeWorkspaceId } = useWorkspaceContext();
	const ws = workspaceId || activeWorkspaceId;
	const resolvePath = useWorkspacePath(ws);

	const [activeTab, setActiveTab] = useState<TTab>('workflows');
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('');

	// None of these endpoints take query params — the whole workspace list
	// comes back at once, so search/category filter client-side.
	const { data: workflows, isLoading: isWfsLoading } = useWorkflowTemplates(ws);
	const { data: agents, isLoading: isAgentsLoading } = useAgentTemplates(ws);
	const { data: collections, isLoading: isCollsLoading } = useTemplateCollections(ws);

	const deleteWorkflowTemplate = useDeleteWorkflowTemplate(ws);
	const useWorkflowTemplateMutation = useUseWorkflowTemplate(ws);
	const deleteAgentTemplate = useDeleteAgentTemplate(ws);
	const useAgentTemplateMutation = useUseAgentTemplate(ws);
	const deleteCollection = useDeleteTemplateCollection(ws);
	const useCollectionMutation = useUseTemplateCollection(ws);

	const setTab = (tab: TTab) => {
		setActiveTab(tab);
		setSelectedCategory('');
	};

	const wfCategories = useMemo(() => {
		const counts = new Map<string, number>();
		(workflows ?? []).forEach((t) => {
			const cat = t.category ?? 'uncategorized';
			counts.set(cat, (counts.get(cat) ?? 0) + 1);
		});
		return Array.from(counts, ([category, count]) => ({ category, count }));
	}, [workflows]);

	const agentCategories = useMemo(() => {
		const counts = new Map<string, number>();
		(agents ?? []).forEach((t) => {
			const cat = t.category ?? 'uncategorized';
			counts.set(cat, (counts.get(cat) ?? 0) + 1);
		});
		return Array.from(counts, ([category, count]) => ({ category, count }));
	}, [agents]);

	const query = searchQuery.trim().toLowerCase();
	const filteredWorkflows = useMemo(
		() =>
			(workflows ?? []).filter(
				(t) =>
					(!query || t.name.toLowerCase().includes(query) || (t.description ?? '').toLowerCase().includes(query)) &&
					(!selectedCategory || (t.category ?? 'uncategorized') === selectedCategory),
			),
		[workflows, query, selectedCategory],
	);
	const filteredAgents = useMemo(
		() =>
			(agents ?? []).filter(
				(t) =>
					(!query || t.name.toLowerCase().includes(query) || (t.description ?? '').toLowerCase().includes(query)) &&
					(!selectedCategory || (t.category ?? 'uncategorized') === selectedCategory),
			),
		[agents, query, selectedCategory],
	);
	const filteredCollections = useMemo(
		() =>
			(collections ?? []).filter(
				(c) => !query || c.name.toLowerCase().includes(query) || (c.description ?? '').toLowerCase().includes(query),
			),
		[collections, query],
	);

	const totalTemplates = (workflows?.length ?? 0) + (agents?.length ?? 0);
	const totalCategories = new Set([
		...(workflows ?? []).map((t) => t.category).filter(Boolean),
		...(agents ?? []).map((t) => t.category).filter(Boolean),
	]).size;
	const totalDeployments = [...(workflows ?? []), ...(agents ?? [])].reduce(
		(sum, t) => sum + t.usage_count,
		0,
	);

	const handleUseWorkflow = (template: TWorkflowTemplate) => {
		useWorkflowTemplateMutation.mutate(
			{ id: template.id },
			{
				onSuccess: (workflow) => {
					notify.success(`Created "${workflow.name}" from template.`);
					navigate(`${resolvePath(pages.playbookEditor.subPages!.edit.to)}/${workflow.id}`);
				},
			},
		);
	};

	const handleUseAgent = (template: TAgentTemplate) => {
		useAgentTemplateMutation.mutate(
			{ id: template.id },
			{
				onSuccess: (agent) => {
					notify.success(`Created "${agent.name}" from template.`);
					navigate(`${resolvePath(pages.agentEditor.subPages!.edit.to)}/${agent.id}`);
				},
			},
		);
	};

	const handleUseCollection = (collection: TTemplateCollection) => {
		useCollectionMutation.mutate(
			{ id: collection.id },
			{
				onSuccess: (result) => {
					notify.success(
						`Created ${result.workflows.length} workflow(s) and ${result.agents.length} agent(s) from "${collection.name}".`,
					);
				},
			},
		);
	};

	const handleDeleteWorkflow = async (template: TWorkflowTemplate) => {
		const confirmed = await confirm({
			title: 'Delete Template',
			message: `Delete "${template.name}"? This cannot be undone.`,
		});
		if (confirmed) deleteWorkflowTemplate.mutate(template.id);
	};

	const handleDeleteAgent = async (template: TAgentTemplate) => {
		const confirmed = await confirm({
			title: 'Delete Template',
			message: `Delete "${template.name}"? This cannot be undone.`,
		});
		if (confirmed) deleteAgentTemplate.mutate(template.id);
	};

	const handleDeleteCollection = async (collection: TTemplateCollection) => {
		const confirmed = await confirm({
			title: 'Delete Collection',
			message: `Delete "${collection.name}"? The templates inside aren't deleted, just ungrouped.`,
		});
		if (confirmed) deleteCollection.mutate(collection.id);
	};

	return (
		<Container className='relative overflow-x-hidden overflow-y-auto bg-[#F8F9FC] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] !p-0 dark:bg-zinc-950 dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]'>
			<style>{`
				@keyframes float { 0%, 100% { transform: translateY(0px) rotate(-10deg) skewX(2deg); } 50% { transform: translateY(-12px) rotate(-8deg) skewX(1deg); } }
				@keyframes float-teal { 0%, 100% { transform: translateY(0px) rotate(15deg) skewX(-2deg); } 50% { transform: translateY(-8px) rotate(12deg) skewX(-1deg); } }
				@keyframes float-coral { 0%, 100% { transform: translateY(0px) rotate(-5deg); } 50% { transform: translateY(-10px) rotate(-8deg); } }
				.animate-3d-float { animation: float 6s ease-in-out infinite; }
				.animate-3d-float-teal { animation: float-teal 5s ease-in-out infinite; }
				.animate-3d-float-coral { animation: float-coral 7s ease-in-out infinite; }
			`}</style>

			<div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
				{/* Hero header banner */}
				<div className='relative mb-8 overflow-hidden rounded-3xl border border-primary-500/20 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 px-6 py-8 text-[#101828] shadow-xl sm:px-10 sm:py-12 dark:border-zinc-800 dark:bg-gradient-to-r dark:from-[#111315] dark:via-[#141619] dark:to-[#0d0e10] dark:text-white'>
					<div className='grid grid-cols-1 items-center gap-8 lg:grid-cols-12'>
						<div className='relative z-10 lg:col-span-8'>
							<div className='mb-4 flex items-center gap-3'>
								<div className='inline-block rounded-md border border-white/30 bg-white/40 px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#101828] uppercase backdrop-blur-md dark:border-primary-500/20 dark:bg-primary-950/30 dark:text-primary-400'>
									Ready to use
								</div>
							</div>
							<h1 className='mb-3 text-3xl font-extrabold tracking-tight text-[#101828] sm:text-4xl dark:text-white'>
								Blueprints
							</h1>
							<p className='mb-6 max-w-2xl text-xs leading-relaxed text-zinc-850 sm:text-sm dark:text-zinc-400'>
								Turn any workflow, agent, or bundle of both into a reusable template — then spin
								up new ones from it in one click.
							</p>

							<div className='mt-6 flex flex-wrap items-center gap-4'>
								<div className='flex items-center gap-3 rounded-2xl border border-white/20 bg-white/40 px-4 py-2.5 shadow-xs backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60'>
									<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-white/50 dark:bg-zinc-850'>
										<Workflow className='h-4.5 w-4.5 text-[#101828] dark:text-primary-400' />
									</div>
									<div>
										<div className='text-sm leading-none font-extrabold text-[#101828] dark:text-white'>
											{totalTemplates}
										</div>
										<div className='mt-0.5 text-[10px] font-semibold text-slate-800 dark:text-zinc-500'>
											Templates
										</div>
									</div>
								</div>

								<div className='flex items-center gap-3 rounded-2xl border border-white/20 bg-white/40 px-4 py-2.5 shadow-xs backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60'>
									<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-white/50 dark:bg-zinc-850'>
										<Layers className='h-4.5 w-4.5 text-[#101828] dark:text-primary-400' />
									</div>
									<div>
										<div className='text-sm leading-none font-extrabold text-[#101828] dark:text-white'>
											{totalCategories}
										</div>
										<div className='mt-0.5 text-[10px] font-semibold text-slate-800 dark:text-zinc-500'>
											Categories
										</div>
									</div>
								</div>

								<div className='flex items-center gap-3 rounded-2xl border border-white/20 bg-white/40 px-4 py-2.5 shadow-xs backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60'>
									<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-white/50 dark:bg-zinc-850'>
										<Sparkles className='h-4.5 w-4.5 text-[#101828] dark:text-primary-400' />
									</div>
									<div>
										<div className='text-sm leading-none font-extrabold text-[#101828] dark:text-white'>
											{formatUsageCount(totalDeployments)}
										</div>
										<div className='mt-0.5 text-[10px] font-semibold text-slate-800 dark:text-zinc-500'>
											Deployments
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* 3D graphic column */}
						<div className='pointer-events-none relative hidden h-56 justify-center select-none lg:col-span-4 lg:flex'>
							<div className='relative flex h-64 w-64 items-center justify-center' style={{ perspective: '1000px' }}>
								<div className='animate-3d-float absolute flex h-36 w-36 items-center justify-center rounded-3xl border border-white/25 bg-gradient-to-br from-primary-400 to-primary-500 shadow-[0_25px_50px_-12px_rgba(196,238,61,0.25)]'>
									<div className='pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/15 via-transparent to-transparent' />
									<Sparkles className='h-16 w-16 text-zinc-900 drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]' />
								</div>
								<div className='animate-3d-float-teal absolute top-28 left-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-tr from-[#7B37FC] to-[#501EE3] shadow-lg'>
									<Workflow className='h-5 w-5 text-white' />
								</div>
								<div className='animate-3d-float-coral absolute top-12 right-6 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-tr from-orange-400 to-primary-400 shadow-lg'>
									<Cpu className='h-4.5 w-4.5 text-white' />
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Tabs & search controls */}
				<div className='mb-8 flex flex-col items-stretch justify-between gap-4 border-b border-zinc-200/50 pb-5 md:flex-row md:items-center dark:border-zinc-800'>
					<div className='no-scrollbar flex items-center gap-2 overflow-x-auto pb-1.5'>
						<button
							onClick={() => setTab('workflows')}
							className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
								activeTab === 'workflows'
									? 'border border-primary-500/20 bg-primary-50 text-primary-600 shadow-2xs dark:border-primary-800/40 dark:bg-primary-950/30 dark:text-primary-400'
									: 'border border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
							}`}>
							<Workflow className='h-3.5 w-3.5' />
							Workflows
						</button>
						<button
							onClick={() => setTab('agents')}
							className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
								activeTab === 'agents'
									? 'border border-primary-500/20 bg-primary-50 text-primary-600 shadow-2xs dark:border-primary-800/40 dark:bg-primary-950/30 dark:text-primary-400'
									: 'border border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
							}`}>
							<Cpu className='h-3.5 w-3.5' />
							AI Agents
						</button>
						<button
							onClick={() => setTab('collections')}
							className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
								activeTab === 'collections'
									? 'border border-primary-500/20 bg-primary-50 text-primary-600 shadow-2xs dark:border-primary-800/40 dark:bg-primary-950/30 dark:text-primary-400'
									: 'border border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
							}`}>
							<Layers className='h-3.5 w-3.5' />
							Collections
						</button>
					</div>

					<div className='flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center'>
						<div className='relative w-full sm:w-64'>
							<Search className='pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-600' />
							<input
								type='text'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder={`Search ${activeTab}...`}
								className='shadow-3xs w-full rounded-xl border border-zinc-200/80 bg-white py-2 pr-4 pl-9 text-xs text-zinc-700 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:focus:ring-primary-600'
							/>
						</div>

						{activeTab !== 'collections' && (
							<div className='relative w-full sm:w-auto'>
								<select
									value={selectedCategory}
									onChange={(e) => setSelectedCategory(e.target.value)}
									className='shadow-3xs w-full cursor-pointer appearance-none rounded-xl border border-zinc-200/80 bg-white py-2 pr-8 pl-3 text-xs text-zinc-700 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300'>
									<option value=''>All Categories</option>
									{(activeTab === 'workflows' ? wfCategories : agentCategories).map((cat) => (
										<option key={cat.category} value={cat.category}>
											{cat.category} ({cat.count})
										</option>
									))}
								</select>
								<ChevronDown className='pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-600' />
							</div>
						)}
					</div>
				</div>

				{/* Main grid list */}
				<div className='mt-8'>
					<div className='mb-6 flex items-center gap-2'>
						<h2 className='text-sm font-bold text-zinc-800 dark:text-zinc-200'>
							{activeTab === 'workflows' ? 'All Workflows' : activeTab === 'agents' ? 'All Agents' : 'All Collections'}
						</h2>
						<span className='rounded-full bg-zinc-200/50 px-2.5 py-0.5 text-[10px] font-extrabold text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400'>
							{activeTab === 'workflows'
								? filteredWorkflows.length
								: activeTab === 'agents'
									? filteredAgents.length
									: filteredCollections.length}
						</span>
					</div>

					{(activeTab === 'workflows' && isWfsLoading) ||
					(activeTab === 'agents' && isAgentsLoading) ||
					(activeTab === 'collections' && isCollsLoading) ? (
						<div className='flex flex-col items-center justify-center gap-2 py-24 text-xs font-semibold text-zinc-500 dark:text-zinc-400'>
							Loading catalog…
						</div>
					) : activeTab === 'workflows' && filteredWorkflows.length === 0 ? (
						<EmptyState icon={Workflow} title='No workflow templates found' />
					) : activeTab === 'agents' && filteredAgents.length === 0 ? (
						<EmptyState icon={Cpu} title='No AI agent templates found' />
					) : activeTab === 'collections' && filteredCollections.length === 0 ? (
						<EmptyState icon={Layers} title='No collections found' />
					) : (
						<div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
							<AnimatePresence mode='popLayout'>
								{activeTab === 'workflows' &&
									filteredWorkflows.map((wf) => (
										<CatalogCard
											key={wf.id}
											color={wf.color || '#C4EE3D'}
											icon={Workflow}
											hoverColor='primary'
											name={wf.name}
											category={wf.category ?? 'uncategorized'}
											description={wf.description}
											footerLeft={`${wf.graph.nodes.length} node${wf.graph.nodes.length === 1 ? '' : 's'}`}
											usageCount={wf.usage_count}
											isUsePending={useWorkflowTemplateMutation.isPending}
											onUse={() => handleUseWorkflow(wf)}
											onDelete={() => handleDeleteWorkflow(wf)}
										/>
									))}

								{activeTab === 'agents' &&
									filteredAgents.map((agent) => (
										<CatalogCard
											key={agent.id}
											color={agent.color || '#C4EE3D'}
											icon={Cpu}
											hoverColor='primary'
											name={agent.name}
											category={agent.category ?? 'uncategorized'}
											description={agent.description}
											footerLeft={agent.config.model || 'Default model'}
											usageCount={agent.usage_count}
											isUsePending={useAgentTemplateMutation.isPending}
											onUse={() => handleUseAgent(agent)}
											onDelete={() => handleDeleteAgent(agent)}
										/>
									))}

								{activeTab === 'collections' &&
									filteredCollections.map((coll) => (
										<CatalogCard
											key={coll.id}
											color={coll.color || '#F59E0B'}
											icon={Layers}
											hoverColor='amber'
											name={coll.name}
											category='Collection Bundle'
											description={coll.description}
											footerLeft={`${coll.item_count ?? 0} items`}
											usageCount={0}
											isUsePending={useCollectionMutation.isPending}
											onUse={() => handleUseCollection(coll)}
											onDelete={() => handleDeleteCollection(coll)}
										/>
									))}
							</AnimatePresence>
						</div>
					)}
				</div>
			</div>
		</Container>
	);
};

// ─── Shared pieces ───────────────────────────────────────────────

const EmptyState = ({ icon: Icon, title }: { icon: typeof Workflow; title: string }) => (
	<div className='rounded-2xl border border-dashed border-zinc-200 bg-white/50 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950/50'>
		<Icon className='mx-auto mb-2 h-10 w-10 text-zinc-300 dark:text-zinc-600' />
		<h3 className='mb-1 text-sm font-bold text-zinc-700 dark:text-zinc-300'>{title}</h3>
		<p className='text-xs text-zinc-400'>Try broadening your search query or filters.</p>
	</div>
);

const CatalogCard = ({
	color,
	icon: Icon,
	hoverColor,
	name,
	category,
	description,
	footerLeft,
	usageCount,
	isUsePending,
	onUse,
	onDelete,
}: {
	color: string;
	icon: typeof Workflow;
	hoverColor: 'primary' | 'amber';
	name: string;
	category: string;
	description: string | null;
	footerLeft: string;
	usageCount: number;
	isUsePending: boolean;
	onUse: () => void;
	onDelete: () => void;
}) => {
	const [menuOpen, setMenuOpen] = useState(false);
	const hoverBorder = hoverColor === 'primary' ? 'hover:border-primary-400 dark:hover:border-primary-400/50' : 'hover:border-amber-400 dark:hover:border-amber-400/50';
	const hoverText = hoverColor === 'primary' ? 'group-hover:text-primary-600 dark:group-hover:text-primary-400' : 'group-hover:text-amber-600 dark:group-hover:text-amber-400';

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 10 }}
			transition={{ type: 'spring', stiffness: 350, damping: 25 }}
			className={`group relative flex flex-col rounded-2xl border border-slate-200/60 bg-white p-5 transition-all duration-300 hover:-translate-y-1 ${hoverBorder} hover:shadow-[0_12px_24px_-10px_rgba(16,24,40,0.06)] dark:border-zinc-800/80 dark:bg-zinc-950 dark:hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.5)]`}>
			<div className='mb-3.5 flex items-start justify-between'>
				<div className='flex min-w-0 items-center gap-3'>
					<div
						style={{ backgroundColor: `${color}1f` }}
						className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-100/50 transition-transform duration-300 group-hover:scale-105 dark:border-zinc-800/50'>
						<Icon className='h-5 w-5' style={{ color }} />
					</div>
					<div className='min-w-0 space-y-0.5'>
						<h4 className={`truncate text-[13px] leading-snug font-black text-slate-900 transition-colors dark:text-zinc-50 ${hoverText}`}>
							{name}
						</h4>
						<span className='block truncate text-[9px] font-extrabold tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
							{category}
						</span>
					</div>
				</div>
				<div className='relative shrink-0'>
					<button
						onClick={() => setMenuOpen((o) => !o)}
						title='More options'
						className='rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'>
						<MoreHorizontal className='h-4 w-4' />
					</button>
					{menuOpen && (
						<div className='absolute top-8 right-0 z-10 w-32 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900'>
							<button
								onClick={() => {
									setMenuOpen(false);
									onDelete();
								}}
								className='flex w-full cursor-pointer items-center gap-1.5 px-3 py-2 text-left text-[11px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20'>
								<Trash2 size={12} />
								Delete
							</button>
						</div>
					)}
				</div>
			</div>

			<p className='mb-4 line-clamp-2 text-[11px] leading-relaxed font-semibold text-slate-500 dark:text-zinc-400'>
				{description || 'No description provided.'}
			</p>

			<div className='mt-auto flex items-center justify-between border-t border-slate-100/80 pt-3.5 dark:border-zinc-900/60'>
				<span className='max-w-[110px] truncate rounded-full border border-zinc-200/60 bg-zinc-50/50 px-2.5 py-0.5 text-[9px] font-bold text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-400'>
					{footerLeft}
				</span>
				<div className='flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500'>
					<Users className='h-3.5 w-3.5 text-slate-400/80 dark:text-zinc-500' />
					<span>{formatUsageCount(usageCount)}</span>
				</div>
			</div>

			<button
				onClick={onUse}
				disabled={isUsePending}
				className='mt-3 flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary-400 text-[11px] font-black text-primary-950 transition-all hover:bg-primary-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'>
				<Play size={12} />
				Use
			</button>
		</motion.div>
	);
};

export default BlueprintsListPage;
