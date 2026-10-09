import { FC, ReactNode } from 'react';
import { Avatar1, Avatar2, Avatar3 } from '@/assets/images';

const FEATURES = [
	{
		path: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z',
		title: 'Autonomous agent workflows',
		description: 'Connect LLMs, memory, and tools to automate complex tasks.',
	},
	{
		path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z|m9 12 2 2 4-4',
		title: 'Enterprise-ready isolation',
		description: 'Role-based access, credential vaults, and full audit trails.',
	},
	{
		path: 'M3 3v18h18|m19 9-5 5-4-4-3 3',
		title: 'Execution at planetary scale',
		description: 'High-throughput orchestration with millisecond latency.',
	},
];

type TAuthLayoutProps = {
	/** Uppercase pill copy above the headline, e.g. "WELCOME TO AGENT1O1". */
	badge: string;
	/** Contents of the floating white card on the right. */
	children: ReactNode;
};

const AuthLayout: FC<TAuthLayoutProps> = ({ badge, children }) => (
	<div className='relative flex min-h-screen w-full flex-col overflow-hidden bg-[#0a0b0f] text-white lg:flex-row'>
		{/* Ambient Brand Glowing Gradient */}
		<div className='bg-primary-600/25 pointer-events-none absolute -top-44 -left-44 h-[700px] w-[700px] rounded-full blur-[170px]' />
		<div className='bg-primary-600/20 pointer-events-none absolute top-1/4 left-1/3 h-[500px] w-[500px] rounded-full blur-[150px]' />

		{/* Decorative Corner Outline */}
		<div className='border-primary-500/20 pointer-events-none absolute top-12 right-0 hidden h-64 w-48 rounded-l-[40px] border-y border-l lg:block' />

		{/* ─── Left Panel: Hero Showcase (Brand Theme & Agent1o1 Tagline) ─── */}
		{/* Hidden below lg: on mobile the auth card should be reachable without scrolling past marketing copy. */}
		<div className='relative z-10 hidden flex-1 flex-col justify-between p-8 sm:p-12 lg:flex lg:p-16'>
			<div>
				<div className='border-primary-500/35 bg-primary-500/15 text-primary-300 inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[11px] font-bold tracking-wider uppercase'>
					<span className='bg-primary-400 size-1.5 animate-pulse rounded-full' />
					{badge}
				</div>

				<h1 className='mt-8 text-5xl leading-[1.05] font-black tracking-tight text-white sm:text-6xl lg:text-7xl'>
					Build <br />
					<span className='text-primary-400 font-serif italic'>Autonomous.</span> <br />
					AI Agents.
				</h1>
			</div>

			{/* 3 Feature Boxes */}
			<div className='my-10 flex max-w-md flex-col gap-3.5'>
				{FEATURES.map(({ path, title, description }) => (
					<div
						key={title}
						className='border-primary-500/25 hover:border-primary-500/50 flex items-center gap-4 rounded-2xl border bg-[#120f1d]/85 p-4 shadow-lg shadow-black/30 backdrop-blur-xl transition-all hover:bg-[#181427]/90'>
						<div className='border-primary-500/30 bg-primary-500/15 text-primary-300 flex size-11 shrink-0 items-center justify-center rounded-xl border shadow-inner'>
							<svg
								className='text-primary-300 size-5'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'>
								{path.split('|').map((d) => (
									<path key={d} d={d} />
								))}
							</svg>
						</div>
						<div>
							<div className='text-sm font-bold text-white'>{title}</div>
							<div className='text-xs text-[#9d9eb5]'>{description}</div>
						</div>
					</div>
				))}
			</div>

			{/* Social Proof */}
			<div className='flex items-center gap-4 pt-2'>
				<div className='flex -space-x-2.5'>
					<img
						src={Avatar1}
						alt='Builder'
						className='ring-primary-900 size-8 rounded-full object-cover ring-2'
					/>
					<img
						src={Avatar2}
						alt='Builder'
						className='ring-primary-900 size-8 rounded-full object-cover ring-2'
					/>
					<img
						src={Avatar3}
						alt='Builder'
						className='ring-primary-900 size-8 rounded-full object-cover ring-2'
					/>
				</div>
				<div>
					<div className='text-primary-300/80 text-[10px] font-bold tracking-widest uppercase'>
						TRUSTED BY BUILDERS
					</div>
					<div className='text-xs font-bold tracking-tight text-white'>
						JOIN 5,000+ TOP-TIER AI DEVELOPERS
					</div>
				</div>
			</div>
		</div>

		{/* ─── Right Panel: Floating Card ───────────────────────────── */}
		<div className='relative z-10 flex flex-1 items-center justify-center p-4 sm:p-8 lg:p-12'>
			<div className='shadow-primary-950/20 w-full max-w-[460px] rounded-[32px] border border-white/80 bg-white p-8 shadow-2xl sm:p-10'>
				{children}
			</div>
		</div>
	</div>
);

export default AuthLayout;
