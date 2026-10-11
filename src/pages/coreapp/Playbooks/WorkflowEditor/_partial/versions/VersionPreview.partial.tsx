import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, Loader2, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { useWorkflowVersion, useWorkflowVersions } from '@/api/modules/workflows';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import type { TCanvasPosition } from '../../_types/canvas.type';
import { diffGraphs } from '../../_helper/versionDiff.helper';
import { useDraftStatus } from '../../_hooks/useDraftStatus.hook';
import { useVersionRestore } from '../../_hooks/useVersionRestore.hook';
import { useWorkflowEditor } from '../../_hooks/useWorkflowEditor.hook';
import {
	ChangeSummary,
	GraphPreviewCanvas,
	primaryButton,
	secondaryButton,
} from './GraphPreviewCanvas.partial';

/**
 * A published version shown read-only over the canvas, with the steps that
 * version added or changed outlined. The draft underneath is untouched until
 * the person restores.
 */
const VersionPreview = () => {
	const { state } = useWorkflowEditor();
	const previewVersionId = useWorkflowShellStore((store) => store.previewVersionId);
	const setPreviewVersionId = useWorkflowShellStore((store) => store.setPreviewVersionId);
	const workspaceId = state.workflow.workspaceId ?? '';
	const workflowId = state.workflow.apiId ?? '';

	const { data: versions } = useWorkflowVersions(workspaceId, workflowId);
	const index = versions?.findIndex((version) => version.id === previewVersionId) ?? -1;
	const previousId = index >= 0 ? versions?.[index + 1]?.id : undefined;

	const versionQuery = useWorkflowVersion(workspaceId, workflowId, previewVersionId ?? '');
	const previousQuery = useWorkflowVersion(workspaceId, workflowId, previousId ?? '');
	const { status: draftStatus, liveVersionId } = useDraftStatus();
	const { restore, isRestoring } = useVersionRestore();

	const version = versionQuery.data;
	const graph = version?.editor_graph;
	const previousGraph = previousQuery.data?.editor_graph;

	const diff = useMemo(
		() => (graph && previousGraph ? diffGraphs(previousGraph, graph) : null),
		[graph, previousGraph],
	);
	// Taken when a version opens, not on every canvas change underneath.
	const [canvasPositions, setCanvasPositions] = useState(
		() => new Map<string, TCanvasPosition>(),
	);

	const [shownVersionId, setShownVersionId] = useState(previewVersionId);
	if (shownVersionId !== previewVersionId) {
		setShownVersionId(previewVersionId);
		setCanvasPositions(new Map(state.nodes.map((node) => [node.id, node.position])));
	}

	useEffect(() => {
		if (!previewVersionId) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setPreviewVersionId(null);
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [previewVersionId, setPreviewVersionId]);

	if (!previewVersionId) return null;

	const isLive = previewVersionId === liveVersionId;
	const draftHasChanges = draftStatus !== 'live';
	const publisher = version?.publisher?.name;

	const handleRestore = async () => {
		if (!version) return;
		const restored = await restore(version, {
			draftHasChanges,
			isDiscard: isLive,
		});
		if (restored) setPreviewVersionId(null);
	};

	return (
		<div className='absolute inset-0 z-[15] flex flex-col bg-zinc-50 dark:bg-[#0b0c0f]'>
			<div className='shrink-0 border-b border-zinc-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-950'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<div className='flex min-w-0 items-center gap-3'>
						<span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300'>
							<Eye size={15} />
						</span>
						<div className='min-w-0'>
							<div className='flex items-center gap-2'>
								<h2 className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
									Viewing v{version?.version ?? '…'}
								</h2>
								{isLive && (
									<span className='rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'>
										Live
									</span>
								)}
								<span className='hidden text-xs text-zinc-500 sm:inline dark:text-zinc-400'>
									Read only
								</span>
							</div>
							{version && (
								<p className='truncate text-xs text-zinc-500 dark:text-zinc-400'>
									{version.notes || 'No description'}
									{' · '}
									{publisher ? `${publisher}, ` : ''}
									{format(new Date(version.created_at), 'MMM d, h:mm a')}
								</p>
							)}
						</div>
					</div>
					<div className='flex items-center gap-2'>
						<button
							type='button'
							onClick={() => setPreviewVersionId(null)}
							className={secondaryButton}>
							<ArrowLeft size={13} />
							Back to draft
						</button>
						{version && !(isLive && !draftHasChanges) && (
							<button
								type='button'
								onClick={handleRestore}
								disabled={isRestoring}
								className={primaryButton}>
								{isRestoring ? (
									<Loader2 size={13} className='animate-spin' />
								) : (
									<RotateCcw size={13} />
								)}
								{isLive ? 'Discard my changes' : 'Restore this version'}
							</button>
						)}
					</div>
				</div>
				{version && (
					<div className='mt-2.5'>
						<ChangeSummary
							diff={diff}
							previousGraph={previousGraph}
							previousNumber={previousQuery.data?.version}
						/>
					</div>
				)}
			</div>

			<div className='relative min-h-0 flex-1'>
				{versionQuery.isLoading && (
					<div className='flex h-full items-center justify-center gap-2 text-sm text-zinc-500'>
						<Loader2 size={16} className='animate-spin' />
						Loading v{versions?.[index]?.version ?? ''}…
					</div>
				)}
				{versionQuery.isError && (
					<div className='flex h-full items-center justify-center text-sm text-zinc-500'>
						This version could not be loaded.
					</div>
				)}
				{graph && (
					<GraphPreviewCanvas
						key={previewVersionId}
						graph={graph}
						diff={diff}
						canvasPositions={canvasPositions}
						emptyLabel='This version has no steps.'
					/>
				)}
			</div>
		</div>
	);
};

export default VersionPreview;
