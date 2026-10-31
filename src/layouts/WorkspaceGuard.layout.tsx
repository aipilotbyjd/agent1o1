import { Navigate, Outlet, useParams } from 'react-router';
import { useWorkspaceContext } from '@/context/workspace';
import useSyncActiveWorkspace from '@/hooks/useSyncActiveWorkspace';
import pages from '@/Routes/pages';

/**
 * Gate for everything under `/:workspaceId`, and for the workspace picker. It
 * carries no chrome, so the core-app shell, the settings shell and the
 * full-screen editors can all sit under it as siblings.
 *
 * In order: no workspace at all goes to onboarding (signup creates none and
 * that step is mandatory); a workspace the user does not belong to goes to the
 * picker; otherwise the URL's workspace becomes the current one.
 */
const WorkspaceGuardLayout = () => {
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { workspaces, isLoading } = useWorkspaceContext();

	// Ids are typed `string` but Laravel sends numbers, so compare as strings.
	const isMember = workspaces.some((workspace) => String(workspace.id) === workspaceId);
	const isSwitching = useSyncActiveWorkspace(isMember ? workspaceId : undefined);

	if (isLoading) return null;

	if (workspaces.length === 0) return <Navigate to={pages.welcome.to} replace />;

	// The picker has no workspace in its URL, so there is nothing to join.
	if (!workspaceId) return <Outlet />;

	if (!isMember) return <Navigate to={pages.choose.to} replace />;

	return isSwitching ? null : <Outlet />;
};

export default WorkspaceGuardLayout;
