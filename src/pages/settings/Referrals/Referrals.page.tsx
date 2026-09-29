import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router';
import { Check, Copy, Gift, Mail, Pencil, Sparkles, Trophy } from 'lucide-react';
import {
	useReferralProfile,
	useReferralProgram,
	useReferralRewards,
	useReferralStats,
	useReferrals,
	useUpdateReferralProfile,
} from '@/api/modules/referrals';
import { ApiError, notify } from '@/api/core';
import { useAuth } from '@/context/auth';
import { useWorkspaceContext } from '@/context/workspace';
import paths from '@/Routes/paths';
import formatDate from '@/utils/formatDate.util';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/Progress';
import { primaryBtn, secondaryBtn } from '../_shared/buttons';
import {
	EmptyBlock,
	Field,
	LoadingBlock,
	Pager,
	Pill,
	SectionCard,
	StatTile,
	TableShell,
	Td,
	fieldClass,
} from './_partial/ReferralUi.partial';
import {
	REFERRAL_STATUS,
	REWARD_STATUS,
	formatCents,
	formatNumber,
} from './_helper/referral.helper';

type TTab = 'people' | 'rewards';

/**
 * "Refer & earn": the signed-in user's share link, the program's current
 * terms (written by the backend from the admin-configured rules), their
 * numbers, who they invited and what they earned. Rewards are credits,
 * free plan time, invoice credit or trial days — never cash.
 */
