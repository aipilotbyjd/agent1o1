import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
	AlertTriangle,
	BookOpen,
	CheckCircle2,
	Cpu,
	KeyRound,
	Pencil,
	Plus,
	RefreshCw,
	Star,
	Trash2,
	User,
	Users,
} from 'lucide-react';
import {
	useAiProviderCredentials,
	useAiProviders,
	useDeleteAiProviderCredential,
	useSetDefaultAiProviderCredential,
	useValidateAiProviderCredential,
} from '@/api/modules/ai-providers';
import { notify } from '@/api/core';
import { useWorkspaceContext } from '@/context/workspace';
import relativeTime from '@/utils/relativeTime.util';
import type {
	TAiProvider,
	TAiProviderCredential,
	TAiProviderCredentialStatus,
} from '@/types/ai-provider.type';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Spinner from '@/components/ui/Spinner';
import { primaryBtn } from '../_shared/buttons';
import AddKeyModal from './_partial/AddKeyModal.partial';
import EditKeyModal from './_partial/EditKeyModal.partial';

const MAX_MODEL_CHIPS = 4;

const statusBadge: Record<
	TAiProviderCredentialStatus,
	{ label: string; className: string; icon: typeof CheckCircle2 }
> = {
	valid: {
		label: 'Working',
		className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
		icon: CheckCircle2,
	},
	invalid: {
		label: 'Rejected',
		className: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
		icon: AlertTriangle,
	},
	unvalidated: {
		label: 'Not checked yet',
		className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
		icon: RefreshCw,
	},
};

const steps = [
	{
		icon: User,
		title: 'Your personal key',
		body: 'Used first for AI you run yourself.',
	},
	{
		icon: Users,
		title: "The workspace's team key",
		body: "Used for anyone who hasn't added their own.",
	},
	{
		icon: Cpu,
		title: 'Our key',
		body: 'Used when there is no key of yours, and billed in credits.',
	},
];

