import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Gift, Pencil, Search } from 'lucide-react';
import {
	useAdminReferralCodes,
	useAdminReferralPrograms,
	useUpdateAdminReferralCode,
} from '@/api/modules/admin-referrals';
import { ApiError, notify } from '@/api/core';
import type { TAdminReferralCode } from '@/types/admin-referral.type';
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
	Pager,
	Pill,
	SectionCard,
	TableShell,
	Td,
	fieldClass,
} from '../../Referrals/_partial/ReferralUi.partial';
import { primaryBtn, secondaryBtn } from '../../_shared/buttons';
import ManualRewardModal from './ManualRewardModal.partial';

type TCodeForm = {
	code: string;
	program_id: string;
	rule_multiplier: string;
	max_uses: string;
	expires_at: string;
	is_active: boolean;
};

const EMPTY_FORM: TCodeForm = {
	code: '',
	program_id: '',
	rule_multiplier: '1',
	max_uses: '',
	expires_at: '',
	is_active: true,
};

const toForm = (code: TAdminReferralCode): TCodeForm => ({
	code: code.code,
	program_id: code.program_id ?? '',
	rule_multiplier: String(code.rule_multiplier),
	max_uses: code.max_uses === null ? '' : String(code.max_uses),
	expires_at: code.expires_at ? code.expires_at.slice(0, 10) : '',
	is_active: code.is_active,
});

/**
 * Per-referrer overrides: a vanity code, a pinned program (an influencer
 * deal), a reward multiplier, a use limit or expiry — or switching a code
 * off for abuse.
 */
