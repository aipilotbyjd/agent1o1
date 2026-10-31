import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { ApiError } from '@/api/core';
import { useCreateSecret } from '@/api/modules/secrets';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import type { TSecret } from '@/types/secret.type';
import { useEditorWorkspaceId } from '../../_hooks/useEditorWorkspaceId.hook';
import { SECRET_KEY_RE, toSecretKey } from '../../_helper/secretTokens.helper';

const inputCls =
	'focus:border-primary-500 focus:ring-primary-500/25 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-800 outline-none focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100';

type Props = {
	isOpen: boolean;
	/** Prefills the name, e.g. from a reference that has no secret yet. */
	initialKey?: string;
	onClose: () => void;
	/** The new secret, so the caller can drop its reference where it's needed. */
	onCreated?: (secret: TSecret) => void;
};

/**
 * Adds a secret to the workspace's Secrets store without leaving the
 * workflow: the same fields as the Secrets page. The name is shaped into a
 * valid key as it's typed, since only those can be referenced from `{{ }}`.
 */
const NewSecretDialog = ({ isOpen, initialKey = '', onClose, onCreated }: Props) => {
	const ws = useEditorWorkspaceId();
	const create = useCreateSecret(ws);
	const [key, setKey] = useState(() => toSecretKey(initialKey));
	const [value, setValue] = useState('');
	const [description, setDescription] = useState('');
	const [isSecret, setIsSecret] = useState(true);
	const [showValue, setShowValue] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const submit = async (event: FormEvent) => {
		// Rendered in a portal, but React still bubbles the submit to an
		// enclosing form on the canvas.
		event.preventDefault();
		event.stopPropagation();
		const next: Record<string, string> = {};
		if (!SECRET_KEY_RE.test(key))
			next.key = 'Use capital letters, digits and _, starting with a letter.';
		if (!value) next.value = 'Enter a value.';
		setErrors(next);
		if (Object.keys(next).length) return;

		try {
			const secret = await create.mutateAsync({
				key,
				value,
				is_secret: isSecret,
				description: description.trim() || null,
			});
			onCreated?.(secret);
			onClose();
		} catch (error) {
			if (!ApiError.is(error)) return;
			if (error.status === 403) {
				setErrors({ form: 'Only workspace owners and admins can add secrets.' });
				return;
			}
			const fields = error.fieldErrors();
			setErrors({
				key: fields.key ?? '',
				value: fields.value ?? '',
				form: Object.keys(fields).length ? '' : error.message,
			});
		}
	};

	const fieldError = (name: string) =>
		errors[name] ? (
			<p className='mt-1 text-[11px] font-semibold text-rose-500'>{errors[name]}</p>
		) : null;

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && onClose()} size='sm'>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<div className='flex items-center gap-3'>
					<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400'>
						<KeyRound size={16} />
					</div>
					<div>
						<p className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							New secret
						</p>
						<p className='mt-1 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
							Saved to this workspace’s Secrets, encrypted.
						</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<form onSubmit={(event) => void submit(event)} className='space-y-4 pt-1'>
					<div>
						<label
							htmlFor='new-secret-key'
							className='mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
							Name
						</label>
						<input
							id='new-secret-key'
							autoFocus={!initialKey}
							value={key}
							onChange={(event) => setKey(toSecretKey(event.target.value))}
							placeholder='OPENAI_API_KEY'
							className={`${inputCls} font-mono`}
						/>
						{fieldError('key')}
						{key && !errors.key && (
							<p className='mt-1 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
								Used as <code className='font-mono'>{`{{ secrets.${key} }}`}</code>
							</p>
						)}
					</div>

					<div>
						<label
							htmlFor='new-secret-value'
							className='mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
							Value
						</label>
						<div className='relative'>
							<textarea
								id='new-secret-value'
								autoFocus={!!initialKey}
								rows={3}
								value={value}
								onChange={(event) => setValue(event.target.value)}
								placeholder={isSecret ? 'Paste the key or token' : 'eu-west-1'}
								style={
									{
										WebkitTextSecurity:
											isSecret && !showValue ? 'disc' : 'none',
									} as CSSProperties
								}
								className={`${inputCls} resize-none pr-10`}
							/>
							{isSecret && (
								<button
									type='button'
									aria-label={showValue ? 'Hide value' : 'Show value'}
									onClick={() => setShowValue((shown) => !shown)}
									className='absolute top-3 right-3 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'>
									{showValue ? <EyeOff size={15} /> : <Eye size={15} />}
								</button>
							)}
						</div>
						{fieldError('value')}
					</div>

					<div>
						<label
							htmlFor='new-secret-description'
							className='mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
							Description{' '}
							<span className='font-normal text-zinc-400'>(optional)</span>
						</label>
						<input
							id='new-secret-description'
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							placeholder='What it’s for'
							className={inputCls}
						/>
					</div>

					<div className='flex items-center gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700'>
						<button
							id='new-secret-is-secret'
							type='button'
							role='switch'
							aria-checked={isSecret}
							aria-label='Mark as secret'
							onClick={() => setIsSecret((secret) => !secret)}
							className={`relative h-6 w-10 shrink-0 rounded-full transition ${isSecret ? 'bg-primary-400' : 'bg-zinc-200 dark:bg-zinc-600'}`}>
							<span
								className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${isSecret ? 'left-4' : 'left-0.5'}`}
							/>
						</button>
						<label htmlFor='new-secret-is-secret' className='cursor-pointer'>
							<span className='block text-sm font-bold text-zinc-800 dark:text-zinc-200'>
								Mark as secret
							</span>
							<span className='text-xs text-zinc-400 dark:text-zinc-500'>
								Never shown again, and hidden from run results. Turn off for plain
								settings.
							</span>
						</label>
					</div>

					{fieldError('form')}

					<div className='flex justify-end gap-2'>
						<button
							type='button'
							onClick={onClose}
							className='h-10 rounded-xl border border-zinc-200 px-4 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-white/[0.05]'>
							Cancel
						</button>
						<button
							type='submit'
							disabled={create.isPending}
							className='bg-primary-400 text-primary-950 flex h-10 items-center gap-2 rounded-xl px-5 text-xs font-bold shadow-md transition hover:brightness-105 disabled:opacity-50'>
							{create.isPending && <Loader2 size={14} className='animate-spin' />}
							Add secret
						</button>
					</div>
				</form>
			</ModalBody>
		</Modal>
	);
};

export default NewSecretDialog;
