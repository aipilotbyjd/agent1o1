import { Loader2 } from 'lucide-react';
import type { TAiProvider } from '@/types/ai-provider.type';
import ProviderLogo from '@/components/ai/ProviderLogo';

interface IConnectProviderGridProps {
	providers: TAiProvider[];
	canAdd: boolean;
	onConnect: (provider: string) => void;
	/** One-click connect, for providers that offer it. */
	onOneClick: (provider: string) => void;
	/** The provider whose one-click sign-in is open right now. */
	oneClickPending: string | null;
}

const modelSummary = (provider: TAiProvider) =>
	provider.models.length > 0
		? `${provider.models.length} model${provider.models.length === 1 ? '' : 's'}${provider.covers_knowledge_base ? ' · Knowledge base' : ''}`
		: provider.covers_knowledge_base
			? 'Knowledge base'
			: 'No models yet';

/**
 * Providers with one-click connect come first: they're the fastest way in.
 */
const ConnectProviderGrid = ({
	providers,
	canAdd,
	onConnect,
	onOneClick,
	oneClickPending,
}: IConnectProviderGridProps) => {
	const sorted = [...providers].sort((a, b) => Number(!!b.connect) - Number(!!a.connect));

	return (
		<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
			{sorted.map((provider) => (
				<div
					key={provider.key}
					className='flex flex-col gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/40'>
					<div className='flex items-center gap-3'>
						<ProviderLogo provider={provider.key} label={provider.label} />
						<div className='min-w-0 flex-1'>
							<p className='truncate text-sm font-black text-zinc-900 dark:text-zinc-100'>
								{provider.label}
							</p>
							<p
								className='truncate text-xs font-medium text-zinc-400 dark:text-zinc-500'
								title={provider.models.join(', ')}>
								{modelSummary(provider)}
							</p>
						</div>
						{canAdd && !provider.connect && (
							<button
								type='button'
								onClick={() => onConnect(provider.key)}
								aria-label={`Connect ${provider.label}`}
								className='shrink-0 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'>
								Connect
							</button>
						)}
					</div>

					{provider.free_tier && (
						<p className='rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'>
							{provider.free_tier}
						</p>
					)}

					{canAdd && provider.connect && (
						<div className='flex items-center gap-2'>
							<button
								type='button'
								onClick={() => onOneClick(provider.key)}
								disabled={oneClickPending !== null}
								className='bg-primary-400 text-primary-950 hover:bg-primary-300 inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black transition disabled:opacity-60'>
								{oneClickPending === provider.key && (
									<Loader2 size={13} className='animate-spin' />
								)}
								{provider.connect.label}
							</button>
							<button
								type='button'
								onClick={() => onConnect(provider.key)}
								className='h-9 shrink-0 rounded-xl border border-zinc-200 px-3 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'>
								Paste a key
							</button>
						</div>
					)}
				</div>
			))}
		</div>
	);
};

export default ConnectProviderGrid;
