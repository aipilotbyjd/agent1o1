import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bot, UserPlus } from 'lucide-react';
import BrandLogo from './BrandLogo.partial';
import { ROLES, PLANS } from '../../_helper/onboarding.constants';

interface IOrbitAnimationProps {
	step: number;
	currentOrbitIcons: string[];
	selectedRoleIndex: number | null;
	selectedPlan: string;
	connectedApps: string[];
}

const OrbitAnimation = ({
	step,
	currentOrbitIcons,
	selectedRoleIndex,
	selectedPlan,
	connectedApps,
}: IOrbitAnimationProps) => {
	return (
		<div className='relative hidden lg:flex min-h-[520px] flex-col items-center justify-center border-l border-slate-100 bg-slate-50/50 p-8 dark:border-zinc-800/80 dark:bg-zinc-950/20'>
			<div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_0)] bg-[size:16px_16px] opacity-[0.03] dark:bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] dark:opacity-[0.04]' />

			<div className='absolute top-6 right-6 flex items-center gap-1.5 rounded-lg bg-primary-400/10 px-2.5 py-1 text-[10px] font-black tracking-wider text-primary-600 uppercase dark:text-primary-400'>
				<Sparkles className='h-3 w-3' />
				Live Preview
			</div>

			<div className='relative flex h-72 w-72 items-center justify-center'>
				<div className='absolute h-40 w-40 animate-pulse rounded-full bg-primary-400/10 blur-2xl dark:bg-primary-400/5' />
				<div className='absolute h-52 w-52 animate-[spin_50s_linear_infinite] rounded-full border border-dashed border-slate-200/60 dark:border-zinc-800/40' />
				<div className='absolute h-[130px] w-[130px] animate-[spin_30s_linear_infinite_reverse] rounded-full border border-dashed border-slate-200/30 dark:border-zinc-800/20' />

				{/* Invite step: show user avatar icons in orbit instead of brand logos */}
				{step === 2 ? (
					<>
						<motion.div
							animate={{
								scale: [1, 1.05, 1],
								boxShadow: [
									'0 0 20px rgba(124,58,237,0.2)',
									'0 0 35px rgba(124,58,237,0.4)',
									'0 0 20px rgba(124,58,237,0.2)',
								],
							}}
							transition={{ repeat: Infinity, duration: 4 }}
							className='relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-full bg-gradient-to-tr from-primary-400 via-fuchsia-500 to-primary-400 p-2 text-primary-950'>
							<UserPlus className='h-9 w-9' />
							<span className='mt-1 text-[10px] font-black tracking-widest uppercase'>
								TEAM
							</span>
							<div className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-emerald-500 text-[8px] font-bold text-white shadow-md'>
								✓
							</div>
						</motion.div>

						<AnimatePresence>
							{['SA', 'MK', 'JR', 'AN'].map((initials, idx) => {
								const colors = ['#4f46e5', '#e85d9e', '#0d9488', '#d97706'];
								const count = 4;
								const angle = (idx / count) * 2 * Math.PI;
								const x = Math.cos(angle) * 104;
								const y = Math.sin(angle) * 104;
								return (
									<motion.div
										key={initials}
										initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
										animate={{ opacity: 1, scale: 1, x, y }}
										exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
										transition={{
											type: 'spring',
											stiffness: 140,
											damping: 15,
											delay: idx * 0.08,
										}}
										className='absolute z-20'>
										<motion.div
											animate={{ y: [0, -5, 0] }}
											transition={{
												repeat: Infinity,
												duration: 3 + idx * 0.5,
												ease: 'easeInOut',
											}}
											className='flex h-11 w-11 items-center justify-center rounded-full border-2 border-white shadow-lg dark:border-zinc-800'
											style={{ backgroundColor: colors[idx] }}>
											<span className='text-xs font-black text-white'>
												{initials}
											</span>
										</motion.div>
									</motion.div>
								);
							})}
						</AnimatePresence>
					</>
				) : (
					<>
						<motion.div
							animate={{
								scale: [1, 1.05, 1],
								boxShadow: [
									'0 0 20px rgba(124,58,237,0.2)',
									'0 0 35px rgba(124,58,237,0.4)',
									'0 0 20px rgba(124,58,237,0.2)',
								],
							}}
							transition={{ repeat: Infinity, duration: 4 }}
							className='relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-full bg-gradient-to-tr from-primary-400 via-fuchsia-500 to-primary-400 p-2 text-primary-950'>
							<Bot className='h-9 w-9' />
							<span className='mt-1 text-[10px] font-black tracking-widest uppercase'>
								CORE
							</span>
							<div className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-emerald-500 text-[8px] font-bold text-white shadow-md'>
								✓
							</div>
						</motion.div>

						<AnimatePresence>
							{currentOrbitIcons.map((brandName, idx) => {
								const count = currentOrbitIcons.length;
								const angle = (idx / count) * 2 * Math.PI;
								const x = Math.cos(angle) * 104;
								const y = Math.sin(angle) * 104;
								return (
									<motion.div
										key={`${brandName}-${idx}`}
										initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
										animate={{ opacity: 1, scale: 1, x, y }}
										exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
										transition={{
											type: 'spring',
											stiffness: 140,
											damping: 15,
											delay: idx * 0.05,
										}}
										className='absolute z-20'>
										<motion.div
											animate={{ y: [0, -5, 0] }}
											transition={{
												repeat: Infinity,
												duration: 3 + idx * 0.5,
												ease: 'easeInOut',
											}}
											className='flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-1 shadow-lg shadow-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none'>
											<BrandLogo name={brandName} className='h-6 w-6' />
										</motion.div>
									</motion.div>
								);
							})}
						</AnimatePresence>
					</>
				)}
			</div>

			<div className='z-10 mt-6 text-center'>
				<h3 className='text-xs font-black tracking-widest text-slate-800 uppercase dark:text-zinc-200'>
					{step === 1 && 'Your Workspace Hub'}
					{step === 2 && 'Bring Your Team'}
					{step === 3 &&
						(selectedRoleIndex !== null
							? `${ROLES[selectedRoleIndex].name} Workspace`
							: 'Choose Your Role')}
					{step === 4 &&
						(selectedPlan === 'free'
							? 'Free Plan Active'
							: `${PLANS.find((p) => p.id === selectedPlan)?.name} Plan Selected`)}
					{step === 5 &&
						`${connectedApps.length} App${connectedApps.length !== 1 ? 's' : ''} Connected`}
					{step === 6 && 'Almost There!'}
				</h3>
				<p className='mx-auto mt-1 max-w-[200px] text-[10px] text-slate-400'>
					{step === 1 &&
						'A central place for your workflows, credentials, and team decisions.'}
					{step === 2 &&
						'Invite teammates to collaborate on workflows and share credentials.'}
					{step === 3 &&
						'Orbiting tools are dynamically tailored based on your selected role.'}
					{step === 4 &&
						'Upgrade any time from your workspace settings — no commitments.'}
					{step === 5 &&
						'Your secure connections are live-linked directly with the cloud nodes.'}
					{step === 6 &&
						'Your workspace is set up. One last question to personalize your experience.'}
				</p>
			</div>
		</div>
	);
};

export default OrbitAnimation;
