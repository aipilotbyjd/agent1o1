import { useState, useEffect } from 'react';
import {
	Box,
	ChevronDown,
	ChevronRight,
	Eye,
	EyeOff,
	FolderOpen,
	Pencil,
	Plus,
	Trash2,
	X,
} from 'lucide-react';
import { useWorkspaceContext } from '@/context/workspaceContext';
import {
	useEnvironments,
	useCreateEnvironment,
	useUpdateEnvironment,
	useDeleteEnvironment,
} from '@/api/modules/environments';
import type { IEnvironment } from '@/types/environment.type';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import { primaryBtn, secondaryBtn, dangerBtn } from '@/pages/settings/_shared/buttons';

// ── helpers ──────────────────────────────────────────────────
const SECRET_PATTERN = /(_KEY|_SECRET|_TOKEN|_PASSWORD)$/i;

function toSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const inputCls =
	'h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/25';

// ── VariableEditor ────────────────────────────────────────────
interface VariableEditorProps {
	variables: Record<string, string>;
	onChange: (vars: Record<string, string>) => void;
}

const VariableEditor = ({ variables, onChange }: VariableEditorProps) => {
	const [revealed, setRevealed] = useState<Set<string>>(new Set());
	const pairs = Object.entries(variables);

	const update = (oldKey: string, newKey: string, value: string) => {
		const next: Record<string, string> = {};
		for (const [k, v] of Object.entries(variables)) {
			if (k === oldKey) next[newKey] = value;
			else next[k] = v;
		}
		onChange(next);
	};

	const remove = (key: string) => {
		const next = { ...variables };
		delete next[key];
		onChange(next);
	};

	const add = () => onChange({ ...variables, '': '' });

	const toggleReveal = (key: string) => {
		setRevealed((prev) => {
			const next = new Set(prev);
			next.has(key) ? next.delete(key) : next.add(key);
			return next;
		});
	};

	return (
		<div className='flex flex-col gap-2'>
			{pairs.length === 0 && (
				<p className='text-sm text-zinc-400 dark:text-zinc-500'>No variables yet.</p>
			)}
			{pairs.map(([key, val], i) => {
				const isSecret = SECRET_PATTERN.test(key);
				const show = revealed.has(key) || !isSecret;
				return (
					<div key={i} className='flex items-center gap-2'>
						<input
							className={`${inputCls} flex-1`}
							placeholder='KEY'
							value={key}
							onChange={(e) => update(key, e.target.value, val)}
						/>
						<div className='relative flex flex-1 items-center'>
							<input
								className={`${inputCls} pr-10`}
								placeholder='value'
								type={show ? 'text' : 'password'}
								value={val}
								onChange={(e) => update(key, key, e.target.value)}
							/>
							{isSecret && (
								<button
									type='button'
									onClick={() => toggleReveal(key)}
									className='absolute right-3 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'>
									{show ? <EyeOff size={15} /> : <Eye size={15} />}
								</button>
							)}
						</div>
						<button
							type='button'
							onClick={() => remove(key)}
							className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 hover:border-red-300 hover:text-red-500 dark:border-zinc-700'>
							<X size={15} />
						</button>
					</div>
				);
			})}
			<button
				type='button'
				onClick={add}
				className='mt-1 flex h-10 w-fit items-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 text-sm font-semibold text-zinc-500 hover:border-primary-400 hover:text-primary-500 dark:border-zinc-600 dark:text-zinc-400'>
				<Plus size={14} />
				Add variable
			</button>
		</div>
	);
};

// ── EnvironmentCard ───────────────────────────────────────────
interface EnvCardProps {
	env: IEnvironment;
	onEdit: (env: IEnvironment) => void;
	onDelete: (env: IEnvironment) => void;
}

