import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, GitMerge, RotateCcw, Search, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { OutletContextType } from './_layouts/Trash.layout';
import { useConfirm } from '@/context/confirm';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import pages from '@/Routes/pages';
import paths from '@/Routes/paths';
import { useWorkspaceContext } from '@/context/workspace';
import {
	useForceDeleteWorkflow,
	useRestoreWorkflow,
	useWorkflowTrash,
} from '@/api/modules/workflows';
import { useAgentTrash, useForceDeleteAgent, useRestoreAgent } from '@/api/modules/agents';
import { agentColorTileClass, agentIconFor } from '@/pages/coreapp/Agents/_helper/agentAppearance';
import Icon from '@/components/icon/Icon';
import ListSkeletonPart from '@/parts/ListSkeleton.part';
import TrashOutcomeModal, { type TTrashOutcome } from './_partial/TrashOutcomeModal.partial';

type TTrashTab = 'workflows' | 'agents';

type TTrashItem = {
	id: string;
	name: string;
	description: string | null;
	deletedAt: string | null;
	icon: LucideIcon;
	iconClass: string;
};

const TABS: { id: TTrashTab; label: string; icon: LucideIcon }[] = [
	{ id: 'workflows', label: 'Workflows', icon: GitMerge },
	{ id: 'agents', label: 'Agents', icon: Bot },
];

const WORKFLOW_ICON_CLASS =
	'border-primary-200 bg-primary-50 text-primary-600 dark:border-primary-900/40 dark:bg-primary-950/40 dark:text-primary-400';

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const TIME_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	['year', 365 * 24 * 60 * 60],
	['month', 30 * 24 * 60 * 60],
	['week', 7 * 24 * 60 * 60],
	['day', 24 * 60 * 60],
	['hour', 60 * 60],
	['minute', 60],
];

const timeAgo = (iso: string): string => {
	const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
	const match = TIME_UNITS.find(([, size]) => Math.abs(seconds) >= size);
	return match ? relativeTime.format(Math.round(seconds / match[1]), match[0]) : 'just now';
};

const TrashPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const { confirm } = useConfirm();
	const navigate = useNavigate();

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.workspace.subPages!.trash }]} />);
		return () => setHeaderLeft(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { activeWorkspaceId } = useWorkspaceContext();
	const ws = workspaceId || activeWorkspaceId;

	const [searchParams, setSearchParams] = useSearchParams();
	const tab: TTrashTab = searchParams.get('tab') === 'agents' ? 'agents' : 'workflows';
	const [searchQuery, setSearchQuery] = useState('');

	const workflowTrash = useWorkflowTrash(ws);
	const agentTrash = useAgentTrash(ws);
	const restoreWorkflow = useRestoreWorkflow(ws);
	const restoreAgent = useRestoreAgent(ws);
	const forceDeleteWorkflow = useForceDeleteWorkflow(ws);
	const forceDeleteAgent = useForceDeleteAgent(ws);

	const items = useMemo<Record<TTrashTab, TTrashItem[]>>(
		() => ({
			workflows: (workflowTrash.data ?? []).map((w) => ({
				id: w.id,
				name: w.name,
				description: w.description,
				deletedAt: w.deleted_at,
				icon: GitMerge,
				iconClass: WORKFLOW_ICON_CLASS,
			})),
			agents: (agentTrash.data ?? []).map((a) => ({
				id: a.id,
				name: a.name,
				description: a.description,
				deletedAt: a.deleted_at,
				icon: agentIconFor(a.icon),
				iconClass: agentColorTileClass(a.color),
			})),
		}),
		[workflowTrash.data, agentTrash.data],
	);

	const visibleItems = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		return items[tab].filter(
			(item) =>
				!query ||
				item.name.toLowerCase().includes(query) ||
				(item.description ?? '').toLowerCase().includes(query),
		);
	}, [items, tab, searchQuery]);

	const isLoading = tab === 'workflows' ? workflowTrash.isLoading : agentTrash.isLoading;
	const singular = tab === 'workflows' ? 'workflow' : 'agent';
	const restoreMutation = tab === 'workflows' ? restoreWorkflow : restoreAgent;
	const forceDeleteMutation = tab === 'workflows' ? forceDeleteWorkflow : forceDeleteAgent;

	const [outcome, setOutcome] = useState<(TTrashOutcome & { id: string; tab: TTrashTab }) | null>(
		null,
	);

	const showOutcome = (kind: TTrashOutcome['kind'], item: TTrashItem) =>
		setOutcome({
			kind,
			singular,
			name: item.name,
			remaining: Math.max(items[tab].length - 1, 0),
			id: item.id,
			tab,
		});

	const openRestored = () => {
		if (!outcome) return;
		navigate(
			outcome.tab === 'workflows'
				? paths.editPlaybook(ws, outcome.id)
				: paths.editAgent(ws, outcome.id),
		);
	};

	const handleRestore = async (item: TTrashItem) => {
		const confirmed = await confirm({
			title: `Restore ${singular}`,
			message: (
				<>
					<strong className='font-semibold text-zinc-800 dark:text-zinc-200'>
						&quot;{item.name}&quot;
					</strong>{' '}
					will move back to your {singular}s and count toward your plan&apos;s limit
					again.
				</>
			),
			confirmText: 'Restore',
			tone: 'primary',
			icon: <Icon icon='DeletePutBack' className='text-lg' />,
		});
		if (!confirmed) return;
		restoreMutation.mutate(item.id, {
			onSuccess: () => showOutcome('restored', item),
		});
	};

	const handleForceDelete = async (item: TTrashItem) => {
		const confirmed = await confirm({
			title: `Delete ${singular} forever`,
			message: (
				<>
					<strong className='font-semibold text-zinc-800 dark:text-zinc-200'>
						&quot;{item.name}&quot;
					</strong>{' '}
					{tab === 'workflows'
						? 'and all of its versions and run history will be permanently deleted.'
						: 'and all of its chats, memories and history will be permanently deleted.'}{' '}
					This action cannot be undone.
				</>
			),
			confirmText: 'Delete forever',
		});
		if (!confirmed) return;
		forceDeleteMutation.mutate(item.id, {
			onSuccess: () => showOutcome('deleted', item),
		});
	};

	const restoringId = restoreMutation.isPending ? restoreMutation.variables : undefined;
	const deletingId = forceDeleteMutation.isPending ? forceDeleteMutation.variables : undefined;

	return (
		<Container className='relative overflow-x-hidden overflow-y-auto bg-[#F8F9FC] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] !p-0 dark:bg-zinc-950 dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]'>
			<div className='@container mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8'>
				<div className='mb-6 sm:mb-8'>
					<h1 className='text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white'>
						Trash
					</h1>
					<p className='mt-1 text-xs font-semibold text-slate-500 dark:text-zinc-400'>
						Deleted workflows and agents stay here until you restore them or delete them
						forever.
					</p>
				</div>

				<div className='mb-6 flex flex-col gap-3 @xl:flex-row @xl:items-center @xl:gap-4'>
					<div className='flex gap-2'>
						{TABS.map(({ id, label, icon: TabIcon }) => {
							const isActive = tab === id;
							return (
								<button
									key={id}
									type='button'
									onClick={() =>
										setSearchParams(id === 'workflows' ? {} : { tab: id }, {
											replace: true,
										})
									}
									className={`flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition-all @xl:flex-none ${
										isActive
											? 'from-primary-400 to-primary-400 text-primary-950 bg-gradient-to-r'
											: 'border-border-main bg-bg-card border text-slate-600 hover:bg-slate-50 dark:text-zinc-400'
									}`}>
									<TabIcon size={14} />
									{label}
									<span
										className={`rounded-md px-1.5 py-0.5 text-[10px] ${
											isActive
												? 'bg-primary-950/10'
												: 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
										}`}>
										{items[id].length}
									</span>
								</button>
							);
						})}
					</div>

					<div className='group relative min-w-0 flex-1'>
						<Search className='group-focus-within:text-primary-500 absolute top-3 left-4 h-4 w-4 text-slate-400 transition-colors duration-200 dark:text-zinc-500' />
						<input
							type='search'
							aria-label={`Search trashed ${singular}s`}
							placeholder={`Search trashed ${singular}s...`}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className='border-border-main bg-bg-card focus:border-primary-500/80 focus:ring-primary-500/10 dark:focus:border-primary-500 dark:focus:ring-primary-500/15 block h-10 w-full rounded-xl border pr-4 pl-11 text-xs font-semibold text-slate-900 shadow-xs transition-all duration-200 outline-none placeholder:text-slate-400 focus:ring-4 dark:text-zinc-100 dark:placeholder:text-zinc-500'
						/>
					</div>
				</div>

				{isLoading ? (
					<div className='grid gap-3'>
						<ListSkeletonPart count={4} />
					</div>
				) : visibleItems.length === 0 ? (
					<div className='border-border-main bg-bg-card flex flex-col items-center justify-center gap-2 rounded-3xl border py-16 text-center'>
						<Trash2 size={28} className='text-slate-300 dark:text-zinc-600' />
						<p className='text-sm font-bold text-slate-700 dark:text-zinc-300'>
							{items[tab].length === 0
								? `No ${singular}s in the trash`
								: `No trashed ${singular}s match`}
						</p>
						<p className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>
							{items[tab].length === 0
								? `Deleted ${singular}s will show up here.`
								: 'Try a different search.'}
						</p>
					</div>
				) : (
					<ul className='grid grid-cols-[minmax(0,1fr)] gap-3'>
						<AnimatePresence mode='popLayout' initial={false}>
							{visibleItems.map((item) => {
								const ItemIcon = item.icon;
								const isRestoring = restoringId === item.id;
								const isDeleting = deletingId === item.id;
								return (
									<motion.li
										key={item.id}
										layout
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.98 }}
										transition={{ type: 'spring', stiffness: 350, damping: 30 }}
										className='border-border-main bg-bg-card flex min-w-0 flex-col gap-3 rounded-2xl border p-3.5 shadow-xs @xl:flex-row @xl:items-center @xl:gap-4 @xl:p-4'>
										<div className='flex min-w-0 flex-1 items-center gap-3 @xl:gap-4'>
											<div
												className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.iconClass}`}>
												<ItemIcon className='h-4.5 w-4.5' />
											</div>
											<div className='min-w-0 flex-1'>
												<p className='truncate text-sm font-bold text-slate-900 dark:text-white'>
													{item.name}
												</p>
												<p className='truncate text-xs font-semibold text-slate-400 dark:text-zinc-500'>
													{item.deletedAt && (
														<span
															title={new Date(
																item.deletedAt,
															).toLocaleString()}>
															Deleted {timeAgo(item.deletedAt)}
														</span>
													)}
													{item.description && (
														<>
															<span className='mx-1.5 text-slate-300 dark:text-zinc-700'>
																·
															</span>
															{item.description}
														</>
													)}
												</p>
											</div>
										</div>

										<div className='grid grid-cols-2 gap-2 @xl:flex @xl:shrink-0 @xl:items-center'>
											<button
												type='button'
												onClick={() => handleRestore(item)}
												disabled={isRestoring || isDeleting}
												className='border-border-main bg-bg-card flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3.5 text-[11px] font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 @xl:h-9 dark:text-zinc-300 dark:hover:bg-zinc-900'>
												<RotateCcw
													size={12}
													className={isRestoring ? 'animate-spin' : ''}
												/>
												Restore
											</button>
											<button
												type='button'
												onClick={() => handleForceDelete(item)}
												disabled={isRestoring || isDeleting}
												className='flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3.5 text-[11px] font-bold text-slate-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 @xl:h-9 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-rose-900/30 dark:hover:bg-rose-950/20'>
												<Trash2 size={12} />
												Delete forever
											</button>
										</div>
									</motion.li>
								);
							})}
						</AnimatePresence>
					</ul>
				)}
			</div>

			<TrashOutcomeModal
				outcome={outcome}
				onClose={() => setOutcome(null)}
				onOpen={openRestored}
			/>
		</Container>
	);
};

export default TrashPage;
