import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { getAccessToken } from '@/api/core';
import useResolvePath from '@/hooks/useResolvePath';
import pages from '@/Routes/pages';

/** The way out of the changelog: the dashboard, or the workspace list / login without one. */
const ChangelogBackLink = () => {
	const { workspaceId, resolvePath } = useResolvePath();
	const signedIn = !!getAccessToken();

	const { to, label } = !signedIn
		? { to: pages.identity.login.to, label: 'Log in' }
		: workspaceId
			? {
					to: resolvePath(pages.workspace.subPages!.dashboard.to),
					label: 'Back to dashboard',
				}
			: { to: pages.choose.to, label: 'Back to your workspaces' };

	return (
		<Link
			to={to}
			className='border-border-main bg-bg-card text-text-main hover:border-primary-500/60 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold shadow-xs transition-colors'>
			<ArrowLeft size={15} aria-hidden /> {label}
		</Link>
	);
};

export default ChangelogBackLink;
