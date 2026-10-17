import { useEffect, useMemo } from 'react';
import { Link, useOutletContext, useParams } from 'react-router';
import { AppWindow, Loader2, PencilRuler } from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import PageRenderer from '@/components/workflowPage/PageRenderer';
import { usePageRun, type TPageTransport } from '@/components/workflowPage/usePageRun';
import { viewFields } from '@/components/workflowPage/pageTree';
import { WorkflowPageService, useWorkflowPageView } from '@/api/modules/workflow-pages';
import { ApiError } from '@/api/core';
import pages from '@/Routes/pages';
import paths from '@/Routes/paths';
import type { TPageView } from '@/types/workflow-page.type';
import type { OutletContextType } from './_layouts/WorkflowPages.layout';


const LivePage = ({ ws, pageId, view }: { ws: string; pageId: string; view: TPageView }) => {
	const fields = useMemo(() => viewFields(view.blocks), [view]);
	const transport = useMemo<TPageTransport>(
		() => ({
			submit: (input) => WorkflowPageService.submit(ws, pageId, input).then((result) => ({ result })),
			poll: (id, _secret, signal) => WorkflowPageService.submission(ws, pageId, id, signal),
			storageKey: `page-run:member:${pageId}`,
			onStart: () => void WorkflowPageService.started(ws, pageId).catch(() => undefined),
		}),
		[ws, pageId],
	);
	const run = usePageRun(fields, transport);
	return <PageRenderer theme={view.theme} blocks={view.blocks} mode='live' run={run} workspaceName={view.workspace_name} className='flex-1' />;
};

/** A published page as a workspace member uses it, inside the app. */
const UsePagePage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const { workspaceId: ws = '', pageId = '' } = useParams<{ workspaceId: string; pageId: string }>();
	const { data: view, isLoading, error } = useWorkflowPageView(ws, pageId);

	useEffect(() => {
		setHeaderLeft(
			<Breadcrumb
				list={[
					{ ...pages.workspace.subPages!.pages },
					{ ...pages.pageEditor.subPages!.use, text: view?.name ?? 'Page', to: paths.usePage(ws, pageId) },
				]}
			/>,
		);
		return () => setHeaderLeft(undefined);
	}, [setHeaderLeft, view?.name, ws, pageId]);

	return (
		<Container className='relative flex flex-col overflow-y-auto !p-0'>
			<div className='absolute top-3 right-4 z-10'>
				<Link
					to={paths.editPage(ws, pageId)}
					className='flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white/90 px-3 text-xs font-semibold text-zinc-700 shadow-sm backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-zinc-900/90 dark:text-zinc-200'>
					<PencilRuler size={13} /> Edit page
				</Link>
			</div>
			{isLoading ? (
				<div className='flex flex-1 items-center justify-center gap-2 text-sm text-zinc-500'>
					<Loader2 size={16} className='animate-spin' /> Loading page…
				</div>
			) : view ? (
				<LivePage ws={ws} pageId={pageId} view={view} />
			) : (
				<div className='flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center'>
					<div className='bg-primary-400/15 text-primary-700 flex size-12 items-center justify-center rounded-2xl'>
						<AppWindow size={22} />
					</div>
					<p className='text-base font-extrabold text-zinc-900 dark:text-white'>This page isn’t live yet</p>
					<p className='max-w-sm text-sm text-zinc-500'>
						{ApiError.is(error) && error.status === 404
							? error.message
							: 'Something went wrong loading it. Try again in a moment.'}
					</p>
					<Link
						to={paths.editPage(ws, pageId)}
						className='bg-primary-400 text-primary-950 mt-2 rounded-xl px-4 py-2 text-xs font-bold'>
						Open the builder
					</Link>
				</div>
			)}
		</Container>
	);
};

export default UsePagePage;
