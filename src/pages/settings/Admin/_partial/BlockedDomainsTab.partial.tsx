import { useState } from 'react';
import type { FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import {
	useAdminBlockedDomains,
	useBlockReferralDomain,
	useUnblockReferralDomain,
} from '@/api/modules/admin-referrals';
import { ApiError, notify } from '@/api/core';
import formatDate from '@/utils/formatDate.util';
import {
	EmptyBlock,
	Field,
	LoadingBlock,
	SectionCard,
	TableShell,
	Td,
	fieldClass,
} from '../../Referrals/_partial/ReferralUi.partial';
import { primaryBtn } from '../../_shared/buttons';

/** Email domains whose signups are never credited to a referrer — mostly throwaway-mail services. */
const BlockedDomainsTab = () => {
	const { data: domains = [], isLoading } = useAdminBlockedDomains();
	const block = useBlockReferralDomain();
	const unblock = useUnblockReferralDomain();
	const [domain, setDomain] = useState('');
	const [reason, setReason] = useState('');
	const [error, setError] = useState<string | null>(null);

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		try {
			await block.mutateAsync({ domain: domain.trim(), reason: reason.trim() || undefined });
			notify.success(`${domain.trim()} blocked.`);
			setDomain('');
			setReason('');
			setError(null);
		} catch (err) {
			setError(ApiError.is(err) ? (err.field('domain') ?? null) : null);
		}
	};

	return (
		<SectionCard
			title='Blocked email domains'
			description='Signups from these domains are recorded but never earn anyone a reward.'>
			<form
				onSubmit={submit}
				className='mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end'>
				<Field label='Domain' error={error}>
					<input
						required
						placeholder='e.g. mailinator.com'
						value={domain}
						onChange={(e) => {
							setDomain(e.target.value);
							setError(null);
						}}
						className={fieldClass}
					/>
				</Field>
				<Field label='Reason (optional)'>
					<input
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						className={fieldClass}
					/>
				</Field>
				<button type='submit' disabled={block.isPending} className={`${primaryBtn} h-10!`}>
					Block
				</button>
			</form>

			{isLoading ? (
				<LoadingBlock />
			) : domains.length === 0 ? (
				<EmptyBlock>No blocked domains.</EmptyBlock>
			) : (
				<TableShell head={['Domain', 'Reason', 'Added', '']}>
					{domains.map((row) => (
						<tr key={row.id}>
							<Td className='font-semibold'>{row.domain}</Td>
							<Td>{row.reason ?? '—'}</Td>
							<Td>{formatDate(row.created_at)}</Td>
							<Td className='text-right'>
								<button
									type='button'
									aria-label={`Unblock ${row.domain}`}
									onClick={() =>
										unblock.mutate(row.id, {
											onSuccess: () =>
												notify.success(`${row.domain} unblocked.`),
										})
									}
									className='rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10'>
									<Trash2 size={15} />
								</button>
							</Td>
						</tr>
					))}
				</TableShell>
			)}
		</SectionCard>
	);
};

export default BlockedDomainsTab;
