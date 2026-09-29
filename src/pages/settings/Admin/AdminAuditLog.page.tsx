import { useState } from 'react';
import { useAdminAuditLog } from '@/api/modules/admin-referrals';
import formatDate from '@/utils/formatDate.util';
import {
	EmptyBlock,
	LoadingBlock,
	Pager,
	SectionCard,
	TableShell,
	Td,
	fieldClass,
} from '../Referrals/_partial/ReferralUi.partial';
import AdminGate from './_partial/AdminGate.partial';

const summarise = (values: Record<string, unknown> | null) =>
	values
		? Object.entries(values)
				.slice(0, 4)
				.map(
					([key, value]) =>
						`${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`,
				)
				.join(' · ')
		: '—';

/** Every change a platform admin made, newest first. */
const AdminAuditLogPage = () => {
	const [page, setPage] = useState(1);
	const [action, setAction] = useState('');
	const { data, isLoading } = useAdminAuditLog({ page, action: action || undefined });

	return (
		<AdminGate>
			<div className='mx-auto w-full max-w-[1180px] space-y-6 px-6 py-8 sm:px-10 lg:px-14'>
				<div>
					<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
						Audit log
					</h1>
					<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
						Who changed what in the admin area, and when.
					</p>
				</div>
				<SectionCard
					title='Changes'
					actions={
						<select
							aria-label='Filter by area'
							value={action}
							onChange={(e) => {
								setAction(e.target.value);
								setPage(1);
							}}
							className={`${fieldClass} w-auto`}>
							<option value=''>Everything</option>
							<option value='referral_program'>Programs</option>
							<option value='referral_rule'>Rules</option>
							<option value='referral_reward'>Rewards</option>
							<option value='referral.'>Referrals</option>
							<option value='referral_code'>Codes</option>
							<option value='referral_blocked_domain'>Blocked domains</option>
							<option value='platform_admin'>Admin access</option>
						</select>
					}>
					{isLoading ? (
						<LoadingBlock />
					) : !data?.items.length ? (
						<EmptyBlock>No changes recorded.</EmptyBlock>
					) : (
						<>
							<TableShell head={['When', 'Who', 'Action', 'Before', 'After']}>
								{data.items.map((log) => (
									<tr key={log.id}>
										<Td className='whitespace-nowrap'>
											{formatDate(log.created_at)}
										</Td>
										<Td>{log.admin?.email ?? 'Command line'}</Td>
										<Td className='font-mono text-xs'>{log.action}</Td>
										<Td className='max-w-[260px] truncate text-xs text-zinc-500'>
											{summarise(log.before)}
										</Td>
										<Td className='max-w-[260px] truncate text-xs text-zinc-500'>
											{summarise(log.after)}
										</Td>
									</tr>
								))}
							</TableShell>
							<Pager meta={data.meta} onPage={setPage} />
						</>
					)}
				</SectionCard>
			</div>
		</AdminGate>
	);
};

export default AdminAuditLogPage;
