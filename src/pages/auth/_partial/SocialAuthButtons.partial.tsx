import { motion } from 'framer-motion';
import { useSocialRedirectUrl } from '@/api/modules/auth';
import type { TSocialProvider } from '@/types/auth.type';
import Icon from '@/components/icon/Icon';

// ============================================================
// Social Auth Buttons
// ------------------------------------------------------------
// The backend owns the provider URL (client id, scopes, state), so
// the button asks for it and then hands the tab over. The provider
// comes back to /oauth/callback with a short-lived exchange code —
// see OAuthCallback.page.tsx.
// ============================================================

const SocialAuthButtons = () => {
	const redirect = useSocialRedirectUrl();

	const handleClick = (provider: TSocialProvider) => {
		redirect.mutate(provider, {
			// A full document navigation, not `navigate()` — the destination
			// is the provider's domain, outside the router entirely.
			onSuccess: ({ url }) => window.location.assign(url),
		});
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.2 }}
			className='mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
			<button
				type='button'
				disabled={redirect.isPending}
				onClick={() => handleClick('google')}
				className='group flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-xs font-bold tracking-wide text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'>
				<Icon icon='Google' className='h-5 w-5' />
				Google
			</button>
			<button
				type='button'
				disabled={redirect.isPending}
				onClick={() => handleClick('github')}
				className='group flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 px-4 py-3.5 text-xs font-bold tracking-wide text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'>
				<Icon icon='Github' className='h-5 w-5 text-white' />
				Github
			</button>
		</motion.div>
	);
};

export default SocialAuthButtons;
