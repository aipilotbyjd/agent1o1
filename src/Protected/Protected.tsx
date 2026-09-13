import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/context/authContext';
import useDarkMode from '@/hooks/useDarkMode';
import { LogoDark, LogoLight } from '@/assets/images';
import pages from '@/Routes/pages';

// ============================================================
// Protected
// ------------------------------------------------------------
// Gate on the session only. Roles on this backend are per-workspace
// (owner/admin/editor/member/viewer on the membership pivot), not a
// user attribute, so a route can't be gated on one here.
// ============================================================

const Protected = () => {
	const { user, tokenStorage, isLoading } = useAuth();
	const { isDarkTheme } = useDarkMode();
	const location = useLocation();

	if (isLoading) {
		return (
			<div className='flex h-full items-center justify-center'>
				<img src={isDarkTheme ? LogoDark : LogoLight} alt='' className='h-24' />
			</div>
		);
	}

	if (!tokenStorage || !user) {
		// `from` lets the login page send the user back where they were headed.
		return (
			<Navigate to={pages.pagesExamples.login.to} replace state={{ from: location.pathname }} />
		);
	}

	return <Outlet />;
};

export default Protected;
