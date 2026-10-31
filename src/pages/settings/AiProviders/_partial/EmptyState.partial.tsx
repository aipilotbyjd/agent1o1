import { KeyRound, Plus, ShieldCheck, Wallet, Zap } from 'lucide-react';
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

const EmptyState = ({ canAdd, onConnect }: { canAdd: boolean; onConnect: () => void }) => (
	<div className='mb-8 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/40 px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-950/20'>
		<div className='bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl'>
			<KeyRound size={22} />
		</div>
		<h2 className='mt-4 text-xl font-black text-zinc-900 dark:text-white'>
			Bring your own AI keys
		</h2>
		<p className='mx-auto mt-1 max-w-md text-sm font-medium text-zinc-500 dark:text-zinc-400'>
			Connect OpenAI, Anthropic, OpenRouter and more. Your agents keep working the same way,
			on your own account.
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
		{canAdd && (
			<button type='button' onClick={onConnect} className={`${primaryBtn} mt-6`}>
				<Plus size={16} />
				Connect a provider
			</button>
		)}
	</div>
);

export default EmptyState;
