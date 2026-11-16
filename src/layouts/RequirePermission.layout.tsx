import { Navigate, Outlet, useLocation, useParams } from 'react-router';
import usePermission from '@/hooks/usePermission';
import { buildPath } from '@/Routes/paths';
import { findPageByPathname } from '@/Routes/pagePermission';
import NoAccessPage from '@/pages/NoAccess.page';

/**
 * Gate for pages a workspace role does not grant. Rendered by
 * WorkspaceGuardLayout once the active workspace is resolved, so no route
 * needs wrapping: a page opts in by declaring `permission` on its definition,
 * and `fallbackTo` sends the viewer somewhere they can go instead.
 */
const RequirePermissionLayout = () => {
	const params = useParams();
	const { pathname } = useLocation();
	const { canOpen } = usePermission();
	const page = findPageByPathname(pathname);

	if (!page || canOpen(page)) return <Outlet />;

	if (page.fallbackTo) return <Navigate to={buildPath(page.fallbackTo, params)} replace />;

	return <NoAccessPage />;
};

export default RequirePermissionLayout;
