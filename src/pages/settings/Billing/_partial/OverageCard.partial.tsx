import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { notify } from '@/api/core';
import { useCreditOverage, useUpdateCreditOverage } from '@/api/modules/billing';
import type { TCreditOverage } from '@/types/billing.type';

const cardClass =
	'rounded-2xl border border-zinc-100 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/60';

const usd = (value: number) =>
	value.toLocaleString(undefined, {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 2,
	});

/** The limit editor, keyed by the saved value so it re-seeds after a save. */
const LimitForm = ({ ws, overage }: { ws: string; overage: TCreditOverage }) => {
	const update = useUpdateCreditOverage(ws);
	const [draft, setDraft] = useState(overage.limit === null ? '' : String(overage.limit));

	const parsed = draft.trim() === '' ? null : Number(draft);
	const isInvalid =
		parsed !== null &&
		(!Number.isInteger(parsed) ||
			parsed < 0 ||
			(overage.maximum_limit !== null && parsed > overage.maximum_limit));
	const isDirty = parsed !== overage.limit;

	const save = () =>
		update.mutate(
			{ enabled: overage.enabled, limit: parsed },
			{ onSuccess: () => notify.success('Overage limit saved.') },
		);

	return (
		<div className='mt-5 grid gap-3 border-t border-zinc-100 pt-5 sm:grid-cols-[1fr_auto] sm:items-end dark:border-zinc-800'>
			<div>
				<label
					htmlFor='overage-limit'
					className='mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-300'>
					Monthly overage cap (credits)
				</label>
				<input
					id='overage-limit'
					aria-label='Monthly overage cap (credits)'
					inputMode='numeric'
					value={draft}
					onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ''))}
					placeholder={
						overage.effective_limit !== null
							? `Default: ${overage.effective_limit.toLocaleString()}`
							: 'No cap'
					}
					className='focus:border-primary-400 focus:ring-primary-200 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 outline-none focus:ring-4 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-primary-500/20'
				/>
				<p
					className={`mt-1.5 text-xs font-semibold ${isInvalid ? 'text-red-500' : 'text-zinc-400'}`}>
					{isInvalid
						? `Enter a whole number${overage.maximum_limit !== null ? ` up to ${overage.maximum_limit.toLocaleString()}` : ''}.`
						: parsed !== null
							? `About ${usd(parsed * overage.credit_value_usd)} at most per period.`
							: 'Leave empty to use the plan default.'}
				</p>
			</div>
			<button
				type='button'
				disabled={!isDirty || isInvalid || update.isPending}
				onClick={save}
				className='bg-primary-400 text-primary-950 hover:bg-primary-500 h-11 rounded-xl px-5 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60'>
				{update.isPending ? 'Saving…' : 'Save cap'}
			</button>
		</div>
	);
};

/**
 * Overage lets runs keep going on paid credits once the period's allowance is
 * spent, up to a cap. The backend decides whether the plan allows it at all.
 */
const OverageCard = ({ ws }: { ws: string }) => {
	const { data: overage, isLoading, isError } = useCreditOverage(ws);
	const update = useUpdateCreditOverage(ws);

	const toggle = () => {
		if (!overage) return;
		const enabled = !overage.enabled;
		update.mutate(
			{ enabled, limit: overage.limit },
			{
				onSuccess: () =>
					notify.success(enabled ? 'Overage turned on.' : 'Overage turned off.'),
			},
		);
	};

	return (
		<div className={cardClass}>
			<div className='flex items-start justify-between gap-4'>
				<div className='flex items-start gap-3'>
					<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'>
						<ShieldAlert size={16} />
					</div>
					<div>
						<p className='text-sm font-black text-zinc-950 dark:text-zinc-50'>
							Overage protection
						</p>
						<p className='mt-0.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
							Keep runs going after your credits run out, billed per credit up to a
							cap.
						</p>
					</div>
				</div>
				{overage?.available && (
					<button
						type='button'
						role='switch'
						aria-checked={overage.enabled}
						aria-label='Overage protection'
						disabled={update.isPending}
						onClick={toggle}
						className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${
							overage.enabled ? 'bg-primary-400' : 'bg-zinc-200 dark:bg-zinc-700'
						}`}>
						<span
							className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
								overage.enabled ? 'translate-x-5' : ''
							}`}
						/>
					</button>
				)}
			</div>

			{isLoading ? (
				<div className='mt-5 h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900' />
			) : isError || !overage ? (
				<p className='mt-5 text-xs font-semibold text-zinc-400'>
					Overage settings could not be loaded.
				</p>
			) : !overage.available ? (
				<p className='mt-5 rounded-xl bg-zinc-50 px-4 py-3 text-xs font-semibold text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400'>
					Overage is not available on your current plan. Upgrade to keep runs going when
					credits run out.
				</p>
			) : (
				<>
					<div className='mt-5 flex flex-wrap gap-6 text-xs font-semibold text-zinc-500 dark:text-zinc-400'>
						<span>
							Used this period:{' '}
							<span className='font-black text-zinc-900 dark:text-zinc-100'>
								{overage.credits_used.toLocaleString()}
							</span>
						</span>
						<span>
							Cap:{' '}
							<span className='font-black text-zinc-900 dark:text-zinc-100'>
								{overage.effective_limit === null
									? 'None'
									: overage.effective_limit.toLocaleString()}
							</span>
						</span>
						{overage.credits_remaining !== null && (
							<span>
								Left:{' '}
								<span className='font-black text-zinc-900 dark:text-zinc-100'>
									{overage.credits_remaining.toLocaleString()}
								</span>
							</span>
						)}
					</div>
					{overage.enabled && (
						<LimitForm key={String(overage.limit)} ws={ws} overage={overage} />
					)}
				</>
			)}
		</div>
	);
};

export default OverageCard;
