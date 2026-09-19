import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Search,
	Sparkles,
	Layers,
	Settings2,
	Trash2,
	UserPlus,
	Puzzle as PuzzleIcon,
	Lock,
	Globe,
	MoreHorizontal,
} from 'lucide-react';
import { OutletContextType } from './_layouts/Skills.layout';
import { useConfirm } from '@/context/confirm';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import pages from '@/Routes/pages';
import { useWorkspaceContext } from '@/context/workspace';
import { useAgentSkills, useDeleteAgentSkill } from '@/api/modules/agent-skills';
import type { TAgentSkill } from '@/types/agent-skill.type';
import { SKILL_CATEGORIES, getSkillIconComponent, getSkillCategoryColor } from './_helper/skills.constants';
import SkillEditorDrawer from './_partial/SkillEditorDrawer.partial';
import AddToAgentDialog from './_partial/AddToAgentDialog.partial';

type TVisibilityFilter = 'All' | 'Personal' | 'Shared';

const SkillsListPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const { confirm } = useConfirm();

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.workspace.subPages!.skills }]} />);
		return () => setHeaderLeft(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	/** The URL is the source of truth for the workspace; the context covers the
	 *  first render, before the route param is available. */
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { activeWorkspaceId } = useWorkspaceContext();
	const currentWorkspaceId = workspaceId || activeWorkspaceId;

	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<'All' | (typeof SKILL_CATEGORIES)[number]>(
		'All',
	);
	const [visibility, setVisibility] = useState<TVisibilityFilter>('All');

	// `skills.index` takes no query params — the workspace's whole skill list
	// comes back at once, so filtering happens client-side.
	const { data: apiSkills, isLoading } = useAgentSkills(currentWorkspaceId);
	const deleteSkillMutation = useDeleteAgentSkill(currentWorkspaceId);

	const [editorState, setEditorState] = useState<{ open: boolean; skillId: string | null }>({
		open: false,
		skillId: null,
	});
	const [attachingSkill, setAttachingSkill] = useState<TAgentSkill | null>(null);

	const skillList = useMemo(() => {
		const rows = apiSkills ?? [];
		const query = searchQuery.trim().toLowerCase();
		return rows.filter((skill) => {
			const matchesSearch =
				!query ||
				skill.name.toLowerCase().includes(query) ||
				(skill.description ?? '').toLowerCase().includes(query);
			const matchesCategory = selectedCategory === 'All' || skill.category === selectedCategory;
			const matchesVisibility =
				visibility === 'All' ||
				(visibility === 'Shared' ? skill.is_shared : !skill.is_shared);
			return matchesSearch && matchesCategory && matchesVisibility;
		});
	}, [apiSkills, searchQuery, selectedCategory, visibility]);

	const categoriesInUse = new Set((apiSkills ?? []).map((s) => s.category).filter(Boolean)).size;
	const sharedCount = (apiSkills ?? []).filter((s) => s.is_shared).length;

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
									Skill Library
								</div>
							</div>
							<h1 className='mb-3 text-3xl font-extrabold tracking-tight text-[#101828] sm:text-4xl dark:text-white'>
								Skills
							</h1>
							<p className='mb-6 max-w-2xl text-xs leading-relaxed text-zinc-850 sm:text-sm dark:text-zinc-400'>
								Build a library of skills — instructions, references, and scripts — and attach
								them to any agent.
							</p>

							<div className='mt-6 flex flex-wrap items-center gap-4'>
								<div className='flex items-center gap-3 rounded-2xl border border-white/20 bg-white/40 px-4 py-2.5 shadow-xs backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60'>
									<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-white/50 dark:bg-zinc-850'>
										<PuzzleIcon className='h-4.5 w-4.5 text-[#101828] dark:text-primary-400' />
									</div>
									<div>
										<div className='text-sm leading-none font-extrabold text-[#101828] dark:text-white'>
											{skillList.length}
										</div>
										<div className='mt-0.5 text-[10px] font-semibold text-slate-800 dark:text-zinc-500'>
											Skills
										</div>
									</div>
								</div>

								<div className='flex items-center gap-3 rounded-2xl border border-white/20 bg-white/40 px-4 py-2.5 shadow-xs backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60'>
									<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-white/50 dark:bg-zinc-850'>
										<Layers className='h-4.5 w-4.5 text-[#101828] dark:text-primary-400' />
									</div>
									<div>
										<div className='text-sm leading-none font-extrabold text-[#101828] dark:text-white'>
											{categoriesInUse}
										</div>
										<div className='mt-0.5 text-[10px] font-semibold text-slate-800 dark:text-zinc-500'>
											Categories
										</div>
									</div>
								</div>

								<div className='flex items-center gap-3 rounded-2xl border border-white/20 bg-white/40 px-4 py-2.5 shadow-xs backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60'>
									<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-white/50 dark:bg-zinc-850'>
										<Globe className='h-4.5 w-4.5 text-[#101828] dark:text-primary-400' />
									</div>
									<div>
										<div className='text-sm leading-none font-extrabold text-[#101828] dark:text-white'>
											{sharedCount}
										</div>
										<div className='mt-0.5 text-[10px] font-semibold text-slate-800 dark:text-zinc-500'>
											Shared
										</div>
									</div>
								</div>

								<button
									onClick={() => setEditorState({ open: true, skillId: null })}
									className='flex h-10 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/20 bg-[#101828] px-5 text-xs font-black text-white shadow-lg transition-all hover:opacity-90 active:scale-95 dark:bg-primary-400 dark:text-primary-950'>
									<Sparkles size={14} />
									Create Skill
								</button>
							</div>
						</div>

						{/* 3D graphic column */}
						<div className='pointer-events-none relative hidden h-56 justify-center select-none lg:col-span-4 lg:flex'>
							<div className='relative flex h-64 w-64 items-center justify-center' style={{ perspective: '1000px' }}>
								<div className='animate-3d-float absolute flex h-36 w-36 items-center justify-center rounded-3xl border border-white/25 bg-gradient-to-br from-primary-400 to-primary-500 shadow-[0_25px_50px_-12px_rgba(196,238,61,0.25)]'>
									<div className='pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/15 via-transparent to-transparent' />
									<PuzzleIcon className='h-16 w-16 text-zinc-900 drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]' />
								</div>
								<div className='animate-3d-float-teal absolute top-28 left-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-tr from-[#7B37FC] to-[#501EE3] shadow-lg'>
									<Layers className='h-5 w-5 text-white' />
								</div>
								<div className='animate-3d-float-coral absolute top-12 right-6 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-tr from-orange-400 to-primary-400 shadow-lg'>
									<Globe className='h-4.5 w-4.5 text-white' />
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Search + filters */}
				<div className='mb-8 flex flex-col gap-4'>
					<div className='flex flex-col gap-3 xl:flex-row xl:items-center'>
						<div className='group relative flex-1'>
							<Search className='absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400 transition-colors duration-200 group-focus-within:text-primary-500 dark:text-zinc-500' />
							<input
								type='search'
								aria-label='Search skills'
								placeholder='Search skills by name or description...'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className='block h-12 w-full rounded-2xl border border-zinc-200 bg-white pr-4 pl-12 text-xs font-semibold text-slate-900 shadow-xs outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary-500/80 focus:ring-4 focus:ring-primary-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-primary-500 dark:focus:ring-primary-500/15'
							/>
						</div>

						<div className='flex shrink-0 gap-1.5 rounded-2xl border border-zinc-200 bg-white p-1.5 dark:border-zinc-800 dark:bg-zinc-900'>
							{(['All', 'Personal', 'Shared'] as TVisibilityFilter[]).map((v) => (
								<button
									key={v}
									onClick={() => setVisibility(v)}
									className={`h-9 cursor-pointer rounded-xl px-4 text-xs font-bold transition-all ${
										visibility === v
											? 'bg-gradient-to-r from-primary-400 to-primary-400 text-primary-950'
											: 'text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-900/40'
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
									: 'border border-zinc-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
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
										: 'border border-zinc-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
								}`}>
								{cat}
							</button>
						))}
					</div>
				</div>

				{/* Grid */}
				{isLoading ? (
					<div className='flex items-center justify-center rounded-3xl border border-zinc-200 bg-white py-16 text-xs font-semibold text-slate-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500'>
						Loading skills…
					</div>
				) : skillList.length === 0 ? (
					<div className='flex flex-col items-center justify-center gap-2 rounded-3xl border border-zinc-200 bg-white py-16 text-center dark:border-zinc-800 dark:bg-zinc-900'>
						<PuzzleIcon size={28} className='text-slate-300 dark:text-zinc-600' />
						<p className='text-sm font-bold text-slate-700 dark:text-zinc-300'>No skills yet</p>
						<p className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>
							Create your first skill to reuse across agents.
						</p>
					</div>
				) : (
					<div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
						<AnimatePresence mode='popLayout'>
							{skillList.map((skill) => (
								<SkillCard
									key={skill.id}
									skill={skill}
									onEdit={() => setEditorState({ open: true, skillId: skill.id })}
									onAttach={() => setAttachingSkill(skill)}
									onDelete={() => handleDelete(skill)}
								/>
							))}
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

const SkillCard = ({
	skill,
	onEdit,
	onAttach,
	onDelete,
}: {
	skill: TAgentSkill;
	onEdit: () => void;
	onAttach: () => void;
	onDelete: () => void;
}) => {
	const [menuOpen, setMenuOpen] = useState(false);
	const IconComponent = getSkillIconComponent(skill.icon);
	const color = skill.color || getSkillCategoryColor(skill.category);

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 10 }}
			transition={{ type: 'spring', stiffness: 350, damping: 25 }}
			className='group relative flex flex-col rounded-2xl border border-slate-200/60 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary-400 hover:shadow-[0_12px_24px_-10px_rgba(16,24,40,0.06)] dark:border-zinc-800/80 dark:bg-zinc-950 dark:hover:border-primary-400/50 dark:hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.5)]'>
			<div className='mb-3.5 flex items-start justify-between'>
				<div className='flex min-w-0 items-center gap-3'>
					<div
						style={{ backgroundColor: `${color}1f` }}
						className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-100/50 transition-transform duration-300 group-hover:scale-105 dark:border-zinc-800/50'>
						<IconComponent className='h-5 w-5' style={{ color }} />
					</div>
					<div className='min-w-0 space-y-0.5'>
						<h4 className='truncate text-[13px] leading-snug font-black text-slate-900 transition-colors group-hover:text-primary-600 dark:text-zinc-50 dark:group-hover:text-primary-400'>
							{skill.name}
						</h4>
						<span className='block truncate text-[9px] font-extrabold tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
							{skill.category ?? 'Uncategorized'}
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
				{skill.description || 'No description provided.'}
			</p>

			<div className='mt-auto flex items-center justify-between border-t border-slate-100/80 pt-3.5 dark:border-zinc-900/60'>
				<span
					className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-bold ${
						skill.is_shared
							? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/20 dark:bg-primary-950/20 dark:text-primary-400'
							: 'border-zinc-200/60 bg-zinc-50/50 text-zinc-450 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-500'
					}`}>
					{skill.is_shared ? <Globe size={11} /> : <Lock size={11} />}
					{skill.is_shared ? 'Shared' : 'Personal'}
				</span>
			</div>

			<div className='mt-3 flex items-center gap-2'>
				<button
					onClick={onEdit}
					className='flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white text-[11px] font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'>
					<Settings2 size={12} className='text-slate-500 dark:text-zinc-400' />
					Edit
				</button>
				<button
					onClick={onAttach}
					title='Add to agent'
					className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-primary-400 text-primary-950 shadow-md shadow-primary-500/10 transition-transform hover:scale-105 hover:bg-primary-500 active:scale-95'>
					<UserPlus size={14} />
				</button>
			</div>
		</motion.div>
	);
};

export default SkillsListPage;
