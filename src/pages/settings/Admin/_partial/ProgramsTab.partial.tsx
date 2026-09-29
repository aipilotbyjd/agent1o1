import { useState } from 'react';
import type { FormEvent } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { useAdminReferralPrograms, useCreateReferralProgram } from '@/api/modules/admin-referrals';
import { ApiError, notify } from '@/api/core';
import formatDate from '@/utils/formatDate.util';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import {
	EmptyBlock,
	Field,
	LoadingBlock,
	Pill,
	SectionCard,
	fieldClass,
} from '../../Referrals/_partial/ReferralUi.partial';
import { primaryBtn, secondaryBtn } from '../../_shared/buttons';
import ProgramEditor from './ProgramEditor.partial';

/**
 * All programs — the default plus any campaigns or partner programs. A new
 * program starts switched off with no rules, so nothing changes until it
 * is set up; duplicating the default is the quicker way to a campaign.
 */
const ProgramsTab = () => {
	const { data: programs = [], isLoading } = useAdminReferralPrograms();
	const create = useCreateReferralProgram();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);
	const [name, setName] = useState('');
	const [nameError, setNameError] = useState<string | null>(null);

	if (selectedId) {
		return (
			<ProgramEditor
				programId={selectedId}
				onBack={() => setSelectedId(null)}
				onSelect={setSelectedId}
			/>
		);
	}

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		try {
			const program = await create.mutateAsync({ name: name.trim(), is_active: false });
			notify.success('Program created — add rules, then switch it on.');
			setCreating(false);
			setName('');
			setSelectedId(program.id);
		} catch (err) {
			setNameError(
				ApiError.is(err) ? (err.field('name') ?? err.field('slug') ?? null) : null,
			);
		}
	};

	return (
		<SectionCard
			title='Programs'
			description='New signups join the default program unless their referrer’s code points at another.'
			actions={
				<button
					type='button'
					onClick={() => setCreating(true)}
					className={`${primaryBtn} h-10!`}>
					<Plus size={14} />
					New program
				</button>
			}>
			{isLoading ? (
				<LoadingBlock />
			) : programs.length === 0 ? (
				<EmptyBlock>
					No programs yet. Create one, or run{' '}
					<code>php artisan db:seed --class=ReferralProgramSeeder</code> for the default.
				</EmptyBlock>
			) : (
				<div className='space-y-2'>
					{programs.map((program) => (
						<button
							key={program.id}
							type='button'
							onClick={() => setSelectedId(program.id)}
							className='flex w-full items-center justify-between gap-4 rounded-xl border border-zinc-100 px-4 py-3 text-left transition hover:border-zinc-200 hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:bg-zinc-900/40'>
							<div className='min-w-0'>
								<div className='flex flex-wrap items-center gap-2'>
									<span className='text-sm font-black text-zinc-900 dark:text-zinc-100'>
										{program.name}
									</span>
									{program.is_default && <Pill tone='primary'>Default</Pill>}
									<Pill tone={program.is_live ? 'success' : 'neutral'}>
										{program.is_live ? 'Live' : 'Not live'}
									</Pill>
									{program.approval_mode === 'manual' && (
										<Pill tone='warning'>Manual approval</Pill>
									)}
								</div>
								<p className='mt-0.5 text-xs font-semibold text-zinc-400'>
									{program.rules_count ?? 0} rules ·{' '}
									{program.referrals_count ?? 0} referrals ·{' '}
									{program.default_hold_days}-day hold
									{program.ends_at && ` · ends ${formatDate(program.ends_at)}`}
								</p>
							</div>
							<ChevronRight size={16} className='shrink-0 text-zinc-400' />
						</button>
					))}
				</div>
			)}

			<Modal isOpen={creating} setIsOpen={setCreating} size='sm'>
				<ModalHeader setIsOpen={setCreating}>
					<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						New program
					</span>
				</ModalHeader>
				<form onSubmit={submit}>
					<ModalBody>
						<div className='pt-2'>
							<Field
								label='Name'
								hint='e.g. "Launch week 2x" or "Creator partners".'
								error={nameError}>
								<input
									autoFocus
									required
									value={name}
									onChange={(e) => {
										setName(e.target.value);
										setNameError(null);
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
								onClick={() => setCreating(false)}
								className={secondaryBtn}>
								Cancel
							</button>
							<button
								type='submit'
								disabled={create.isPending}
								className={primaryBtn}>
								{create.isPending ? 'Creating…' : 'Create'}
							</button>
						</ModalFooterChild>
					</ModalFooter>
				</form>
			</Modal>
		</SectionCard>
	);
};

export default ProgramsTab;
