import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Resizable } from 're-resizable';
import { AnimatePresence, motion } from 'framer-motion';
import { Layers, Loader2, SlidersHorizontal } from 'lucide-react';
import { useWorkflowInterface } from '@/api/modules/workflows';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToPage, useWorkflowPage, workflowPageKeys } from '@/api/modules/workflow-pages';
import type { IEchoLike } from '@/api/modules/workflow-builder/workflow-builder.realtime';
import { useRealtime } from '@/context/realtime';
import type { TPageVariant, TWorkflowPage } from '@/types/workflow-page.type';
import useDeviceScreen from '@/hooks/useDeviceScreen';
import paths from '@/Routes/paths';
import { PageBuilderContext, type TPageBuilderContext } from './_context/PageBuilder.context';
import { usePageAutosave } from './_hooks/usePageAutosave.hook';
import { useBuilderHotkeys } from './_hooks/useBuilderHotkeys.hook';
import { usePageBuilderStore } from './_store/pageBuilder.store';
import BuilderTopbar from './_partial/BuilderTopbar.partial';
import BuilderOverlays from './_partial/BuilderOverlays.partial';
import BuilderCanvas from './_partial/BuilderCanvas.partial';
import LeftPanel from './_partial/LeftPanel.partial';
import RightPanel from './_partial/RightPanel.partial';

const NO_FIELDS: never[] = [];

/**
 * The page builder: a full-screen editor like the workflow editor; the
 * block library on the left, the page itself in the middle at desktop,
 * tablet or phone size, and the selected block's settings on the right.
 */
