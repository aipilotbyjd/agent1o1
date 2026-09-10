import { useState, useEffect } from 'react';
import { Copy, Eye, EyeOff, Key, Lock, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useWorkspaceContext } from '@/context/workspace';
import {
	useVariables,
	useCreateVariable,
	useUpdateVariable,
	useDeleteVariable,
} from '@/api/modules/variables';
import { notify } from '@/api/core';
import type { IVariable } from '@/types/variable.type';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Table, { TBody, THead, Td, Th, Tr } from '@/components/ui/Table';
import { primaryBtn, secondaryBtn, dangerBtn } from '@/pages/settings/_shared/buttons';

// ── shared styles ─────────────────────────────────────────────
const inputCls =
	'h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 shadow-xs outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-200 dark:placeholder:text-zinc-500';

// ── SecretModal (add + edit) ──────────────────────────────────
interface SecretModalProps {
	open: boolean;
	target: IVariable | null;
	isPending: boolean;
	onClose: () => void;
	onSubmit: (data: {
		key: string;
		value: string;
		is_secret: boolean;
		description: string;
	}) => void;
}

const SecretModal = ({ open, target, isPending, onClose, onSubmit }: SecretModalProps) => {
	const isEdit = !!target;

	const [key, setKey] = useState('');
	const [value, setValue] = useState('');
	const [isSecret, setIsSecret] = useState(true);
	const [description, setDescription] = useState('');
	const [showValue, setShowValue] = useState(false);

	useEffect(() => {
		if (open) {
			setKey(target?.key ?? '');
			setValue(target?.value ?? '');
			setIsSecret(target?.is_secret ?? true);
			setDescription(target?.description ?? '');
			setShowValue(false);
		}
	}, [open, target]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!key.trim() || !value.trim()) return;
		onSubmit({ key: key.trim(), value: value.trim(), is_secret: isSecret, description });
	};

	return (
		<Modal isOpen={open} setIsOpen={onClose} size='sm'>
			<ModalHeader setIsOpen={onClose}>
				<div className='flex items-center gap-3'>
					<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'>
						<Lock size={16} />
					</div>
					<div className='flex flex-col'>
						<span className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							{isEdit ? 'Edit Secret' : 'Add Secret'}
						</span>
						<span className='mt-1 text-xs leading-normal font-semibold text-zinc-400 dark:text-zinc-500'>
							{isEdit
								? 'Update the value or description.'
								: 'The value will be encrypted and stored securely.'}
						</span>
					</div>
				</div>
			</ModalHeader>

			<form onSubmit={handleSubmit}>
				<ModalBody>
					<div className='space-y-4 pt-2'>
						{/* Key */}
						<div>
							<div className='mb-1.5 flex items-center justify-between'>
								<label className='text-xs font-bold text-zinc-700 dark:text-zinc-300'>
									Name
								</label>
								<span className='text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
									Required
								</span>
							</div>
							<input
								type='text'
								required
								value={key}
								onChange={(e) => setKey(e.target.value)}
								placeholder='e.g. OPENAI_API_KEY'
								disabled={isEdit}
								className={`${inputCls} disabled:cursor-not-allowed disabled:opacity-60`}
							/>
						</div>

						{/* Value */}
						<div>
							<div className='mb-1.5 flex items-center justify-between'>
								<label className='text-xs font-bold text-zinc-700 dark:text-zinc-300'>
									Value
								</label>
								<span className='text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
									Required
								</span>
							</div>
							<div className='relative'>
								<textarea
									required
									rows={3}
									value={value}
									onChange={(e) => setValue(e.target.value)}
									placeholder='Secret value'
									style={
										{
											WebkitTextSecurity:
												isSecret && !showValue ? 'disc' : 'none',
										} as React.CSSProperties
									}
									className='w-full resize-none rounded-xl border border-zinc-200 bg-white p-4 pr-10 text-sm font-semibold text-zinc-800 shadow-xs outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-200'
								/>
								{isSecret && (
									<button
										type='button'
										onClick={() => setShowValue((v) => !v)}
										className='absolute top-3 right-3 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'>
										{showValue ? <EyeOff size={15} /> : <Eye size={15} />}
									</button>
								)}
							</div>
						</div>

						{/* Description */}
						<div>
							<label className='mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
								Description{' '}
								<span className='font-normal text-zinc-400'>(optional)</span>
							</label>
							<input
								type='text'
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder='What this secret is used for'
								className={inputCls}
							/>
						</div>

						{/* Secret toggle */}
						<label className='flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700'>
							<button
								type='button'
								onClick={() => setIsSecret((v) => !v)}
								className={[
									'relative h-6 w-10 shrink-0 rounded-full transition',
									isSecret ? 'bg-primary-400' : 'bg-zinc-200 dark:bg-zinc-600',
								].join(' ')}>
								<span
									className={[
										'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition',
										isSecret ? 'left-4' : 'left-0.5',
									].join(' ')}
								/>
							</button>
							<div>
								<span className='block text-sm font-bold text-zinc-800 dark:text-zinc-200'>
									Mark as secret
								</span>
								<span className='text-xs text-zinc-400 dark:text-zinc-500'>
									Value will be masked in the UI
								</span>
							</div>
						</label>
					</div>
				</ModalBody>

				<ModalFooter>
					<ModalFooterChild className='flex w-full justify-end gap-3'>
						<button
							type='button'
							onClick={onClose}
							className={secondaryBtn}>
							Cancel
						</button>
						<button
							type='submit'
							disabled={isPending}
							className={primaryBtn}>
							{isPending
								? isEdit
									? 'Saving…'
									: 'Creating…'
								: isEdit
									? 'Save changes'
									: 'Create'}
						</button>
					</ModalFooterChild>
				</ModalFooter>
			</form>
		</Modal>
	);
};

