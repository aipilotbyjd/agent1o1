import { useState } from 'react';
import type { FC } from 'react';
import {
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	Copy,
	Pencil,
	Plus,
	Power,
	Star,
	Trash2,
} from 'lucide-react';
import {
	useAdminReferralProgram,
	useDeleteReferralProgram,
	useDeleteReferralRule,
	useDuplicateReferralProgram,
	useMakeDefaultReferralProgram,
	useReorderReferralRules,
	useToggleReferralRule,
} from '@/api/modules/admin-referrals';
import { usePlans } from '@/api/modules/billing';
import { notify } from '@/api/core';
import { useConfirm } from '@/context/confirm';
import { useWorkspaceContext } from '@/context/workspace';
import type { TReferralRule } from '@/types/admin-referral.type';
import {
	EmptyBlock,
	LoadingBlock,
	Pill,
	SectionCard,
} from '../../Referrals/_partial/ReferralUi.partial';
import { RECIPIENT_LABEL, TRIGGER_LABEL } from '../../Referrals/_helper/referral.helper';
import { primaryBtn, secondaryBtn } from '../../_shared/buttons';
import ProgramSettingsForm from './ProgramSettingsForm.partial';
import RuleModal from './RuleModal.partial';
import SimulatorPanel from './SimulatorPanel.partial';

const iconBtn =
	'rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200';

