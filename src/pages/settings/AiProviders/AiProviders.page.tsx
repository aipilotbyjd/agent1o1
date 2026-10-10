import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import classNames from 'classnames';
import { Cpu, KeyRound, Plus, User, Users } from 'lucide-react';
import {
	useAiProviderCredentials,
	useAiProviders,
	useDeleteAiProviderCredential,
	useRestoreAiProviderCredential,
	useSetDefaultAiProviderCredential,
	useValidateAiProviderCredential,
} from '@/api/modules/ai-providers';
import { notify } from '@/api/core';
import { useWorkspaceContext } from '@/context/workspace';
import type { TAiProviderCredential } from '@/types/ai-provider.type';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Spinner from '@/components/ui/Spinner';
import { primaryBtn } from '../_shared/buttons';
import ConnectKeyModal from './_partial/ConnectKeyModal.partial';
import ConnectProviderGrid from './_partial/ConnectProviderGrid.partial';
import EditKeyModal from './_partial/EditKeyModal.partial';
import EmptyState from './_partial/EmptyState.partial';
import KeyPolicyCard from './_partial/KeyPolicyCard.partial';
import ProviderCard from './_partial/ProviderCard.partial';

type TTab = 'keys' | 'policy';

const tabs: { id: TTab; label: string }[] = [
	{ id: 'keys', label: 'Keys' },
	{ id: 'policy', label: 'Policy' },
];

const steps = [
	{ icon: User, title: 'Your personal key', body: 'Used first for AI you run yourself.' },
	{
		icon: Users,
		title: "The workspace's team key",
		body: "Used for anyone who hasn't added their own.",
	},
	{
		icon: Cpu,
		title: 'Our key',
		body: "Used when your keys can't run a call, if the policy below allows it. Billed in credits.",
	},
];

const AiProvidersPage = () => {
	const { activeWorkspaceId: ws } = useWorkspaceContext();
	const [searchParams, setSearchParams] = useSearchParams();
	const tab: TTab = searchParams.get('tab') === 'policy' ? 'policy' : 'keys';

	const providersQuery = useAiProviders(ws);
	const credentialsQuery = useAiProviderCredentials(ws);
	const deleteKey = useDeleteAiProviderCredential(ws);
	const restoreKey = useRestoreAiProviderCredential(ws);
	const setDefault = useSetDefaultAiProviderCredential(ws);
	const validateKey = useValidateAiProviderCredential(ws);

	const [connectingFor, setConnectingFor] = useState<string | null | undefined>(undefined);
	const [editing, setEditing] = useState<TAiProviderCredential | null>(null);
	const [removing, setRemoving] = useState<TAiProviderCredential | null>(null);

	const providers = providersQuery.data;
	const credentials = useMemo(() => credentialsQuery.data ?? [], [credentialsQuery.data]);
	const canAdd = !!providers && (providers.can_add_team || providers.can_add_personal);

	const { connected, unconnected } = useMemo(() => {
		const list = providers?.providers ?? [];
		const withKeys = new Set(credentials.map((c) => c.execution_provider));
		return {
			connected: list.filter((p) => withKeys.has(p.key)),
			unconnected: list.filter((p) => !withKeys.has(p.key)),
		};
	}, [providers, credentials]);

	const busyId =
		(validateKey.isPending && validateKey.variables) ||
		(setDefault.isPending && setDefault.variables) ||
		null;

	const switchTab = (next: TTab) =>
		setSearchParams(next === 'keys' ? {} : { tab: next }, { replace: true });

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
		const removed = removing;
		try {
			await deleteKey.mutateAsync(removed.id);
			setRemoving(null);
			notify.withAction(`${removed.name || `${removed.provider_label} key`} removed.`, {
				label: 'Undo',
				onClick: () => restoreKey.mutate(removed.id),
			});
		} catch {
			// Toast is handled by the API hook.
		}
	};

	const isLoading = providersQuery.isLoading || credentialsQuery.isLoading;
	const error = providersQuery.error || credentialsQuery.error;

	return (
		<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
			<div className='mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-center'>
				<div>
					<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
						AI Providers
					</h1>
					<p className='mt-1 max-w-xl text-sm font-medium text-zinc-500 dark:text-zinc-400'>
						Bring your own API keys. AI calls made with your key are billed by the
						provider, not in credits.
					</p>
				</div>
				{canAdd && tab === 'keys' && credentials.length > 0 && (
					<button
						type='button'
						onClick={() => setConnectingFor(null)}
						className={primaryBtn}>
						<Plus size={16} />
						Connect a provider
					</button>
				)}
			</div>

			<div
				role='tablist'
				aria-label='AI Providers sections'
				className='mb-6 flex gap-1 border-b border-zinc-200 dark:border-zinc-800'>
				{tabs.map((t) => (
					<button
						key={t.id}
						type='button'
						role='tab'
						aria-selected={tab === t.id}
						onClick={() => switchTab(t.id)}
						className={classNames(
							'-mb-px border-b-2 px-4 py-2.5 text-sm font-bold transition',
							tab === t.id
								? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
								: 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
						)}>
						{t.label}
						{t.id === 'keys' && credentials.length > 0 && (
							<span className='ms-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
								{credentials.length}
							</span>
						)}
					</button>
				))}
			</div>

			{tab === 'policy' ? (
				<div className='space-y-6'>
					<div className='rounded-2xl border border-zinc-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/40'>
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
							On your own key, AI tokens cost 0 credits. Each run's base credit, tool
							calls and processing time are still billed in credits.
						</p>
					</div>
					<KeyPolicyCard ws={ws} />
				</div>
			) : isLoading ? (
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
				<>
					{connected.length === 0 ? (
						<EmptyState canAdd={canAdd} onConnect={() => setConnectingFor(null)} />
					) : (
						<div className='mb-10 space-y-4'>
							{connected.map((provider) => (
								<ProviderCard
									key={provider.key}
									provider={provider}
									keys={credentials.filter(
										(c) => c.execution_provider === provider.key,
									)}
									canAdd={canAdd}
									busyId={busyId}
									onAdd={() => setConnectingFor(provider.key)}
									onValidate={handleValidate}
									onSetDefault={(credential) => setDefault.mutate(credential.id)}
									onEdit={setEditing}
									onRemove={setRemoving}
								/>
							))}
						</div>
					)}

					{unconnected.length > 0 && (
						<>
							<h2 className='mb-3 text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
								{connected.length === 0
									? 'Available providers'
									: 'Connect another provider'}
							</h2>
							<ConnectProviderGrid
								providers={unconnected}
								canAdd={canAdd}
								onConnect={setConnectingFor}
							/>
						</>
					)}
				</>
			)}

			{connectingFor !== undefined && providers && (
				<ConnectKeyModal
					ws={ws}
					providers={providers}
					initialProvider={connectingFor}
					onClose={() => setConnectingFor(undefined)}
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
						? 'AI calls for this provider will go back to our key and use credits, unless members have their own key or your policy says otherwise.'
						: 'Your AI calls for this provider will go back to the team key, or to our key and use credits.'
				}
				confirmText='Remove key'
				onConfirm={handleRemove}
				onCancel={() => setRemoving(null)}
			/>
		</div>
	);
};

export default AiProvidersPage;
