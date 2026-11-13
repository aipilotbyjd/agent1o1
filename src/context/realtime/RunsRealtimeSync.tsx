import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaceContext } from '@/context/workspace';
import { runKeys, subscribeToRun } from '@/api/modules/runs';
import { triggerKeys } from '@/api/modules/triggers/triggers.keys';
import { useRealtime } from './useRealtime';

/** A run moves through several states in a second: refresh once it settles. */
const REFRESH_DEBOUNCE_MS = 400;

/**
 * Refreshes what a run changes (run lists, trigger counts and event feeds, the
 * dashboard) whenever any run in the workspace changes state, whoever started
 * it. Renders nothing; mounted inside `RealtimeProvider`.
 */
export const RunsRealtimeSync = () => {
	const { echo } = useRealtime();
	const { activeWorkspaceId: ws } = useWorkspaceContext();
	const qc = useQueryClient();

	useEffect(() => {
		if (!echo || !ws) return undefined;

		let timer: ReturnType<typeof setTimeout> | undefined;
		const unsubscribe = subscribeToRun(echo, ws, null, {
			onRunState: () => {
				clearTimeout(timer);
				timer = setTimeout(() => {
					qc.invalidateQueries({ queryKey: runKeys.all(ws) });
					qc.invalidateQueries({ queryKey: triggerKeys.all(ws) });
					qc.invalidateQueries({ queryKey: ['dashboard', ws] });
				}, REFRESH_DEBOUNCE_MS);
			},
		});

		return () => {
			clearTimeout(timer);
			unsubscribe();
		};
	}, [echo, ws, qc]);

	return null;
};
