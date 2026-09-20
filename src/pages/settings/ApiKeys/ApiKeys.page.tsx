import { useState } from 'react';
import type { ComponentType, FormEvent } from 'react';
import {
	Bot,
	Check,
	Copy,
	GitBranch,
	Key,
	ListChecks,
	Plug,
	Plus,
	ShieldCheck,
	Trash2,
} from 'lucide-react';
import { useApiKeys, useCreateApiKey, useDeleteApiKey } from '@/api/modules/user';
import { useWorkspaceContext } from '@/context/workspace';
import { notify } from '@/api/core';
import type { TApiKey, TApiKeyAbility, TCreateApiKeyDto } from '@/types/auth.type';
import Button from '@/components/ui/Button';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Spinner from '@/components/ui/Spinner';

type TAbilityOption = {
	value: TApiKeyAbility;
	label: string;
	description: string;
	icon: ComponentType<{ size?: number; className?: string }>;
};

const abilityOptions: TAbilityOption[] = [
	{
		value: 'workflows:read',
		label: 'Workflows: Read',
		description: 'Read workflows, their graphs and input interfaces.',
		icon: GitBranch,
	},
	{
		value: 'workflows:write',
		label: 'Workflows: Write',
		description: 'Author workflows and run, cancel, or retry them.',
		icon: GitBranch,
	},
	{
		value: 'agents:invoke',
		label: 'Agents: Invoke',
		description: 'Start agent sessions and send messages.',
		icon: Bot,
	},
	{
		value: 'runs:read',
		label: 'Runs: Read',
		description: 'Read run history, including per-node results.',
		icon: ListChecks,
	},
	{
		value: 'connectors:manage',
		label: 'Connectors: Manage',
		description: 'Read the connector catalog and provision credentials.',
		icon: Plug,
	},
];

const abilityBadgeColors: Record<string, string> = {
	'workflows:read': 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
	'workflows:write':
		'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400',
	'agents:invoke': 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
	'runs:read': 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
	'connectors:manage':
		'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
	'*': 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900',
};

const abilityLabel = (value: TApiKeyAbility) =>
	value === '*' ? 'Full access' : (abilityOptions.find((o) => o.value === value)?.label ?? value);

const formatDate = (value: string | null) =>
	value
		? new Date(value).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			})
		: null;

