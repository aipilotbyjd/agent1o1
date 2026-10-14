import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/core';
import { messageFromError, notify } from '@/api/core/notify';
import { WorkflowPageService, workflowPageKeys } from '@/api/modules/workflow-pages';
import { usePageBuilderStore } from '../_store/pageBuilder.store';

const AUTOSAVE_DEBOUNCE_MS = 700;

/**
 * Saves the builder's draft a moment after each change. The server's answer
 * updates the page record (issues, unpublished changes) but never the draft
 * in the builder — see `usePageBuilderStore`. `flush()` saves right away,
 * for publishing, and resolves to whether the draft on the server is now
 * the one on screen.
 */
export const usePageAutosave = (ws: string, pageId: string) => {
	const qc = useQueryClient();
	const timer = useRef<number | null>(null);
	const inFlight = useRef<Promise<boolean> | null>(null);
	const revision = usePageBuilderStore((store) => store.revision);
	const saveState = usePageBuilderStore((store) => store.saveState);

	const save = useCallback(
		async (options?: { silent?: boolean; force?: boolean }): Promise<boolean> => {
			if (inFlight.current) await inFlight.current;

			const { content, variant, revision: saving, savedRevision, pageId: loaded, baseRevision } = usePageBuilderStore.getState();
			if (!content || loaded !== pageId) return false;
			if (saving === savedRevision) return true;

			const store = usePageBuilderStore.getState();
			store.markSaving();

			const request = WorkflowPageService.update(ws, pageId, {
				...(variant === 'b' ? { variant_content: content } : { content }),
				...(options?.force || baseRevision === null ? {} : { base_revision: baseRevision }),
			})
				.then((page) => {
					qc.setQueryData(workflowPageKeys.detail(ws, pageId), page);
					usePageBuilderStore.getState().markSaved(saving, page.draft_revision);
					return usePageBuilderStore.getState().revision === saving;
				})
				.catch((error: unknown) => {
					if (ApiError.is(error) && error.status === 409) {
						usePageBuilderStore.getState().markConflict();
						return false;
					}
					usePageBuilderStore.getState().markSaveFailed();
					if (!options?.silent) notify.error(messageFromError(error, 'Could not save the page'));
					return false;
				})
				.finally(() => {
					inFlight.current = null;
				});

			inFlight.current = request;
			return request;
		},
		[qc, ws, pageId],
	);

	useEffect(() => {
		if (saveState !== 'dirty') return;
		if (timer.current) window.clearTimeout(timer.current);
		timer.current = window.setTimeout(() => void save(), AUTOSAVE_DEBOUNCE_MS);
		return () => {
			if (timer.current) window.clearTimeout(timer.current);
		};
	}, [revision, saveState, save]);

	// Leaving the builder in-app would drop the last edit with the timer, so
	// it is saved instead; the request outlives the unmount.
	useEffect(
		() => () => {
			if (timer.current) window.clearTimeout(timer.current);
			if (usePageBuilderStore.getState().saveState === 'dirty') void save({ silent: true });
		},
		[save],
	);

	useEffect(() => {
		if (saveState !== 'dirty' && saveState !== 'saving') return;
		const onBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, [saveState]);

	const flush = useCallback(async () => {
		if (timer.current) window.clearTimeout(timer.current);
		let saved = await save();
		// An edit made while that save was in flight still needs its own.
		if (saved === false && usePageBuilderStore.getState().saveState === 'dirty') saved = await save();
		return saved;
	}, [save]);

	/**
	 * After a conflict: `theirs` loads the draft as it is now and drops the
	 * edits on screen; `mine` saves them over it anyway.
	 */
	const resolveConflict = useCallback(
		async (keep: 'mine' | 'theirs') => {
			if (keep === 'mine') {
				await save({ force: true });
				return;
			}
			const page = await WorkflowPageService.detail(ws, pageId);
			qc.setQueryData(workflowPageKeys.detail(ws, pageId), page);
			const { variant, load } = usePageBuilderStore.getState();
			const content = variant === 'b' ? page.variant.content : page.content;
			if (content) load(page.id, content, page.variant.exists ? variant : 'a', page.draft_revision);
		},
		[save, qc, ws, pageId],
	);

	return { saveState, retry: save, flush, resolveConflict };
};
