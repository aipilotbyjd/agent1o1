import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useDashboardOverview } from '@/api/modules/dashboard';
import { useOnboardingState, useSubmitOnboardingDiscovery } from '@/api/modules/onboarding';
import { useAuth } from '@/context/auth';
import safeStorage from '@/utils/safeStorage.util';

const dismissedKey = (userId: string) => `discovery-question-dismissed:${userId}`;

/**
 * "How did you find us", asked once the workspace has had its first
 * successful run, so it never stands between a new user and that. One tap
 * answers it; closing it hides it on this browser.
 */
const DiscoveryQuestionCard = ({ ws }: { ws: string }) => {
	const { userData } = useAuth();
	const userId = String(userData?.id ?? '');
	// Same queries (and keys) the dashboard and onboarding already read.
	const { data: overview } = useDashboardOverview(ws, { days: 7 });
	const { data: onboarding } = useOnboardingState();
	const submit = useSubmitOnboardingDiscovery();
	const [isDismissed, setIsDismissed] = useState(
		() => !!userId && safeStorage.get(dismissedKey(userId)) !== null,
	);

	const hasFirstSuccess =
		overview?.getting_started?.milestones.find((item) => item.key === 'run_workflow')
			?.completed === true;
	const sources = onboarding?.meta.discovery_sources ?? [];
	const isVisible =
		hasFirstSuccess &&
		onboarding?.discovery_answered === false &&
		sources.length > 0 &&
		!isDismissed;

	const dismiss = () => {
		if (userId) safeStorage.set(dismissedKey(userId), '1');
		setIsDismissed(true);
	};

	const answer = (source: string) => {
		if (submit.isPending) return;
		// The saved answer flips `discovery_answered`, which hides the card.
		submit.mutate({ discovery_source: source });
	};

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -10, height: 0 }}
					transition={{ duration: 0.3 }}
					className='border-border-main bg-bg-card overflow-hidden rounded-3xl border p-5 shadow-sm'>
					<div className='flex items-start justify-between gap-4'>
						<div>
							<p className='text-primary-600 dark:text-primary-400 flex items-center gap-1.5 text-[10px] font-black tracking-[0.18em] uppercase'>
								<Check className='h-3 w-3' />
								Your first run worked
							</p>
							<h2 className='mt-1 text-sm font-black text-slate-950 dark:text-white'>
								Quick one: how did you find us?
							</h2>
						</div>
						<button
							type='button'
							aria-label='Dismiss'
							onClick={dismiss}
							className='rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'>
							<X className='h-3.5 w-3.5' />
						</button>
					</div>
					<div className='mt-3 flex flex-wrap gap-2'>
						{sources.map((source) => (
							<button
								key={source.value}
								type='button'
								onClick={() => answer(source.value)}
								disabled={submit.isPending}
								className='border-border-main hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-full border px-3 py-1.5 text-[11px] font-bold text-slate-600 transition disabled:opacity-60 dark:text-zinc-300'>
								{source.label}
							</button>
						))}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default DiscoveryQuestionCard;
