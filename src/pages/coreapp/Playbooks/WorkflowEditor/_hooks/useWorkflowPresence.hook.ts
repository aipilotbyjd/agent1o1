import { useEffect, useMemo, useState } from 'react';
import { joinWorkflowPresence, type IPresenceMember } from '@/api/modules/workflows';
import { useAuth } from '@/context/auth';
import { useRealtime } from '@/context/realtime';
import { useWorkflowEditor } from './useWorkflowEditor.hook';

/** The other members who have this workflow open right now. */
export const useWorkflowPresence = () => {
	const { echo } = useRealtime();
	const { state } = useWorkflowEditor();
	const selfId = useAuth().userData?.id;
	const ws = state.workflow.workspaceId;
	const wfId = state.workflow.apiId;
	const [members, setMembers] = useState<IPresenceMember[]>([]);

	useEffect(() => {
		if (!echo || !ws || !wfId) return undefined;

		const leave = joinWorkflowPresence(echo, ws, wfId, {
			onHere: setMembers,
			onJoining: (member) =>
				setMembers((current) => [...current.filter(({ id }) => id !== member.id), member]),
			onLeaving: (member) =>
				setMembers((current) => current.filter(({ id }) => id !== member.id)),
		});

		return () => {
			leave();
			setMembers([]);
		};
	}, [echo, ws, wfId]);

	return useMemo(() => members.filter(({ id }) => id !== selfId), [members, selfId]);
};
