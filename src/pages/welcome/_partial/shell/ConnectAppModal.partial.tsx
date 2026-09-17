import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useConnectOAuthConnector, useCreateConnectorCredential } from '@/api/modules/connectors';
import { useOnboardingStore } from '../../_context/OnboardingStore.context';
import { useOnboardingWorkspaceId } from '../../_hooks/useOnboardingWorkspace.hook';
import BrandLogo from '../shared/BrandLogo.partial';
import type { TConnectorData, TConnectorField } from '@/types/connector.type';

/** How long the success tick stays up before the modal dismisses itself. */
const SUCCESS_DISMISS_MS = 800;

const ConnectAppModal = () => {
	const { state, dispatch } = useOnboardingStore();
	const { selectedAppForAuth, authSuccess } = state;
	const workspaceId = useOnboardingWorkspaceId();

	const connectOAuth = useConnectOAuthConnector(workspaceId);
	const createCredential = useCreateConnectorCredential(workspaceId);

	const [fieldValues, setFieldValues] = useState<TConnectorData>({});

	const isOAuth = selectedAppForAuth?.is_oauth ?? false;
	const fields: TConnectorField[] = selectedAppForAuth?.fields ?? [];
	const isConnecting = connectOAuth.isPending || createCredential.isPending;

	const close = () => dispatch({ type: 'SET_FIELD', payload: { selectedAppForAuth: null } });

	// Each app opens with a blank form.
	useEffect(() => {
		setFieldValues({});
	}, [selectedAppForAuth?.id]);

	// Let the tick land, then get out of the way.
	useEffect(() => {
		if (!authSuccess) return;
		const timer = window.setTimeout(
			() => dispatch({ type: 'SET_FIELD', payload: { selectedAppForAuth: null } }),
			SUCCESS_DISMISS_MS,
		);
		return () => window.clearTimeout(timer);
	}, [authSuccess, dispatch]);

	const missingRequiredField = fields.some(
		(field) => field.required && !String(fieldValues[field.name] ?? '').trim(),
	);

	const handleConnect = async () => {
		if (!selectedAppForAuth) return;

		try {
			if (isOAuth) {
				// Opens the provider's consent screen in a popup and resolves
				// once `/oauth/connector-complete` reports back.
				await connectOAuth.mutateAsync({
					connector_id: selectedAppForAuth.id,
					name: selectedAppForAuth.name,
				});
			} else {
				await createCredential.mutateAsync({
					connector_id: selectedAppForAuth.id,
					name: selectedAppForAuth.name,
					data: fieldValues,
				});
			}

			dispatch({ type: 'SET_FIELD', payload: { authSuccess: true } });
		} catch {
			// Left open so the user can retry; the mutation cache has already
			// surfaced the reason.
		}
	};

	const renderField = (field: TConnectorField) => {
		const value = fieldValues[field.name] ?? '';
		const setValue = (next: string | boolean) =>
			setFieldValues((previous) => ({ ...previous, [field.name]: next }));

		const inputClass =
			'h-full min-w-0 flex-1 bg-transparent px-3.5 text-sm font-semibold outline-none';

		return (
			<div key={field.name} className='space-y-2 text-left'>
				<label className='block text-[10px] font-bold tracking-widest text-slate-500 uppercase'>
					{field.label ?? field.name}
				</label>
				<div className='flex h-11 items-center overflow-hidden rounded-xl border border-slate-200/90 bg-white/50 pr-3 dark:border-zinc-800'>
					{field.type === 'multiline' ? (
						<textarea
							placeholder={field.placeholder}
							value={String(value)}
							onChange={(e) => setValue(e.target.value)}
							className={`${inputClass} resize-none py-3`}
						/>
					) : field.type === 'boolean' ? (
						<input
							type='checkbox'
							checked={Boolean(value)}
							onChange={(e) => setValue(e.target.checked)}
							className='ml-3.5 h-4 w-4 rounded border-slate-300'
						/>
					) : (
						<input
							type={
								field.secret
									? 'password'
									: field.type === 'number'
										? 'number'
										: 'text'
							}
							placeholder={field.placeholder}
							value={String(value)}
							onChange={(e) => setValue(e.target.value)}
							className={inputClass}
						/>
					)}
				</div>
				{field.description && (
					<p className='text-[10px] text-slate-400'>{field.description}</p>
				)}
			</div>
		);
	};

	return (
		<AnimatePresence>
			{selectedAppForAuth && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm dark:bg-black/60'>
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 15 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 15 }}
						className='relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-2xl dark:border-zinc-800/80 dark:bg-zinc-900'>
						<button
							onClick={close}
							className='absolute top-4 right-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800'>
							<X className='h-4 w-4' />
						</button>

						<div className='mt-4 flex flex-col items-center'>
							<div className='mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-2 shadow-inner dark:border-zinc-800 dark:bg-zinc-950'>
								<BrandLogo name={selectedAppForAuth.name} className='h-10 w-10' />
							</div>
							<h2 className='text-xl font-extrabold text-slate-950 dark:text-zinc-50'>
								Connect {selectedAppForAuth.name}
							</h2>
							<p className='mt-1.5 max-w-[260px] text-xs text-slate-400'>
								{isOAuth
									? `You'll finish signing in to ${selectedAppForAuth.name} in a new window.`
									: 'Authenticate your credentials to link your cloud instance.'}
							</p>
						</div>

						<div className='mt-6 space-y-4'>
							{isOAuth ? (
								<div className='rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left dark:border-zinc-800/40 dark:bg-zinc-950/30'>
									<p className='text-xs font-bold text-slate-600 dark:text-zinc-400'>
										Grant permissions
									</p>
									<p className='mt-1 text-[10px] text-slate-400'>
										This gives Agent1o1 permission to sync alerts, lists, and
										directories dynamically.
									</p>
								</div>
							) : (
								fields.map(renderField)
							)}

							{authSuccess ? (
								<div className='flex flex-col items-center justify-center space-y-2 py-4 text-emerald-500'>
									<div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10'>
										<Check className='h-5 w-5 stroke-[3]' />
									</div>
									<span className='text-xs font-black'>
										Link Connected Successfully!
									</span>
								</div>
							) : (
								<button
									disabled={isConnecting || (!isOAuth && missingRequiredField)}
									onClick={handleConnect}
									className='flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-xs font-black tracking-wide text-white transition-all hover:opacity-90 active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:bg-zinc-50 dark:text-slate-950'>
									{isConnecting ? (
										<>
											<Loader2 className='h-4 w-4 animate-spin' />
											Connecting...
										</>
									) : (
										'Authorize Connection'
									)}
								</button>
							)}
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
};

export default ConnectAppModal;
