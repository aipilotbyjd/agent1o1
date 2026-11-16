import { FC } from 'react';
import { Navigate, Outlet, useParams } from 'react-router';
import { useWorkspaceContext } from '@/context/workspace';
import { useCan, TPermissionCheck } from '@/hooks/usePermission';
import { buildPath } from '@/Routes/paths';
import NoAccessPage from '@/pages/NoAccess.page';

interface IRequirePermissionLayoutProps {
	permission: TPermissionCheck;
	mode?: 'any' | 'all';
	/** Page template to send the viewer to instead, filled from the current route's params. */
	redirectTo?: string;
}

/**
 * Route gate for pages a workspace role does not grant. Sits under
 * WorkspaceGuardLayout, so the active workspace is already resolved.
 */
const RequirePermissionLayout: FC<IRequirePermissionLayoutProps> = ({
	permission,
	mode = 'any',
	redirectTo,
}) => {
	const params = useParams();
	const { isLoading } = useWorkspaceContext();
	const allowed = useCan(permission, mode);

	if (isLoading) return null;

	if (allowed) return <Outlet />;

	if (redirectTo) return <Navigate to={buildPath(redirectTo, params)} replace />;

	return <NoAccessPage />;
};

export default RequirePermissionLayout;
