import PasswordCard from './_partial/PasswordCard.partial';
import TwoFactorCard from './_partial/TwoFactorCard.partial';
import SessionsCard from './_partial/SessionsCard.partial';
import LoginActivityCard from './_partial/LoginActivityCard.partial';

const SecurityPage = () => (
	<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
		<div className='mb-6'>
			<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
				Security
			</h1>
			<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
				Password, two-factor authentication and the devices signed in to your account.
			</p>
		</div>

		<div className='space-y-6'>
			<PasswordCard />
			<TwoFactorCard />
			<SessionsCard />
			<LoginActivityCard />
		</div>
	</div>
);

export default SecurityPage;
