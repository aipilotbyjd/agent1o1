import { Link, useSearchParams } from 'react-router';
import { XCircle, ArrowRight, RotateCcw, HelpCircle } from 'lucide-react';
import pages from '@/Routes/pages';

const TYPE_BACK: Record<string, string> = {
	plan: pages.settings.subPages.plan.subPages.upgrade.to,
	credits: pages.settings.subPages.billing.subPages.credits.to,
};

const REASSURANCES = [
	'No charge was made — you can safely close this page.',
	'Your current plan and credits are unchanged.',
	'You can upgrade or buy credits any time from Settings.',
];

const BillingCancelPage = () => {
	const [searchParams] = useSearchParams();
	const type = searchParams.get('type') ?? 'plan';
	const backTo = TYPE_BACK[type] ?? pages.settings.subPages.billing.to;
	const backLabel = type === 'credits' ? 'Back to Buy Credits' : 'Back to Plans';

	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950'>
			{/* Card */}
			<div className='w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-10 shadow-xl dark:border-zinc-700 dark:bg-zinc-900'>
				{/* Icon */}
				<div className='mb-6 flex justify-center'>
					<div className='flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800'>
						<XCircle
							size={44}
							className='text-zinc-400 dark:text-zinc-500'
							strokeWidth={1.5}
						/>
					</div>
				</div>

				{/* Heading */}
				<h1 className='text-center text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
					Payment cancelled
				</h1>
				<p className='mt-3 text-center text-base text-zinc-500 dark:text-zinc-400'>
					No worries — nothing was charged. Your account is exactly as you left it.
				</p>

				{/* Divider */}
				<div className='my-8 border-t border-zinc-100 dark:border-zinc-800' />

				{/* Reassurances */}
				<div className='space-y-3'>
					{REASSURANCES.map((text) => (
						<div key={text} className='flex items-start gap-3'>
							<div className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800'>
								<span className='text-[10px] font-black text-zinc-500'>✓</span>
							</div>
							<p className='text-sm text-zinc-600 dark:text-zinc-400'>{text}</p>
						</div>
					))}
				</div>

				{/* CTAs */}
				<div className='mt-8 flex flex-col gap-3'>
					<Link
						to={backTo}
						className='flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 text-sm font-black text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200'>
						<RotateCcw size={15} />
						{backLabel}
					</Link>
					<Link
						to={pages.app.subPages.workflows.to}
						className='flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'>
						Back to dashboard
						<ArrowRight size={15} />
					</Link>
				</div>
			</div>

			{/* Help note */}
			<p className='mt-6 flex items-center gap-1.5 text-center text-xs text-zinc-400'>
				<HelpCircle size={13} />
				Questions?{' '}
				<a href='mailto:support@agent1o1.com' className='underline hover:text-zinc-600'>
					Contact support
				</a>
			</p>
		</div>
	);
};

export default BillingCancelPage;
