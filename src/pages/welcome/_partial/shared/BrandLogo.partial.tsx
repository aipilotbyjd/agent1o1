import { Globe } from 'lucide-react';

const BrandLogo = ({ name, className = 'w-6 h-6' }: { name: string; className?: string }) => {
	const getIcon = () => {
		switch (name.toLowerCase()) {
			case 'slack':
				return (
					<svg viewBox='0 0 24 24' className={className}>
						<path
							fill='#36C5F0'
							d='M5 10.5c0-1.4 1.1-2.5 2.5-2.5h2.5v2.5c0 1.4-1.1 2.5-2.5 2.5H5v-2.5zm0 2.5h5v5c0 1.4-1.1 2.5-2.5 2.5S5 19.4 5 18v-5z'
						/>
						<path
							fill='#2EB67D'
							d='M10.5 5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5v2.5h-2.5c-1.4 0-2.5-1.1-2.5-2.5zm2.5 5h5v2.5c0 1.4-1.1 2.5-2.5 2.5H13v-5z'
						/>
						<path
							fill='#ECB22E'
							d='M19 13.5c0 1.4-1.1 2.5-2.5 2.5H14v-2.5c0-1.4 1.1-2.5 2.5-2.5H19v2.5zm0-2.5h-5V6c0-1.4 1.1-2.5 2.5-2.5S19 4.6 19 6v5z'
						/>
						<path
							fill='#E01E5A'
							d='M13.5 19c0 1.4-1.1 2.5-2.5 2.5S8.5 20.4 8.5 19v-2.5H11c1.4 0 2.5 1.1 2.5 2.5zm-2.5-5H6v-2.5c0-1.4 1.1-2.5 2.5-2.5H11v5z'
						/>
					</svg>
				);
			case 'github':
				return (
					<svg
						viewBox='0 0 24 24'
						className={`${className} fill-current text-slate-900 dark:text-white`}>
						<path
							fillRule='evenodd'
							clipRule='evenodd'
							d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z'
						/>
					</svg>
				);
			case 'gmail':
				return (
					<svg viewBox='0 0 24 24' className={className}>
						<path
							fill='#EA4335'
							d='M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z'
						/>
						<path
							fill='#FBBC05'
							d='M22 6v12c0 1.1-.9 2-2 2h-2V8l-6 4-6-4v12H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h16c1.1 0 2.9-.1 2 2z'
						/>
						<path
							fill='#34A853'
							d='M2 6v1.5l10 6.5 10-6.5V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2z'
						/>
						<path
							fill='#4285F4'
							d='M22 6v1.5l-10 6.5L2 7.5V6c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2z'
						/>
					</svg>
				);
			case 'google sheets':
				return (
					<svg viewBox='0 0 24 24' className={className}>
						<path
							fill='#0F9D58'
							d='M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z'
						/>
						<rect fill='#0F9D58' x='8' y='11' width='8' height='2' rx='0.5' />
						<rect fill='#0F9D58' x='8' y='14' width='8' height='2' rx='0.5' />
					</svg>
				);
			case 'google drive':
				return (
					<svg viewBox='0 0 24 24' className={className}>
						<path fill='#0066da' d='M12.87 2.45L4.56 16.7h14.88L12.87 2.45z' />
						<path fill='#00a85d' d='M4.56 16.7L1.25 22.45h14.88L12.87 16.7H4.56z' />
						<path fill='#ffbc00' d='M12.87 16.7L9.56 22.45h13.19L19.44 16.7H12.87z' />
					</svg>
				);
			case 'notion':
				return (
					<div
						className={`border-zinc-150 flex items-center justify-center rounded-lg border bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/60 ${className}`}>
						<span className='text-sm font-extrabold text-zinc-900 dark:text-white'>
							N
						</span>
					</div>
				);
			case 'airtable':
				return (
					<svg viewBox='0 0 24 24' className={className}>
						<path
							fill='#18bfff'
							d='M12 2L2 7v10l10 5 10-5V7L12 2zm-1 15.5l-6-3V10l6 3v4.5zm8-1l-6 3V12l6-3v5.5z'
						/>
					</svg>
				);
			case 'salesforce':
				return (
					<svg viewBox='0 0 24 24' className={className}>
						<path
							fill='#00A1E0'
							d='M18.5 10.5C18.2 8 16 6 13.5 6c-1.5 0-3 .8-3.8 2C9 7.4 7.8 7 6.5 7 4 7 2 9 2 11.5c0 .3 0 .6.1.9C1 13 0 14.4 0 16c0 2.5 2 4.5 4.5 4.5h14c3 0 5.5-2.5 5.5-5.5 0-2.3-1.4-4.2-3.5-4.5z'
						/>
					</svg>
				);
			case 'hubspot':
				return (
					<svg viewBox='0 0 24 24' className={className}>
						<path
							fill='#FF7A59'
							d='M21.5 11h-3.8c-.5-1.5-1.9-2.5-3.5-2.5-1.3 0-2.4.6-3.1 1.6L5.5 7.2C5.8 6.5 6 5.8 6 5c0-2.8-2.2-5-5-5S-4 2.2-4 5s2.2 5 5 5c.8 0 1.5-.2 2.2-.5l5.6 3.9c-1 1-1.6 2.3-1.6 3.7 0 2.8 2.2 5 5 5s5-2.2 5-5c0-1-.3-2-.9-2.7l3.9-5.6c.5.3 1.2.5 1.9.5 1.7 0 3-1.3 3-3s-1.3-3-3-3z'
						/>
					</svg>
				);
			case 'apollo':
				return (
					<div
						className={`flex items-center justify-center rounded-lg bg-orange-500 text-white ${className}`}>
						<span className='text-xs font-black tracking-tighter'>🚀</span>
					</div>
				);
			case 'tiktok':
				return (
					<svg viewBox='0 0 24 24' className={className}>
						<path
							fill='#000'
							d='M12.5 2v13c0 2.5-2 4.5-4.5 4.5S3.5 17.5 3.5 15s2-4.5 4.5-4.5c.3 0 .6 0 .9.1V6.2C7 6 5.5 6.5 4.3 7.5S2 11 2 13.5s2.2 6.5 6.5 6.5S15 17.8 15 13.5V6.5c1.5 1.5 3.5 2 5.5 2v-4c-2 0-4-1.5-5-3h-3z'
						/>
					</svg>
				);
			case 'youtube':
				return (
					<svg viewBox='0 0 24 24' className={className}>
						<path
							fill='#FF0000'
							d='M23.5 6.5C23.2 4.2 21.3 2.5 19 2.2c-3.3-.4-6.7-.4-10 0C6.7 2.5 4.8 4.2 4.5 6.5c-.5 3.3-.5 6.7 0 10 .3 2.3 2.2 4 4.5 4.3 3.3.4 6.7.4 10 0 2.3-.3 4.2-2 4.5-4.3.5-3.3.5-6.7 0-10zM9.5 15.5V8.5l6.5 3.5-6.5 3.5z'
						/>
					</svg>
				);
			case 'instagram':
				return (
					<svg viewBox='0 0 24 24' className={className}>
						<rect
							x='2'
							y='2'
							width='20'
							height='20'
							rx='5'
							fill='none'
							stroke='#E1306C'
							strokeWidth='2.5'
						/>
						<circle
							cx='12'
							cy='12'
							r='5'
							fill='none'
							stroke='#E1306C'
							strokeWidth='2.5'
						/>
						<circle cx='18' cy='6' r='1.5' fill='#E1306C' />
					</svg>
				);
			case 'x (twitter)':
				return (
					<svg
						viewBox='0 0 24 24'
						className={`${className} fill-current text-slate-900 dark:text-white`}>
						<path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
					</svg>
				);
			case 'google analytics':
				return (
					<svg viewBox='0 0 24 24' className={className}>
						<path
							fill='#F4B400'
							d='M12 2v20M6 10v12M18 14v8'
							stroke='#F4B400'
							strokeWidth='3.5'
							strokeLinecap='round'
						/>
					</svg>
				);
			case 'vercel':
				return (
					<svg
						viewBox='0 0 24 24'
						className={`${className} fill-current text-slate-900 dark:text-white`}>
						<path d='M24 22.525H0L12 1.475l12 21.05z' />
					</svg>
				);
			case 'jira':
				return (
					<svg viewBox='0 0 24 24' className={className}>
						<path
							fill='#0052CC'
							d='M11.5 2L2 11.5v5.5l9.5-9.5H17V2h-5.5zM22 12v5.5l-9.5 9.5H7V22l9.5-9.5H22z'
						/>
					</svg>
				);
			case 'figma':
				return (
					<svg viewBox='0 0 24 24' className={className}>
						<path
							fill='#F24E1E'
							d='M12 2a3.5 3.5 0 00-3.5 3.5c0 .9.3 1.7.9 2.3L12 10.5V2z'
						/>
						<path
							fill='#A259FF'
							d='M8.5 7.5a3.5 3.5 0 00-3.5 3.5c0 .9.3 1.7.9 2.3L8.5 16V7.5z'
						/>
						<path fill='#1ABCFE' d='M12 10.5H8.5c-.9 0-1.7.3-2.3.9L12 13.5v-3z' />
						<path fill='#0ACF83' d='M8.5 16H12v3.5a3.5 3.5 0 01-3.5-3.5z' />
						<path
							fill='#FF7262'
							d='M15.5 7.5a3.5 3.5 0 00-3.5-3.5V11h3.5a3.5 3.5 0 000-3.5z'
						/>
					</svg>
				);
			case 'zendesk':
				return (
					<div
						className={`flex items-center justify-center rounded-lg bg-[#03363d] text-white ${className}`}>
						<span className='text-xs font-black'>Z</span>
					</div>
				);
			case 'stripe':
				return (
					<div
						className={`flex items-center justify-center rounded-lg bg-[#635bff] text-white ${className}`}>
						<span className='text-[10px] font-black tracking-tight'>S</span>
					</div>
				);
			default:
				return <Globe className={`${className} text-zinc-400`} />;
		}
	};
	return getIcon();
};

export default BrandLogo;
