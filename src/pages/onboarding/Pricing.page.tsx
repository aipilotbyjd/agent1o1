import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import pages from '@/Routes/pages';
import Icon from '@/components/icon/Icon';

const creditMarks = [
	{ label: '10k', value: 10000 },
	{ label: '50k', value: 50000 },
	{ label: '100k', value: 100000 },
	{ label: '250k', value: 250000 },
	{ label: '500k', value: 500000 },
	{ label: '1M', value: 1000000 },
	{ label: '2M', value: 2000000 },
];

const PricingPage = () => {
	const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
	const [creditIndex, setCreditIndex] = useState(2);
	const credits = creditMarks[creditIndex];
	const annual = billingCycle === 'annual';

	const price = useMemo(() => {
		const monthlyBase = [0, 19, 37, 79, 149, 249, 399][creditIndex] ?? 37;
		return annual ? Math.round(monthlyBase * 0.8) : monthlyBase;
	}, [annual, creditIndex]);

	return (
		<main className='min-h-screen overflow-hidden bg-white text-slate-950'>
			<div className='absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(circle_at_18%_16%,rgba(79,70,229,0.12),transparent_30%),radial-gradient(circle_at_82%_10%,rgba(232,93,158,0.13),transparent_30%),linear-gradient(180deg,#fff,#fbfbfd)]' />
			<PricingNav />

			<section className='relative mx-auto max-w-[1220px] px-6 pt-12 pb-24'>
				<div className='mx-auto mb-10 flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-500 shadow-lg shadow-slate-200/70'>
					<span className='h-2 w-2 rounded-full bg-[#e85d9e]' />
					Credits that scale with your agents
				</div>

				<div className='mx-auto max-w-4xl text-center'>
					<h1 className='text-slate-950 text-6xl leading-[0.95] font-semibold tracking-normal md:text-7xl xl:text-8xl'>
						Pricing built around momentum.
					</h1>
					<p className='mx-auto mt-7 max-w-2xl text-xl leading-8 font-medium text-slate-600'>
						Start lean, add credits when agents get busy, and keep every workspace on a
						predictable plan.
					</p>
				</div>

				<div className='mt-16 flex justify-center'>
					<div className='grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-100 p-1 shadow-sm'>
						<button
							type='button'
							onClick={() => setBillingCycle('monthly')}
							className={`rounded-xl px-5 py-3 text-sm font-black transition ${
								billingCycle === 'monthly'
									? 'text-slate-950 bg-white shadow-sm'
									: 'hover:text-slate-950 text-slate-500'
							}`}>
							Monthly
						</button>
						<button
							type='button'
							onClick={() => setBillingCycle('annual')}
							className={`rounded-xl px-5 py-3 text-sm font-black transition ${
								billingCycle === 'annual'
									? 'text-slate-950 bg-white shadow-sm'
									: 'hover:text-slate-950 text-slate-500'
							}`}>
							Annually{' '}
							<span className='ml-2 rounded-lg bg-[#e85d9e] px-2 py-1 text-white'>
								20%
							</span>
						</button>
					</div>
				</div>

				<div className='mx-auto mt-20 max-w-5xl'>
					<div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
						<div>
							<p className='text-sm font-black tracking-[0.18em] text-slate-400 uppercase'>
								Monthly usage
							</p>
							<h2 className='text-slate-950 mt-3 text-4xl font-semibold tracking-normal'>
								How many credits do you need?
							</h2>
						</div>
						<div className='rounded-3xl border border-slate-200 bg-white px-6 py-4 text-right shadow-lg shadow-slate-200/70'>
							<p className='text-slate-950 text-3xl font-black'>{credits.label}</p>
							<p className='text-xs font-bold text-slate-500'>credits / month</p>
						</div>
					</div>

					<input
						aria-label='Monthly credits'
						type='range'
						min={0}
						max={creditMarks.length - 1}
						step={1}
						value={creditIndex}
						onChange={(event) => setCreditIndex(Number(event.target.value))}
						className='accent-primary-600 h-2 w-full cursor-pointer rounded-full'
					/>
					<div className='mt-5 grid grid-cols-7 text-center text-sm font-black text-slate-500'>
						{creditMarks.map((mark) => (
							<span key={mark.label}>{mark.label}</span>
						))}
					</div>
				</div>

				<div className='mt-20 grid gap-5 lg:grid-cols-3'>
					<PricingCard
						name='Free'
						description='Explore agents before you scale.'
						price={0}
						billingCycle={billingCycle}
						color='#f59e0b'
						features={[
							'10k credits included',
							'2 workflows',
							'Community templates',
							'Basic run history',
						]}
						cta='Start free'
						to={pages.onboarding.subPages.createWorkspace.to}
					/>
					<PricingCard
						name='Pro'
						description='For teams shipping real workflows.'
						price={price}
						billingCycle={billingCycle}
						color='#e85d9e'
						highlight
						features={[
							`${credits.label} credits included`,
							'Unlimited workflows',
							'Team invites and roles',
							'Priority automation runs',
						]}
						cta='Choose Pro'
						to={pages.onboarding.subPages.createWorkspace.to}
					/>
					<PricingCard
						name='Scale'
						description='Controls, support, and volume for bigger teams.'
						price={null}
						billingCycle={billingCycle}
						color='#4f46e5'
						features={[
							'Custom credit pools',
							'SSO and audit logs',
							'Dedicated support',
							'Workspace governance',
						]}
						cta='Talk to sales'
						to={pages.onboarding.subPages.inviteTeam.to}
					/>
				</div>

				<div className='mt-8 grid gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-4 md:grid-cols-3'>
					{includedItems.map((item) => (
						<div key={item.title} className='rounded-3xl bg-white p-5 shadow-sm'>
							<div className='mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white'>
								<Icon icon={item.icon} className='h-5 w-5' />
							</div>
							<p className='text-slate-950 text-base font-black'>{item.title}</p>
							<p className='mt-2 text-sm leading-6 font-medium text-slate-500'>
								{item.description}
							</p>
						</div>
					))}
				</div>
			</section>
		</main>
	);
};

