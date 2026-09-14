import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { CheckCircle, ArrowRight, Zap, LayoutGrid, CreditCard } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import pages from '@/Routes/pages';

const NEXT_STEPS = [
	{
		icon: LayoutGrid,
		title: 'Build your first workflow',
		desc: 'Automate any process with our drag-and-drop builder.',
		to: pages.app.subPages.workflows.to,
		cta: 'Open builder',
	},
	{
		icon: Zap,
		title: 'View your plan & limits',
		desc: "See everything that's now unlocked on your new plan.",
		to: pages.settings.subPages.plan.to,
		cta: 'View plan',
	},
	{
		icon: CreditCard,
		title: 'Check your credits',
		desc: 'Track your credit balance and usage in real time.',
		to: pages.settings.subPages.usage.to,
		cta: 'View usage',
	},
];

const TYPE_COPY: Record<string, { headline: string; sub: string }> = {
	plan: {
		headline: 'Your plan is now active!',
		sub: "All features and credits have been applied to your workspace. You're ready to build.",
	},
	credits: {
		headline: 'Credits added to your workspace!',
		sub: 'Your credit pack has been applied. You can start running workflows right away.',
	},
};

const BillingSuccessPage = () => {
	const [searchParams] = useSearchParams();
	const queryClient = useQueryClient();
	const type = searchParams.get('type') ?? 'plan';
	const copy = TYPE_COPY[type] ?? TYPE_COPY.plan;

	// Invalidate subscription + balance so they're fresh when the user navigates away
	useEffect(() => {
		queryClient.invalidateQueries({ queryKey: ['plans'] });
		queryClient.invalidateQueries({ queryKey: ['credits'] });
	}, [queryClient]);

	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950'>
			{/* Card */}
			<div className='w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-10 shadow-xl dark:border-zinc-700 dark:bg-zinc-900'>
				{/* Icon */}
				<div className='mb-6 flex justify-center'>
					<div className='flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950'>
						<CheckCircle size={44} className='text-emerald-500' strokeWidth={1.5} />
					</div>
				</div>

				{/* Heading */}
				<h1 className='text-center text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
					{copy.headline}
				</h1>
				<p className='mt-3 text-center text-base text-zinc-500 dark:text-zinc-400'>
					{copy.sub}
				</p>

				{/* Divider */}
				<div className='my-8 border-t border-zinc-100 dark:border-zinc-800' />

				{/* Next steps */}
				<p className='mb-4 text-xs font-bold tracking-widest text-zinc-400 uppercase'>
					What's next
				</p>
				<div className='space-y-3'>
					{NEXT_STEPS.map(({ icon: Icon, title, desc, to, cta }) => (
						<Link
							key={to}
							to={to}
							className='flex items-center gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 transition hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800'>
							<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-zinc-900'>
								<Icon size={18} className='text-zinc-600 dark:text-zinc-400' />
							</div>
							<div className='min-w-0 flex-1'>
								<p className='text-sm font-bold text-zinc-900 dark:text-zinc-100'>
									{title}
								</p>
								<p className='text-xs text-zinc-500 dark:text-zinc-400'>{desc}</p>
							</div>
							<span className='flex shrink-0 items-center gap-1 text-xs font-bold text-zinc-400'>
								{cta} <ArrowRight size={12} />
							</span>
						</Link>
					))}
				</div>

				{/* Primary CTA */}
				<Link
					to={pages.app.subPages.workflows.to}
					className='mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 text-sm font-black text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200'>
					Go to dashboard
					<ArrowRight size={16} />
				</Link>
			</div>

			{/* Footer note */}
			<p className='mt-6 text-center text-xs text-zinc-400'>
				Receipt sent to your email.{' '}
				<Link
					to={pages.settings.subPages.billing.to}
					className='underline hover:text-zinc-600'>
					View billing
				</Link>
			</p>
		</div>
	);
};

export default BillingSuccessPage;
