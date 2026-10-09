import { useState } from 'react';
import { Activity, Key, Pencil, RefreshCw, Star, Trash2, X as CloseIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useConnectorCredential } from '@/api/modules/connectors';
import type {
	TConnector,
	TConnectorCredential,
	TConnectorData,
	TUpdateConnectorCredentialDto,
} from '@/types/connector.type';
import type { IAvailableApp } from '../_types/apps.type';
import {
	buildEditCredentialData,
	createEditFormValues,
	getCredentialFields,
	getRequiredFields,
	isEmptyCredentialValue,
	isOAuthCredentialType,
} from '../_helper/connectorCatalog.helper';
import { CredentialTestResult, CredentialUsage } from './CredentialHealth.partial';

interface ICredentialDetailModalProps {
	activeWorkspaceId: string;
	credentialId: string;
	connectors: TConnector[];
	apps: IAvailableApp[];
	closeLabel: string;
	onClose: () => void;
	onDelete: (credential: TConnectorCredential) => void;
	onUpdate: (id: string, body: TUpdateConnectorCredentialDto) => Promise<void>;
	onReconnect: (credential: TConnectorCredential) => void;
	onSetDefault: (id: string) => void;
	onTest: (id: string) => void;
	canManage: boolean;
	isTesting: boolean;
	isDeleting: boolean;
	isUpdating: boolean;
	isReconnecting: boolean;
	isSettingDefault: boolean;
}