// ── Page ──────────────────────────────────────────────────────
const SecretsPage = () => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const [searchQuery, setSearchQuery] = useState('');

	const { data: secrets = [], isLoading } = useVariables(activeWorkspaceId, {
		search: searchQuery || undefined,
	});

	const createVar = useCreateVariable(activeWorkspaceId);
	const updateVar = useUpdateVariable(activeWorkspaceId);
	const deleteVar = useDeleteVariable(activeWorkspaceId);

	const [modalOpen, setModalOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<IVariable | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<IVariable | null>(null);
	const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

	const openAdd = () => {
		setEditTarget(null);
		setModalOpen(true);
	};

	const openEdit = (v: IVariable) => {
		setEditTarget(v);
		setModalOpen(true);
	};

	const closeModal = () => {
		setModalOpen(false);
		setEditTarget(null);
	};

	const handleSubmit = async (data: {
		key: string;
		value: string;
		is_secret: boolean;
		description: string;
	}) => {
		try {
			if (editTarget) {
				await updateVar.mutateAsync({
					id: editTarget.id,
					body: {
						value: data.value,
						is_secret: data.is_secret,
						description: data.description,
					},
				});
			} else {
				await createVar.mutateAsync({
					key: data.key,
					value: data.value,
					is_secret: data.is_secret,
					description: data.description,
					scope: 'Global',
				});
			}
			closeModal();
		} catch {
			// toast handled by hook
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		try {
			await deleteVar.mutateAsync(deleteTarget.id);
			setDeleteTarget(null);
		} catch {
			// toast handled by hook
		}
	};

	const toggleVisibility = (id: string) => {
		setVisibleIds((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	};

	const handleCopy = (value: string) => {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(value);
			notify.success('Copied to clipboard');
		} else {
			notify.error('Clipboard copy failed');
		}
	};

	const formatDate = (ts: string | number) => {
		const d = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	};

	const isPending = createVar.isPending || updateVar.isPending;
	const isEmpty = !isLoading && secrets.length === 0 && !searchQuery;
	const noResults = !isLoading && secrets.length === 0 && !!searchQuery;

	return (
		<div className='mx-auto w-full max-w-[1180px] px-6 py-8 text-zinc-950 sm:px-10 lg:px-14 dark:text-zinc-50'>
			{/* Header */}
			<div className='mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-start'>
				<div>
					<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
						Your Secrets
					</h1>
					<p className='mt-1 max-w-2xl text-sm font-medium text-zinc-500 dark:text-zinc-400'>
						Configure secrets to use them in custom nodes and MCP nodes. Secrets are
						encrypted and should be used for sensitive data.
					</p>
				</div>
			</div>

			{/* Search + Add */}
			<div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<div className='relative w-full max-w-sm'>
					<Search className='pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400' />
					<input
						type='text'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder='Search secrets'
						className='h-10 w-full rounded-xl border border-border-main bg-bg-card pr-8 pl-10 text-sm font-medium text-zinc-800 shadow-xs outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 dark:border-border-main dark:bg-bg-card dark:text-zinc-100'
					/>
					{searchQuery && (
						<button
							type='button'
							onClick={() => setSearchQuery('')}
							className='absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 hover:text-zinc-600'>
							<X size={14} />
						</button>
					)}
				</div>
				<button
					type='button'
					onClick={openAdd}
					className={primaryBtn}>
					<Plus size={15} />
					Add Secret
				</button>
			</div>

			{/* Loading */}
			{isLoading && (
				<div className='overflow-hidden rounded-2xl border border-border-main bg-bg-card shadow-sm dark:border-border-main dark:bg-bg-card'>
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className='flex items-center gap-4 border-b border-border-main p-4 last:border-0 dark:border-border-main'>
							<div className='h-8 w-8 animate-pulse rounded-lg bg-zinc-150 dark:bg-zinc-950/40' />
							<div className='h-4 w-36 animate-pulse rounded-md bg-zinc-150 dark:bg-zinc-950/40' />
							<div className='ml-auto h-4 w-32 animate-pulse rounded-md bg-zinc-150 dark:bg-zinc-950/40' />
						</div>
					))}
				</div>
			)}

			{/* Empty — no secrets yet */}
			{isEmpty && (
				<div className='rounded-2xl border border-dashed border-border-main bg-bg-card px-4 py-20 text-center dark:border-border-main dark:bg-bg-card/20'>
					<div className='mx-auto flex max-w-sm flex-col items-center'>
						<div className='mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'>
							<Key size={24} />
						</div>
						<h3 className='mb-1.5 text-lg font-bold text-zinc-900 dark:text-zinc-50'>
							No secrets yet
						</h3>
						<p className='mb-6 text-sm leading-relaxed font-medium text-zinc-500 dark:text-zinc-400'>
							Create your first secret to get started
						</p>
						<button
							type='button'
							onClick={openAdd}
							className={primaryBtn}>
							<Plus size={16} />
							Add Secret
						</button>
					</div>
				</div>
			)}

			{/* Empty — no search results */}
			{noResults && (
				<div className='rounded-2xl border border-dashed border-border-main bg-bg-card px-4 py-16 text-center dark:border-border-main dark:bg-bg-card/20'>
					<div className='mx-auto flex max-w-sm flex-col items-center'>
						<div className='mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800'>
							<Search size={20} />
						</div>
						<h3 className='mb-1 text-base font-bold text-zinc-900 dark:text-zinc-50'>
							No secrets match your search
						</h3>
						<p className='text-xs font-medium text-zinc-500 dark:text-zinc-400'>
							Try adjusting your keywords or add a new secret above.
						</p>
					</div>
				</div>
			)}

			{/* Table */}
			{!isLoading && secrets.length > 0 && (
				<div className='overflow-x-auto rounded-2xl border border-border-main bg-bg-card shadow-sm dark:border-border-main dark:bg-bg-card'>
					<Table>
						<THead>
							<Tr>
								<Th className='border-b border-border-main bg-bg-card/50 p-4 text-left text-xs font-bold tracking-wider text-zinc-500 uppercase dark:border-border-main dark:bg-bg-sidebar/40 dark:text-zinc-400'>
									Name
								</Th>
								<Th className='border-b border-border-main bg-bg-card/50 p-4 text-left text-xs font-bold tracking-wider text-zinc-500 uppercase dark:border-border-main dark:bg-bg-sidebar/40 dark:text-zinc-400'>
									Value
								</Th>
								<Th className='border-b border-border-main bg-bg-card/50 p-4 text-left text-xs font-bold tracking-wider text-zinc-500 uppercase dark:border-border-main dark:bg-bg-sidebar/40 dark:text-zinc-400'>
									Description
								</Th>
								<Th className='border-b border-border-main bg-bg-card/50 p-4 text-left text-xs font-bold tracking-wider text-zinc-500 uppercase dark:border-border-main dark:bg-bg-sidebar/40 dark:text-zinc-400'>
									Created
								</Th>
								<Th className='w-[180px] border-b border-border-main bg-bg-card/50 p-4 text-right text-xs font-bold tracking-wider text-zinc-500 uppercase dark:border-border-main dark:bg-bg-sidebar/40 dark:text-zinc-400'>
									Actions
								</Th>
							</Tr>
						</THead>
						<TBody>
							{secrets.map((secret) => {
								const isVisible = visibleIds.has(secret.id);
								const masked = secret.is_secret && !isVisible;
								return (
									<Tr
										key={secret.id}
										className='group border-b border-border-main last:border-0 dark:border-border-main'>
										{/* Name */}
										<Td className='p-4'>
											<div className='flex items-center gap-2.5'>
												<span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-bg-sidebar dark:text-zinc-400'>
													<Key size={14} />
												</span>
												<span className='truncate font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100'>
													{secret.key}
												</span>
												{secret.is_secret && (
													<span className='hidden shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 sm:inline-flex dark:bg-amber-950/50 dark:text-amber-400'>
														<Lock size={9} />
														secret
													</span>
												)}
											</div>
										</Td>

										{/* Value */}
										<Td className='p-4'>
											<div className='flex items-center gap-2'>
												<span className='font-mono text-xs text-zinc-500 dark:text-zinc-400'>
													{masked ? '••••••••••••••••' : secret.value}
												</span>
												{secret.is_secret && (
													<button
														type='button'
														onClick={() => toggleVisibility(secret.id)}
														className='shrink-0 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-zinc-600 dark:hover:text-zinc-200'
														title={isVisible ? 'Hide' : 'Reveal'}>
														{isVisible ? (
															<EyeOff size={13} />
														) : (
															<Eye size={13} />
														)}
													</button>
												)}
											</div>
										</Td>

										{/* Description */}
										<Td className='p-4 text-sm text-zinc-400 dark:text-zinc-500'>
											{secret.description || '—'}
										</Td>

										{/* Created */}
										<Td className='p-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400'>
											{formatDate(secret.created_at)}
										</Td>

										{/* Actions */}
										<Td className='p-4 text-right'>
											<div className='flex items-center justify-end gap-1'>
												<button
													type='button'
													onClick={() => handleCopy(secret.value)}
													className='flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200'
													title='Copy value'>
													<Copy size={14} />
												</button>
												<button
													type='button'
													onClick={() => openEdit(secret)}
													className='flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200'
													title='Edit'>
													<Pencil size={13} />
												</button>
												<button
													type='button'
													onClick={() => setDeleteTarget(secret)}
													className='flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400'
													title='Delete'>
													<Trash2 size={14} />
												</button>
											</div>
										</Td>
									</Tr>
								);
							})}
						</TBody>
					</Table>
				</div>
			)}

			{/* Add / Edit modal */}
			<SecretModal
				open={modalOpen}
				target={editTarget}
				isPending={isPending}
				onClose={closeModal}
				onSubmit={handleSubmit}
			/>

			{/* Delete confirmation */}
			<Modal
				isOpen={!!deleteTarget}
				setIsOpen={(open) => !open && setDeleteTarget(null)}
				size='sm'>
				<ModalHeader setIsOpen={() => setDeleteTarget(null)}>
					<div className='flex items-center gap-3'>
						<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400'>
							<Trash2 size={16} />
						</div>
						<span className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							Delete Secret
						</span>
					</div>
				</ModalHeader>
				<ModalBody>
					<p className='pt-2 text-sm leading-relaxed font-medium text-zinc-500 dark:text-zinc-400'>
						Are you sure you want to delete{' '}
						<strong className='font-mono text-zinc-800 dark:text-zinc-200'>
							"{deleteTarget?.key}"
						</strong>
						? This cannot be undone and any node using it will fail.
					</p>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild className='flex w-full justify-end gap-3'>
						<button
							type='button'
							onClick={() => setDeleteTarget(null)}
							className={secondaryBtn}>
							Cancel
						</button>
						<button
							type='button'
							disabled={deleteVar.isPending}
							onClick={handleDelete}
							className={dangerBtn}>
							{deleteVar.isPending ? 'Deleting…' : 'Delete'}
						</button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>
		</div>
	);
};

export default SecretsPage;
