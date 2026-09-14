import { useEffect } from 'react';
import { useOutletContext } from 'react-router';
import Breadcrumb from '@/components/layout/Breadcrumb';
import pages from '@/Routes/pages';
import { OutletContextType } from './_layouts/Security.layout';
import ChangePasswordCard from './_partial/ChangePasswordCard.partial';
import TwoFactorCard from './_partial/TwoFactorCard.partial';
import SessionsCard from './_partial/SessionsCard.partial';

// ============================================================
// Security settings
// ------------------------------------------------------------
// The account-security half of the auth surface: password,
// two-factor, and issued sessions. Enabling 2FA lives on
// /two-factor-setup because it needs the QR step; everything
// after that is managed here.
// ============================================================

const SecurityPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.settings.subPages.security }]} />);
		return () => setHeaderLeft('');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
			<div className='mb-6'>
				<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
					Security
				</h1>
				<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
					Your password, two-factor authentication, and where you are signed in.
				</p>
			</div>

			<ChangePasswordCard />
			<TwoFactorCard />
			<SessionsCard />
		</div>
	);
};

export default SecurityPage;
