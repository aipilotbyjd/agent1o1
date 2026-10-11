import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router';
import {
	AlertTriangle,
	AppWindow,
	Copy,
	ExternalLink,
	GitMerge,
	Globe,
	Link2,
	Lock,
	MoreHorizontal,
	PencilRuler,
	Plus,
	Search,
	Trash2,
	Users,
} from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import ListSkeletonPart from '@/parts/ListSkeleton.part';
import pages from '@/Routes/pages';
import paths from '@/Routes/paths';
import { notify } from '@/api/core';
import { useConfirm } from '@/context/confirm';
import { useWorkspaceContext } from '@/context/workspace';
import { useDeleteWorkflowPage, useDuplicateWorkflowPage, useWorkflowPages } from '@/api/modules/workflow-pages';
import type { TWorkflowPage } from '@/types/workflow-page.type';
import relativeTime from '@/utils/relativeTime.util';
import type { OutletContextType } from './_layouts/WorkflowPages.layout';
import CreatePageModal from './_partial/CreatePageModal.partial';

type TFilter = 'all' | 'live' | 'draft' | 'attention';

const ACCESS = {
	workspace: { icon: Users, label: 'Workspace' },
	link: { icon: Globe, label: 'Public link' },
	password: { icon: Lock, label: 'Password' },
} as const;