const ReferralsPage = () => {
	const { userData } = useAuth();
	const { workspaces, activeWorkspaceId } = useWorkspaceContext();
	const { data: profile, isLoading } = useReferralProfile();
	const { data: program } = useReferralProgram();
	const { data: stats } = useReferralStats();
	const update = useUpdateReferralProfile();

	const [tab, setTab] = useState<TTab>('people');
	const [peoplePage, setPeoplePage] = useState(1);
	const [rewardsPage, setRewardsPage] = useState(1);
	const { data: people, isLoading: peopleLoading } = useReferrals({ page: peoplePage });
	const { data: rewards, isLoading: rewardsLoading } = useReferralRewards({ page: rewardsPage });

	const [copied, setCopied] = useState(false);
	const [editingCode, setEditingCode] = useState(false);
	const [codeDraft, setCodeDraft] = useState('');
	const [codeError, setCodeError] = useState<string | null>(null);

	if (isLoading || !profile) {
		return (
			<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
				<LoadingBlock label='Loading your referral link…' />
			</div>
		);
	}

	if (!profile.enabled) {
		return (
			<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
				<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 px-6 py-16 text-center dark:border-zinc-800'>
					<Gift size={28} className='text-zinc-400' />
					<h1 className='mt-3 text-lg font-bold text-zinc-900 dark:text-white'>
						Referrals are paused
					</h1>
					<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
						The referral program isn&apos;t running right now. Check back soon.
					</p>
				</div>
			</div>
		);
	}

	const ownedWorkspaces = workspaces.filter((w) => w.owner_id === userData?.id);

	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(profile.share_url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			notify.error('Could not copy — select the link and copy it manually.');
		}
	};

	const shareText = encodeURIComponent(
		'I use Agent1o1 to automate my work — sign up with my link:',
	);
	const shareUrl = encodeURIComponent(profile.share_url);

	const openCodeEditor = () => {
		setCodeDraft(profile.code);
		setCodeError(null);
		setEditingCode(true);
	};

	const saveCode = async (e: FormEvent) => {
		e.preventDefault();
		try {
			await update.mutateAsync({ code: codeDraft.trim() });
			notify.success('Your referral link is updated.');
			setEditingCode(false);
		} catch (err) {
			setCodeError(ApiError.is(err) ? (err.field('code') ?? err.message) : null);
		}
	};

	const changeRewardWorkspace = (workspaceId: string) => {
		update.mutate(
			{ reward_workspace_id: workspaceId },
			{ onSuccess: () => notify.success('Rewards will go to that workspace from now on.') },
		);
	};

	const milestone = profile.next_milestone;

	return (
		<div className='mx-auto w-full max-w-[1180px] space-y-6 px-6 py-8 sm:px-10 lg:px-14'>
			<div>
				<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
					Refer &amp; earn
				</h1>
				<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
					{program?.program?.description ??
						'Invite people to Agent1o1 and earn bonus credits and free plan time.'}
					{program?.program?.ends_at &&
						` Offer ends ${formatDate(program.program.ends_at)}.`}
				</p>
			</div>

			{stats?.free_plan_time && (
				<div className='flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20'>
					<Sparkles
						size={18}
						className='shrink-0 text-emerald-600 dark:text-emerald-400'
					/>
					<p className='text-sm font-semibold text-emerald-700 dark:text-emerald-300'>
						You have {stats.free_plan_time.plan ?? 'a paid plan'} free until{' '}
						{formatDate(stats.free_plan_time.expires_at)}, thanks to your referrals.
					</p>
				</div>
			)}

			<SectionCard
				title='Your referral link'
				description='Anyone who signs up through this link is credited to you.'>
				<div className='flex flex-col gap-3 sm:flex-row'>
					<input
						readOnly
						aria-label='Referral link'
						value={profile.share_url}
						onFocus={(e) => e.currentTarget.select()}
						className={`${fieldClass} h-11 font-semibold`}
					/>
					<button type='button' onClick={copyLink} className={`${primaryBtn} shrink-0`}>
						{copied ? <Check size={15} /> : <Copy size={15} />}
						{copied ? 'Copied' : 'Copy link'}
					</button>
				</div>

				<div className='mt-4 flex flex-wrap items-center gap-2'>
					<a
						className={`${secondaryBtn} h-9! px-3! text-xs!`}
						target='_blank'
						rel='noreferrer'
						href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}>
						Share on X
					</a>
					<a
						className={`${secondaryBtn} h-9! px-3! text-xs!`}
						target='_blank'
						rel='noreferrer'
						href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}>
						Share on LinkedIn
					</a>
					<a
						className={`${secondaryBtn} h-9! px-3! text-xs!`}
						href={`mailto:?subject=${encodeURIComponent('Try Agent1o1')}&body=${shareText}%20${shareUrl}`}>
						<Mail size={13} />
						Email
					</a>
					<span className='ml-auto text-xs font-semibold text-zinc-400'>
						Code{' '}
						<span className='font-black text-zinc-700 dark:text-zinc-200'>
							{profile.code}
						</span>
						{profile.can_customize_code && (
							<button
								type='button'
								onClick={openCodeEditor}
								className='text-primary-600 dark:text-primary-400 ml-2 inline-flex items-center gap-1 font-bold hover:underline'>
								<Pencil size={11} />
								Customise
							</button>
						)}
					</span>
				</div>

				{ownedWorkspaces.length > 1 && (
					<div className='mt-5 max-w-sm'>
						<Field
							label='Send my rewards to'
							hint='Credits and free plan time you earn land in this workspace.'>
							<select
								className={fieldClass}
								value={profile.reward_workspace?.id ?? ''}
								disabled={update.isPending}
								onChange={(e) => changeRewardWorkspace(e.target.value)}>
								{ownedWorkspaces.map((w) => (
									<option key={w.id} value={w.id}>
										{w.name}
									</option>
								))}
							</select>
						</Field>
					</div>
				)}
			</SectionCard>

			{stats && (
				<div className='grid grid-cols-2 gap-4 lg:grid-cols-6'>
					<StatTile label='Link visits' value={formatNumber(stats.visits)} />
					<StatTile label='Signed up' value={formatNumber(stats.signups)} />
					<StatTile label='Paying' value={formatNumber(stats.converted)} />
					<StatTile label='Credits earned' value={formatNumber(stats.credits_earned)} />
					<StatTile
						label='Free days earned'
						value={formatNumber(stats.plan_days_earned)}
						hint={
							stats.invoice_credit_cents > 0
								? `+ ${formatCents(stats.invoice_credit_cents)} invoice credit`
								: undefined
						}
					/>
					<StatTile
						label='On the way'
						value={formatNumber(stats.pending_rewards)}
						hint='rewards'
					/>
				</div>
			)}

			<div className='grid gap-6 lg:grid-cols-5'>
				<SectionCard title='How it works' className='lg:col-span-3'>
					{program?.terms.length ? (
						<ul className='space-y-3'>
							{program.terms.map((term, index) => (
								<li
									key={`${term.trigger}-${index}`}
									className='flex items-start gap-3'>
									<span className='bg-primary-400/15 text-primary-700 dark:text-primary-400 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-black'>
										{index + 1}
									</span>
									<span className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
										{term.description}
									</span>
								</li>
							))}
						</ul>
					) : (
						<EmptyBlock>
							Rewards for this program haven&apos;t been set up yet.
						</EmptyBlock>
					)}
				</SectionCard>

				<SectionCard title='Next milestone' className='lg:col-span-2'>
					{milestone ? (
						<div>
							<div className='flex items-center gap-3'>
								<Trophy size={22} className='text-amber-500' />
								<p className='text-sm font-bold text-zinc-800 dark:text-zinc-200'>
									{milestone.remaining} more paying{' '}
									{milestone.remaining === 1 ? 'referral' : 'referrals'} to go
								</p>
							</div>
							<ProgressBar
								className='mt-4'
								value={milestone.count - milestone.remaining}
								max={milestone.count}
							/>
							<p className='mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400'>
								{milestone.description}
							</p>
						</div>
					) : (
						<EmptyBlock>No milestones to reach right now.</EmptyBlock>
					)}
				</SectionCard>
			</div>

			<SectionCard
				title='Your referrals'
				actions={
					<div className='flex rounded-xl border border-zinc-200 p-0.5 text-xs font-bold dark:border-zinc-700'>
						{(['people', 'rewards'] as TTab[]).map((key) => (
							<button
								key={key}
								type='button'
								onClick={() => setTab(key)}
								className={`rounded-lg px-3 py-1.5 transition ${
									tab === key
										? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
										: 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
								}`}>
								{key === 'people' ? 'People' : 'Rewards'}
							</button>
						))}
					</div>
				}>
				{tab === 'people' ? (
					peopleLoading ? (
						<LoadingBlock />
					) : !people?.referrals.length ? (
						<EmptyBlock>
							Nobody has signed up with your link yet — share it to get started.
						</EmptyBlock>
					) : (
						<>
							<TableShell head={['Person', 'Status', 'Signed up', 'Paying since']}>
								{people.referrals.map((person) => (
									<tr key={person.id}>
										<Td className='font-semibold'>{person.email ?? '—'}</Td>
										<Td>
											<Pill tone={REFERRAL_STATUS[person.status].tone}>
												{REFERRAL_STATUS[person.status].label}
											</Pill>
										</Td>
										<Td>{formatDate(person.signed_up_at)}</Td>
										<Td>{formatDate(person.converted_at) ?? '—'}</Td>
									</tr>
								))}
							</TableShell>
							<Pager meta={people.meta} onPage={setPeoplePage} />
						</>
					)
				) : rewardsLoading ? (
					<LoadingBlock />
				) : !rewards?.rewards.length ? (
					<EmptyBlock>No rewards yet.</EmptyBlock>
				) : (
					<>
						<TableShell head={['Reward', 'For', 'Status', 'Date']}>
							{rewards.rewards.map((reward) => (
								<tr key={reward.id}>
									<Td className='font-semibold'>{reward.summary}</Td>
									<Td>
										{reward.recipient_role === 'referrer'
											? 'Inviting'
											: 'Joining'}
									</Td>
									<Td>
										<Pill tone={REWARD_STATUS[reward.status].tone}>
											{REWARD_STATUS[reward.status].label}
										</Pill>
									</Td>
									<Td>
										{reward.status === 'pending' && reward.grant_after
											? `Arrives ${formatDate(reward.grant_after)}`
											: formatDate(reward.granted_at ?? reward.created_at)}
									</Td>
								</tr>
							))}
						</TableShell>
						<Pager meta={rewards.meta} onPage={setRewardsPage} />
					</>
				)}
			</SectionCard>

			<p className='text-xs font-medium text-zinc-400'>
				Credits are added to your workspace&apos;s balance on the{' '}
				<Link to={paths.billing(activeWorkspaceId)} className='font-bold underline'>
					billing page
				</Link>
				. Rewards from payments are held for a short period in case of refunds.
			</p>

			<Modal isOpen={editingCode} setIsOpen={setEditingCode} size='sm'>
				<ModalHeader setIsOpen={setEditingCode}>
					<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						Customise your link
					</span>
				</ModalHeader>
				<form onSubmit={saveCode}>
					<ModalBody>
						<div className='space-y-3 pt-2'>
							<Field
								label='Referral code'
								hint='Letters, numbers and dashes. You can only change this once.'
								error={codeError}>
								<input
									autoFocus
									required
									minLength={3}
									maxLength={32}
									value={codeDraft}
									onChange={(e) => {
										setCodeDraft(e.target.value);
										setCodeError(null);
									}}
									className={fieldClass}
								/>
							</Field>
						</div>
					</ModalBody>
					<ModalFooter>
						<ModalFooterChild className='flex w-full justify-end gap-3'>
							<button
								type='button'
								onClick={() => setEditingCode(false)}
								className={secondaryBtn}>
								Cancel
							</button>
							<button
								type='submit'
								disabled={update.isPending}
								className={primaryBtn}>
								{update.isPending ? 'Saving…' : 'Save'}
							</button>
						</ModalFooterChild>
					</ModalFooter>
				</form>
			</Modal>
		</div>
	);
};

export default ReferralsPage;
