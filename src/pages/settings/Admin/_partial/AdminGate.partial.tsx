import type { FC, ReactNode } from 'react';
import { Link } from 'react-router';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { useWorkspaceContext } from '@/context/workspace';
import paths from '@/Routes/paths';
import { primaryBtn } from '../../_shared/buttons';

/**
 * The admin API refuses anyone who isn't a platform admin, and any admin
 * without two-factor auth confirmed. Checking both here means the screens
 * explain the refusal instead of firing requests that 403.
 */
const AdminGate: FC<{ children: ReactNode }> = ({ children }) => {
	const { userData } = useAuth();
	const { activeWorkspaceId } = useWorkspaceContext();

	if (!userData?.is_platform_admin) {
		return (
			<Notice title='Platform admins only'>
				This area is for the people who run Agent1o1. Ask an existing admin to run{' '}
				<code className='font-mono'>php artisan admin:grant</code> for your account.
			</Notice>
		);
	}

	if (!userData.two_factor_enabled) {
		return (
			<Notice
				title='Turn on two-factor authentication'
				action={
					<Link to={paths.security(activeWorkspaceId)} className={`${primaryBtn} mt-5`}>
						Open security settings
					</Link>
				}>
				Admin screens can hand out credits and plan time, so they need two-factor
				authentication on your account first.
			</Notice>
		);
	}

	return <>{children}</>;
};

const Notice: FC<{ title: string; children: ReactNode; action?: ReactNode }> = ({
	title,
	children,
	action,
}) => (
	<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
		<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 px-6 py-16 text-center dark:border-zinc-800'>
			<ShieldAlert size={28} className='text-amber-500' />
			<h1 className='mt-3 text-lg font-bold text-zinc-900 dark:text-white'>{title}</h1>
			<p className='mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400'>{children}</p>
			{action}
		</div>
	</div>
);

export default AdminGate;
