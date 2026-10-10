import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import {
	useAiKeyPolicy,
	usePreviewAiKeyPolicy,
	useUpdateAiKeyPolicy,
} from '@/api/modules/ai-providers';
import type {
	TAiKeyPolicyImpact,
	TPlatformKeyUsage,
	TUpdateAiKeyPolicyDto,
} from '@/types/ai-provider.type';
import Checkbox from '@/components/form/Checkbox';
import Spinner from '@/components/ui/Spinner';
import { hasImpact, isStricter } from '../_helper/policyImpact.helper';
import PolicyImpactModal from './PolicyImpactModal.partial';

const usageOptions: { value: TPlatformKeyUsage; label: string; description: string }[] = [
	{
		value: 'fallback',
		label: 'As a backup',
		description:
			'Your keys first. If one is busy or out of quota, our key takes over and uses credits.',
	},
	{
		value: 'when_no_key',
		label: 'Only when you have no key',
		description: 'Models your keys cover never use our key. Other models still run on credits.',
	},
	{
		value: 'never',
		label: 'Never',
		description: "Only your own keys. Models your keys don't cover can't be used.",
	},
];

const KeyPolicyCard = ({ ws }: { ws: string }) => {
	const { data: policy, isLoading } = useAiKeyPolicy(ws);
	const updatePolicy = useUpdateAiKeyPolicy(ws);
	const previewPolicy = usePreviewAiKeyPolicy(ws);
	const [pending, setPending] = useState<{
		change: TUpdateAiKeyPolicyDto;
		impact: TAiKeyPolicyImpact;
	} | null>(null);

	if (isLoading || !policy) {
		return (
			<div className='flex items-center justify-center rounded-2xl border border-zinc-100 bg-white py-10 dark:border-zinc-800 dark:bg-zinc-950/40'>
				<Spinner color='primary' className='size-6' />
			</div>
		);
	}

	const canEdit = policy.can_manage && !updatePolicy.isPending && !previewPolicy.isPending;

	const requestChange = async (change: TUpdateAiKeyPolicyDto) => {
		if (!isStricter(policy, change)) {
			updatePolicy.mutate(change);
			return;
		}
		try {
			const impact = await previewPolicy.mutateAsync(change);
			if (hasImpact(impact)) setPending({ change, impact });
			else updatePolicy.mutate(change);
		} catch {
			// Toast is handled by the API hook.
		}
	};

	const confirmPending = async () => {
		if (!pending) return;
		try {
			await updatePolicy.mutateAsync(pending.change);
			setPending(null);
		} catch {
			// Toast is handled by the API hook.
		}
	};

	return (
		<section className='rounded-2xl border border-zinc-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/40'>
			<div className='flex items-start justify-between gap-3'>
				<div className='flex items-start gap-3'>
					<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
						<ShieldCheck size={17} />
					</div>
					<div>
						<h2 className='text-base font-black text-zinc-900 dark:text-zinc-100'>
							Workspace key policy
						</h2>
						<p className='mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400'>
							{policy.can_manage
								? 'Decide when our key may be used and who can add keys.'
								: 'Set by your workspace admins.'}
						</p>
					</div>
				</div>
				{(updatePolicy.isPending || previewPolicy.isPending) && (
					<Spinner color='primary' className='size-4' />
				)}
			</div>

			<p className='mt-5 text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
				Use our key (credits)
			</p>
			<div
				role='radiogroup'
				aria-label='Use our key'
				className='mt-2 grid gap-2 sm:grid-cols-3'>
				{usageOptions.map((option) => {
					const selected = policy.platform_usage === option.value;
					return (
						<button
							key={option.value}
							type='button'
							role='radio'
							aria-checked={selected}
							aria-label={option.label}
							disabled={!canEdit}
							onClick={() =>
								!selected && requestChange({ platform_usage: option.value })
							}
							className={`rounded-xl border p-3 text-left transition disabled:cursor-default ${
								selected
									? 'border-primary-400 bg-primary-50/60 dark:border-primary-500/60 dark:bg-primary-950/20'
									: 'border-zinc-200 bg-white enabled:hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:enabled:hover:border-zinc-600'
							} ${!policy.can_manage && !selected ? 'opacity-50' : ''}`}>
							<p className='text-sm font-bold text-zinc-900 dark:text-zinc-100'>
								{option.label}
							</p>
							<p className='mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400'>
								{option.description}
							</p>
						</button>
					);
				})}
			</div>
			{policy.platform_usage === 'never' && (
				<p className='mt-2 text-xs font-medium text-amber-700 dark:text-amber-400'>
					Knowledge base uploads and searches also need a key for the provider marked
					below, or they'll stop working.
				</p>
			)}

			<div className='mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800'>
				<Checkbox
					variant='switch'
					dimension='sm'
					id='allow-personal-keys'
					name='allow_personal_keys'
					checked={policy.allow_personal_keys}
					disabled={!canEdit}
					onChange={(e) => requestChange({ allow_personal_keys: e.target.checked })}
					label='Allow personal keys'
					description='Members can add keys only they use. When off, existing personal keys are kept but not used.'
				/>
			</div>

			{pending && (
				<PolicyImpactModal
					impact={pending.impact}
					isSaving={updatePolicy.isPending}
					onConfirm={confirmPending}
					onCancel={() => setPending(null)}
				/>
			)}
		</section>
	);
};

export default KeyPolicyCard;
