import { useState } from 'react';
import type { FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import { ApiError } from '@/api/core';
import { useUpdateAiProviderCredential } from '@/api/modules/ai-providers';
import type {
	TAiProviderCredential,
	TUpdateAiProviderCredentialDto,
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

interface IEditKeyModalProps {
	ws: string;
	credential: TAiProviderCredential;
	onClose: () => void;
}

const EditKeyModal = ({ ws, credential, onClose }: IEditKeyModalProps) => {
	const updateKey = useUpdateAiProviderCredential(ws);

	const [name, setName] = useState(credential.name ?? '');
	const [apiKey, setApiKey] = useState('');
	const [keyError, setKeyError] = useState<string | undefined>();

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setKeyError(undefined);

		const body: TUpdateAiProviderCredentialDto = { name: name.trim() || null };
		if (apiKey.trim()) body.api_key = apiKey.trim();

		try {
			await updateKey.mutateAsync({ id: credential.id, body });
			onClose();
		} catch (error) {
			if (ApiError.is(error) && error.status === 422) {
				setKeyError(error.field('api_key') ?? error.message);
			}
		}
	};

	return (
		<Modal isOpen setIsOpen={(open) => !open && onClose()} size='sm'>
			<ModalHeader setIsOpen={onClose}>
				<div className='flex items-center gap-3'>
					<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
						<KeyRound size={18} />
					</div>
					<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						Edit {credential.provider_label} key
					</span>
				</div>
			</ModalHeader>
			<form onSubmit={handleSubmit}>
				<ModalBody>
					<div className='space-y-5 pt-2'>
						<Input
							label='Name (optional)'
							name='name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							variant='default'
							dimension='default'
						/>
						<div>
							<Validation
								isValid={!keyError}
								isTouched={!!keyError}
								invalidFeedback={keyError}>
								<Input
									label='Replace key (optional)'
									name='api_key'
									type='password'
									autoComplete='off'
									value={apiKey}
									onChange={(e) => {
										setApiKey(e.target.value);
										setKeyError(undefined);
									}}
									placeholder={`Current: ${credential.key_hint ?? 'hidden'}`}
									variant='default'
									dimension='default'
								/>
							</Validation>
							<p className='mt-2 text-xs font-medium text-zinc-400 dark:text-zinc-500'>
								Leave empty to keep the current key. A new key is checked with{' '}
								{credential.provider_label} before it replaces the old one.
							</p>
						</div>
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
							isLoading={updateKey.isPending}
							className='shadow-primary-500/10 h-11 font-bold text-zinc-950 shadow-md'>
							{apiKey.trim() ? 'Check & save' : 'Save'}
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default EditKeyModal;