const ApiKeysPage = () => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const { data: apiKeys = [], isLoading, error } = useApiKeys(activeWorkspaceId);
	const createApiKey = useCreateApiKey(activeWorkspaceId);
	const deleteApiKey = useDeleteApiKey(activeWorkspaceId);

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [keyToRevoke, setKeyToRevoke] = useState<TApiKey | null>(null);
	const [createdKey, setCreatedKey] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const [name, setName] = useState('');
	const [abilities, setAbilities] = useState<TApiKeyAbility[]>([]);
	const [expiresAt, setExpiresAt] = useState('');

	const resetForm = () => {
		setName('');
		setAbilities([]);
		setExpiresAt('');
	};

	const toggleAbility = (value: TApiKeyAbility) => {
		setAbilities((prev) =>
			prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value],
		);
	};

	const handleCreate = async (e: FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			notify.error('Please enter a name for the key');
			return;
		}
		if (abilities.length === 0) {
			notify.error('Select at least one ability');
			return;
		}

		const payload: TCreateApiKeyDto = {
			name: name.trim(),
			abilities,
			expires_at: expiresAt || null,
		};

		try {
			const result = await createApiKey.mutateAsync(payload);
			setCreatedKey(result.plain_text_key);
			setIsCreateModalOpen(false);
			resetForm();
		} catch {
			// Toast is handled by the API hook.
		}
	};

	const handleRevoke = async () => {
		if (!keyToRevoke) return;
		try {
			await deleteApiKey.mutateAsync(keyToRevoke.id);
			setKeyToRevoke(null);
		} catch {
			// Toast is handled by the API hook.
		}
	};

	const handleCopy = async () => {
		if (!createdKey) return;
		await navigator.clipboard.writeText(createdKey);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
			<div className='mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center'>
				<div>
					<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
						API Keys
					</h1>
					<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
						Manage keys used to access the API on behalf of this workspace.
					</p>
				</div>
				<Button
					variant='solid'
					color='primary'
					icon='Add01'
					onClick={() => setIsCreateModalOpen(true)}
					className='shadow-primary-500/10 h-12 font-bold text-zinc-950 shadow-md'>
					Create API key
				</Button>
			</div>

			{isLoading ? (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white py-20 dark:border-zinc-700 dark:bg-zinc-900'>
					<Spinner color='primary' className='size-8' />
					<p className='mt-2.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
						Loading API keys...
					</p>
				</div>
			) : error ? (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white py-16 text-center dark:border-zinc-700 dark:bg-zinc-900'>
					<div className='flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10'>
						<Key size={24} />
					</div>
					<h3 className='mt-4 text-lg font-bold text-zinc-900 dark:text-white'>
						Could not load API keys
					</h3>
					<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
						Please try again after refreshing.
					</p>
				</div>
			) : apiKeys.length === 0 ? (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/35 px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950/20'>
					<div className='bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl shadow-xs'>
						<Key size={22} />
					</div>
					<h3 className='text-lg font-bold text-zinc-900 dark:text-white'>
						No API keys yet
					</h3>
					<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
						Create a key to start calling the API from your own code.
					</p>
					<button
						type='button'
						onClick={() => setIsCreateModalOpen(true)}
						className='bg-primary-400 text-primary-950 shadow-primary-500/10 hover:bg-primary-500 mt-5 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold shadow-md transition active:scale-95'>
						<Plus size={14} />
						<span>Create your first key</span>
					</button>
				</div>
			) : (
				<div className='space-y-3'>
					{apiKeys.map((key) => (
						<div
							key={key.id}
							className='flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-xs transition hover:border-zinc-200 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-zinc-700'>
							<div className='flex items-start gap-4'>
								<div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'>
									<Key size={18} />
								</div>
								<div>
									<p className='text-sm font-black text-zinc-900 dark:text-zinc-100'>
										{key.name}
									</p>
									<p className='mt-0.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
										Created {formatDate(key.created_at)}
									</p>
									<div className='mt-2.5 flex flex-wrap gap-1.5'>
										{key.abilities.map((ability) => (
											<span
												key={ability}
												className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${abilityBadgeColors[ability] ?? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
												{abilityLabel(ability)}
											</span>
										))}
									</div>
								</div>
							</div>

							<div className='flex items-center gap-6 pl-15 sm:pl-0'>
								<div className='text-left sm:text-right'>
									<p className='text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
										Last used
									</p>
									<p className='mt-0.5 text-sm font-bold text-zinc-700 dark:text-zinc-300'>
										{formatDate(key.last_used_at) ?? 'Never'}
									</p>
								</div>
								<div className='text-left sm:text-right'>
									<p className='text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
										Expires
									</p>
									<p className='mt-0.5 text-sm font-bold text-zinc-700 dark:text-zinc-300'>
										{formatDate(key.expires_at) ?? 'Never'}
									</p>
								</div>
								<button
									type='button'
									aria-label={`Revoke ${key.name}`}
									onClick={() => setKeyToRevoke(key)}
									className='rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10'>
									<Trash2 size={16} />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Create key modal */}
			<Modal isOpen={isCreateModalOpen} setIsOpen={setIsCreateModalOpen} size='sm'>
				<ModalHeader setIsOpen={setIsCreateModalOpen}>
					<div className='flex items-center gap-3'>
						<div className='bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex h-9 w-9 items-center justify-center rounded-xl'>
							<Plus size={18} />
						</div>
						<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							Create API key
						</span>
					</div>
				</ModalHeader>
				<form onSubmit={handleCreate}>
					<ModalBody>
						<div className='space-y-5 pt-2'>
							<Input
								label='Name'
								name='name'
								required
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder='e.g. Production integration'
								variant='default'
								dimension='default'
							/>
							<div>
								<div className='mb-2 block text-sm font-bold text-zinc-700 dark:text-zinc-300'>
									Abilities
								</div>
								<div className='space-y-2'>
									{abilityOptions.map((option) => {
										const selected = abilities.includes(option.value);
										return (
											<button
												key={option.value}
												type='button'
												onClick={() => toggleAbility(option.value)}
												className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
													selected
														? 'border-primary-400 bg-primary-50/60 dark:border-primary-500/60 dark:bg-primary-950/20'
														: 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600'
												}`}>
												<div
													className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
														selected
															? 'bg-primary-400 text-primary-950'
															: 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
													}`}>
													<option.icon size={15} />
												</div>
												<div className='min-w-0 flex-1'>
													<p className='text-sm font-bold text-zinc-900 dark:text-zinc-100'>
														{option.label}
													</p>
													<p className='mt-0.5 text-xs font-medium text-zinc-400 dark:text-zinc-500'>
														{option.description}
													</p>
												</div>
												<div
													className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
														selected
															? 'border-primary-400 bg-primary-400 text-primary-950'
															: 'border-zinc-300 dark:border-zinc-600'
													}`}>
													{selected && (
														<Check size={12} className='stroke-[3]' />
													)}
												</div>
											</button>
										);
									})}
								</div>
							</div>
							<Input
								label='Expires on (optional)'
								name='expires_at'
								type='date'
								value={expiresAt}
								onChange={(e) => setExpiresAt(e.target.value)}
								variant='default'
								dimension='default'
							/>
						</div>
					</ModalBody>
					<ModalFooter>
						<ModalFooterChild className='flex w-full justify-end gap-3'>
							<Button
								variant='outline'
								color='zinc'
								onClick={() => setIsCreateModalOpen(false)}
								className='h-11 border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50'>
								Cancel
							</Button>
							<Button
								type='submit'
								variant='solid'
								color='primary'
								isLoading={createApiKey.isPending}
								className='shadow-primary-500/10 h-11 font-bold text-zinc-950 shadow-md'>
								Create key
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</form>
			</Modal>

			{/* Reveal plaintext key once, on creation */}
			<Modal
				isOpen={!!createdKey}
				setIsOpen={(open) => !open && setCreatedKey(null)}
				size='sm'>
				<ModalHeader setIsOpen={() => setCreatedKey(null)}>
					<div className='flex items-center gap-3'>
						<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'>
							<ShieldCheck size={18} />
						</div>
						<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							API key created
						</span>
					</div>
				</ModalHeader>
				<ModalBody>
					<p className='text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
						Copy this key now - you won't be able to see it again.
					</p>
					<div className='mt-4 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800'>
						<code className='flex-1 truncate text-sm font-bold text-zinc-800 dark:text-zinc-200'>
							{createdKey}
						</code>
						<button
							type='button'
							onClick={handleCopy}
							className='rounded-lg p-2 text-zinc-400 transition hover:bg-white hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200'>
							{copied ? (
								<Check size={16} className='text-emerald-500' />
							) : (
								<Copy size={16} />
							)}
						</button>
					</div>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild className='flex w-full justify-end'>
						<Button
							variant='solid'
							color='primary'
							onClick={() => setCreatedKey(null)}
							className='shadow-primary-500/10 h-11 font-bold text-zinc-950 shadow-md'>
							Done
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>

			{/* Revoke confirmation */}
			<Modal
				isOpen={!!keyToRevoke}
				setIsOpen={(open) => !open && setKeyToRevoke(null)}
				size='sm'>
				<ModalHeader setIsOpen={() => setKeyToRevoke(null)}>
					<div className='flex items-center gap-3'>
						<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'>
							<Trash2 size={18} />
						</div>
						<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							Revoke API key
						</span>
					</div>
				</ModalHeader>
				<ModalBody>
					<p className='text-base leading-relaxed font-semibold text-zinc-500 dark:text-zinc-400'>
						Are you sure you want to revoke{' '}
						<span className='font-bold text-zinc-800 dark:text-zinc-100'>
							{keyToRevoke?.name}
						</span>
						? Any integration using this key will stop working immediately.
					</p>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild className='flex w-full justify-end gap-3'>
						<Button
							variant='outline'
							color='zinc'
							onClick={() => setKeyToRevoke(null)}
							className='h-11 border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50'>
							Cancel
						</Button>
						<Button
							variant='solid'
							color='red'
							onClick={handleRevoke}
							isLoading={deleteApiKey.isPending}
							className='h-11 font-bold text-white shadow-md shadow-red-500/15'>
							Revoke
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>
		</div>
	);
};

export default ApiKeysPage;