/** One program: its settings, its reward rules and a simulator to try them. */
const ProgramEditor: FC<{
	programId: string;
	onBack: () => void;
	onSelect: (id: string) => void;
}> = ({ programId, onBack, onSelect }) => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const { confirm } = useConfirm();
	const { data: program, isLoading } = useAdminReferralProgram(programId);
	const { data: plans = [] } = usePlans(activeWorkspaceId);

	const makeDefault = useMakeDefaultReferralProgram();
	const duplicate = useDuplicateReferralProgram();
	const remove = useDeleteReferralProgram();
	const toggleRule = useToggleReferralRule();
	const deleteRule = useDeleteReferralRule();
	const reorder = useReorderReferralRules();

	const [editingRule, setEditingRule] = useState<TReferralRule | 'new' | null>(null);

	if (isLoading || !program) return <LoadingBlock label='Loading program…' />;

	const rules = [...(program.rules ?? [])].sort((a, b) => a.sort_order - b.sort_order);

	const move = (index: number, delta: number) => {
		const ids = rules.map((r) => r.id);
		const [moved] = ids.splice(index, 1);
		ids.splice(index + delta, 0, moved);
		reorder.mutate({ programId: program.id, ruleIds: ids });
	};

	const handleDelete = async () => {
		const ok = await confirm({
			title: 'Delete program',
			confirmText: 'Delete',
			message: 'Referrals made under it keep their history, but no new ones will join it.',
		});
		if (ok)
			remove.mutate(program.id, {
				onSuccess: () => {
					notify.success('Program deleted.');
					onBack();
				},
			});
	};

	const handleDeleteRule = async (rule: TReferralRule) => {
		const ok = await confirm({
			title: 'Delete rule',
			confirmText: 'Delete',
			message: `"${rule.name}" stops giving rewards. Rewards it already gave are kept.`,
		});
		if (ok) deleteRule.mutate(rule.id, { onSuccess: () => notify.success('Rule deleted.') });
	};

	return (
		<div className='space-y-6'>
			<div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
				<div className='flex items-center gap-3'>
					<button
						type='button'
						aria-label='All programs'
						onClick={onBack}
						className={iconBtn}>
						<ArrowLeft size={18} />
					</button>
					<div>
						<div className='flex items-center gap-2'>
							<h2 className='text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
								{program.name}
							</h2>
							{program.is_default && <Pill tone='primary'>Default</Pill>}
							<Pill tone={program.is_live ? 'success' : 'neutral'}>
								{program.is_live ? 'Live' : 'Not live'}
							</Pill>
						</div>
						<p className='text-xs font-semibold text-zinc-400'>{program.slug}</p>
					</div>
				</div>
				<div className='flex flex-wrap gap-2'>
					{!program.is_default && (
						<button
							type='button'
							disabled={makeDefault.isPending || !program.is_active}
							title={program.is_active ? undefined : 'Switch the program on first'}
							onClick={() =>
								makeDefault.mutate(program.id, {
									onSuccess: () =>
										notify.success(`${program.name} is now the default.`),
								})
							}
							className={`${secondaryBtn} h-10!`}>
							<Star size={14} />
							Make default
						</button>
					)}
					<button
						type='button'
						disabled={duplicate.isPending}
						onClick={() =>
							duplicate.mutate(program.id, {
								onSuccess: (copy) => {
									notify.success('Copy created — it starts switched off.');
									onSelect(copy.id);
								},
							})
						}
						className={`${secondaryBtn} h-10!`}>
						<Copy size={14} />
						Duplicate
					</button>
					{!program.is_default && (
						<button
							type='button'
							onClick={handleDelete}
							className={`${secondaryBtn} h-10! text-red-500!`}>
							<Trash2 size={14} />
							Delete
						</button>
					)}
				</div>
			</div>

			<SectionCard
				title='Reward rules'
				description='Each rule: when something happens, give someone something. Users see the generated terms.'
				actions={
					<button
						type='button'
						onClick={() => setEditingRule('new')}
						className={`${primaryBtn} h-10!`}>
						<Plus size={14} />
						Add rule
					</button>
				}>
				{rules.length === 0 ? (
					<EmptyBlock>
						No rules yet — this program gives nothing until you add one.
					</EmptyBlock>
				) : (
					<div className='space-y-2'>
						{rules.map((rule, index) => (
							<div
								key={rule.id}
								className='flex flex-col gap-3 rounded-xl border border-zinc-100 px-4 py-3 sm:flex-row sm:items-center dark:border-zinc-800'>
								<div className='min-w-0 flex-1'>
									<div className='flex flex-wrap items-center gap-2'>
										<p className='text-sm font-black text-zinc-900 dark:text-zinc-100'>
											{rule.name}
										</p>
										<Pill tone='neutral'>{TRIGGER_LABEL[rule.trigger]}</Pill>
										<Pill tone='info'>{RECIPIENT_LABEL[rule.recipient]}</Pill>
										{!rule.is_live && (
											<Pill tone='danger'>
												{rule.is_active ? 'Out of dates' : 'Off'}
											</Pill>
										)}
									</div>
									<p className='mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400'>
										{rule.summary}
									</p>
								</div>
								<div className='flex shrink-0 items-center'>
									<button
										type='button'
										aria-label='Move up'
										disabled={index === 0 || reorder.isPending}
										onClick={() => move(index, -1)}
										className={iconBtn}>
										<ArrowUp size={15} />
									</button>
									<button
										type='button'
										aria-label='Move down'
										disabled={index === rules.length - 1 || reorder.isPending}
										onClick={() => move(index, 1)}
										className={iconBtn}>
										<ArrowDown size={15} />
									</button>
									<button
										type='button'
										aria-label={rule.is_active ? 'Switch off' : 'Switch on'}
										title={rule.is_active ? 'Switch off' : 'Switch on'}
										onClick={() => toggleRule.mutate(rule.id)}
										className={
											iconBtn + (rule.is_active ? ' text-emerald-500!' : '')
										}>
										<Power size={15} />
									</button>
									<button
										type='button'
										aria-label='Edit rule'
										onClick={() => setEditingRule(rule)}
										className={iconBtn}>
										<Pencil size={15} />
									</button>
									<button
										type='button'
										aria-label='Delete rule'
										onClick={() => handleDeleteRule(rule)}
										className={`${iconBtn} hover:text-red-500!`}>
										<Trash2 size={15} />
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</SectionCard>

			<SimulatorPanel programId={program.id} plans={plans} />

			<ProgramSettingsForm key={program.id} program={program} plans={plans} />

			<RuleModal
				key={editingRule === 'new' ? 'new' : (editingRule?.id ?? 'closed')}
				programId={program.id}
				rule={editingRule === 'new' ? null : editingRule}
				isOpen={editingRule !== null}
				plans={plans}
				onClose={() => setEditingRule(null)}
			/>
		</div>
	);
};

export default ProgramEditor;
