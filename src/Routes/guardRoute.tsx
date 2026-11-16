import { RouteObject } from 'react-router';
import RequirePermissionLayout from '@/layouts/RequirePermission.layout';
import type { TPage } from '@/Routes/pages';

/**
 * Wraps a route in the permission gate its page declares, so the permission is
 * written once, on the page, and the sidebar and the route agree. Pages with
 * no `permission` pass through untouched. `redirectTo` sends viewers who lack
 * it to another page instead of the no-access screen.
 */
const guardRoute = (page: TPage, route: RouteObject, redirectTo?: string): RouteObject =>
	page.permission
		? {
				element: (
					<RequirePermissionLayout permission={page.permission} redirectTo={redirectTo} />
				),
				children: [route],
			}
		: route;

export default guardRoute;
