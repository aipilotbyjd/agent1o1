import { useState } from 'react';
import type { FormEvent } from 'react';
import { ExternalLink, Plus, User, Users } from 'lucide-react';
import { ApiError } from '@/api/core';
import { useCreateAiProviderCredential } from '@/api/modules/ai-providers';
import type {
	TAiProvider,
	TAiProviderCredentialScope,
	TAiProvidersResult,
} from '@/types/ai-provider.type';
import Button from '@/components/ui/Button';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Validation from '@/components/form/Validation';
import Select from '@/components/form/Select';

type TScopeOption = {
	value: TAiProviderCredentialScope;
	label: string;
	description: string;
	icon: typeof User;
};

const scopeOptions: TScopeOption[] = [
	{
		value: 'personal',
		label: 'Only me',
		description: 'Used for AI you run yourself. Nobody else can see or use it.',
		icon: User,
	},
	{
		value: 'team',
		label: 'Everyone in this workspace',
		description: "Used for every member's AI calls, unless they've added their own key.",
		icon: Users,
	},
];

interface IAddKeyModalProps {
	ws: string;
	providers: TAiProvidersResult;
	initialProvider: string | null;
	onClose: () => void;
}

const AddKeyModal = ({ ws, providers, initialProvider, onClose }: IAddKeyModalProps) => {
	const createKey = useCreateAiProviderCredential(ws);

	const [providerKey, setProviderKey] = useState(
		initialProvider ?? providers.providers[0]?.key ?? '',
	);
	const [apiKey, setApiKey] = useState('');
	const [name, setName] = useState('');
	const [scope, setScope] = useState<TAiProviderCredentialScope>(
		providers.can_add_team ? 'team' : 'personal',
	);
	const [keyError, setKeyError] = useState<string | undefined>();

	const provider: TAiProvider | undefined = providers.providers.find(
		(p) => p.key === providerKey,
	);
	const canAdd = (value: TAiProviderCredentialScope) =>
		value === 'team' ? providers.can_add_team : providers.can_add_personal;

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setKeyError(undefined);
		try {
			await createKey.mutateAsync({
				execution_provider: providerKey,
				api_key: apiKey.trim(),
				name: name.trim() || null,
				scope,
			});
			onClose();
		} catch (error) {
			if (ApiError.is(error) && error.status === 422) {
				setKeyError(
					error.field('api_key') ?? error.field('execution_provider') ?? error.message,
				);
			}
		}
	};

	return (
		<Modal isOpen setIsOpen={(open) => !open && onClose()} size='md'>
			<ModalHeader setIsOpen={onClose}>
				<div className='flex items-center gap-3'>
					<div className='bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex h-9 w-9 items-center justify-center rounded-xl'>
						<Plus size={18} />
					</div>
					<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						Add your own key
					</span>
				</div>
			</ModalHeader>
			<form onSubmit={handleSubmit}>
				<ModalBody>
					<div className='space-y-5 pt-2'>
						<Select
							label='Provider'
							name='execution_provider'
							value={providerKey}
							onChange={(e) => {
								setProviderKey(e.target.value);
								setKeyError(undefined);
							}}
							variant='default'
							dimension='default'>
							{providers.providers.map((p) => (
								<option key={p.key} value={p.key}>
									{p.label}
								</option>
							))}
						</Select>

						<div>
							<Validation
								isValid={!keyError}
								isTouched={!!keyError}
								invalidFeedback={keyError}>
								<Input
									label='API key'
									name='api_key'
									type='password'
									autoComplete='off'
									required
									value={apiKey}
									onChange={(e) => {
										setApiKey(e.target.value);
										setKeyError(undefined);
									}}
									placeholder={provider?.key_placeholder ?? 'Paste your API key'}
									variant='default'
									dimension='default'
								/>
							</Validation>
							{provider && (
								<a
									href={provider.key_url}
									target='_blank'
									rel='noreferrer'
									className='text-primary-700 dark:text-primary-400 mt-2 inline-flex items-center gap-1 text-xs font-bold hover:underline'>
									Get a {provider.label} API key
									<ExternalLink size={12} />
								</a>
							)}
						</div>

						<Input
							label='Name (optional)'
							name='name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder={`e.g. ${provider?.label ?? 'Provider'} production key`}
							variant='default'
							dimension='default'
						/>

						<div>
							<div className='mb-2 block text-sm font-bold text-zinc-700 dark:text-zinc-300'>
								Who uses this key
							</div>
							<div className='space-y-2'>
								{scopeOptions.map((option) => {
									const selected = scope === option.value;
									const allowed = canAdd(option.value);
									return (
										<button
											key={option.value}
											type='button'
											disabled={!allowed}
											aria-pressed={selected}
											aria-label={option.label}
											onClick={() => setScope(option.value)}
											className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
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
													{allowed
														? option.description
														: 'Only workspace owners and admins can add this.'}
												</p>
											</div>
										</button>
									);
								})}
							</div>
						</div>

						<p className='rounded-xl bg-zinc-50 px-4 py-3 text-xs font-medium text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400'>
							We check the key with {provider?.label ?? 'the provider'} before saving
							it. It's stored encrypted and is never shown again.
						</p>
					</div>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild className='flex w-full justify-end gap-3'>
						<Button
							variant='outline'
							color='zinc'
							onClick={onClose}
							className='h-11 border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50'>
							Cancel
						</Button>
						<Button
							type='submit'
							variant='solid'
							color='primary'
							isLoading={createKey.isPending}
							isDisable={!apiKey.trim() || !providerKey}
							className='shadow-primary-500/10 h-11 font-bold text-zinc-950 shadow-md'>
							Check & save key
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default AddKeyModal;
