import { Navigate, Outlet, useParams } from 'react-router';
import { useWorkspaceContext } from '@/context/workspace';
import pages from '@/Routes/pages';

/**
 * Membership gate for everything under `/:workspaceId`. It carries no chrome, so
 * the core-app shell, the settings shell and the full-screen editors can all sit
 * under it as siblings without stacking layouts.
 */
const WorkspaceGuardLayout = () => {
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { workspaces, isLoading } = useWorkspaceContext();

	// Ids are typed `string` here but Laravel sends them as numbers, so the raw
	// comparison never matched and every workspace bounced straight back to the
	// chooser.
	if (!isLoading && !workspaces.some((w) => String(w.id) === String(workspaceId))) {
		return <Navigate to={pages.choose.to} replace />;
	}

	return <Outlet />;
};

export default WorkspaceGuardLayout;
