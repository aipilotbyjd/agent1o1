import { useMemo, useState } from 'react';
import {
	CheckCircle2,
	ExternalLink,
	Gift,
	KeyRound,
	Loader2,
	MousePointerClick,
} from 'lucide-react';
import { ApiError, notify } from '@/api/core';
import {
	useAiProviderCredentials,
	useAiProviders,
	useConnectAiProvider,
} from '@/api/modules/ai-providers';
import type { TAiProvider } from '@/types/ai-provider.type';
import ProviderLogo from '@/components/ai/ProviderLogo';
import ConnectKeyModal from '@/pages/settings/AiProviders/_partial/ConnectKeyModal.partial';
import { useOnboardingWorkspaceId } from '../../_hooks/useOnboardingWorkspace.hook';

const modelCount = (provider: TAiProvider) =>
	provider.models.length > 0
		? `${provider.models.length} model${provider.models.length === 1 ? '' : 's'}`
		: null;

/**
 * Onboarding's "Connect AI" step (`connect_ai`): bring your own AI key before
 * building anything. One-click providers come first (sign in and approve,
 * nothing to copy), then providers with a free tier, then "paste any key".
 * Skippable: the workspace can start on the platform's starter model and
 * connect later in Settings → AI Providers.
 */
const ConnectAiStep = () => {
	const ws = useOnboardingWorkspaceId();
	const providersQuery = useAiProviders(ws);
	const credentialsQuery = useAiProviderCredentials(ws);
	const connectProvider = useConnectAiProvider(ws);
	const [pasting, setPasting] = useState<string | null | undefined>(undefined);

	const providers = providersQuery.data;
	const connectedKeys = useMemo(
		() =>
			new Set(
				(credentialsQuery.data ?? [])
					.filter((c) => c.validation_status !== 'invalid')
					.map((c) => c.execution_provider),
			),
		[credentialsQuery.data],
	);
	const oneClick = (providers?.providers ?? []).filter((p) => p.connect);
	const freeTier = (providers?.providers ?? []).filter((p) => p.free_tier && !p.connect);
	const canAdd = !!providers && (providers.can_add_team || providers.can_add_personal);
	const pending = connectProvider.isPending ? connectProvider.variables : null;

	const handleOneClick = async (provider: TAiProvider) => {
		try {
			await connectProvider.mutateAsync(provider.key);
			notify.success(`${provider.label} connected.`);
		} catch (error) {
			notify.error(ApiError.is(error) ? error.message : 'Could not connect. Try again.');
		}
	};

	const rowClass = (connected: boolean) =>
		`flex items-center justify-between gap-3 rounded-xl border p-3 ${connected ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-100 bg-white/40 dark:border-zinc-800/80 dark:bg-zinc-950/20'}`;

	const connectedBadge = (
		<span className='flex h-7 items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 text-xs font-bold text-emerald-600 dark:text-emerald-400'>
			<CheckCircle2 size={12} />
			Connected
		</span>
	);

	return (
		<>
			<div>
				<h1 className='text-3xl leading-tight font-extrabold tracking-tight text-slate-950 dark:text-zinc-50'>
					Bring your own AI
				</h1>
				<p className='mt-2 text-sm font-medium text-slate-500 dark:text-zinc-400'>
					Your agents run on your own AI account: you pay the provider directly, at their
					prices, with no markup on tokens.
				</p>
			</div>

			{!ws || providersQuery.isLoading ? (
				<div className='flex items-center justify-center gap-2 py-8 text-xs font-bold text-slate-400'>
					<Loader2 className='h-4 w-4 animate-spin' />
					Loading AI providers...
				</div>
			) : !canAdd ? (
				<p className='rounded-xl border border-slate-100 bg-white/40 p-4 text-xs font-medium text-slate-500 dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-400'>
					Your workspace admin manages AI keys here. You can carry on.
				</p>
			) : (
				<div className='no-scrollbar max-h-[300px] space-y-4 overflow-y-auto pr-1'>
					{oneClick.length > 0 && (
						<section className='space-y-2'>
							<p className='flex items-center gap-1.5 text-[10px] font-black tracking-wider text-slate-400 uppercase'>
								<MousePointerClick size={12} />
								One click, no key to copy
							</p>
							{oneClick.map((provider) => {
								const connected = connectedKeys.has(provider.key);
								return (
									<div key={provider.key} className={rowClass(connected)}>
										<div className='flex min-w-0 items-center gap-3'>
											<ProviderLogo
												provider={provider.key}
												label={provider.label}
												size='sm'
											/>
											<div className='min-w-0'>
												<p className='text-xs font-bold text-slate-900 dark:text-zinc-50'>
													{provider.label}
												</p>
												<p className='truncate text-[10px] text-slate-400'>
													{[modelCount(provider), provider.free_tier]
														.filter(Boolean)
														.join(' · ')}
												</p>
											</div>
										</div>
										{connected ? (
											connectedBadge
										) : (
											<button
												type='button'
												onClick={() => handleOneClick(provider)}
												disabled={pending !== null}
												className='flex h-7 shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-black text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 dark:bg-zinc-100 dark:text-slate-950'>
												{pending === provider.key && (
													<Loader2 size={12} className='animate-spin' />
												)}
												{provider.connect?.label}
											</button>
										)}
									</div>
								);
							})}
						</section>
					)}

					{freeTier.length > 0 && (
						<section className='space-y-2'>
							<p className='flex items-center gap-1.5 text-[10px] font-black tracking-wider text-slate-400 uppercase'>
								<Gift size={12} />
								Free to start
							</p>
							{freeTier.map((provider) => {
								const connected = connectedKeys.has(provider.key);
								return (
									<div key={provider.key} className={rowClass(connected)}>
										<div className='flex min-w-0 items-center gap-3'>
											<ProviderLogo
												provider={provider.key}
												label={provider.label}
												size='sm'
											/>
											<div className='min-w-0'>
												<p className='text-xs font-bold text-slate-900 dark:text-zinc-50'>
													{provider.label}
												</p>
												<p className='truncate text-[10px] text-slate-400'>
													{provider.free_tier}
												</p>
											</div>
										</div>
										{connected ? (
											connectedBadge
										) : (
											<div className='flex shrink-0 items-center gap-1.5'>
												<a
													href={provider.key_url}
													target='_blank'
													rel='noreferrer'
													className='flex h-7 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'>
													Get free key
													<ExternalLink size={11} />
												</a>
												<button
													type='button'
													onClick={() => setPasting(provider.key)}
													className='flex h-7 items-center rounded-lg bg-slate-900 px-3 text-xs font-black text-white hover:opacity-90 dark:bg-zinc-100 dark:text-slate-950'>
													Paste key
												</button>
											</div>
										)}
									</div>
								);
							})}
						</section>
					)}

					<button
						type='button'
						onClick={() => setPasting(null)}
						className='flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 p-3 text-xs font-bold text-slate-600 transition hover:bg-white/60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900/40'>
						<KeyRound size={13} />I have a key from another provider (OpenAI, Anthropic,
						...)
					</button>
				</div>
			)}

			<p className='text-[11px] font-medium text-slate-400'>
				No key yet? Skip this step to start on the free starter model, and connect later in
				Settings → AI Providers.
			</p>

			{pasting !== undefined && providers && (
				<ConnectKeyModal
					ws={ws}
					providers={providers}
					initialProvider={pasting}
					onOneClick={(key) => {
						const provider = providers.providers.find((p) => p.key === key);
						if (provider) void handleOneClick(provider);
					}}
					onClose={() => setPasting(undefined)}
				/>
			)}
		</>
	);
};

export default ConnectAiStep;
