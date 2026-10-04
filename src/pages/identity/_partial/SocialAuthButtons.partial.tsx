import { ReactElement } from 'react';
import { useSocialRedirectUrl } from '@/api/modules/auth';
import { TSocialProvider } from '@/types/auth.type';

// ============================================================
// Social Auth Buttons
// ------------------------------------------------------------
// The backend owns the provider URL (client id, scopes, state), so
// the button asks for it and then hands the tab over. It comes back
// to `/oauth/callback` with a short-lived exchange code — see
// `OAuthCallback.page.tsx`.
// ============================================================

const GoogleMark = () => (
	<svg className='size-4' viewBox='0 0 46 47' fill='none'>
		<path
			d='M46 24.0287C46 22.09 45.8533 20.68 45.5013 19.2112H23.4694V27.9356H36.4069C36.1429 30.1094 34.7347 33.37 31.5957 35.5731L31.5663 35.8669L38.5191 41.2719L38.9885 41.3306C43.4477 37.2181 46 31.1669 46 24.0287Z'
			fill='#4285F4'
		/>
		<path
			d='M23.4694 47C29.8061 47 35.1161 44.9144 39.0179 41.3012L31.625 35.5437C29.6301 36.9244 26.9898 37.8937 23.4987 37.8937C17.2793 37.8937 12.0281 33.7812 10.1505 28.1412L9.88649 28.1706L2.61097 33.7812L2.52296 34.0456C6.36608 41.7125 14.287 47 23.4694 47Z'
			fill='#34A853'
		/>
		<path
			d='M10.1212 28.1413C9.62245 26.6725 9.32908 25.1156 9.32908 23.5C9.32908 21.8844 9.62245 20.3275 10.0918 18.8588V18.5356L2.75765 12.8369L2.52296 12.9544C0.909439 16.1269 0 19.7106 0 23.5C0 27.2894 0.909439 30.8731 2.49362 34.0456L10.1212 28.1413Z'
			fill='#FBBC05'
		/>
		<path
			d='M23.4694 9.07688C27.8699 9.07688 30.8622 10.9863 32.5344 12.5725L39.1645 6.11C35.0867 2.32063 29.8061 0 23.4694 0C14.287 0 6.36607 5.2875 2.49362 12.9544L10.0918 18.8588C11.9987 13.1894 17.25 9.07688 23.4694 9.07688Z'
			fill='#EB4335'
		/>
	</svg>
);

const GithubMark = () => (
	<svg className='size-4' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
		<path d='M12 .5C5.73.5.99 5.24.99 11.51c0 4.87 3.16 9 7.54 10.46.55.1.75-.24.75-.53v-2.06c-3.07.67-3.72-1.3-3.72-1.3-.5-1.28-1.23-1.62-1.23-1.62-1-.69.08-.67.08-.67 1.11.08 1.7 1.14 1.7 1.14.99 1.7 2.59 1.21 3.22.93.1-.72.39-1.21.7-1.49-2.45-.28-5.03-1.23-5.03-5.46 0-1.21.43-2.2 1.14-2.97-.11-.28-.49-1.4.11-2.92 0 0 .93-.3 3.05 1.14a10.5 10.5 0 0 1 5.56 0c2.12-1.44 3.05-1.14 3.05-1.14.6 1.52.22 2.64.11 2.92.71.77 1.14 1.76 1.14 2.97 0 4.24-2.58 5.18-5.04 5.45.4.34.75 1.02.75 2.06v3.05c0 .29.2.64.76.53 4.38-1.46 7.53-5.59 7.53-10.46C23.01 5.24 18.27.5 12 .5Z' />
	</svg>
);

const PROVIDERS: Array<{
	provider: TSocialProvider;
	label: string;
	Mark: () => ReactElement;
	className: string;
}> = [
	{
		provider: 'google',
		label: 'Google',
		Mark: GoogleMark,
		className:
			'border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50',
	},
	{
		provider: 'github',
		label: 'Github',
		Mark: GithubMark,
		className: 'bg-[#2e3138] text-white hover:bg-[#202227]',
	},
];

const SocialAuthButtons = () => {
	const redirect = useSocialRedirectUrl();

	const handleClick = (provider: TSocialProvider) => {
		redirect.mutate(provider, {
			// A full document navigation, not `navigate()` — the destination is
			// the provider's domain, outside the router entirely.
			onSuccess: ({ url }) => window.location.assign(url),
		});
	};

	return (
		<div className='grid grid-cols-2 gap-3'>
			{PROVIDERS.map(({ provider, label, Mark, className }) => (
				<button
					key={provider}
					type='button'
					disabled={redirect.isPending}
					onClick={() => handleClick(provider)}
					className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold shadow-2xs transition-colors focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 ${className}`}>
					<Mark />
					{label}
				</button>
			))}
		</div>
	);
};

export default SocialAuthButtons;