const status = (page: TWorkflowPage) =>
	!page.is_published
		? { label: 'Draft', className: 'bg-zinc-100 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300' }
		: !page.is_enabled
			? { label: 'Turned off', className: 'bg-zinc-100 text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400' }
			: page.has_unpublished_changes
				? { label: 'Live · edited', className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' }
				: { label: 'Live', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' };

const liveUrl = (ws: string, page: TWorkflowPage) =>
	page.access === 'workspace'
		? `${window.location.origin}${paths.usePage(ws, page.id)}`
		: `${window.location.origin}${paths.publicPage(page.public_token)}`;

const PageCard = ({ ws, page }: { ws: string; page: TWorkflowPage }) => {
	const navigate = useNavigate();
	const { confirm } = useConfirm();
	const duplicate = useDuplicateWorkflowPage(ws);
	const remove = useDeleteWorkflowPage(ws);
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const pill = status(page);
	const access = ACCESS[page.access];
	const errors = page.issues.filter((issue) => issue.severity === 'error').length;

	useEffect(() => {
		if (!menuOpen) return;
		const onClick = (event: MouseEvent) => {
			if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
		};
		document.addEventListener('mousedown', onClick);
		return () => document.removeEventListener('mousedown', onClick);
	}, [menuOpen]);

	const onDelete = async () => {
		setMenuOpen(false);
		const ok = await confirm({
			title: 'Delete page',
			message: (
				<>
					Delete <strong className='font-semibold text-zinc-800 dark:text-zinc-200'>“{page.name}”</strong>? Its link stops working and
					its run history goes with it. The workflow isn’t touched.
				</>
			),
			confirmText: 'Delete page',
		});
		if (ok) remove.mutate(page.id, { onSuccess: () => notify.success(`“${page.name}” deleted.`) });
	};

	const menuItem = 'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition';

	return (
		<article className='group hover:border-primary-400/50 relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xs transition hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900'>
			<Link
				to={paths.editPage(ws, page.id)}
				className='relative flex h-28 items-center justify-center overflow-hidden border-b border-zinc-100 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950'>
				<div className='w-[62%] space-y-1.5 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition group-hover:-translate-y-0.5 dark:border-zinc-700 dark:bg-zinc-800'>
					<div className='h-2 w-1/2 rounded-full bg-zinc-800/80 dark:bg-zinc-200/80' />
					<div className='h-1.5 w-3/4 rounded-full bg-zinc-200 dark:bg-zinc-600' />
					<div className='h-4 w-full rounded-md border border-zinc-200 dark:border-zinc-600' />
					<div className='bg-primary-400 h-3 w-1/3 rounded-md' />
				</div>
				{errors > 0 && (
					<span className='absolute top-3 left-3 flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30'>
						<AlertTriangle size={11} /> Needs attention
					</span>
				)}
			</Link>

			<div className='flex flex-1 flex-col gap-3 p-4'>
				<div className='flex items-start justify-between gap-2'>
					<div className='min-w-0'>
						<Link
							to={paths.editPage(ws, page.id)}
							className='hover:text-primary-700 block truncate text-sm font-extrabold text-zinc-900 dark:text-white'>
							{page.name}
						</Link>
						<p className='mt-0.5 flex items-center gap-1 truncate text-[11px] text-zinc-500 dark:text-zinc-400'>
							<GitMerge size={11} className='shrink-0' />
							<span className='truncate'>
								{page.workflow ? page.workflow.name : 'Workflow missing'}
								{page.workflow?.trashed ? ' (in trash)' : ''}
							</span>
						</p>
					</div>
					<div ref={menuRef} className='relative shrink-0'>
						<button
							type='button'
							aria-label='Page actions'
							aria-haspopup='menu'
							aria-expanded={menuOpen}
							onClick={() => setMenuOpen((open) => !open)}
							className='rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200'>
							<MoreHorizontal size={16} />
						</button>
						{menuOpen && (
							<div role='menu' className='absolute top-8 right-0 z-30 w-48 rounded-xl border border-zinc-200 bg-white p-1 shadow-xl dark:border-white/10 dark:bg-zinc-950'>
								<button role='menuitem' type='button' onClick={() => navigate(paths.editPage(ws, page.id))} className={`${menuItem} text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-white/[0.05]`}>
									<PencilRuler size={13} /> Open builder
								</button>
								{page.is_published && (
									<>
										<a role='menuitem' href={liveUrl(ws, page)} target='_blank' rel='noopener noreferrer' className={`${menuItem} text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-white/[0.05]`}>
											<ExternalLink size={13} /> Open page
										</a>
										<button
											role='menuitem'
											type='button'
											onClick={() => {
												setMenuOpen(false);
												void navigator.clipboard.writeText(liveUrl(ws, page)).then(() => notify.success('Link copied.'));
											}}
											className={`${menuItem} text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-white/[0.05]`}>
											<Link2 size={13} /> Copy link
										</button>
									</>
								)}
								<button
									role='menuitem'
									type='button'
									onClick={() => {
										setMenuOpen(false);
										duplicate.mutate(page.id, { onSuccess: () => notify.success('Page duplicated.') });
									}}
									className={`${menuItem} text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-white/[0.05]`}>
									<Copy size={13} /> Duplicate
								</button>
								<button role='menuitem' type='button' onClick={() => void onDelete()} className={`${menuItem} text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10`}>
									<Trash2 size={13} /> Delete
								</button>
							</div>
						)}
					</div>
				</div>

				{page.description && <p className='line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400'>{page.description}</p>}

				<div className='mt-auto flex flex-wrap items-center gap-1.5'>
					<span className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-bold ${pill.className}`}>
						<span className='size-1.5 rounded-full bg-current' />
						{pill.label}
					</span>
					<span className='inline-flex h-6 items-center gap-1 rounded-full bg-zinc-100 px-2.5 text-[10px] font-bold text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300'>
						<access.icon size={11} />
						{access.label}
					</span>
				</div>
				<p className='text-[11px] text-zinc-400 dark:text-zinc-500'>
					{page.runs_count ? `${page.runs_count} run${page.runs_count === 1 ? '' : 's'}` : 'No runs yet'}
					{page.last_run_at ? ` · last ${relativeTime(page.last_run_at)}` : ''}
				</p>
			</div>
		</article>
	);
};

const PagesListPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { activeWorkspaceId } = useWorkspaceContext();
	const ws = workspaceId || activeWorkspaceId;
	const { data, isLoading } = useWorkflowPages(ws);
	const [creating, setCreating] = useState(false);
	const [query, setQuery] = useState('');
	const [filter, setFilter] = useState<TFilter>('all');

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.workspace.subPages!.pages }]} />);
		return () => setHeaderLeft(undefined);
	}, [setHeaderLeft]);

	const list = useMemo(() => {
		const q = query.trim().toLowerCase();
		return (data ?? []).filter((page) => {
			const matches =
				!q ||
				page.name.toLowerCase().includes(q) ||
				(page.workflow?.name ?? '').toLowerCase().includes(q) ||
				(page.description ?? '').toLowerCase().includes(q);
			const inFilter =
				filter === 'all' ||
				(filter === 'live' && page.is_published) ||
				(filter === 'draft' && !page.is_published) ||
				(filter === 'attention' && page.issues.some((issue) => issue.severity === 'error'));
			return matches && inFilter;
		});
	}, [data, query, filter]);

	return (
		<Container className='relative overflow-x-hidden overflow-y-auto bg-[#F8F9FC] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] !p-0 dark:bg-zinc-950 dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]'>
			<div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
				<div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
					<div>
						<h1 className='text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white'>Pages</h1>
						<p className='mt-1 max-w-xl text-sm text-zinc-500 dark:text-zinc-400'>
							Turn a workflow into a page anyone can use: a form for its inputs and a place for its result.
						</p>
					</div>
					<button
						type='button'
						onClick={() => setCreating(true)}
						className='bg-primary-400 text-primary-950 shadow-primary-500/10 hover:bg-primary-500 flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-xs font-bold shadow-md transition-all hover:shadow-lg active:scale-95'>
						<Plus size={15} /> New page
					</button>
				</div>

				<div className='mb-6 flex flex-col gap-3 md:flex-row md:items-center'>
					<div className='group relative flex-1'>
						<Search className='group-focus-within:text-primary-500 absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400 transition-colors' />
						<input
							type='search'
							aria-label='Search pages'
							placeholder='Search pages or workflows…'
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className='focus:border-primary-500/80 focus:ring-primary-500/10 block h-12 w-full rounded-2xl border border-zinc-200 bg-white pr-4 pl-12 text-xs font-semibold text-slate-900 shadow-xs outline-none focus:ring-4 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'
						/>
					</div>
					<div className='flex shrink-0 gap-1.5 rounded-2xl border border-zinc-200 bg-white p-1.5 dark:border-zinc-800 dark:bg-zinc-900'>
						{(
							[
								['all', 'All'],
								['live', 'Live'],
								['draft', 'Drafts'],
								['attention', 'Needs attention'],
							] as const
						).map(([value, label]) => (
							<button
								key={value}
								type='button'
								onClick={() => setFilter(value)}
								className={`h-9 rounded-xl px-4 text-xs font-bold transition ${
									filter === value
										? 'bg-primary-400 text-primary-950'
										: 'text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50'
								}`}>
								{label}
							</button>
						))}
					</div>
				</div>

				{isLoading ? (
					<div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
						<ListSkeletonPart count={8} />
					</div>
				) : list.length === 0 ? (
					<div className='flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 bg-white/60 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/40'>
						<div className='bg-primary-400/15 text-primary-700 dark:text-primary-300 mb-4 flex size-14 items-center justify-center rounded-2xl'>
							<AppWindow size={26} />
						</div>
						<p className='text-base font-extrabold text-zinc-900 dark:text-white'>
							{data?.length ? 'No pages match' : 'No pages yet'}
						</p>
						<p className='mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400'>
							{data?.length
								? 'Try another search or filter.'
								: 'Pick a workflow and get a ready-made page from its inputs and outputs, then make it yours in the builder.'}
						</p>
						{!data?.length && (
							<button
								type='button'
								onClick={() => setCreating(true)}
								className='bg-primary-400 text-primary-950 mt-5 flex h-10 items-center gap-2 rounded-xl px-5 text-xs font-bold shadow-md'>
								<Plus size={15} /> Create your first page
							</button>
						)}
					</div>
				) : (
					<div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
						{list.map((page) => (
							<PageCard key={page.id} ws={ws} page={page} />
						))}
					</div>
				)}
			</div>
			{creating && <CreatePageModal ws={ws} isOpen={creating} onClose={() => setCreating(false)} />}
		</Container>
	);
};

export default PagesListPage;
