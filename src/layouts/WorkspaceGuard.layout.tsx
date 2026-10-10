import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useParams } from 'react-router';
import { useWorkspaceContext } from '@/context/workspace';
import pages from '@/Routes/pages';

/**
 * Membership gate for everything under `/:workspaceId`. It carries no chrome, so
 * the core-app shell, the settings shell and the full-screen editors can all sit
 * under it as siblings without stacking layouts.
 *
 * The URL decides the workspace: opening a link to another workspace the member
 * belongs to makes it their current one, so every page and the sidebar agree.
 */
const WorkspaceGuardLayout = () => {
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { workspaces, isLoading, activeWorkspaceId, switchWorkspace } = useWorkspaceContext();
	const attemptedFor = useRef<string | null>(null);
	const [failedFor, setFailedFor] = useState<string | null>(null);

	// Ids are typed `string` here but Laravel sends them as numbers, so the raw
	// comparison never matched and every workspace bounced straight back to the
	// chooser.
	const isMember = workspaces.some((w) => String(w.id) === String(workspaceId));
	const needsSwitch =
		!isLoading &&
		isMember &&
		!!workspaceId &&
		String(activeWorkspaceId) !== String(workspaceId) &&
		failedFor !== workspaceId;

	useEffect(() => {
		if (!needsSwitch || !workspaceId || attemptedFor.current === workspaceId) return;
		attemptedFor.current = workspaceId;
		switchWorkspace(workspaceId).catch(() => setFailedFor(workspaceId));
	}, [needsSwitch, switchWorkspace, workspaceId]);

	if (!isLoading && !isMember) {
		return <Navigate to={pages.choose.to} replace />;
	}

	if (isLoading || needsSwitch) return null;

	return <Outlet />;
};

export default WorkspaceGuardLayout;
