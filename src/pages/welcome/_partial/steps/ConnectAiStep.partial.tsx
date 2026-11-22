import { useMemo, useState } from 'react';
import {
	ArrowRight,
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
import StepHeading from '../shared/StepHeading.partial';
import WizardButton from '../shared/WizardButton.partial';

type TProps = {
	ws: string;
	onContinue: () => void;
	isSaving: boolean;
};

const modelCount = (provider: TAiProvider) =>
	provider.models.length > 0
		? `${provider.models.length} model${provider.models.length === 1 ? '' : 's'}`
		: null;

/**
 * Onboarding's "Connect AI" step (`connect_ai`): bring your own AI key before
 * building anything. One-click providers come first (sign in and approve,
 * nothing to copy), then providers with a free tier, then "paste any key".
 * Required: there is no platform model, so the first run needs a key of the
 * workspace's own.
 */
const ConnectAiStep = ({ ws, onContinue, isSaving }: TProps) => {
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
	const hasKey = connectedKeys.size > 0;
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
		`flex items-center justify-between gap-3 rounded-xl border p-3 ${connected ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'}`;

	const connectedBadge = (
		<span className='flex h-7 items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 text-xs font-bold text-emerald-600 dark:text-emerald-400'>
			<CheckCircle2 size={12} />
			Connected
		</span>
	);

	return (
		<div className='mx-auto flex max-w-2xl flex-col gap-6'>
			<StepHeading
				title='Connect your AI'
				description='Your workflows think with your own AI account: you pay the provider directly, at their prices, with no markup. Several providers have a free tier to start on.'
			/>

			{!ws || providersQuery.isLoading ? (
				<div className='flex items-center justify-center gap-2 py-8 text-xs font-bold text-slate-400'>
					<Loader2 className='h-4 w-4 animate-spin' />
					Loading AI providers...
				</div>
			) : !canAdd ? (
				<p className='rounded-xl border border-slate-100 bg-white/40 p-4 text-xs font-medium text-slate-500 dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-400'>
					Your workspace admin manages AI keys here. Ask them to connect a provider, then
					come back to run your first workflow.
				</p>
			) : (
				<div className='space-y-4'>
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

			<div className='flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800'>
				<p className='text-xs font-medium text-zinc-500 dark:text-zinc-400'>
					{hasKey
						? 'Connected. You can add or change providers later in Settings → AI Providers.'
						: 'Connect one provider to continue.'}
				</p>
				<WizardButton
					onClick={onContinue}
					disabled={!hasKey}
					isLoading={isSaving}
					icon={!isSaving ? <ArrowRight className='size-4' /> : undefined}>
					Continue
				</WizardButton>
			</div>

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
		</div>
	);
};

export default ConnectAiStep;
