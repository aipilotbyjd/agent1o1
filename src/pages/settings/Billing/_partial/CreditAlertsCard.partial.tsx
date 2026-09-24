import { useState } from 'react';
import type { FormEvent } from 'react';
import { BellRing, X } from 'lucide-react';
import { notify } from '@/api/core';
import { useCreditNotifications, useUpdateCreditNotifications } from '@/api/modules/billing';

const cardClass =
	'rounded-2xl border border-zinc-100 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/60';

/**
 * Emails sent when the period's credit usage crosses a percentage, plus one
 * when credits run out. Thresholds are percentages (1-100); the backend
 * sorts and de-duplicates them, and `null` resets to its defaults.
 */
const CreditAlertsCard = ({ ws }: { ws: string }) => {
	const { data: settings, isLoading, isError } = useCreditNotifications(ws);
	const update = useUpdateCreditNotifications(ws);
	const [draft, setDraft] = useState('');

	const thresholds = settings?.thresholds ?? [];
	const isFull = !!settings && thresholds.length >= settings.maximum_thresholds;
	const parsed = Number(draft);
	const isValid =
		draft.trim() !== '' &&
		Number.isInteger(parsed) &&
		parsed >= 1 &&
		parsed <= 100 &&
		!thresholds.includes(parsed);

	const saveThresholds = (next: number[] | null, message: string) =>
		update.mutate({ thresholds: next }, { onSuccess: () => notify.success(message) });

	const handleAdd = (e: FormEvent) => {
		e.preventDefault();
		if (!isValid || isFull) return;
		saveThresholds([...thresholds, parsed], `You'll be emailed at ${parsed}% usage.`);
		setDraft('');
	};

	const toggleOutOfCredits = () => {
		if (!settings) return;
		const enabled = !settings.out_of_credits_enabled;
		update.mutate(
			{ out_of_credits_enabled: enabled },
			{
				onSuccess: () =>
					notify.success(
						enabled
							? 'Out-of-credits email turned on.'
							: 'Out-of-credits email turned off.',
					),
			},
		);
	};

	return (
		<div className={cardClass}>
			<div className='flex items-start gap-3'>
				<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400'>
					<BellRing size={16} />
				</div>
				<div>
					<p className='text-sm font-black text-zinc-950 dark:text-zinc-50'>
						Usage alerts
					</p>
					<p className='mt-0.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
						Email the workspace admins as credits get used up.
					</p>
				</div>
			</div>

			{isLoading ? (
				<div className='mt-5 h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900' />
			) : isError || !settings ? (
				<p className='mt-5 text-xs font-semibold text-zinc-400'>
					Alert settings could not be loaded.
				</p>
			) : (
				<>
					<div className='mt-5 flex items-center justify-between gap-4'>
						<span className='text-xs font-bold text-zinc-600 dark:text-zinc-300'>
							Email when credits run out
						</span>
						<button
							type='button'
							role='switch'
							aria-checked={settings.out_of_credits_enabled}
							aria-label='Email when credits run out'
							disabled={update.isPending}
							onClick={toggleOutOfCredits}
							className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${
								settings.out_of_credits_enabled
									? 'bg-primary-400'
									: 'bg-zinc-200 dark:bg-zinc-700'
							}`}>
							<span
								className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
									settings.out_of_credits_enabled ? 'translate-x-5' : ''
								}`}
							/>
						</button>
					</div>

					<div className='mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800'>
						<div className='flex items-center justify-between gap-2'>
							<span className='text-xs font-bold text-zinc-600 dark:text-zinc-300'>
								Email at usage
							</span>
							{!settings.is_default && (
								<button
									type='button'
									disabled={update.isPending}
									onClick={() =>
										saveThresholds(null, 'Usage alerts reset to the defaults.')
									}
									className='text-primary-600 dark:text-primary-400 text-xs font-bold hover:underline disabled:opacity-60'>
									Reset to defaults
								</button>
							)}
						</div>
						<div className='mt-2.5 flex flex-wrap gap-2'>
							{thresholds.length === 0 && (
								<span className='text-xs font-semibold text-zinc-400'>
									No usage alerts.
								</span>
							)}
							{thresholds.map((value) => (
								<span
									key={value}
									className='inline-flex items-center gap-1 rounded-full bg-sky-50 py-1 pr-1.5 pl-3 text-xs font-bold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'>
									{value}%
									<button
										type='button'
										aria-label={`Remove ${value}% alert`}
										disabled={update.isPending}
										onClick={() =>
											saveThresholds(
												thresholds.filter((t) => t !== value),
												`Removed the ${value}% alert.`,
											)
										}
										className='rounded-full p-0.5 hover:bg-sky-100 disabled:opacity-60 dark:hover:bg-sky-900/40'>
										<X size={12} />
									</button>
								</span>
							))}
						</div>
						<form onSubmit={handleAdd} className='mt-3 flex gap-2'>
							<input
								inputMode='numeric'
								aria-label='New alert percentage'
								value={draft}
								disabled={isFull}
								onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ''))}
								placeholder={
									isFull
										? `Up to ${settings.maximum_thresholds} alerts`
										: 'Add a percentage, e.g. 90'
								}
								className='focus:border-primary-400 focus:ring-primary-200 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 outline-none focus:ring-4 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100'
							/>
							<button
								type='submit'
								disabled={!isValid || isFull || update.isPending}
								className='h-10 shrink-0 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'>
								Add
							</button>
						</form>
					</div>
				</>
			)}
		</div>
	);
};

export default CreditAlertsCard;