const AiProvidersPage = () => {
	const { activeWorkspaceId: ws } = useWorkspaceContext();
	const providersQuery = useAiProviders(ws);
	const credentialsQuery = useAiProviderCredentials(ws);
	const deleteKey = useDeleteAiProviderCredential(ws);
	const setDefault = useSetDefaultAiProviderCredential(ws);
	const validateKey = useValidateAiProviderCredential(ws);

	const [addingFor, setAddingFor] = useState<string | null | undefined>(undefined);
	const [editing, setEditing] = useState<TAiProviderCredential | null>(null);
	const [removing, setRemoving] = useState<TAiProviderCredential | null>(null);

	const providers = providersQuery.data;
	const credentials = useMemo(() => credentialsQuery.data ?? [], [credentialsQuery.data]);
	const canAdd = !!providers && (providers.can_add_team || providers.can_add_personal);

	const sortedProviders = useMemo(() => {
		const list = providers?.providers ?? [];
		const hasKey = (p: TAiProvider) => credentials.some((c) => c.execution_provider === p.key);
		return [...list].sort((a, b) => Number(hasKey(b)) - Number(hasKey(a)));
	}, [providers, credentials]);

	const handleValidate = async (credential: TAiProviderCredential) => {
		try {
			const { result } = await validateKey.mutateAsync(credential.id);
			if (result.ok) notify.success(result.message);
			else notify.error(result.message);
		} catch {
			// Toast is handled by the API hook.
		}
	};

	const handleRemove = async () => {
		if (!removing) return;
		try {
			await deleteKey.mutateAsync(removing.id);
			setRemoving(null);
		} catch {
			// Toast is handled by the API hook.
		}
	};

	const isLoading = providersQuery.isLoading || credentialsQuery.isLoading;
	const error = providersQuery.error || credentialsQuery.error;

	return (
		<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
			<div className='mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center'>
				<div>
					<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
						AI Providers
					</h1>
					<p className='mt-1 max-w-xl text-sm font-medium text-zinc-500 dark:text-zinc-400'>
						Bring your own API keys. AI calls made with your key are billed by the
						provider, not in credits.
					</p>
				</div>
				{canAdd && (
					<button type='button' onClick={() => setAddingFor(null)} className={primaryBtn}>
						<Plus size={16} />
						Add key
					</button>
				)}
			</div>

			<div className='mb-8 rounded-2xl border border-zinc-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/40'>
				<p className='text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
					Which key runs an AI call
				</p>
				<ol className='mt-3 grid gap-3 sm:grid-cols-3'>
					{steps.map((step, index) => (
						<li
							key={step.title}
							className='flex items-start gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/60'>
							<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-600 shadow-xs dark:bg-zinc-800 dark:text-zinc-300'>
								<step.icon size={15} />
							</div>
							<div>
								<p className='text-sm font-bold text-zinc-900 dark:text-zinc-100'>
									{index + 1}. {step.title}
								</p>
								<p className='mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400'>
									{step.body}
								</p>
							</div>
						</li>
					))}
				</ol>
				<p className='mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400'>
					On your own key, AI tokens cost 0 credits. Each run's base credit, tool calls
					and processing time are still billed in credits.
				</p>
			</div>

			{isLoading ? (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white py-20 dark:border-zinc-700 dark:bg-zinc-900'>
					<Spinner color='primary' className='size-8' />
					<p className='mt-2.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
						Loading AI providers...
					</p>
				</div>
			) : error || !providers ? (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white py-16 text-center dark:border-zinc-700 dark:bg-zinc-900'>
					<div className='flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10'>
						<KeyRound size={24} />
					</div>
					<h3 className='mt-4 text-lg font-bold text-zinc-900 dark:text-white'>
						Could not load AI providers
					</h3>
					<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
						Please try again after refreshing.
					</p>
				</div>
			) : (
				<div className='space-y-4'>
					{sortedProviders.map((provider) => {
						const keys = credentials.filter(
							(c) => c.execution_provider === provider.key,
						);
						const extraModels = provider.models.length - MAX_MODEL_CHIPS;
						return (
							<section
								key={provider.key}
								className='rounded-2xl border border-zinc-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/40'>
								<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
									<div className='min-w-0'>
										<h2 className='text-base font-black text-zinc-900 dark:text-zinc-100'>
											{provider.label}
										</h2>
										{provider.models.length > 0 ? (
											<div className='mt-2 flex flex-wrap items-center gap-1.5'>
												<span className='text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
													Runs
												</span>
												{provider.models
													.slice(0, MAX_MODEL_CHIPS)
													.map((model) => (
														<span
															key={model}
															className='rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
															{model}
														</span>
													))}
												{extraModels > 0 && (
													<span
														title={provider.models
															.slice(MAX_MODEL_CHIPS)
															.join(', ')}
														className='text-[11px] font-bold text-zinc-400 dark:text-zinc-500'>
														+{extraModels} more
													</span>
												)}
											</div>
										) : (
											!provider.covers_knowledge_base && (
												<p className='mt-1 text-xs font-medium text-zinc-400 dark:text-zinc-500'>
													No models in the catalog use this provider yet.
												</p>
											)
										)}
										{provider.covers_knowledge_base && (
											<p className='mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400'>
												<BookOpen size={13} />
												Also used for knowledge base uploads and searches
											</p>
										)}
									</div>
									{canAdd && (
										<button
											type='button'
											onClick={() => setAddingFor(provider.key)}
											className='inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'>
											<Plus size={14} />
											Add {provider.label} key
										</button>
									)}
								</div>

								{keys.length > 0 && (
									<ul className='mt-4 space-y-2'>
										{keys.map((credential) => (
											<KeyRow
												key={credential.id}
												credential={credential}
												showDefault={
													keys.filter((k) => k.scope === credential.scope)
														.length > 1
												}
												isBusy={
													(validateKey.isPending &&
														validateKey.variables === credential.id) ||
													(setDefault.isPending &&
														setDefault.variables === credential.id)
												}
												onValidate={() => handleValidate(credential)}
												onSetDefault={() =>
													setDefault.mutate(credential.id)
												}
												onEdit={() => setEditing(credential)}
												onRemove={() => setRemoving(credential)}
											/>
										))}
									</ul>
								)}
							</section>
						);
					})}
				</div>
			)}

			{addingFor !== undefined && providers && (
				<AddKeyModal
					ws={ws}
					providers={providers}
					initialProvider={addingFor}
					onClose={() => setAddingFor(undefined)}
				/>
			)}

			{editing && (
				<EditKeyModal
					key={editing.id}
					ws={ws}
					credential={editing}
					onClose={() => setEditing(null)}
				/>
			)}

			<ConfirmDialog
				isOpen={!!removing}
				isLoading={deleteKey.isPending}
				title={`Remove ${removing?.provider_label ?? ''} key?`}
				message={
					removing?.scope === 'team'
						? 'AI calls for this provider will go back to our key and use credits, unless members have their own key.'
						: 'Your AI calls for this provider will go back to the team key, or to our key and use credits.'
				}
				confirmText='Remove key'
				onConfirm={handleRemove}
				onCancel={() => setRemoving(null)}
			/>
		</div>
	);
};