const PricingNav = () => (
	<header className='relative z-20 px-5 pt-6'>
		<nav className='mx-auto flex max-w-[1220px] items-center justify-between rounded-[28px] border border-white bg-white/85 px-4 py-3 shadow-xl shadow-slate-200/70 backdrop-blur'>
			<Link to='/' className='flex items-center gap-3'>
				<span className='bg-slate-950 flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black text-white'>
					A1
				</span>
				<span className='text-slate-950 text-xl font-black'>Agent1o1</span>
			</Link>
			<div className='hidden items-center gap-7 text-sm font-bold text-slate-500 md:flex'>
				<span>Solutions</span>
				<span>Agents</span>
				<span>Teams</span>
				<span className='text-slate-950'>Pricing</span>
			</div>
			<div className='flex items-center gap-3'>
				<Link
					to={pages.onboarding.subPages.inviteTeam.to}
					className='hover:text-slate-950 hidden text-sm font-bold text-slate-500 transition sm:block'>
					Talk to sales
				</Link>
				<Link
					to={pages.editor.subPages.addWorkflow.to}
					className='bg-slate-950 rounded-2xl px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800'>
					Go to app
				</Link>
			</div>
		</nav>
	</header>
);

const PricingCard = ({
	name,
	description,
	price,
	billingCycle,
	color,
	features,
	cta,
	to,
	highlight = false,
}: {
	name: string;
	description: string;
	price: number | null;
	billingCycle: 'monthly' | 'annual';
	color: string;
	features: string[];
	cta: string;
	to: string;
	highlight?: boolean;
}) => (
	<div
		className={`relative rounded-[2rem] border bg-white p-7 shadow-xl shadow-slate-200/70 ${
			highlight ? 'border-[#e85d9e]' : 'border-slate-200'
		}`}>
		{highlight && (
			<div className='bg-slate-950 absolute -top-4 right-7 rounded-full px-4 py-2 text-xs font-black text-white'>
				Most popular
			</div>
		)}
		<div className='mb-6 h-10 w-10 rounded-2xl' style={{ backgroundColor: color }} />
		<h3 className='text-slate-950 text-3xl font-black'>{name}</h3>
		<p className='mt-3 min-h-12 text-base leading-7 font-medium text-slate-500'>
			{description}
		</p>

		<div className='mt-8 flex items-end gap-2'>
			{price === null ? (
				<p className='text-slate-950 text-4xl font-black'>Custom</p>
			) : (
				<>
					<p className='text-slate-950 text-5xl font-black'>${price}</p>
					<p className='pb-2 text-sm font-bold text-slate-500'>
						/user/{billingCycle === 'annual' ? 'mo, billed yearly' : 'mo'}
					</p>
				</>
			)}
		</div>

		<Link
			to={to}
			className={`mt-8 flex min-h-13 items-center justify-center rounded-2xl px-5 text-sm font-black transition ${
				highlight
					? 'bg-slate-950 text-white hover:bg-slate-800'
					: 'text-slate-950 hover:bg-slate-50 border border-slate-200'
			}`}>
			{cta}
		</Link>

		<ul className='mt-8 space-y-4'>
			{features.map((feature) => (
				<li
					key={feature}
					className='flex items-center gap-3 text-sm font-bold text-slate-600'>
					<Icon icon='CheckmarkCircle01' className='text-primary-600 h-5 w-5' />
					{feature}
				</li>
			))}
		</ul>
	</div>
);

const includedItems = [
	{
		title: 'Usage visibility',
		description: 'Track where credits go across workflows, agents, and teammates.',
		icon: 'ChartUp',
	},
	{
		title: 'Team-ready roles',
		description: 'Invite builders, operators, and reviewers without sharing one login.',
		icon: 'UserMultiple',
	},
	{
		title: 'Upgrade anytime',
		description: 'Move from free experiments to production scale without migration work.',
		icon: 'ArrowUpRight01',
	},
];

export default PricingPage;