const PageBuilderPage = () => {
	const { workspaceId: ws = '', pageId = '' } = useParams<{ workspaceId: string; pageId: string }>();
	const pageQuery = useWorkflowPage(ws, pageId);
	const page = pageQuery.data;
	const interfaceQuery = useWorkflowInterface(ws, page?.workflow_id ?? '');
	const load = usePageBuilderStore((store) => store.load);
	const loadedId = usePageBuilderStore((store) => store.pageId);
	const variant = usePageBuilderStore((store) => store.variant);
	const qc = useQueryClient();
	const { saveState, retry, flush, resolveConflict } = usePageAutosave(ws, pageId);
	const [publishOpen, setPublishOpen] = useState(false);
	const [mobilePanel, setMobilePanel] = useState<'left' | 'right' | null>(null);
	const [leftWidth, setLeftWidth] = useState(300);
	const [rightWidth, setRightWidth] = useState(320);
	const { width } = useDeviceScreen();
	const isMobile = width !== undefined && width < 1024;

	// The draft is read from the server once per page; from then on the
	// builder owns it and the autosave only writes.
	useEffect(() => {
		if (page?.content && loadedId !== page.id) load(page.id, page.content, 'a', page.draft_revision);
	}, [page, loadedId, load]);

	// The workflow may be edited in another tab: re-read its inputs and the
	// page's checks when the builder comes back into focus.
	const refetchInterface = interfaceQuery.refetch;
	const refetchPage = pageQuery.refetch;
	useEffect(() => {
		const onFocus = () => {
			void refetchInterface();
			if (usePageBuilderStore.getState().saveState === 'saved') void refetchPage();
		};
		window.addEventListener('focus', onFocus);
		return () => window.removeEventListener('focus', onFocus);
	}, [refetchInterface, refetchPage]);

	// Version B can be removed or promoted while it's open; go back to the page.
	useEffect(() => {
		if (page?.content && variant === 'b' && !page.variant.exists && loadedId === page.id) load(page.id, page.content, 'a', page.draft_revision);
	}, [page, variant, loadedId, load]);

	const switchVariant = useCallback(
		async (next: TPageVariant) => {
			if (next === usePageBuilderStore.getState().variant) return;
			if (!(await flush())) return;
			const fresh = qc.getQueryData<TWorkflowPage>(workflowPageKeys.detail(ws, pageId));
			const content = next === 'b' ? fresh?.variant.content : fresh?.content;
			if (fresh && content) load(fresh.id, content, next, fresh.draft_revision);
		},
		[flush, qc, ws, pageId, load],
	);

	// Comments and AI designs from anyone building this page, as they happen.
	const { echo } = useRealtime();
	useEffect(() => {
		if (!echo || !ws || !pageId) return;
		return subscribeToPage(echo as unknown as IEchoLike, ws, pageId, {
			onComments: () => void qc.invalidateQueries({ queryKey: workflowPageKeys.comments(ws, pageId) }),
			onGeneration: (event) => void qc.invalidateQueries({ queryKey: workflowPageKeys.generation(ws, pageId, event.id) }),
		});
	}, [echo, ws, pageId, qc]);

	const openPublish = useCallback(() => setPublishOpen(true), []);
	useBuilderHotkeys(openPublish);

	const context = useMemo<TPageBuilderContext | null>(
		() =>
			page
				? {
						ws,
						// The checks shown are the ones for the version being edited.
						page: variant === 'b' ? { ...page, issues: page.variant.issues } : page,
						fields: interfaceQuery.data?.fields ?? NO_FIELDS,
						outputs: interfaceQuery.data?.outputs ?? NO_FIELDS,
						interfaceLoading: interfaceQuery.isLoading,
						saveState,
						retrySave: () => void retry(),
						resolveConflict,
						flush,
						switchVariant,
					}
				: null,
		[ws, page, variant, interfaceQuery.data, interfaceQuery.isLoading, saveState, retry, flush, switchVariant, resolveConflict],
	);

	if (pageQuery.isError) {
		return (
			<div className='flex h-dvh flex-col items-center justify-center gap-3 bg-zinc-50 px-4 text-center dark:bg-zinc-950'>
				<p className='text-sm font-semibold text-rose-600'>Could not load this page.</p>
				<div className='flex gap-2'>
					<button
						type='button'
						onClick={() => void pageQuery.refetch()}
						className='bg-primary-400 text-primary-950 rounded-lg px-4 py-2 text-xs font-bold'>
						Retry
					</button>
					<Link to={paths.pages(ws)} className='rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold dark:border-white/10'>
						Back to Pages
					</Link>
				</div>
			</div>
		);
	}

	if (!context || loadedId !== pageId) {
		return (
			<div className='flex h-dvh items-center justify-center gap-2 bg-zinc-50 text-sm font-semibold text-zinc-500 dark:bg-zinc-950'>
				<Loader2 size={16} className='animate-spin' /> Loading page…
			</div>
		);
	}

	return (
		<PageBuilderContext.Provider value={context}>
			<div className='flex h-dvh w-screen flex-col overflow-hidden bg-zinc-50 text-zinc-950 dark:bg-[#07080b] dark:text-zinc-100'>
				<BuilderTopbar publishOpen={publishOpen} setPublishOpen={setPublishOpen} />
				<BuilderOverlays />
				<div className='relative flex min-h-0 flex-1'>
					{isMobile ? (
						<AnimatePresence>
							{mobilePanel && (
								<>
									<motion.button
										type='button'
										aria-label='Close panel'
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										onClick={() => setMobilePanel(null)}
										className='absolute inset-0 z-40 bg-zinc-950/30 backdrop-blur-[2px]'
									/>
									<motion.div
										initial={{ x: mobilePanel === 'left' ? -340 : 340 }}
										animate={{ x: 0 }}
										exit={{ x: mobilePanel === 'left' ? -340 : 340 }}
										transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
										className={`absolute inset-y-0 z-50 w-[320px] max-w-[88vw] shadow-2xl ${mobilePanel === 'left' ? 'left-0' : 'right-0'}`}>
										{mobilePanel === 'left' ? <LeftPanel /> : <RightPanel />}
									</motion.div>
								</>
							)}
						</AnimatePresence>
					) : (
						<Resizable
							size={{ width: leftWidth, height: '100%' }}
							minWidth={260}
							maxWidth={420}
							enable={{ right: true }}
							onResizeStop={(_event, _direction, ref) => setLeftWidth(ref.offsetWidth)}
							className='min-h-0 shrink-0'>
							<LeftPanel />
						</Resizable>
					)}

					<BuilderCanvas />

					{!isMobile && (
						<Resizable
							size={{ width: rightWidth, height: '100%' }}
							minWidth={280}
							maxWidth={460}
							enable={{ left: true }}
							onResizeStop={(_event, _direction, ref) => setRightWidth(ref.offsetWidth)}
							className='min-h-0 shrink-0'>
							<RightPanel />
						</Resizable>
					)}

					{isMobile && !mobilePanel && (
						<nav
							aria-label='Builder panels'
							className='absolute right-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 flex gap-2'>
							<button
								type='button'
								onClick={() => setMobilePanel('left')}
								className='flex h-11 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white/95 px-3.5 text-xs font-bold shadow-xl backdrop-blur dark:border-white/10 dark:bg-zinc-900/95'>
								<Layers size={15} /> Blocks
							</button>
							<button
								type='button'
								onClick={() => setMobilePanel('right')}
								className='flex h-11 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white/95 px-3.5 text-xs font-bold shadow-xl backdrop-blur dark:border-white/10 dark:bg-zinc-900/95'>
								<SlidersHorizontal size={15} /> Settings
							</button>
						</nav>
					)}
				</div>
			</div>
		</PageBuilderContext.Provider>
	);
};

export default PageBuilderPage;