interface IKeyRowProps {
	credential: TAiProviderCredential;
	showDefault: boolean;
	isBusy: boolean;
	onValidate: () => void;
	onSetDefault: () => void;
	onEdit: () => void;
	onRemove: () => void;
}

const KeyRow = ({
	credential,
	showDefault,
	isBusy,
	onValidate,
	onSetDefault,
	onEdit,
	onRemove,
}: IKeyRowProps) => {
	const status = statusBadge[credential.validation_status];
	const ScopeIcon = credential.scope === 'personal' ? User : Users;
	const lastUsed = relativeTime(credential.last_used_at);
	const lastChecked = relativeTime(credential.last_validated_at);

	return (
		<li className='flex flex-col gap-3 rounded-xl border border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800'>
			<div className='flex min-w-0 items-start gap-3'>
				<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'>
					<ScopeIcon size={16} />
				</div>
				<div className='min-w-0'>
					<div className='flex flex-wrap items-center gap-1.5'>
						<p className='text-sm font-black text-zinc-900 dark:text-zinc-100'>
							{credential.name || `${credential.provider_label} key`}
						</p>
						<span className='rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
							{credential.scope === 'personal' ? 'Only you' : 'Team'}
						</span>
						{showDefault && credential.is_default && (
							<span className='bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400 rounded-full px-2 py-0.5 text-[11px] font-bold'>
								Default
							</span>
						)}
						<span
							className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${status.className}`}>
							<status.icon size={11} />
							{status.label}
						</span>
					</div>
					<p className='mt-1 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
						<code className='font-mono text-zinc-500 dark:text-zinc-400'>
							{credential.key_hint}
						</code>
						{' · '}
						{lastUsed ? `Last used ${lastUsed}` : 'Not used yet'}
						{lastChecked && ` · Checked ${lastChecked}`}
					</p>
					{credential.validation_status !== 'valid' && credential.validation_message && (
						<p className='mt-1 text-xs font-medium text-red-600 dark:text-red-400'>
							{credential.validation_message}
						</p>
					)}
				</div>
			</div>

			{credential.can_manage && (
				<div className='flex shrink-0 items-center gap-1 pl-12 sm:pl-0'>
					{isBusy ? (
						<Spinner color='primary' className='mx-2 size-4' />
					) : (
						<>
							<IconButton label='Check key now' onClick={onValidate}>
								<RefreshCw size={15} />
							</IconButton>
							{showDefault && !credential.is_default && (
								<IconButton label='Make default' onClick={onSetDefault}>
									<Star size={15} />
								</IconButton>
							)}
						</>
					)}
					<IconButton label='Edit key' onClick={onEdit}>
						<Pencil size={15} />
					</IconButton>
					<IconButton label='Remove key' onClick={onRemove} danger>
						<Trash2 size={15} />
					</IconButton>
				</div>
			)}
		</li>
	);
};

const IconButton = ({
	label,
	onClick,
	danger,
	children,
}: {
	label: string;
	onClick: () => void;
	danger?: boolean;
	children: ReactNode;
}) => (
	<button
		type='button'
		aria-label={label}
		title={label}
		onClick={onClick}
		className={`rounded-lg p-2 text-zinc-400 transition ${
			danger
				? 'hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10'
				: 'hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
		}`}>
		{children}
	</button>
);

export default AiProvidersPage;