const CodesTab = () => {
	const [search, setSearch] = useState('');
	const [query, setQuery] = useState('');
	const [page, setPage] = useState(1);
	const { data, isLoading } = useAdminReferralCodes({ search: query || undefined, page });
	const { data: programs = [] } = useAdminReferralPrograms();
	const update = useUpdateAdminReferralCode();

	const [editing, setEditing] = useState<TAdminReferralCode | null>(null);
	const [form, setForm] = useState<TCodeForm>(EMPTY_FORM);
	const [codeError, setCodeError] = useState<string | null>(null);
	const [rewarding, setRewarding] = useState<TAdminReferralCode | null>(null);

	// Search on pause rather than on every keystroke.
	useEffect(() => {
		const timer = setTimeout(() => {
			setQuery(search.trim());
			setPage(1);
		}, 300);
		return () => clearTimeout(timer);
	}, [search]);

	const open = (code: TAdminReferralCode) => {
		setEditing(code);
		setForm(toForm(code));
		setCodeError(null);
	};

	const save = async (e: FormEvent) => {
		e.preventDefault();
		if (!editing) return;
		try {
			await update.mutateAsync({
				id: editing.id,
				body: {
					code: form.code.trim(),
					program_id: form.program_id || null,
					rule_multiplier: Number(form.rule_multiplier),
					max_uses: form.max_uses ? Number(form.max_uses) : null,
					expires_at: form.expires_at || null,
					is_active: form.is_active,
				},
			});
			notify.success('Code updated.');
			setEditing(null);
		} catch (err) {
			setCodeError(ApiError.is(err) ? (err.field('code') ?? null) : null);
		}
	};

	const programName = (id: string | null) =>
		id ? (programs.find((p) => p.id === id)?.name ?? 'Unknown program') : 'Default';

	return (
		<SectionCard
			title='Referrer codes'
			description='Give a partner a custom code, their own program or a reward multiplier.'
			actions={
				<div className='relative w-64'>
					<Search className='pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400' />
					<input
						type='search'
						aria-label='Search codes'
						placeholder='Code, name or email'
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className={`${fieldClass} pl-9`}
					/>
				</div>
			}>
			{isLoading ? (
				<LoadingBlock />
			) : !data?.items.length ? (
				<EmptyBlock>No codes match.</EmptyBlock>
			) : (
				<>
					<TableShell head={['Code', 'Owner', 'Program', 'Multiplier', 'Referrals', '']}>
						{data.items.map((code) => (
							<tr key={code.id}>
								<Td className='font-mono text-xs font-bold'>
									{code.code} {!code.is_active && <Pill tone='danger'>Off</Pill>}
								</Td>
								<Td>
									<span className='block font-semibold'>{code.user?.name}</span>
									<span className='text-[11px] text-zinc-400'>
										{code.user?.email}
									</span>
								</Td>
								<Td>{programName(code.program_id)}</Td>
								<Td className='tabular-nums'>×{code.rule_multiplier}</Td>
								<Td className='tabular-nums'>
									{code.referrals_count ?? 0}
									{code.max_uses !== null && ` / ${code.max_uses}`}
								</Td>
								<Td className='space-x-2 text-right whitespace-nowrap'>
									<button
										type='button'
										onClick={() => setRewarding(code)}
										className='inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline'>
										<Gift size={12} />
										Reward
									</button>
									<button
										type='button'
										onClick={() => open(code)}
										className='inline-flex items-center gap-1 text-xs font-bold text-zinc-600 hover:underline dark:text-zinc-300'>
										<Pencil size={12} />
										Edit
									</button>
								</Td>
							</tr>
						))}
					</TableShell>
					<Pager meta={data.meta} onPage={setPage} />
				</>
			)}

			<Modal isOpen={editing !== null} setIsOpen={(o) => !o && setEditing(null)} size='md'>
				<ModalHeader setIsOpen={() => setEditing(null)}>
					<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						Edit code
					</span>
				</ModalHeader>
				<form onSubmit={save}>
					<ModalBody>
						<div className='grid gap-4 pt-2 sm:grid-cols-2'>
							<Field label='Code' error={codeError}>
								<input
									required
									value={form.code}
									onChange={(e) => setForm({ ...form, code: e.target.value })}
									className={fieldClass}
								/>
							</Field>
							<Field
								label='Program'
								hint='Default follows whichever program is the default.'>
								<select
									className={fieldClass}
									value={form.program_id}
									onChange={(e) =>
										setForm({ ...form, program_id: e.target.value })
									}>
									<option value=''>Default</option>
									{programs.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name}
										</option>
									))}
								</select>
							</Field>
							<Field
								label='Reward multiplier'
								hint="Scales this referrer's own rewards.">
								<input
									type='number'
									min={0}
									max={100}
									step={0.1}
									value={form.rule_multiplier}
									onChange={(e) =>
										setForm({ ...form, rule_multiplier: e.target.value })
									}
									className={fieldClass}
								/>
							</Field>
							<Field label='Max signups' hint='Leave empty for no limit.'>
								<input
									type='number'
									min={1}
									value={form.max_uses}
									onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
									className={fieldClass}
								/>
							</Field>
							<Field label='Expires on' hint='Leave empty to never expire.'>
								<input
									type='date'
									value={form.expires_at}
									onChange={(e) =>
										setForm({ ...form, expires_at: e.target.value })
									}
									className={fieldClass}
								/>
							</Field>
							<label className='flex items-center gap-2 self-end pb-2 text-sm font-bold text-zinc-700 dark:text-zinc-300'>
								<input
									type='checkbox'
									checked={form.is_active}
									onChange={(e) =>
										setForm({ ...form, is_active: e.target.checked })
									}
								/>
								Code is active
							</label>
						</div>
					</ModalBody>
					<ModalFooter>
						<ModalFooterChild className='flex w-full justify-end gap-3'>
							<button
								type='button'
								onClick={() => setEditing(null)}
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

			<ManualRewardModal
				key={rewarding?.id ?? 'closed'}
				isOpen={rewarding !== null}
				onClose={() => setRewarding(null)}
				userId={rewarding?.user?.id}
				userLabel={rewarding?.user?.email}
			/>
		</SectionCard>
	);
};

export default CodesTab;
