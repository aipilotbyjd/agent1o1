import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/icon/Icon';
import type { TIcons } from '@/types/icons.type';

interface IAuthShellProps {
	badge: string;
	title: ReactNode;
	subtitle: string;
	mobileTitle: string;
	mobileSubtitle: string;
	children: ReactNode;
	footer: ReactNode;
}

const featureItems: { title: string; desc: string; icon: TIcons }[] = [
	{
		title: 'Launch production workflows',
		desc: 'Ship AI-powered automations in minutes, not days.',
		icon: 'AiCloud',
	},
	{
		title: 'Secure team-ready automation',
		desc: 'Enterprise-grade security for your entire organization.',
		icon: 'AiSecurity01',
	},
	{
		title: 'Scale with confidence',
		desc: 'Handle millions of tasks with 99.9% reliability.',
		icon: 'AnalyticsUp',
	},
];

const AuthShell = ({
	badge,
	title,
	subtitle,
	mobileTitle,
	mobileSubtitle,
	children,
	footer,
}: IAuthShellProps) => {
	return (
		<div className='selection:bg-primary-200 selection:text-primary-950 min-h-screen w-full overflow-hidden bg-slate-100 text-slate-950'>
			<div className='flex min-h-screen w-full flex-col md:flex-row'>
				<motion.aside
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.8, ease: 'easeOut' }}
					className='relative hidden w-[40%] flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white md:flex lg:p-16 xl:w-[42%] xl:p-20'>
					{/* Background Effects */}
					<div className='absolute inset-0 z-0 overflow-hidden'>
						<div className='bg-primary-900 absolute -top-1/4 -left-1/4 h-[100%] w-[100%] rounded-full blur-[120px]' />
						<div className='bg-secondary-950 absolute -right-1/4 -bottom-1/4 h-[100%] w-[100%] rounded-full blur-[120px]' />

						{/* Noise Texture */}
						<div
							className='absolute inset-0 opacity-[0.015] contrast-150'
							style={{
								backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
							}}
						/>
					</div>

					{/* Floating Glass Element */}
					<motion.div
						animate={{
							y: [0, -20, 0],
							rotate: [0, 5, 0],
							scale: [1, 1.05, 1],
						}}
						transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
						className='border-primary-700 absolute top-20 -right-20 z-0 h-64 w-64 rounded-[60px] border bg-slate-900'
					/>

					<div className='relative z-10'>
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
							className='border-primary-400 bg-primary-100 mb-12 inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-[10px] font-black tracking-[0.2em] uppercase'>
							<span className='relative flex h-2 w-2'>
								<span className='bg-primary-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75' />
								<span className='bg-primary-400 relative inline-flex h-2 w-2 rounded-full' />
							</span>
							<span className='text-primary-700'>{badge}</span>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
							className='mb-16'>
							<h1 className='text-6xl leading-[0.9] font-black tracking-tighter text-white sm:text-7xl xl:text-8xl'>
								Ship <br />
								<span className='text-primary-300 italic'>Brilliance.</span> <br />
								Every day.
							</h1>
						</motion.div>

						<div className='grid grid-cols-1 gap-6'>
							{featureItems.map((item, index) => (
								<motion.div
									key={item.title}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.45 + index * 0.1 }}
									className='group hover:border-primary-500 relative flex items-start gap-5 rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-sm transition-all hover:bg-slate-800'>
									<div className='bg-primary-200 text-primary-900 ring-primary-300 group-hover:bg-primary-500 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 transition-all group-hover:text-slate-950'>
										<Icon icon={item.icon} className='h-6 w-6' />
									</div>
									<div className='space-y-1'>
										<h4 className='group-hover:text-primary-200 text-sm font-bold text-white transition-colors'>
											{item.title}
										</h4>
										<p className='text-xs leading-relaxed font-medium text-slate-300'>
											{item.desc}
										</p>
									</div>
								</motion.div>
							))}
						</div>
					</div>

					<div className='relative z-10 border-t border-slate-700 pt-10'>
						<div className='flex items-center gap-6'>
							<div className='flex -space-x-4'>
								{[
									'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100',
									'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100',
									'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100',
								].map((src, i) => (
									<motion.img
										key={i}
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ delay: 0.8 + i * 0.1 }}
										src={src}
										alt='user'
										className='h-12 w-12 rounded-full border-4 border-white object-cover shadow-2xl'
									/>
								))}
							</div>
							<div className='space-y-0.5'>
								<p className='text-primary-300 text-xs font-black tracking-widest uppercase'>
									Trusted by experts
								</p>
								<p className='text-[10px] font-bold text-slate-300 uppercase'>
									Join 5,000+ top-tier developers
								</p>
							</div>
						</div>
					</div>
				</motion.aside>

				<motion.main
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
					className='relative flex min-h-screen w-full flex-col items-center justify-center bg-slate-100 px-6 py-12 md:w-[60%] lg:px-12 xl:px-20'>
					<div className='flex w-full max-w-xl flex-col rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300 sm:p-8'>
						{/* Mobile Header */}
						<div className='mb-10 block md:hidden'>
							<div className='bg-primary-100 text-primary-800 ring-primary-300 mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase ring-1'>
								<span className='bg-primary-400 h-1.5 w-1.5 rounded-full' />
								{badge}
							</div>
							<h3 className='text-3xl font-black tracking-tighter text-zinc-950'>
								{mobileTitle}
							</h3>
							<p className='mt-2 text-sm font-medium text-zinc-500'>
								{mobileSubtitle}
							</p>
						</div>

						<header className='mb-10 hidden md:block'>
							<h2 className='text-4xl font-black tracking-tighter text-zinc-950 lg:text-5xl'>
								{title}
							</h2>
							<p className='mt-3 text-sm font-medium text-zinc-500'>{subtitle}</p>
						</header>

						<div className='w-full'>{children}</div>

						<footer className='mt-10 border-t border-slate-200 pt-6 text-center text-xs font-bold text-slate-500'>
							{footer}
						</footer>
					</div>
				</motion.main>
			</div>
		</div>
	);
};

export default AuthShell;
