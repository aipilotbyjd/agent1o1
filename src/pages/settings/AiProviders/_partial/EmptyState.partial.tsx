import { KeyRound, Loader2, Plus, ShieldCheck, Wallet, Zap } from 'lucide-react';
import type { TAiProvider } from '@/types/ai-provider.type';
import ProviderLogo from '@/components/ai/ProviderLogo';
import { primaryBtn } from '../../_shared/buttons';

const benefits = [
	{
		icon: Wallet,
		title: 'Pay your provider directly',
		body: 'AI calls are billed to your own account at the provider, at their prices.',
	},
	{
		icon: Zap,
		title: '0 token credits',
		body: 'Tokens on your key cost no credits. Only run, tool and processing credits apply.',
	},
	{
		icon: ShieldCheck,
		title: 'Your key stays private',
		body: 'Encrypted at rest, never shown again, and used only for this workspace.',
	},
];

interface IEmptyStateProps {
	canAdd: boolean;
	onConnect: () => void;
	/** Providers with one-click connect, offered first. */
	oneClickProviders: TAiProvider[];
	onOneClick: (provider: string) => void;
	oneClickPending: string | null;
}

const EmptyState = ({
	canAdd,
	onConnect,
	oneClickProviders,
	onOneClick,
	oneClickPending,
}: IEmptyStateProps) => (
	<div className='mb-8 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/40 px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-950/20'>
		<div className='bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl'>
			<KeyRound size={22} />
		</div>
		<h2 className='mt-4 text-xl font-black text-zinc-900 dark:text-white'>
			Bring your own AI keys
		</h2>
		<p className='mx-auto mt-1 max-w-md text-sm font-medium text-zinc-500 dark:text-zinc-400'>
			Connect OpenAI, Anthropic, OpenRouter and more, some in one click and some with a free
			tier. Your agents keep working the same way, on your own account.
		</p>
		<div className='mx-auto mt-6 grid max-w-3xl gap-3 text-left sm:grid-cols-3'>
			{benefits.map((benefit) => (
				<div
					key={benefit.title}
					className='rounded-xl bg-white p-4 shadow-xs dark:bg-zinc-900'>
					<benefit.icon size={16} className='text-primary-600 dark:text-primary-400' />
					<p className='mt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100'>
						{benefit.title}
					</p>
					<p className='mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400'>
						{benefit.body}
					</p>
				</div>
			))}
		</div>
		{canAdd && oneClickProviders.length > 0 && (
			<div className='mt-6'>
				<p className='text-xs font-bold text-zinc-500 dark:text-zinc-400'>
					Fastest: sign in and approve, no key to copy
				</p>
				<div className='mt-2 flex flex-wrap justify-center gap-2'>
					{oneClickProviders.map((provider) => (
						<button
							key={provider.key}
							type='button'
							onClick={() => onOneClick(provider.key)}
							disabled={oneClickPending !== null}
							className={primaryBtn}>
							{oneClickPending === provider.key ? (
								<Loader2 size={16} className='animate-spin' />
							) : (
								<ProviderLogo
									provider={provider.key}
									label={provider.label}
									size='xxs'
								/>
							)}
							{provider.connect?.label}
						</button>
					))}
				</div>
			</div>
		)}
		{canAdd && (
			<button
				type='button'
				onClick={onConnect}
				className={
					oneClickProviders.length > 0
						? 'mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-300'
						: `${primaryBtn} mt-6`
				}>
				<Plus size={16} />
				{oneClickProviders.length > 0 ? 'Or paste any API key' : 'Connect a provider'}
			</button>
		)}
	</div>
);

export default EmptyState;
