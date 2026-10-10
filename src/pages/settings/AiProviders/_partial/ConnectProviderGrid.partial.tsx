import type { TAiProvider } from '@/types/ai-provider.type';
import ProviderLogo from './ProviderLogo.partial';

interface IConnectProviderGridProps {
	providers: TAiProvider[];
	canAdd: boolean;
	onConnect: (provider: string) => void;
}

const ConnectProviderGrid = ({ providers, canAdd, onConnect }: IConnectProviderGridProps) => (
	<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
		{providers.map((provider) => (
			<div
				key={provider.key}
				className='flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/40'>
				<ProviderLogo provider={provider.key} label={provider.label} />
				<div className='min-w-0 flex-1'>
					<p className='truncate text-sm font-black text-zinc-900 dark:text-zinc-100'>
						{provider.label}
					</p>
					<p
						className='truncate text-xs font-medium text-zinc-400 dark:text-zinc-500'
						title={provider.models.join(', ')}>
						{provider.models.length > 0
							? `${provider.models.length} model${provider.models.length === 1 ? '' : 's'}${provider.covers_knowledge_base ? ' · Knowledge base' : ''}`
							: provider.covers_knowledge_base
								? 'Knowledge base'
								: 'No models yet'}
					</p>
				</div>
				{canAdd && (
					<button
						type='button'
						onClick={() => onConnect(provider.key)}
						aria-label={`Connect ${provider.label}`}
						className='shrink-0 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'>
						Connect
					</button>
				)}
			</div>
		))}
	</div>
);

export default ConnectProviderGrid;