const CredentialDetailModal = ({
	activeWorkspaceId,
	credentialId,
	connectors,
	apps,
	closeLabel,
	onClose,
	onDelete,
	onUpdate,
	onReconnect,
	onSetDefault,
	onTest,
	canManage,
	isTesting,
	isDeleting,
	isUpdating,
	isReconnecting,
	isSettingDefault,
}: ICredentialDetailModalProps) => {
	const {
		data: credential,
		isLoading,
		isError,
	} = useConnectorCredential(activeWorkspaceId, credentialId);

	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState('');
	const [editFormValues, setEditFormValues] = useState<TConnectorData>({});

	if (isLoading) {
		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.96, y: 15 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.96, y: 15 }}
				className='relative flex min-h-[200px] w-full max-w-3xl flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-zinc-800/80 dark:bg-[#11131c]'>
				<svg
					className='text-primary-600 h-7 w-7 animate-spin'
					xmlns='http://www.w3.org/2000/svg'
					fill='none'
					viewBox='0 0 24 24'>
					<circle
						className='opacity-25'
						cx='12'
						cy='12'
						r='10'
						stroke='currentColor'
						strokeWidth='4'
					/>
					<path
						className='opacity-75'
						fill='currentColor'
						d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
					/>
				</svg>
				<p className='mt-3 text-xs font-bold text-slate-500 dark:text-zinc-400'>
					Loading connection details...
				</p>
			</motion.div>
		);
	}

	if (isError || !credential) {
		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.96, y: 15 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.96, y: 15 }}
				className='relative w-full max-w-3xl rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-zinc-800/80 dark:bg-[#11131c]'>
				<button
					aria-label='Close'
					onClick={onClose}
					className='hover:text-slate-650 absolute top-4 right-4 cursor-pointer rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'>
					<CloseIcon className='h-4.5 w-4.5' />
				</button>
				<h3 className='text-red-650 text-sm font-black'>Failed to load connection</h3>
				<p className='mt-2 text-xs font-semibold text-slate-400'>
					There was a problem retrieving the details for this connection.
				</p>
			</motion.div>
		);
	}

	// `connector` is embedded on the credential, but fall back to the catalog in
	// case a caller passed a credential loaded without it.
	const connector =
		credential.connector ??
		connectors.find((entry) => String(entry.id) === String(credential.connector_id));
	const isKnownCredentialType = Boolean(connector);
	const app = connector ? apps.find((entry) => entry.id === connector.key) : undefined;
	const AppIcon = app?.icon ?? Key;
	const credentialFields = connector ? getCredentialFields(connector) : {};
	const requiredFields = connector ? getRequiredFields(connector) : [];
	const usesOAuth = isOAuthCredentialType(connector);
	const canSaveEdit =
		isKnownCredentialType &&
		Boolean(editName.trim()) &&
		(usesOAuth ||
			requiredFields.every((key) => {
				const field = credentialFields[key];
				if (field?.secret) return true;
				return !isEmptyCredentialValue(editFormValues[key]);
			}));

	if (isEditing) {
		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.96, y: 15 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.96, y: 15 }}
				className='relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-zinc-800/80 dark:bg-[#11131c]'>
				{/* Close button */}
				<button
					aria-label='Close connection details'
					onClick={onClose}
					className='hover:text-slate-650 absolute top-4 right-4 cursor-pointer rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'>
					<CloseIcon className='h-4.5 w-4.5' />
				</button>

				<div className='flex items-center gap-3.5 border-b border-slate-100 pb-4 dark:border-zinc-800/40'>
					<div className='bg-primary-400 text-primary-950 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-inner'>
						<Key className='h-5 w-5' />
					</div>
					<div>
						<h2 className='text-base font-black text-slate-900 dark:text-white'>
							Edit Connection
						</h2>
						<p className='text-[10px] font-bold text-slate-400 dark:text-zinc-500'>
							Update your connection configuration
						</p>
					</div>
				</div>

				{/* Edit Form */}
				<div className='mt-5 space-y-4 text-left'>
					<div>
						<label
							htmlFor='editName'
							className='mb-1.5 block text-[10px] font-black tracking-wider text-slate-500 uppercase dark:text-zinc-400'>
							Connection Name
						</label>
						<input
							id='editName'
							type='text'
							required
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
							placeholder='e.g., My Updated Connection'
							aria-label='Connection Name'
							className='focus:border-primary-500/80 focus:ring-primary-500/10 dark:focus:border-primary-500 dark:focus:ring-primary-500/15 block h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:bg-white focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:placeholder:text-zinc-600'
						/>
					</div>

					{usesOAuth ? (
						<div className='border-primary-500/20 bg-primary-50/60 text-primary-700 dark:border-primary-500/15 dark:bg-primary-500/10 dark:text-primary-300 rounded-2xl border p-4 text-xs font-semibold'>
							OAuth token fields are managed by the backend. Use reconnect to
							re-authorize this account.
						</div>
					) : (
						Object.entries(credentialFields).map(([fieldKey, field]) => {
							const inputId = `edit-credential-field-${fieldKey}`;
							const value = editFormValues[fieldKey];

							return (
								<div key={fieldKey}>
									<label
										htmlFor={inputId}
										className='mb-1.5 block text-[10px] font-black tracking-wider text-slate-500 uppercase dark:text-zinc-400'>
										{field.label}
										{field.secret ? ' (optional)' : ''}
									</label>
									{field.type === 'boolean' ? (
										<label className='flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200'>
											<input
												id={inputId}
												type='checkbox'
												aria-label={field.label}
												checked={Boolean(value)}
												onChange={(e) =>
													setEditFormValues((prev) => ({
														...prev,
														[fieldKey]: e.target.checked,
													}))
												}
												className='text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-slate-300'
											/>
											<span>{field.description ?? field.label}</span>
										</label>
									) : field.type === 'multiline' ? (
										<textarea
											id={inputId}
											value={String(value ?? '')}
											onChange={(e) =>
												setEditFormValues((prev) => ({
													...prev,
													[fieldKey]: e.target.value,
												}))
											}
											placeholder={
												field.secret
													? 'Leave blank to keep existing value'
													: field.placeholder
											}
											aria-label={field.label}
											rows={4}
											className='focus:border-primary-500/80 focus:ring-primary-500/10 dark:focus:border-primary-500 dark:focus:ring-primary-500/15 block w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 text-xs font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:bg-white focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:placeholder:text-zinc-600'
										/>
									) : (
										<input
											id={inputId}
											type={
												field.secret
													? 'password'
													: field.type === 'number'
														? 'number'
														: 'text'
											}
											value={String(value ?? '')}
											onChange={(e) =>
												setEditFormValues((prev) => ({
													...prev,
													[fieldKey]: e.target.value,
												}))
											}
											placeholder={
												field.secret
													? 'Leave blank to keep existing value'
													: field.placeholder
											}
											aria-label={field.label}
											className='focus:border-primary-500/80 focus:ring-primary-500/10 dark:focus:border-primary-500 dark:focus:ring-primary-500/15 block h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:bg-white focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:placeholder:text-zinc-600'
										/>
									)}
									{field.secret && (
										<p className='mt-1.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
											Leave blank to keep the existing value.
										</p>
									)}
								</div>
							);
						})
					)}
				</div>

				{/* Actions Footer */}
				<div className='mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-zinc-800/60'>
					<button
						disabled={isUpdating}
						onClick={() => setIsEditing(false)}
						className='h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-4.5 text-[11px] font-black transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'>
						Cancel
					</button>
					<button
						disabled={isUpdating || !canSaveEdit}
						onClick={async () => {
							await onUpdate(credential.id, {
								name: editName.trim(),
								...(usesOAuth
									? {}
									: {
											data: buildEditCredentialData(
												credentialFields,
												editFormValues,
											),
										}),
							});
							setIsEditing(false);
						}}
						className='bg-primary-400 text-primary-950 hover:bg-primary-500 flex h-10 cursor-pointer items-center justify-center rounded-xl px-5 text-[11px] font-black shadow-md transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-40'>
						{isUpdating ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.96, y: 15 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.96, y: 15 }}
			className='relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-zinc-800/80 dark:bg-[#11131c]'>
			{/* Close button */}
			<button
				aria-label='Close connection details'
				onClick={onClose}
				className='hover:text-slate-650 absolute top-4 right-4 cursor-pointer rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'>
				<CloseIcon className='h-4.5 w-4.5' />
			</button>

			<div className='flex items-center gap-3.5 border-b border-slate-100 pb-4 dark:border-zinc-800/40'>
				<div
					className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-inner'
					style={{ backgroundColor: app?.color ?? '#6D28D9' }}>
					<AppIcon className='h-5 w-5' />
				</div>
				<div className='min-w-0 pr-8'>
					<h2 className='truncate text-base font-black text-slate-900 dark:text-white'>
						{credential.name}
					</h2>
					<p className='text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
						{app?.name ?? connector?.name ?? 'Unknown app'} ·{' '}
						{usesOAuth ? 'OAuth 2.0' : 'API Key'}
					</p>
					{credential.account_label && (
						<p className='mt-0.5 truncate text-xs font-bold text-slate-600 dark:text-zinc-300'>
							{credential.account_label}
						</p>
					)}
				</div>
			</div>

			<div className='mt-5 space-y-4 text-left'>
				<div className='grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-zinc-900/30 dark:bg-zinc-950/15'>
					<div>
						<span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
							App
						</span>
						<span className='mt-1 inline-block text-xs font-semibold text-slate-800 dark:text-zinc-200'>
							{app?.name ?? connector?.name ?? '-'}
						</span>
					</div>

					<div>
						<span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
							Auth Method
						</span>
						<span
							className={`mt-1 inline-block rounded-lg px-2 py-0.5 text-xs font-bold ${usesOAuth ? 'border-primary-500/20 bg-primary-50 text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-400 border' : 'border border-slate-200 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}`}>
							{usesOAuth ? 'OAuth 2.0' : 'API Key'}
						</span>
					</div>

					<div>
						<span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
							Sharing
						</span>
						<span
							className={`mt-1 inline-block rounded-lg px-2 py-0.5 text-xs font-bold ${credential.scope === 'team' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400' : 'border border-slate-200 bg-white text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'}`}>
							{credential.scope === 'team' ? 'Shared with workspace' : 'Private'}
						</span>
						{credential.is_default && (
							<span className='border-primary-500/20 bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400 mt-1 ml-1.5 inline-block rounded-lg border px-2 py-0.5 text-xs font-bold'>
								Default
							</span>
						)}
					</div>

					<div className='col-span-2 border-t border-slate-100 pt-3 dark:border-zinc-800/40'>
						<span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
							Created At
						</span>
						<span className='text-slate-850 mt-0.5 text-xs font-semibold dark:text-zinc-200'>
							{new Date(credential.created_at).toLocaleString()}
						</span>
					</div>

					{credential.expires_at && !usesOAuth && (
						<div className='col-span-2 border-t border-slate-100 pt-3 dark:border-zinc-800/40'>
							<span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
								Expires At
							</span>
							<span className='text-slate-850 mt-0.5 text-xs font-semibold dark:text-zinc-200'>
								{new Date(credential.expires_at).toLocaleString()}
							</span>
						</div>
					)}

					{credential.last_used_at && (
						<div className='col-span-2 border-t border-slate-100 pt-3 dark:border-zinc-800/40'>
							<span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
								Last Used
							</span>
							<span className='text-slate-850 mt-0.5 text-xs font-semibold dark:text-zinc-200'>
								{new Date(credential.last_used_at).toLocaleString()}
							</span>
						</div>
					)}

					{/* Stored field values are never returned by the API — the
					    secret payload is write-only — so there is nothing to list
					    here, only the schema shown while editing. */}
				</div>
				{credential.is_expired && (
					<div className='rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'>
						This connection has expired. Reconnect it to keep any nodes that use it
						working.
					</div>
				)}
				{!isKnownCredentialType && (
					<div className='rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'>
						This credential type is not available in the current API catalog. Editing is
						disabled until the backend returns this type.
					</div>
				)}
				{credential.last_tested_at && credential.last_test_ok !== null && (
					<CredentialTestResult
						result={{
							ok: credential.last_test_ok,
							message: credential.last_test_message ?? '',
							account: credential.account_label,
							tested_at: credential.last_tested_at,
						}}
					/>
				)}
				<CredentialUsage
					workspaceId={activeWorkspaceId}
					credentialId={credential.id}
					onNavigate={onClose}
				/>
			</div>

			<div className='sticky -bottom-6 -mx-6 mt-6 -mb-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-3 border-t border-slate-100 bg-white px-6 pt-4 pb-6 dark:border-zinc-800/60 dark:bg-[#11131c]'>
				{canManage ? (
					<div className='grid w-full auto-cols-fr grid-flow-col gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center'>
						<button
							disabled={isDeleting || isTesting}
							onClick={() => onTest(credential.id)}
							className='flex h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-1 text-[10px] font-black text-slate-700 transition-all hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 sm:h-9 sm:flex-row sm:gap-1.5 sm:px-3.5 sm:text-[11px] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'>
							{isTesting ? (
								<RefreshCw className='h-3.5 w-3.5 animate-spin' />
							) : (
								<Activity className='h-3.5 w-3.5' />
							)}
							<span>{isTesting ? 'Testing…' : 'Test'}</span>
						</button>
						{usesOAuth && (
							<button
								disabled={isDeleting || isReconnecting}
								onClick={() => onReconnect(credential)}
								className='flex h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-1 text-[10px] font-black text-slate-700 transition-all hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 sm:h-9 sm:flex-row sm:gap-1.5 sm:px-3.5 sm:text-[11px] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'>
								<RefreshCw
									className={`h-3.5 w-3.5 ${isReconnecting ? 'animate-spin' : ''}`}
								/>
								<span className='truncate'>
									{isReconnecting ? 'Reconnecting…' : 'Reconnect'}
								</span>
							</button>
						)}
						<button
							disabled={isDeleting || !isKnownCredentialType}
							onClick={() => {
								setEditName(credential.name);
								setEditFormValues(createEditFormValues(connector));
								setIsEditing(true);
							}}
							className='flex h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-1 text-[10px] font-black text-slate-700 transition-all hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 sm:h-9 sm:flex-row sm:gap-1.5 sm:px-3.5 sm:text-[11px] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'>
							<Pencil className='h-3.5 w-3.5' />
							<span>{usesOAuth ? 'Rename' : 'Edit'}</span>
						</button>
						{!credential.is_default && (
							<button
								disabled={isDeleting || isSettingDefault}
								onClick={() => onSetDefault(credential.id)}
								className='flex h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-1 text-[10px] font-black text-slate-700 transition-all hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 sm:h-9 sm:flex-row sm:gap-1.5 sm:px-3.5 sm:text-[11px] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'>
								<Star className='h-3.5 w-3.5' />
								<span className='sm:hidden'>
									{isSettingDefault ? 'Setting…' : 'Default'}
								</span>
								<span className='hidden sm:inline'>
									{isSettingDefault ? 'Setting...' : 'Make default'}
								</span>
							</button>
						)}
					</div>
				) : (
					<p className='text-[11px] font-semibold text-slate-500 dark:text-zinc-400'>
						Only workspace owners and admins can change this account.
					</p>
				)}

				<div className='flex w-full items-center gap-2 sm:ml-auto sm:w-auto'>
					{canManage && (
						<button
							disabled={isDeleting}
							onClick={() => onDelete(credential)}
							className='flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 text-[11px] font-black text-red-600 transition-all hover:bg-red-50 disabled:pointer-events-none disabled:opacity-40 sm:h-9 sm:flex-none sm:border-transparent dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10'>
							<Trash2 className='h-3.5 w-3.5' />
							{isDeleting ? 'Disconnecting...' : 'Disconnect'}
						</button>
					)}
					<button
						disabled={isDeleting}
						onClick={onClose}
						className='bg-primary-400 text-primary-950 hover:bg-primary-500 h-10 flex-1 cursor-pointer rounded-xl px-5 text-[11px] font-black transition-all active:scale-95 sm:h-9 sm:flex-none'>
						{closeLabel === 'Back' ? 'Back' : 'Done'}
					</button>
				</div>
			</div>
		</motion.div>
	);
};

export default CredentialDetailModal;
