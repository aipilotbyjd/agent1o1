import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { useFormik } from 'formik';
import pages from '@/Routes/pages';
import { ApiError } from '@/api/core';
import { useCreateWorkspace, useSwitchWorkspace } from '@/api/modules/workspaces';
import * as Yup from 'yup';
import {
	ArrowRight,
	Building2,
	MessageSquare,
	Workflow,
	BarChart3,
	HelpCircle,
	Sun,
	Moon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import useDarkMode from '@/hooks/useDarkMode';
import DARK_MODE from '@/constants/darkMode.constant';

interface ICreateWorkspaceFormValues {
	name: string;
	slug: string;
}

const slugify = (value: string) =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

const validationSchema = Yup.object().shape({
	name: Yup.string()
		.required('Workspace name is required')
		.min(2, 'Workspace name must be at least 2 characters'),
	slug: Yup.string()
		.required('Workspace URL is required')
		.matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens'),
});

const CreateWorkspacePage = () => {
	const navigate = useNavigate();
	const createWorkspace = useCreateWorkspace();
	const switchWorkspace = useSwitchWorkspace();
	const { isDarkTheme, setDarkModeStatus } = useDarkMode();

	const formik = useFormik<ICreateWorkspaceFormValues>({
		initialValues: {
			name: '',
			slug: '',
		},
		validationSchema,
		validateOnMount: true,
		onSubmit: async (values, actions) => {
			try {
				const workspace = await createWorkspace.mutateAsync({
					name: values.name,
				});
				await switchWorkspace.mutateAsync(workspace.id);
				navigate(`${pages.onboarding.subPages.inviteTeam.to}?workspaceId=${workspace.id}`);
			} catch (error) {
				if (ApiError.is(error)) {
					const fieldErrors = error.fieldErrors();
					actions.setErrors({
						name: fieldErrors.name,
						slug: fieldErrors.slug,
					});
				}
			}
		},
	});

	const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
		const nextName = event.target.value;
		formik.setFieldValue('name', nextName);
		if (!formik.touched.slug) {
			formik.setFieldValue('slug', slugify(nextName));
		}
	};

	const firstError =
		(formik.touched.name && formik.errors.name) ||
		(formik.touched.slug && formik.errors.slug) ||
		'';

	// Animation Variants
	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.08,
				delayChildren: 0.15,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 25 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				type: 'spring' as const,
				stiffness: 90,
				damping: 14,
			},
		},
	};

	return (
		<main className='dark:to-zinc-950 dark:text-zinc-500 relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-gradient-to-br from-primary-50/80 via-slate-50/90 to-rose-50/80 p-6 text-slate-950 transition-colors duration-300 md:p-12 dark:from-zinc-950 dark:via-zinc-900'>
			{/* Stunning animated SVG mesh gradient backgrounds */}
			<div className='pointer-events-none absolute inset-0 z-0 overflow-hidden'>
				<div className='absolute top-0 right-0 left-0 h-[500px] bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.15),transparent_45%),radial-gradient(circle_at_top_right,rgba(244,63,94,0.15),transparent_45%)]' />
				<div
					className='absolute -top-40 -left-40 h-[600px] w-[600px] animate-pulse rounded-full bg-primary-400/30 blur-[120px] dark:bg-primary-900/15'
					style={{ animationDuration: '8s' }}
				/>
				<div
					className='absolute -right-40 -bottom-40 h-[600px] w-[600px] animate-pulse rounded-full bg-orange-400/30 blur-[120px] dark:bg-amber-900/15'
					style={{ animationDuration: '12s' }}
				/>
				<div
					className='dark:bg-primary-950/10 absolute top-1/2 left-1/3 h-[500px] w-[500px] animate-pulse rounded-full bg-rose-400/20 blur-[100px]'
					style={{ animationDuration: '10s' }}
				/>
			</div>

			{/* Navigation Header */}
			<header className='absolute top-0 right-0 left-0 z-25 w-full px-8 py-6'>
				<div className='mx-auto flex max-w-7xl items-center justify-between'>
					<div className='flex items-center gap-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-400 to-primary-400 text-primary-950 shadow-lg shadow-primary-500/25'>
							<span className='text-base font-extrabold tracking-tighter'>A1</span>
						</div>
						<span className='dark:to-zinc-100 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 bg-clip-text text-xl font-black text-transparent dark:from-white dark:via-zinc-200'>
							Agent1o1
						</span>
					</div>

					{/* Theme Toggle Button */}
					<button
						onClick={() =>
							setDarkModeStatus(isDarkTheme ? DARK_MODE.LIGHT : DARK_MODE.DARK)
						}
						className='flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm backdrop-blur-md transition hover:bg-slate-50 hover:text-slate-700 dark:border-zinc-800 dark:bg-[#11131c] dark:text-zinc-400 dark:hover:bg-zinc-800/60'>
						{isDarkTheme ? <Sun size={15} /> : <Moon size={15} />}
					</button>
				</div>
			</header>

			{/* High-fidelity background glows with organic floating animation paths */}
			<motion.div
				animate={{
					x: [0, 50, -30, 0],
					y: [0, -40, 50, 0],
					scale: [1, 1.15, 0.9, 1],
				}}
				transition={{
					duration: 25,
					repeat: Infinity,
					ease: 'linear',
				}}
				className='pointer-events-none absolute top-[-15%] left-[-15%] -z-10 h-[60%] w-[60%] rounded-full bg-gradient-to-tr from-primary-400/10 to-primary-400/10 blur-[130px]'
			/>
			<motion.div
				animate={{
					x: [0, -40, 40, 0],
					y: [0, 50, -40, 0],
					scale: [1, 0.85, 1.15, 1],
				}}
				transition={{
					duration: 20,
					repeat: Infinity,
					ease: 'linear',
				}}
				className='pointer-events-none absolute right-[-15%] bottom-[-15%] -z-10 h-[60%] w-[60%] rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 blur-[130px]'
			/>
			<motion.div
				animate={{
					x: [0, 30, -40, 0],
					y: [0, 40, -30, 0],
				}}
				transition={{
					duration: 18,
					repeat: Infinity,
					ease: 'linear',
				}}
				className='pointer-events-none absolute top-[30%] right-[5%] -z-10 h-[45%] w-[45%] rounded-full bg-gradient-to-l from-primary-400/8 to-primary-400/8 blur-[110px]'
			/>

			{/* Main Grid Section */}
			<section className='relative z-10 mx-auto mt-16 grid w-full max-w-[1140px] items-center gap-16 lg:mt-0 lg:grid-cols-[1.1fr_0.9fr]'>
				{/* Left Column Description */}
				<motion.div
					variants={containerVariants}
					initial='hidden'
					animate='visible'
					className='space-y-7'>
					<motion.div
						variants={itemVariants}
						className='inline-flex items-center gap-2 self-start rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-black text-slate-500 shadow-md shadow-slate-200/40 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-400 dark:shadow-none'>
						<span className='h-2.5 w-2.5 animate-pulse rounded-full bg-primary-400' />
						Workspace setup
					</motion.div>

					<motion.h1
						variants={itemVariants}
						className='via-primary-950 max-w-3xl bg-gradient-to-r from-slate-900 to-primary-900 bg-clip-text text-5xl leading-[0.95] font-black tracking-tight text-transparent md:text-7xl xl:text-[76px] dark:from-white dark:via-zinc-200 dark:to-zinc-100'>
						Create a workspace for your team and workflows.
					</motion.h1>

					<motion.p
						variants={itemVariants}
						className='max-w-2xl text-base leading-8 font-semibold text-slate-500 md:text-lg dark:text-zinc-400'>
						Name the place where your workflows, prompts, credentials, and team
						decisions will live together.
					</motion.p>

					{/* Workspace Stats row */}
					<motion.div
						variants={itemVariants}
						className='grid max-w-lg grid-cols-3 gap-4 pt-4'>
						{workspaceStats.map((stat) => (
							<motion.div
								key={stat.label}
								whileHover={{ y: -5, scale: 1.02 }}
								transition={{
									type: 'spring' as const,
									stiffness: 200,
									damping: 10,
								}}
								className='group dark:hover:border-zinc-700 cursor-default rounded-3xl border border-white/60 bg-white/60 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] backdrop-blur-md transition-all duration-300 hover:border-white hover:bg-white/85 dark:border-zinc-800/40 dark:bg-zinc-900/60 dark:hover:bg-zinc-900/85'>
								<p className='text-3xl font-black tracking-tight text-slate-900 dark:text-zinc-100'>
									{stat.value}
								</p>
								<p className='dark:text-zinc-500 mt-2 text-[9px] font-black tracking-widest text-slate-400 uppercase'>
									{stat.label}
								</p>
							</motion.div>
						))}
					</motion.div>
				</motion.div>

				{/* Right Column Form Card */}
				<motion.div
					initial={{ opacity: 0, y: 35, scale: 0.98 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ type: 'spring' as const, stiffness: 80, damping: 15, delay: 0.1 }}
					className='relative'>
					{/* Glowing decorative floating dots */}
					<div className='absolute -top-12 -right-10 -z-10 hidden h-32 w-32 rounded-[2.5rem] bg-gradient-to-tr from-primary-400 to-primary-400 opacity-20 blur-2xl lg:block' />
					<div className='absolute -bottom-10 -left-8 -z-10 hidden h-28 w-28 rounded-full bg-emerald-500 opacity-15 blur-2xl lg:block' />

					<div className='relative rounded-[2.5rem] border border-white/50 bg-white/80 p-8 text-slate-950 shadow-[0_25px_60px_rgba(8,_112,_184,_0.05)] backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/80 dark:text-zinc-50 dark:shadow-[0_25px_60px_rgba(0,0,0,0.2)]'>
						{/* Card Header */}
						<div className='mb-8 flex items-center justify-between'>
							<div>
								<p className='text-[10px] font-black tracking-[0.24em] text-slate-400 uppercase dark:text-zinc-500'>
									Step 1 of 2
								</p>
								<h2 className='mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white'>
									Create workspace
								</h2>
							</div>
							<div className='flex h-12 w-12 items-center justify-center rounded-2xl border border-primary-100/35 bg-primary-50 text-primary-600 shadow-sm dark:border-primary-900/30 dark:bg-primary-950/40 dark:text-primary-400'>
								<Building2 className='h-5 w-5' />
							</div>
						</div>

						{/* Form inputs */}
						<form className='space-y-6' onSubmit={formik.handleSubmit}>
							{/* Workspace Name Input block */}
							<div className='space-y-2'>
								<label
									className='block px-1 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-zinc-500'
									htmlFor='name'>
									Workspace name
								</label>
								<div className='group relative flex items-center'>
									<Building2 className='absolute left-4 h-4.5 w-4.5 text-slate-400 transition-colors duration-200 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400' />
									<input
										id='name'
										name='name'
										aria-label='Workspace name'
										autoComplete='organization'
										placeholder='Acme Automation'
										value={formik.values.name}
										onChange={handleNameChange}
										onBlur={formik.handleBlur}
										className='dark:text-zinc-100 dark:placeholder:text-zinc-600 block h-12 w-full rounded-2xl border border-slate-200 bg-white/55 pr-4 pl-12 text-sm font-semibold text-slate-900 shadow-xs transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-primary-500/80 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:border-zinc-800 dark:bg-zinc-950/40 dark:focus:border-primary-500 dark:focus:bg-zinc-950/60 dark:focus:ring-primary-500/15'
									/>
								</div>
							</div>

							{/* Workspace URL input block */}
							<div className='space-y-2'>
								<label
									className='dark:text-zinc-500 block px-1 text-[10px] font-black tracking-widest text-slate-400 uppercase'
									htmlFor='slug'>
									Workspace URL
								</label>
								<div className='flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-white/55 shadow-xs transition-all duration-200 focus-within:border-primary-500/80 focus-within:bg-white focus-within:ring-4 focus-within:ring-primary-500/10 dark:border-zinc-800 dark:bg-zinc-950/40 focus-within:dark:border-primary-500/80 focus-within:dark:bg-zinc-950/60 focus-within:dark:ring-primary-500/15'>
									<span className='border-slate-100 flex h-full items-center border-r bg-slate-50/50 px-4 text-xs font-black text-slate-400 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-500'>
										agent1o1.app/
									</span>
									<input
										id='slug'
										name='slug'
										aria-label='Workspace URL'
										placeholder='acme'
										value={formik.values.slug}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										className='dark:placeholder:text-zinc-600 min-w-0 flex-1 border-none bg-transparent px-4 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-zinc-100'
									/>
								</div>
							</div>

							{firstError && (
								<motion.div
									initial={{ opacity: 0, y: -5 }}
									animate={{ opacity: 1, y: 0 }}
									className='flex items-center gap-1.5 px-1 text-[11px] font-bold text-rose-500'>
									<HelpCircle size={13} className='shrink-0' />
									<span>{firstError}</span>
								</motion.div>
							)}

							{/* Submit Button */}
							<motion.button
								whileHover={{ scale: 1.01 }}
								whileTap={{ scale: 0.99 }}
								type='submit'
								disabled={!formik.isValid || createWorkspace.isPending}
								className='group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-400 to-primary-400 text-sm font-black text-primary-950 shadow-lg shadow-primary-500/10 transition-all duration-250 hover:shadow-xl hover:shadow-primary-500/20 disabled:pointer-events-none disabled:opacity-50'>
								{createWorkspace.isPending ? (
									<div className='flex items-center gap-2'>
										<svg
											className='h-5 w-5 animate-spin text-white'
											xmlns='http://www.w3.org/2000/svg'
											fill='none'
											viewBox='0 0 24 24'>
											<circle
												className='opacity-25'
												cx='12'
												cy='12'
												r='10'
												stroke='currentColor'
												strokeWidth='4'
											/>
											<path
												className='opacity-75'
												fill='currentColor'
												d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
											/>
										</svg>
										<span>Creating Workspace...</span>
									</div>
								) : (
									<div className='flex items-center gap-1.5'>
										<span>Continue</span>
										<ArrowRight className='h-4 w-4 transition-transform duration-200 group-hover:translate-x-1' />
									</div>
								)}
							</motion.button>
						</form>

						{/* Pre-configured Modules cards */}
						<div className='border-slate-100/45 mt-8 border-t pt-6 dark:border-zinc-800/40'>
							<p className='dark:text-zinc-500 mb-4 text-center text-[9px] font-black tracking-widest text-slate-400 uppercase'>
								Pre-configured agent components included
							</p>
							<div className='grid grid-cols-3 gap-3'>
								{workflowCards.map((card) => {
									let IconComponent = MessageSquare;
									if (card.label === 'Ops') IconComponent = Workflow;
									if (card.label === 'Sales') IconComponent = BarChart3;

									return (
										<motion.div
											key={card.label}
											whileHover={{ y: -4, scale: 1.02 }}
											className='group/item dark:hover:bg-zinc-800 dark:hover:border-zinc-700 flex cursor-pointer flex-col items-center rounded-2xl border border-slate-200/50 bg-white/60 p-3.5 text-center shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all duration-200 hover:bg-white hover:shadow-md dark:border-zinc-800/40 dark:bg-zinc-900/60'>
											<div
												className='mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl text-white transition-all duration-300'
												style={{ backgroundColor: card.color }}>
												<IconComponent className='h-4.5 w-4.5 transition-transform duration-200 group-hover/item:scale-110 group-hover/item:rotate-[5deg]' />
											</div>
											<p className='text-[11px] font-black text-slate-800 dark:text-zinc-200'>
												{card.label}
											</p>
										</motion.div>
									);
								})}
							</div>
						</div>
					</div>
				</motion.div>
			</section>
		</main>
	);
};

const workspaceStats = [
	{ value: '01', label: 'Shared hub' },
	{ value: '∞', label: 'Workflows' },
	{ value: '2m', label: 'Setup' },
];

const workflowCards = [
	{ label: 'Support', icon: 'BubbleChat', color: '#4f46e5' },
	{ label: 'Ops', icon: 'WorkflowCircle03', color: '#111827' },
	{ label: 'Sales', icon: 'ChartUp', color: '#e85d9e' },
];

export default CreateWorkspacePage;