const EnvironmentCard = ({ env, onEdit, onDelete }: EnvCardProps) => {
	const [expanded, setExpanded] = useState(false);
	const [revealed, setRevealed] = useState<Set<string>>(new Set());
	const varCount = Object.keys(env.variables).length;
	const updatedAt = new Date(env.updated_at).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});

	return (
		<div className='rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900'>
			<div className='flex items-center justify-between gap-4 px-5 py-4'>
				<div className='flex min-w-0 items-center gap-3'>
					<button
						type='button'
						onClick={() => setExpanded((v) => !v)}
						className='text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'>
						{expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
					</button>
					<div className='min-w-0'>
						<div className='flex items-center gap-2'>
							<span className='truncate text-base font-bold text-zinc-950 dark:text-zinc-50'>
								{env.name}
							</span>
							<span className='rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>
								{env.slug}
							</span>
						</div>
						<div className='mt-0.5 text-xs text-zinc-400 dark:text-zinc-500'>
							{varCount} variable{varCount !== 1 ? 's' : ''} · Updated {updatedAt}
						</div>
					</div>
				</div>
				<div className='flex items-center gap-2'>
					<button
						type='button'
						onClick={() => onEdit(env)}
						className='flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:hover:text-zinc-200'>
						<Pencil size={14} />
					</button>
					<button
						type='button'
						onClick={() => onDelete(env)}
						className='flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:border-red-300 hover:text-red-500 dark:border-zinc-700'>
						<Trash2 size={14} />
					</button>
				</div>
			</div>

			{expanded && varCount > 0 && (
				<div className='border-t border-zinc-100 px-5 py-4 dark:border-zinc-800'>
					<table className='w-full text-sm'>
						<thead>
							<tr className='text-left text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
								<th className='pr-4 pb-2 font-semibold'>Key</th>
								<th className='pb-2 font-semibold'>Value</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-zinc-100 dark:divide-zinc-800'>
							{Object.entries(env.variables).map(([k, v]) => {
								const isSecret = SECRET_PATTERN.test(k);
								const show = revealed.has(k);
								return (
									<tr key={k}>
										<td className='py-2 pr-4 font-mono text-xs text-zinc-700 dark:text-zinc-300'>
											{k}
										</td>
										<td className='flex items-center gap-2 py-2 font-mono text-xs text-zinc-500 dark:text-zinc-400'>
											{isSecret && !show ? '•••••••' : v}
											{isSecret && (
												<button
													type='button'
													onClick={() =>
														setRevealed((prev) => {
															const next = new Set(prev);
															next.has(k)
																? next.delete(k)
																: next.add(k);
															return next;
														})
													}
													className='text-zinc-400 hover:text-zinc-600'>
													{show ? (
														<EyeOff size={12} />
													) : (
														<Eye size={12} />
													)}
												</button>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			{expanded && varCount === 0 && (
				<p className='border-t border-zinc-100 px-5 py-4 text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-500'>
					No variables in this environment.
				</p>
			)}
		</div>
	);
};

// ── EnvModal ──────────────────────────────────────────────────
interface EnvModalProps {
	open: boolean;
	env?: IEnvironment | null;
	isPending: boolean;
	onClose: () => void;
	onSubmit: (data: { name: string; slug: string; variables: Record<string, string> }) => void;
}

const EnvModal = ({ open, env, isPending, onClose, onSubmit }: EnvModalProps) => {
	const [name, setName] = useState('');
	const [slug, setSlug] = useState('');
	const [slugEdited, setSlugEdited] = useState(false);
	const [variables, setVariables] = useState<Record<string, string>>({});
	const [slugError, setSlugError] = useState('');

	useEffect(() => {
		if (open) {
			setName(env?.name ?? '');
			setSlug(env?.slug ?? '');
			setSlugEdited(!!env);
			setVariables(env?.variables ?? {});
			setSlugError('');
		}
	}, [open, env]);

	const handleNameChange = (v: string) => {
		setName(v);
		if (!slugEdited) setSlug(toSlug(v));
	};

	const handleSlugChange = (v: string) => {
		setSlugEdited(true);
		setSlug(v);
		setSlugError(
			v && !slugPattern.test(v)
				? 'Slug must be lowercase letters, numbers, and hyphens only'
				: '',
		);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !slug.trim()) return;
		if (!slugPattern.test(slug)) {
			setSlugError('Slug must be lowercase letters, numbers, and hyphens only');
			return;
		}
		onSubmit({ name: name.trim(), slug, variables });
	};

	return (
		<Modal isOpen={open} setIsOpen={onClose} isCentered>
			<ModalHeader>{env ? 'Edit Environment' : 'Create Environment'}</ModalHeader>
			<form onSubmit={handleSubmit}>
				<ModalBody>
					<div className='flex flex-col gap-5'>
						<div>
							<label className='mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
								Name
							</label>
							<input
								className={inputCls}
								placeholder='e.g. Production'
								value={name}
								onChange={(e) => handleNameChange(e.target.value)}
								required
							/>
						</div>
						<div>
							<label className='mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
								Slug
							</label>
							<input
								className={inputCls}
								placeholder='e.g. production'
								value={slug}
								onChange={(e) => handleSlugChange(e.target.value)}
								required
							/>
							{slugError && <p className='mt-1 text-xs text-red-500'>{slugError}</p>}
						</div>
						<div>
							<label className='mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
								Variables
							</label>
							<VariableEditor variables={variables} onChange={setVariables} />
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild>
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
							{isPending ? 'Saving…' : env ? 'Update' : 'Create'}
						</button>
					</ModalFooterChild>
				</ModalFooter>
			</form>
		</Modal>
	);
};

// ── Page ──────────────────────────────────────────────────────
const EnvironmentsPage = () => {
	const { activeWorkspaceId } = useWorkspaceContext();

	const { data: environments = [], isLoading } = useEnvironments(activeWorkspaceId);
	const createEnv = useCreateEnvironment(activeWorkspaceId);
	const updateEnv = useUpdateEnvironment(activeWorkspaceId);
	const deleteEnv = useDeleteEnvironment(activeWorkspaceId);

	const [modalOpen, setModalOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<IEnvironment | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<IEnvironment | null>(null);

	const openCreate = () => {
		setEditTarget(null);
		setModalOpen(true);
	};

	const openEdit = (env: IEnvironment) => {
		setEditTarget(env);
		setModalOpen(true);
	};

	const closeModal = () => {
		setModalOpen(false);
		setEditTarget(null);
	};

	const handleSubmit = async (data: {
		name: string;
		slug: string;
		variables: Record<string, string>;
	}) => {
		if (editTarget) {
			await updateEnv.mutateAsync({
				id: editTarget.id,
				body: { name: data.name, variables: data.variables },
			});
		} else {
			await createEnv.mutateAsync(data);
		}
		closeModal();
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		await deleteEnv.mutateAsync(deleteTarget.id);
		setDeleteTarget(null);
	};

	const isPending = createEnv.isPending || updateEnv.isPending;

	return (
		<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
			<div className='flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between'>
				<div>
					<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
						Environments
					</h1>
					<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
						Manage separate variable sets for development, staging, and production.
					</p>
				</div>
				<button
					type='button'
					onClick={openCreate}
					className={primaryBtn}>
					<Plus size={16} />
					New environment
				</button>
			</div>

			<div className='mt-8 flex flex-col gap-4'>
				{isLoading &&
					Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className='h-20 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800'
						/>
					))}

				{!isLoading && environments.length === 0 && (
					<div className='flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/50'>
						<div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800'>
							<FolderOpen size={26} />
						</div>
						<div>
							<p className='text-base font-bold text-zinc-700 dark:text-zinc-300'>
								No environments yet
							</p>
							<p className='mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400'>
								Create one to manage separate variable sets for dev, staging, and
								production.
							</p>
						</div>
						<button
							type='button'
							onClick={openCreate}
							className={primaryBtn}>
							<Plus size={15} />
							Create environment
						</button>
					</div>
				)}

				{!isLoading &&
					environments.map((env) => (
						<EnvironmentCard
							key={env.id}
							env={env}
							onEdit={openEdit}
							onDelete={setDeleteTarget}
						/>
					))}
			</div>

			<EnvModal
				open={modalOpen}
				env={editTarget}
				isPending={isPending}
				onClose={closeModal}
				onSubmit={handleSubmit}
			/>

			{/* Delete confirmation */}
			<Modal isOpen={!!deleteTarget} setIsOpen={() => setDeleteTarget(null)} isCentered>
				<ModalHeader>Delete environment?</ModalHeader>
				<ModalBody>
					<p className='text-sm text-zinc-600 dark:text-zinc-300'>
						This will permanently delete{' '}
						<span className='font-bold text-zinc-900 dark:text-zinc-50'>
							{deleteTarget?.name}
						</span>{' '}
						and all its variables. This action cannot be undone.
					</p>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild>
						<button
							type='button'
							onClick={() => setDeleteTarget(null)}
							className={secondaryBtn}>
							Cancel
						</button>
						<button
							type='button'
							disabled={deleteEnv.isPending}
							onClick={handleDelete}
							className={dangerBtn}>
							{deleteEnv.isPending ? 'Deleting…' : 'Delete'}
						</button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>

			<div className='mt-8 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500'>
				<Box size={13} />
				{environments.length} environment{environments.length !== 1 ? 's' : ''}
			</div>
		</div>
	);
};

export default EnvironmentsPage;
