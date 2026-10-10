import { useState } from 'react';
import type { FormEvent } from 'react';
import classNames from 'classnames';
import {
	AlertTriangle,
	ArrowLeft,
	Check,
	CheckCircle2,
	ExternalLink,
	Eye,
	EyeOff,
	Loader2,
	User,
	Users,
} from 'lucide-react';
import { ApiError } from '@/api/core';
import { useCreateAiProviderCredential } from '@/api/modules/ai-providers';
import type {
	TAiProvider,
	TAiProviderCredential,
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
import { keyFormatHint } from '../_helper/keyFormat.helper';
import ProviderLogo from './ProviderLogo.partial';

type TStep = 'provider' | 'details' | 'checking' | 'done';

const steps: { id: TStep; label: string }[] = [
	{ id: 'provider', label: 'Provider' },
	{ id: 'details', label: 'Key' },
	{ id: 'done', label: 'Check' },
];

const scopeOptions: {
	value: TAiProviderCredentialScope;
	label: string;
	description: string;
	icon: typeof User;
}[] = [
	{
		value: 'team',
		label: 'Everyone in this workspace',
		description: "Used for every member's AI, unless they've added their own key.",
		icon: Users,
	},
	{
		value: 'personal',
		label: 'Only me',
		description: 'Used only for AI you run. Nobody else can see or use it.',
		icon: User,
	},
];

interface IConnectKeyModalProps {
	ws: string;
	providers: TAiProvidersResult;
	initialProvider: string | null;
	onClose: () => void;
}

const ConnectKeyModal = ({ ws, providers, initialProvider, onClose }: IConnectKeyModalProps) => {
	const createKey = useCreateAiProviderCredential(ws);

	const [step, setStep] = useState<TStep>(initialProvider ? 'details' : 'provider');
	const [providerKey, setProviderKey] = useState(initialProvider ?? '');
	const [apiKey, setApiKey] = useState('');
	const [showKey, setShowKey] = useState(false);
	const [name, setName] = useState('');
	const [scope, setScope] = useState<TAiProviderCredentialScope>(
		providers.can_add_team ? 'team' : 'personal',
	);
	const [keyError, setKeyError] = useState<string | undefined>();
	const [saved, setSaved] = useState<TAiProviderCredential | null>(null);

	const provider = providers.providers.find((p) => p.key === providerKey);
	const hint = keyFormatHint(apiKey, provider, providers.providers);
	const canAdd = (value: TAiProviderCredentialScope) =>
		value === 'team' ? providers.can_add_team : providers.can_add_personal;
	const activeIndex = steps.findIndex((s) => s.id === (step === 'checking' ? 'done' : step));

	const chooseProvider = (p: TAiProvider) => {
		setProviderKey(p.key);
		setKeyError(undefined);
		setStep('details');
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!apiKey.trim()) return;
		setKeyError(undefined);
		setStep('checking');
		try {
			const credential = await createKey.mutateAsync({
				execution_provider: providerKey,
				api_key: apiKey.trim(),
				name: name.trim() || null,
				scope,
			});
			setSaved(credential);
			setStep('done');
		} catch (error) {
			setStep('details');
			if (ApiError.is(error) && error.status === 422) {
				setKeyError(
					error.field('api_key') ??
						error.field('scope') ??
						error.field('execution_provider') ??
						error.message,
				);
			}
		}
	};

	return (
		<Modal isOpen setIsOpen={(open) => !open && onClose()} size='md'>
			<ModalHeader setIsOpen={onClose}>
				<div className='flex items-center gap-3'>
					{provider && step !== 'provider' ? (
						<ProviderLogo provider={provider.key} label={provider.label} size='sm' />
					) : null}
					<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						{step === 'provider' ? 'Connect a provider' : `Connect ${provider?.label}`}
					</span>
				</div>
			</ModalHeader>

			<ModalBody>
				<ol className='mb-5 flex items-center gap-2' aria-label='Progress'>
					{steps.map((s, index) => {
						const done = index < activeIndex || step === 'done';
						const current = index === activeIndex && step !== 'done';
						return (
							<li key={s.id} className='flex flex-1 items-center gap-2'>
								<span
									className={classNames(
										'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black',
										done && 'bg-primary-400 text-primary-950',
										current &&
											'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900',
										!done &&
											!current &&
											'bg-zinc-100 text-zinc-400 dark:bg-zinc-800',
									)}>
									{done ? <Check size={12} className='stroke-[3]' /> : index + 1}
								</span>
								<span
									className={classNames(
										'text-xs font-bold',
										current || done
											? 'text-zinc-900 dark:text-zinc-100'
											: 'text-zinc-400',
									)}>
									{s.label}
								</span>
								{index < steps.length - 1 && (
									<span className='h-px flex-1 bg-zinc-200 dark:bg-zinc-700' />
								)}
							</li>
						);
					})}
				</ol>

				{step === 'provider' && (
					<div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
						{providers.providers.map((p) => (
							<button
								key={p.key}
								type='button'
								onClick={() => chooseProvider(p)}
								className='hover:border-primary-400 flex flex-col items-start gap-2 rounded-xl border border-zinc-200 bg-white p-3 text-left transition dark:border-zinc-700 dark:bg-zinc-900'>
								<ProviderLogo provider={p.key} label={p.label} size='sm' />
								<span className='text-sm font-bold text-zinc-900 dark:text-zinc-100'>
									{p.label}
								</span>
								<span className='text-[11px] font-medium text-zinc-400'>
									{p.models.length > 0
										? `${p.models.length} model${p.models.length === 1 ? '' : 's'}`
										: p.covers_knowledge_base
											? 'Knowledge base'
											: 'No models yet'}
								</span>
							</button>
						))}
					</div>
				)}

				{(step === 'details' || step === 'checking') && provider && (
					<form id='connect-key-form' onSubmit={handleSubmit} className='space-y-5'>
						{!initialProvider && (
							<button
								type='button'
								onClick={() => setStep('provider')}
								disabled={step === 'checking'}
								className='inline-flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'>
								<ArrowLeft size={12} />
								Choose a different provider
							</button>
						)}

						{provider.key_guide.length > 0 && (
							<div className='rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/60'>
								<p className='text-xs font-black text-zinc-700 dark:text-zinc-200'>
									Where to find your {provider.label} key
								</p>
								<ol className='mt-2 space-y-1.5'>
									{provider.key_guide.map((line, index) => (
										<li
											key={line}
											className='flex gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300'>
											<span className='flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300'>
												{index + 1}
											</span>
											{line}
										</li>
									))}
								</ol>
								<a
									href={provider.key_url}
									target='_blank'
									rel='noreferrer'
									className='text-primary-700 dark:text-primary-400 mt-3 inline-flex items-center gap-1 text-xs font-bold hover:underline'>
									Open {provider.label} keys page
									<ExternalLink size={12} />
								</a>
							</div>
						)}

						<div>
							<div className='relative'>
								<Validation
									isValid={!keyError}
									isTouched={!!keyError}
									invalidFeedback={keyError}>
									<Input
										label='API key'
										name='api_key'
										type={showKey ? 'text' : 'password'}
										autoComplete='off'
										spellCheck={false}
										required
										disabled={step === 'checking'}
										value={apiKey}
										onChange={(e) => {
											setApiKey(e.target.value);
											setKeyError(undefined);
										}}
										placeholder={
											provider.key_placeholder ?? 'Paste your API key'
										}
										variant='default'
										dimension='default'
										className='pe-11'
									/>
								</Validation>
								<button
									type='button'
									onClick={() => setShowKey((v) => !v)}
									aria-label={showKey ? 'Hide key' : 'Show key'}
									className='absolute end-2 top-[30px] rounded-lg p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'>
									{showKey ? <EyeOff size={15} /> : <Eye size={15} />}
								</button>
							</div>
							{!keyError && hint?.kind === 'other-provider' && (
								<div className='mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'>
									<AlertTriangle size={13} className='shrink-0' />
									<span>This looks like a {hint.provider.label} key.</span>
									<button
										type='button'
										onClick={() => setProviderKey(hint.provider.key)}
										className='font-bold underline underline-offset-2'>
										Switch to {hint.provider.label}
									</button>
								</div>
							)}
							{!keyError && hint?.kind === 'unexpected-prefix' && (
								<p className='mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400'>
									<AlertTriangle size={13} className='shrink-0' />
									{provider.label} keys usually start with “{hint.prefix}”. Check
									it was copied in full.
								</p>
							)}
						</div>

						<Input
							label='Name (optional)'
							name='name'
							value={name}
							disabled={step === 'checking'}
							onChange={(e) => setName(e.target.value)}
							placeholder={`e.g. ${provider.label} production key`}
							variant='default'
							dimension='default'
						/>

						<div>
							<div className='mb-2 block text-sm font-bold text-zinc-700 dark:text-zinc-300'>
								Who uses this key
							</div>
							<div className='grid gap-2 sm:grid-cols-2'>
								{scopeOptions.map((option) => {
									const selected = scope === option.value;
									const allowed = canAdd(option.value);
									return (
										<button
											key={option.value}
											type='button'
											disabled={!allowed || step === 'checking'}
											aria-pressed={selected}
											aria-label={option.label}
											onClick={() => setScope(option.value)}
											className={classNames(
												'flex items-start gap-3 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50',
												selected
													? 'border-primary-400 bg-primary-50/60 dark:border-primary-500/60 dark:bg-primary-950/20'
													: 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900',
											)}>
											<option.icon
												size={15}
												className='mt-0.5 shrink-0 text-zinc-500'
											/>
											<div className='min-w-0'>
												<p className='text-sm font-bold text-zinc-900 dark:text-zinc-100'>
													{option.label}
												</p>
												<p className='mt-0.5 text-xs font-medium text-zinc-400 dark:text-zinc-500'>
													{allowed
														? option.description
														: option.value === 'team'
															? 'Only owners and admins can add team keys.'
															: 'Personal keys are turned off in this workspace.'}
												</p>
											</div>
										</button>
									);
								})}
							</div>
						</div>

						{step === 'checking' && (
							<div
								role='status'
								className='flex items-center gap-2 rounded-xl bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200'>
								<Loader2 size={16} className='text-primary-600 animate-spin' />
								Checking the key with {provider.label}…
							</div>
						)}
					</form>
				)}

				{step === 'done' && provider && saved && (
					<div className='py-2 text-center'>
						<div
							className={classNames(
								'mx-auto flex h-14 w-14 items-center justify-center rounded-2xl',
								saved.validation_status === 'valid'
									? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
									: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
							)}>
							{saved.validation_status === 'valid' ? (
								<CheckCircle2 size={28} />
							) : (
								<AlertTriangle size={28} />
							)}
						</div>
						<h3 className='mt-4 text-lg font-black text-zinc-900 dark:text-white'>
							{saved.validation_status === 'valid'
								? `${provider.label} is connected`
								: 'Key saved, not checked yet'}
						</h3>
						<p className='mx-auto mt-1 max-w-sm text-sm font-medium text-zinc-500 dark:text-zinc-400'>
							{saved.validation_status === 'valid'
								? saved.scope === 'team'
									? 'Everyone in this workspace now runs these models on your key.'
									: 'Your AI now runs these models on your own key.'
								: `We couldn't reach ${provider.label} just now. We'll check the key again shortly and start using it once it works.`}
						</p>
						{(provider.models.length > 0 || provider.covers_knowledge_base) && (
							<div className='mt-4 flex flex-wrap justify-center gap-1.5'>
								{provider.models.map((model) => (
									<span
										key={model}
										className='rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
										{model}
									</span>
								))}
								{provider.covers_knowledge_base && (
									<span className='rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
										Knowledge base
									</span>
								)}
							</div>
						)}
					</div>
				)}
			</ModalBody>

			<ModalFooter>
				<ModalFooterChild className='flex w-full items-center justify-between gap-3'>
					<p className='text-[11px] font-medium text-zinc-400'>
						{step === 'done' ? '' : 'Encrypted at rest · never shown again'}
					</p>
					<div className='flex gap-3'>
						{step === 'done' ? (
							<Button
								variant='solid'
								color='primary'
								onClick={onClose}
								className='shadow-primary-500/10 h-11 font-bold text-zinc-950 shadow-md'>
								Done
							</Button>
						) : (
							<>
								<Button
									variant='outline'
									color='zinc'
									onClick={onClose}
									className='h-11 border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50'>
									Cancel
								</Button>
								{step !== 'provider' && (
									<Button
										type='submit'
										form='connect-key-form'
										variant='solid'
										color='primary'
										isLoading={step === 'checking'}
										isDisable={!apiKey.trim()}
										className='shadow-primary-500/10 h-11 font-bold text-zinc-950 shadow-md'>
										Check & connect
									</Button>
								)}
							</>
						)}
					</div>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default ConnectKeyModal;
