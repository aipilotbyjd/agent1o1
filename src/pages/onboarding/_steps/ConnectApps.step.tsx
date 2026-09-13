import { FC } from 'react';
import { useConnectors } from '@/api/modules/connectors';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import StepFooter from '../_parts/StepFooter.part';
import { TOnboardingStepProps } from '../onboarding.types';

// The onboarding snapshot ships `meta.credential_types` as an empty
// array today, so this step previews the real connector catalog
// (`GET /connectors`) instead. Connecting an account needs a
// credential form per connector, which lives in Connectors, not here.
const ConnectAppsStep: FC<TOnboardingStepProps> = ({ onNext, onBack }) => {
	const { data: connectors, isLoading } = useConnectors();

	const available = (connectors ?? []).filter((connector) => connector.is_active).slice(0, 12);

	return (
		<div>
			<h2 className='text-xl font-bold text-zinc-800 dark:text-white'>Connect your apps</h2>
			<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
				Agents work with the tools you already use. Here's what's in the catalog — you can
				connect accounts from Connectors once you're in.
			</p>

			<div className='mt-6'>
				{isLoading && (
					<div className='grid gap-2 sm:grid-cols-2'>
						{[0, 1, 2, 3].map((key) => (
							<Skeleton key={key} className='h-14 w-full rounded-xl' />
						))}
					</div>
				)}

				{!isLoading && available.length > 0 && (
					<div className='grid gap-2 sm:grid-cols-2'>
						{available.map((connector) => (
							<div
								key={connector.id}
								className='flex items-center gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800'>
								<div className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-500/10 text-xs font-bold uppercase'>
									{connector.name.slice(0, 2)}
								</div>
								<div className='min-w-0'>
									<div className='truncate text-sm font-medium text-zinc-800 dark:text-white'>
										{connector.name}
									</div>
									{connector.is_oauth && (
										<Badge color='blue' variant='soft' className='mt-0.5'>
											OAuth
										</Badge>
									)}
								</div>
							</div>
						))}
					</div>
				)}

				{!isLoading && available.length === 0 && (
					<p className='rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700'>
						No connectors are published yet. You can add them later from your
						workspace's Connectors page.
					</p>
				)}
			</div>

			<StepFooter onBack={onBack} submitLabel='Continue' onSubmit={onNext} />
		</div>
	);
};

export default ConnectAppsStep;
