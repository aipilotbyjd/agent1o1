import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Search,
	Sparkles,
	Layers,
	FileText,
	Code2,
	Settings2,
	Trash2,
	UserPlus,
	Puzzle as PuzzleIcon,
	Lock,
	Globe,
} from 'lucide-react';
import { OutletContextType } from './_layouts/Skills.layout';
import { useConfirm } from '@/context/confirm';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import pages from '@/Routes/pages';
import { useWorkspaceContext } from '@/context/workspace';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import { useAgentSkills, useDeleteAgentSkill } from '@/api/modules/agents';
import type { TAgentSkill, TSkillFilters } from '@/types/agent.type';
import { SKILL_CATEGORIES, getSkillIconComponent, getSkillCategoryColor } from './_helper/skills.constants';
import SkillEditorDrawer from './_partial/SkillEditorDrawer.partial';
import AddToAgentDialog from './_partial/AddToAgentDialog.partial';

type TVisibilityFilter = 'All' | 'Personal' | 'Shared';

const SkillsListPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const { confirm } = useConfirm();

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.app.subPages.skills }]} />);
		return () => setHeaderLeft(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const { activeWorkspaceId } = useWorkspaceContext();
	const { activeWorkspaceId: fallbackWorkspaceId } = useWorkflowShellStore();
	const currentWorkspaceId = activeWorkspaceId || fallbackWorkspaceId;

	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<'All' | (typeof SKILL_CATEGORIES)[number]>(
		'All',
	);
	const [visibility, setVisibility] = useState<TVisibilityFilter>('All');

	const filters = useMemo<TSkillFilters>(() => {
		const f: TSkillFilters = {};
		if (searchQuery.trim()) f.search = searchQuery.trim();
		if (selectedCategory !== 'All') f.category = selectedCategory;
		if (visibility !== 'All') f.is_shared = visibility === 'Shared';
		return f;
	}, [searchQuery, selectedCategory, visibility]);

	const { data: skills, isLoading } = useAgentSkills(currentWorkspaceId, filters);
	const deleteSkillMutation = useDeleteAgentSkill(currentWorkspaceId);

	const [editorState, setEditorState] = useState<{ open: boolean; skillId: string | null }>({
		open: false,
		skillId: null,
	});
	const [attachingSkill, setAttachingSkill] = useState<TAgentSkill | null>(null);

	const skillList = skills ?? [];
	const categoriesInUse = new Set(skillList.map((s) => s.category).filter(Boolean)).size;
	const sharedCount = skillList.filter((s) => s.is_shared).length;

	const handleDelete = async (skill: TAgentSkill) => {
		const confirmed = await confirm({
			title: 'Delete Skill',
			message: (
				<>
					Are you sure you want to delete{' '}
					<strong className='font-semibold text-zinc-800 dark:text-zinc-200'>
						&quot;{skill.name}&quot;
					</strong>
					? This action cannot be undone.
				</>
			),
		});
		if (!confirmed) return;
		deleteSkillMutation.mutate(skill.id);
	};

	return (
		<Container className='relative overflow-x-hidden overflow-y-auto bg-[#f8f9fc] !p-0 dark:bg-zinc-950'>
			<div className='pointer-events-none absolute top-[-10%] right-[-10%] -z-10 h-[45%] w-[45%] rounded-full bg-gradient-to-tr from-primary-400/5 to-primary-400/5 blur-[120px]' />
			<div className='pointer-events-none absolute bottom-[-10%] left-[-10%] -z-10 h-[45%] w-[45%] rounded-full bg-gradient-to-br from-primary-500/5 to-primary-500/0 blur-[120px]' />

			<div className='mx-auto flex w-full max-w-7xl flex-col space-y-8 p-4 sm:p-6 md:p-8'>
				{/* Header */}
				<div className='flex flex-col justify-between gap-6 md:flex-row md:items-center'>
					<div>
						<h1 className='bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 bg-clip-text text-3xl font-black tracking-tight text-transparent dark:from-white dark:via-zinc-200 dark:to-white'>
							Skills
						</h1>
						<p className='mt-1 text-xs font-black tracking-widest text-primary-600 uppercase dark:text-primary-400'>
							REUSABLE AGENT CAPABILITIES
						</p>
						<p className='mt-0.5 text-xs font-semibold text-slate-500 dark:text-zinc-400'>
							Build a library of skills — instructions, references, and scripts — and attach
							them to any agent.
						</p>
					</div>

					<button
						onClick={() => setEditorState({ open: true, skillId: null })}
						className='flex h-11 cursor-pointer items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-primary-400 to-primary-400 px-5 text-xs font-black text-primary-950 shadow-lg shadow-primary-500/20 transition-all hover:shadow-xl hover:shadow-primary-500/30 active:scale-95 dark:shadow-none md:self-auto'>
						<Sparkles size={14} />
						<span>Create Skill</span>
					</button>
				</div>

				{/* Stat tiles */}
				<div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
					<div className='rounded-2xl border border-border-main bg-bg-card p-5 shadow-xs backdrop-blur-md dark:border-border-main dark:bg-bg-card'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
								<PuzzleIcon size={16} />
							</div>
							<span className='text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
								Total Skills
							</span>
						</div>
						<div className='mt-3.5 text-3xl font-black text-slate-900 dark:text-white'>
							{skillList.length}
						</div>
					</div>

					<div className='rounded-2xl border border-border-main bg-bg-card p-5 shadow-xs backdrop-blur-md dark:border-border-main dark:bg-bg-card'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
								<Layers size={16} />
							</div>
							<span className='text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
								Categories In Use
							</span>
						</div>
						<div className='mt-3.5 text-3xl font-black text-slate-900 dark:text-white'>
							{categoriesInUse}
						</div>
					</div>

					<div className='rounded-2xl border border-border-main bg-bg-card p-5 shadow-xs backdrop-blur-md dark:border-border-main dark:bg-bg-card'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
								<Globe size={16} />
							</div>
							<span className='text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
								Shared Workspace-Wide
							</span>
						</div>
						<div className='mt-3.5 text-3xl font-black text-slate-900 dark:text-white'>
							{sharedCount}
						</div>
					</div>
				</div>

				{/* Search + filters */}
				<div className='flex flex-col gap-4'>
					<div className='flex flex-col gap-3 xl:flex-row xl:items-center'>
						<div className='group relative flex-1'>
							<Search className='absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400 transition-colors duration-200 group-focus-within:text-primary-500 dark:text-zinc-500' />
							<input
								type='search'
								aria-label='Search skills'
								placeholder='Search skills by name or description...'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className='dark:placeholder:text-zinc-500 block h-12 w-full rounded-2xl border border-border-main bg-bg-card pr-4 pl-12 text-xs font-semibold text-slate-900 shadow-xs transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-primary-500/80 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:border-border-main dark:bg-bg-card dark:text-zinc-100 dark:focus:border-primary-500 dark:focus:bg-zinc-950/40 dark:focus:ring-primary-500/15'
							/>
						</div>

						<div className='flex shrink-0 gap-1.5 rounded-2xl border border-border-main bg-bg-card p-1.5 dark:border-border-main dark:bg-bg-card'>
							{(['All', 'Personal', 'Shared'] as TVisibilityFilter[]).map((v) => (
								<button
									key={v}
									onClick={() => setVisibility(v)}
									className={`h-9 cursor-pointer rounded-xl px-4 text-xs font-bold transition-all ${
										visibility === v
											? 'bg-gradient-to-r from-primary-400 to-primary-400 text-primary-950'
											: 'text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-950/40'
									}`}>
									{v}
								</button>
							))}
						</div>
					</div>

					<div className='no-scrollbar flex gap-2 overflow-x-auto pb-1'>
						<button
							onClick={() => setSelectedCategory('All')}
							className={`flex h-9 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-bold transition-all ${
								selectedCategory === 'All'
									? 'bg-gradient-to-r from-primary-400 to-primary-400 text-primary-950'
									: 'border border-border-main bg-bg-card text-slate-600 hover:bg-slate-50 dark:border-border-main dark:bg-bg-card dark:text-zinc-400'
							}`}>
							All Categories
						</button>
						{SKILL_CATEGORIES.map((cat) => (
							<button
								key={cat}
								onClick={() => setSelectedCategory(cat)}
								className={`flex h-9 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-bold transition-all ${
									selectedCategory === cat
										? 'bg-gradient-to-r from-primary-400 to-primary-400 text-primary-950'
										: 'border border-border-main bg-bg-card text-slate-600 hover:bg-slate-50 dark:border-border-main dark:bg-bg-card dark:text-zinc-400'
								}`}>
								{cat}
							</button>
						))}
					</div>
				</div>

				{/* Grid */}
				{isLoading ? (
					<div className='flex items-center justify-center rounded-3xl border border-border-main bg-bg-card py-16 text-xs font-semibold text-slate-400 dark:text-zinc-500'>
						Loading skills…
					</div>
				) : skillList.length === 0 ? (
					<div className='flex flex-col items-center justify-center gap-2 rounded-3xl border border-border-main bg-bg-card py-16 text-center'>
						<PuzzleIcon size={28} className='text-slate-300 dark:text-zinc-600' />
						<p className='text-sm font-bold text-slate-700 dark:text-zinc-300'>No skills yet</p>
						<p className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>
							Create your first skill to reuse across agents.
						</p>
					</div>
				) : (
					<div className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
						<AnimatePresence mode='popLayout'>
							{skillList.map((skill) => {
								const IconComponent = getSkillIconComponent(skill.icon);
								const color = skill.color || getSkillCategoryColor(skill.category);
								return (
									<motion.article
										key={skill.id}
										layout
										initial={{ opacity: 0, scale: 0.96, y: 10 }}
										animate={{ opacity: 1, scale: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.96, y: 10 }}
										whileHover={{ y: -6, scale: 1.01 }}
										transition={{ type: 'spring', stiffness: 350, damping: 25 }}
										className='group relative flex flex-col justify-between rounded-3xl border border-border-main bg-bg-card p-6 shadow-xs backdrop-blur-md transition-all duration-300 hover:border-primary-500/35 hover:bg-bg-card/80 hover:shadow-xl dark:border-border-main dark:bg-bg-card dark:hover:border-primary-500/35 dark:hover:bg-bg-card/85 dark:hover:shadow-none'>
										<div
											className='pointer-events-none absolute -inset-px -z-10 rounded-3xl opacity-0 blur-md transition-all duration-500 group-hover:opacity-15'
											style={{
												background: `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 70%)`,
											}}
										/>

										<div className='flex items-start justify-between gap-4'>
											<div
												className='relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:rotate-2'
												style={{ backgroundColor: color }}>
												<IconComponent size={20} />
											</div>
											<span
												className={`inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[10px] font-bold ${
													skill.is_shared
														? 'border border-primary-500/20 bg-primary-400/10 text-primary-600 dark:text-primary-400'
														: 'border border-border-main bg-bg-main text-slate-450 dark:bg-zinc-950/40 dark:text-zinc-500'
												}`}>
												{skill.is_shared ? <Globe size={11} /> : <Lock size={11} />}
												{skill.is_shared ? 'Shared' : 'Personal'}
											</span>
										</div>

										<div className='mt-5 text-left'>
											<h2 className='text-md font-bold tracking-tight text-slate-900 dark:text-white'>
												{skill.name}
											</h2>
											<p className='mt-2 line-clamp-2 min-h-[32px] text-xs leading-relaxed font-semibold text-slate-400 dark:text-zinc-500'>
												{skill.description || 'No description provided.'}
											</p>
										</div>

										<div className='mt-4 flex flex-wrap gap-2'>
											{skill.category && (
												<span className='inline-flex items-center gap-1 rounded-lg border border-slate-200/50 bg-slate-50/50 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400'>
													<Layers size={11} className='text-primary-500' />
													{skill.category}
												</span>
											)}
											<span className='inline-flex items-center gap-1 rounded-lg border border-slate-200/50 bg-slate-50/50 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400'>
												<FileText size={11} className='text-primary-500' />
												{skill.references_count ?? 0} refs
											</span>
											<span className='inline-flex items-center gap-1 rounded-lg border border-slate-200/50 bg-slate-50/50 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400'>
												<Code2 size={11} className='text-primary-500' />
												{skill.scripts_count ?? 0} scripts
											</span>
										</div>

										<div className='my-4 border-t border-slate-100 dark:border-zinc-800/60' />

										<div className='flex items-center justify-between gap-2'>
											<button
												onClick={() =>
													setEditorState({ open: true, skillId: skill.id })
												}
												className='dark:text-zinc-300 dark:hover:bg-zinc-955/60 flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border-main bg-bg-card text-[11px] font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 dark:border-border-main dark:bg-bg-card'>
												<Settings2 size={12} className='text-slate-500 dark:text-zinc-400' />
												Edit
											</button>

											<button
												onClick={() => setAttachingSkill(skill)}
												title='Add to agent'
												className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-primary-400 text-primary-950 shadow-md shadow-primary-500/10 transition-transform hover:scale-105 hover:bg-primary-500 active:scale-95'>
												<UserPlus size={14} />
											</button>
											<button
												onClick={() => handleDelete(skill)}
												title='Delete skill'
												className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 active:scale-95 dark:border-zinc-800 dark:hover:border-rose-900/30 dark:hover:bg-rose-950/20'>
												<Trash2 size={12} />
											</button>
										</div>
									</motion.article>
								);
							})}
						</AnimatePresence>
					</div>
				)}
			</div>

			<SkillEditorDrawer
				ws={currentWorkspaceId}
				isOpen={editorState.open}
				skillId={editorState.skillId}
				onClose={() => setEditorState({ open: false, skillId: null })}
			/>

			<AddToAgentDialog
				ws={currentWorkspaceId}
				skill={attachingSkill}
				onClose={() => setAttachingSkill(null)}
			/>
		</Container>
	);
};

export default SkillsListPage;
