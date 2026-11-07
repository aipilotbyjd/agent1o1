import { useEditorWorkspaceId } from '../../../_hooks/useEditorWorkspaceId.hook';
import { useId, useState } from 'react';
import {
	ArrowLeft,
	ArrowUpRight,
	Check,
	CheckCircle2,
	ExternalLink,
	KeyRound,
	Loader2,
	Plus,
	UserRound,
	Users,
	X,
} from 'lucide-react';
import { useConnectOAuthConnector, useCreateConnectorCredential } from '@/api/modules/connectors';
import type { TConnector, TConnectorData, TConnectorCredentialScope } from '@/types/connector.type';

type Props = {
	connector: TConnector;
	onBack: () => void;
	onClose: () => void;
	onConnected: (id: string) => void;
	onBusyChange: (busy: boolean) => void;
	headingId: string;
	descriptionId: string;
};

const AccountConnectionSetup = ({
	connector,
	onBack,
	onClose,
	onConnected,
	onBusyChange,
	headingId,
	descriptionId,
}: Props) => {
	const activeWorkspaceId = useEditorWorkspaceId();
	const oauth = useConnectOAuthConnector(activeWorkspaceId);
	const create = useCreateConnectorCredential(activeWorkspaceId);
	const [name, setName] = useState('');
	const [scope, setScope] = useState<TConnectorCredentialScope>('personal');
	const [data, setData] = useState<TConnectorData>(() =>
		Object.fromEntries(
			connector.fields
				.filter((field) => field.type === 'boolean')
				.map((field) => [field.name, false]),
		),
	);
	const [error, setError] = useState<string>();
	const [connectedId, setConnectedId] = useState<string>();
	const nameId = useId();
	const scopeName = useId();
	const fieldPrefix = useId();
	const busy = oauth.isPending || create.isPending;
	const ready = Boolean(connectedId);
	const inputClass =
		'mt-2 h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400';
	const submit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!name.trim() || busy) return;
		setError(undefined);
		onBusyChange(true);
		try {
			const id = connector.is_oauth
				? (
						await oauth.mutateAsync({
							connector_id: connector.id,
							name: name.trim(),
							scope,
						})
					).credentialId
				: (
						await create.mutateAsync({
							connector_id: connector.id,
							name: name.trim(),
							scope,
							data,
						})
					).id;
			if (!id) throw new Error('The connection could not be confirmed. Please try again.');
			setConnectedId(id);
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: 'Could not connect this account. Please try again.',
			);
		} finally {
			onBusyChange(false);
		}
	};
	return (
		<form onSubmit={submit} className='flex min-h-0 flex-1 flex-col'>
			<header className='shrink-0 px-6 pt-6 pb-5 sm:px-8 sm:pt-8'>
				<div className='mb-5 flex items-center justify-between'>
					<button
						type='button'
						onClick={onBack}
						disabled={busy}
						className='flex items-center gap-1.5 rounded text-xs text-zinc-500 hover:text-zinc-900 disabled:opacity-40 dark:text-zinc-400 dark:hover:text-white'>
						<ArrowLeft size={14} />
						Accounts
					</button>
					<button
						type='button'
						aria-label='Close account setup'
						onClick={onClose}
						disabled={busy}
						className='rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800'>
						<X size={18} />
					</button>
				</div>
				<div
					className='mb-5 flex items-center gap-2 text-[11px] text-zinc-400'
					aria-label={`Connection progress: ${ready ? 'Account ready' : busy ? 'Connecting' : 'Account details'}`}>
					{['Details', 'Connect', 'Ready'].map((label, index) => (
						<span key={label} className='flex flex-1 items-center gap-2'>
							<span
								className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${(ready ? 2 : busy ? 1 : 0) >= index ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800'}`}>
								{ready || (busy && index === 0) ? <Check size={11} /> : index + 1}
							</span>
							<span
								className={
									(ready ? 2 : busy ? 1 : 0) === index
										? 'font-medium text-zinc-800 dark:text-zinc-100'
										: ''
								}>
								{label}
							</span>
							{index < 2 && (
								<span className='ml-1 h-px flex-1 bg-zinc-200 dark:bg-zinc-700' />
							)}
						</span>
					))}
				</div>
				<h2 id={headingId} className='text-2xl leading-8 font-semibold tracking-tight'>
					{ready
						? 'Your account is connected'
						: busy
							? `Connecting to ${connector.name}`
							: `Connect ${connector.name}`}
				</h2>
				<p
					id={descriptionId}
					className='mt-2 text-sm leading-5 text-zinc-500 dark:text-zinc-400'>
					{ready
						? 'Everything is ready. Use this account for your workflow step.'
						: busy
							? connector.is_oauth
								? 'Finish signing in in the provider’s window. We’ll update this screen when you’re done.'
								: 'Saving your account connection…'
							: 'Give this connection a name and choose who can use it.'}
				</p>
			</header>
			<div className='min-h-0 overflow-y-auto px-6 pb-6 sm:px-8'>
				{ready ? (
					<div
						role='status'
						className='rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900'>
						<div className='mb-4 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400'>
							<CheckCircle2 size={19} />
							Connected successfully
						</div>
						<p className='text-base font-semibold break-words'>{name.trim()}</p>
						<p className='mt-2 flex items-center gap-1.5 text-xs text-zinc-500'>
							{scope === 'team' ? <Users size={13} /> : <UserRound size={13} />}
							{scope === 'team' ? 'Shared with your workspace' : 'Personal account'}
						</p>
					</div>
				) : busy ? (
					<div
						role='status'
						className='flex flex-col items-center rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900'>
						<Loader2 size={28} className='mb-5 animate-spin text-zinc-400' />
						<p className='text-sm font-medium'>
							{connector.is_oauth
								? 'Waiting for sign-in'
								: 'Creating your connection'}
						</p>
						<p className='mt-2 max-w-xs text-xs leading-5 text-zinc-500'>
							{connector.is_oauth
								? 'Keep this screen open. To cancel, close the sign-in window.'
								: 'This usually takes a few moments.'}
						</p>
					</div>
				) : (
					<>
						<label htmlFor={nameId} className='block text-sm font-medium'>
							Account name
						</label>
						<input
							aria-label={`e.g. Work ${connector.name}`}
							id={nameId}
							value={name}
							onChange={(event) => setName(event.target.value)}
							required
							maxLength={255}
							placeholder={`e.g. Work ${connector.name}`}
							className={inputClass}
						/>
						<p className='mt-2 text-xs text-zinc-500'>
							A label to help you recognize this account later.
						</p>
						<fieldset className='mt-6'>
							<legend className='mb-2.5 text-sm font-medium'>
								Who can use this account?
							</legend>
							<div className='grid gap-2 sm:grid-cols-2'>
								{(['personal', 'team'] as const).map((option) => {
									const ScopeIcon = option === 'personal' ? UserRound : Users;
									return (
										<label
											key={option}
											className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 focus-within:ring-2 focus-within:ring-zinc-400 ${scope === option ? 'border-zinc-600 bg-zinc-50 dark:border-zinc-400 dark:bg-zinc-800' : 'border-zinc-200 dark:border-zinc-700'}`}>
											<input
												type='radio'
												name={scopeName}
												value={option}
												checked={scope === option}
												onChange={() => setScope(option)}
												className='sr-only'
											/>
											<ScopeIcon
												size={17}
												className='mt-0.5 shrink-0 text-zinc-400'
											/>
											<span className='min-w-0 flex-1'>
												<span className='block text-sm font-medium'>
													{option === 'personal' ? 'Only me' : 'My team'}
												</span>
												<span className='mt-1 block text-xs leading-5 text-zinc-500'>
													{option === 'personal'
														? 'A personal connection'
														: 'Anyone in this workspace'}
												</span>
											</span>
											{scope === option && (
												<Check size={14} className='mt-1 shrink-0' />
											)}
										</label>
									);
								})}
							</div>
						</fieldset>
						{!connector.is_oauth && (
							<div className='mt-6 space-y-4'>
								<h3 className='flex items-center gap-2 text-sm font-medium'>
									<KeyRound size={15} />
									Connection details
								</h3>
								{connector.fields.length === 0 && (
									<p className='text-xs text-zinc-500'>
										No additional connection details are required.
									</p>
								)}
								{connector.fields.map((field) => {
									const id = `${fieldPrefix}-${field.name}`;
									const set = (value: string | boolean | number) =>
										setData((prev) => {
											const next = { ...prev };
											if (value === '') delete next[field.name];
											else next[field.name] = value;
											return next;
										});
									return (
										<div key={field.name}>
											<label htmlFor={id} className='text-xs font-medium'>
												{field.label ?? field.name}
												{field.required && (
													<span className='ml-1 text-zinc-400'>
														Required
													</span>
												)}
											</label>
											{field.type === 'boolean' ? (
												<input
													id={id}
													type='checkbox'
													checked={Boolean(data[field.name])}
													onChange={(event) => set(event.target.checked)}
													className='ml-3 accent-zinc-800'
												/>
											) : field.type === 'multiline' && !field.secret ? (
												<textarea
													aria-label={field.placeholder}
													id={id}
													value={String(data[field.name] ?? '')}
													onChange={(event) => set(event.target.value)}
													required={field.required}
													placeholder={field.placeholder}
													className={`${inputClass} min-h-24 py-3`}
													autoComplete='off'
												/>
											) : (
												<input
													aria-label={field.placeholder}
													id={id}
													type={
														field.secret
															? 'password'
															: field.type === 'number'
																? 'number'
																: 'text'
													}
													step={
														field.type === 'number' ? 'any' : undefined
													}
													value={String(data[field.name] ?? '')}
													onChange={(event) =>
														set(
															field.type === 'number' &&
																event.target.value !== ''
																? Number(event.target.value)
																: event.target.value,
														)
													}
													required={field.required}
													placeholder={field.placeholder}
													autoComplete='off'
													className={inputClass}
												/>
											)}
											{field.description && (
												<p className='mt-1.5 text-xs leading-5 text-zinc-500'>
													{field.description}
												</p>
											)}
										</div>
									);
								})}
							</div>
						)}
						{connector.is_oauth && (
							<div className='mt-6 flex items-start gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900'>
								<ExternalLink size={17} className='mt-0.5 shrink-0 text-zinc-400' />
								<div>
									<p className='text-xs font-medium'>
										Next: sign in with {connector.name}
									</p>
									<p className='mt-1.5 text-xs leading-5 text-zinc-500'>
										A separate window will open for you to choose an account and
										review the access requested by {connector.name}. You’ll
										return here when it’s connected.
									</p>
								</div>
							</div>
						)}
						{error && (
							<div
								role='alert'
								className='mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300'>
								{error}
							</div>
						)}
					</>
				)}
			</div>
			<footer className='flex shrink-0 justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-6 py-4 sm:px-8 dark:border-zinc-800 dark:bg-zinc-900/50'>
				{!ready && (
					<button
						type='button'
						onClick={onBack}
						disabled={busy}
						className='rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-xs font-medium disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800'>
						Back
					</button>
				)}
				{ready ? (
					<button
						type='button'
						onClick={() => connectedId && onConnected(connectedId)}
						className='flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900'>
						<Check size={14} />
						Use this account
					</button>
				) : (
					<button
						type='submit'
						disabled={busy || !name.trim()}
						className='flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-xs font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900'>
						{busy ? (
							<Loader2 size={14} className='animate-spin' />
						) : connector.is_oauth ? (
							<ArrowUpRight size={14} />
						) : (
							<Plus size={14} />
						)}
						{busy
							? 'Connecting…'
							: connector.is_oauth
								? `Continue with ${connector.name}`
								: 'Connect account'}
					</button>
				)}
			</footer>
		</form>
	);
};

export default AccountConnectionSetup;
