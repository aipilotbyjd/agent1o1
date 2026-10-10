import type { Dispatch, SetStateAction } from 'react';
import { Cloud, Grid, Search, ShieldCheck, X as CloseIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import type {
	TConnectorCredentialScope,
	TConnectorData,
	TConnectorField,
} from '@/types/connector.type';
import { CONNECTOR_UNAVAILABLE_LABEL, isConnectorUnavailable } from '@/types/connector.type';
import type { IAvailableApp, IConnectedApp } from '../_types/apps.type';
import { isOAuthCredentialType } from '../_helper/connectorCatalog.helper';

interface IConnectModalProps {
	canManageConnections: boolean;
	canSubmitConnection: boolean;
	closeConnectModal: () => void;
	credentialFormValues: TConnectorData;
	credentialName: string;
	credentialScope: TConnectorCredentialScope;
	filteredAvailableApps: IConnectedApp[];
	handleAuthorize: () => void;
	handleConnectClick: (app: IConnectedApp) => void;
	isConnecting: boolean;
	modalSearch: string;
	modalStep: 1 | 2;
	selectedAppForAuth: IAvailableApp | null;
	selectedAppHasNoForm: boolean;
	selectedAppUsesOAuth: boolean;
	selectedCredentialFields: Record<string, TConnectorField>;
	selectedRequiredFields: string[];
	setCredentialFormValues: Dispatch<SetStateAction<TConnectorData>>;
	setCredentialName: (name: string) => void;
	setCredentialScope: (scope: TConnectorCredentialScope) => void;
	setModalSearch: (search: string) => void;
	setModalStep: (step: 1 | 2) => void;
	totalIntegrationsCount: number;
	isCredentialTypesLoading: boolean;
	isCredentialTypesError: boolean;
	refetchCredentialTypes: () => unknown;
}

/** Step 1 picks an app from the catalog; step 2 is its connect form. State lives in the page. */
const ConnectModal = ({
	canManageConnections,
	canSubmitConnection,
	closeConnectModal,
	credentialFormValues,
	credentialName,
	credentialScope,
	filteredAvailableApps,
	handleAuthorize,
	handleConnectClick,
	isConnecting,
	modalSearch,
	modalStep,
	selectedAppForAuth,
	selectedAppHasNoForm,
	selectedAppUsesOAuth,
	selectedCredentialFields,
	selectedRequiredFields,
	setCredentialFormValues,
	setCredentialName,
	setCredentialScope,
	setModalSearch,
	setModalStep,
	totalIntegrationsCount,
	isCredentialTypesLoading,
	isCredentialTypesError,
	refetchCredentialTypes,
}: IConnectModalProps) => (
	<div
		role='presentation'
		onClick={(event) => {
			if (event.target === event.currentTarget && !isConnecting) closeConnectModal();
		}}
		className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 font-sans text-slate-950 backdrop-blur-md dark:bg-black/70 dark:text-zinc-50'>
		{/* STEP 1: AVAILABLE APPS CATALOG */}
		{modalStep === 1 && (
			<motion.div
				initial={{ opacity: 0, scale: 0.96, y: 15 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.96, y: 15 }}
				className='relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-zinc-800/80 dark:bg-[#11131c]'>
				{/* Close button */}
				<button
					aria-label='Close app connection dialog'
					onClick={closeConnectModal}
					className='absolute top-4 right-4 cursor-pointer rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'>
					<CloseIcon className='h-4.5 w-4.5' />
				</button>

				<div className='flex items-center gap-3.5 pr-10'>
					<div className='bg-primary-100/60 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl'>
						<Grid className='h-5 w-5' />
					</div>
					<div className='min-w-0'>
						<div className='flex items-center gap-2'>
							<h2 className='text-lg font-black text-slate-900 dark:text-white'>
								Apps Available
							</h2>
							<span className='rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'>
								{isCredentialTypesLoading ? '…' : totalIntegrationsCount}
							</span>
						</div>
						<p className='mt-0.5 text-xs font-bold text-slate-400 dark:text-zinc-500'>
							Select the app you would like to authenticate with.
						</p>
					</div>
				</div>

				{/* Search available apps */}
				<div className='group relative mt-5'>
					<Search className='absolute top-3.5 left-3.5 h-4 w-4 text-slate-400' />
					<input
						type='text'
						aria-label='Search available apps'
						placeholder='Search integrations...'
						value={modalSearch}
						onChange={(e) => setModalSearch(e.target.value)}
						className='dark:placeholder:text-zinc-650 focus:border-primary-500/80 focus:ring-primary-500/10 dark:focus:border-primary-500 dark:focus:ring-primary-500/15 block h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-10 text-xs font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:bg-white focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100'
					/>
					{modalSearch && (
						<button
							aria-label='Clear available apps search'
							onClick={() => setModalSearch('')}
							className='hover:text-slate-650 dark:hover:text-zinc-350 absolute top-3.5 right-3.5 text-slate-400 dark:text-zinc-500'>
							<CloseIcon className='h-4 w-4' />
						</button>
					)}
				</div>

				{/* Available apps grid list */}
				<div className='no-scrollbar mt-4 grid max-h-[350px] grid-cols-1 gap-3 overflow-y-auto border-t border-slate-100 pt-4 pr-1 sm:grid-cols-2 dark:border-zinc-800/40'>
					{isCredentialTypesLoading ? (
						<div className='col-span-full p-6 text-center text-xs font-bold text-slate-400 dark:text-zinc-500'>
							Loading integrations...
						</div>
					) : isCredentialTypesError ? (
						<div className='col-span-full rounded-2xl border border-red-200 bg-red-50/50 p-5 text-center dark:border-red-500/20 dark:bg-red-500/10'>
							<p className='text-xs font-black text-red-700 dark:text-red-300'>
								Could not load integrations.
							</p>
							<button
								type='button'
								onClick={() => void refetchCredentialTypes()}
								className='mt-3 h-8 cursor-pointer rounded-lg bg-white px-4 text-[11px] font-black text-red-700 shadow-xs dark:bg-zinc-900 dark:text-red-300'>
								Retry
							</button>
						</div>
					) : filteredAvailableApps.length === 0 ? (
						<div className='col-span-full p-6 text-center text-xs font-bold text-slate-400 dark:text-zinc-500'>
							No integrations available.
						</div>
					) : (
						filteredAvailableApps.map((availableApp) => (
							<div
								key={availableApp.id}
								className='group/item hover:border-primary-500/30 dark:hover:border-primary-500/30 flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-sm dark:border-zinc-900/30 dark:bg-zinc-950/15 dark:hover:bg-zinc-950/40'>
								<div className='flex gap-3'>
									<div
										className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover/item:scale-105'
										style={{
											backgroundColor: availableApp.color,
										}}>
										{availableApp.icon ? (
											<availableApp.icon className='h-5 w-5' />
										) : (
											<Cloud className='h-5 w-5' />
										)}
									</div>
									<div className='min-w-0 flex-1'>
										<p className='flex flex-wrap items-center gap-1 text-xs font-black text-slate-900 dark:text-white'>
											<span>{availableApp.name}</span>
											{isOAuthCredentialType(availableApp.connector) && (
												<span className='border-primary-200 bg-primary-50 text-primary-600 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-400 rounded border px-1.5 py-0.5 text-[8px] font-black'>
													OAuth 2.0
												</span>
											)}
											{availableApp.isConnected && (
												<span className='inline-flex items-center gap-1 rounded border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-black text-emerald-600 dark:text-emerald-400'>
													<span className='h-1 w-1 rounded-full bg-emerald-500' />
													{availableApp.credentials.length} connected
												</span>
											)}
										</p>
										<p className='mt-1 line-clamp-2 text-[10px] leading-relaxed font-semibold text-slate-400 dark:text-zinc-500'>
											{availableApp.description}
										</p>
									</div>
								</div>
								<button
									onClick={() => handleConnectClick(availableApp)}
									disabled={
										isConnectorUnavailable(availableApp.connector) ||
										!canManageConnections
									}
									title={
										!canManageConnections
											? 'Only workspace owners and admins can connect apps.'
											: isConnectorUnavailable(availableApp.connector)
												? `${availableApp.name} isn't set up on this server yet.`
												: undefined
									}
									className='hover:border-primary-400 hover:bg-primary-400 hover:text-primary-950 dark:hover:border-primary-400 dark:hover:bg-primary-400 dark:hover:text-primary-950 mt-3.5 h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-white text-[11px] font-black text-slate-700 transition-all disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'>
									{!canManageConnections
										? 'Admins only'
										: isConnectorUnavailable(availableApp.connector)
											? CONNECTOR_UNAVAILABLE_LABEL
											: availableApp.isConnected
												? 'Add another account'
												: isOAuthCredentialType(availableApp.connector)
													? 'Authorize'
													: 'Connect'}
								</button>
							</div>
						))
					)}
				</div>

				{/* Modal Actions Footer */}
				<div className='mt-6 flex items-center justify-end border-t border-slate-100 pt-4 dark:border-zinc-800/60'>
					<button
						onClick={closeConnectModal}
						className='h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-5 text-[11px] font-black transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'>
						Close
					</button>
				</div>
			</motion.div>
		)}

		{/* STEP 2: CONFIGURE CREDENTIAL */}
		{modalStep === 2 && selectedAppForAuth && (
			<motion.div
				initial={{ opacity: 0, scale: 0.96, y: 15 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.96, y: 15 }}
				className='relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800/80 dark:bg-[#11131c]'>
				{/* Close button */}
				<button
					aria-label='Close app connection dialog'
					disabled={isConnecting}
					onClick={closeConnectModal}
					className='hover:text-slate-650 absolute top-4 right-4 cursor-pointer rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'>
					<CloseIcon className='h-4.5 w-4.5' />
				</button>

				<div className='flex items-center gap-3.5 border-b border-slate-100 pb-4 dark:border-zinc-800/40'>
					<div
						className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-inner'
						style={{ backgroundColor: selectedAppForAuth.color }}>
						{selectedAppForAuth.icon ? (
							<selectedAppForAuth.icon className='h-5.5 w-5.5' />
						) : (
							<Cloud className='h-5.5 w-5.5' />
						)}
					</div>
					<div>
						<h2 className='text-base font-black text-slate-900 dark:text-white'>
							Connect {selectedAppForAuth.name}
						</h2>
						<p className='text-[10px] font-bold text-slate-400 dark:text-zinc-500'>
							Configure your secure connection
						</p>
					</div>
				</div>

				{/* Credential Form */}
				<div className='mt-5 space-y-4 text-left'>
					<div>
						<label
							htmlFor='credentialName'
							className='mb-1.5 block text-[10px] font-black tracking-wider text-slate-500 uppercase dark:text-zinc-400'>
							Connection Name
						</label>
						<input
							id='credentialName'
							type='text'
							required
							value={credentialName}
							onChange={(e) => setCredentialName(e.target.value)}
							placeholder='e.g., My API Key'
							aria-label='Connection Name'
							className='focus:border-primary-500/80 focus:ring-primary-500/10 dark:focus:border-primary-500 dark:focus:ring-primary-500/15 block h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:bg-white focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:placeholder:text-zinc-600'
						/>
					</div>

					{/* Visibility is fixed when the credential is
						    created — `PATCH` does not accept `scope`. */}
					<div>
						<span className='mb-1.5 block text-[10px] font-black tracking-wider text-slate-500 uppercase dark:text-zinc-400'>
							Visibility
						</span>
						<div className='flex gap-1.5 rounded-2xl border border-slate-200 bg-slate-50/50 p-1.5 dark:border-zinc-800 dark:bg-zinc-950/40'>
							{(
								[
									['team', 'Workspace', 'Everyone here can use it'],
									['personal', 'Private', 'Only you can use it'],
								] as const
							).map(([value, label, hint]) => (
								<button
									key={value}
									type='button'
									onClick={() => setCredentialScope(value)}
									className={`flex-1 cursor-pointer rounded-xl px-3 py-2 text-left transition-all ${
										credentialScope === value
											? 'bg-white shadow-sm dark:bg-zinc-900'
											: 'hover:bg-white/60 dark:hover:bg-zinc-900/50'
									}`}>
									<span
										className={`block text-[11px] font-black ${
											credentialScope === value
												? 'text-primary-700 dark:text-primary-400'
												: 'text-slate-600 dark:text-zinc-400'
										}`}>
										{label}
									</span>
									<span className='mt-0.5 block text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
										{hint}
									</span>
								</button>
							))}
						</div>
					</div>

					{selectedAppHasNoForm ? (
						<div className='rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'>
							{selectedAppForAuth.name} has no connection fields set up on this server
							yet, so it can&apos;t be connected.
						</div>
					) : selectedAppUsesOAuth ? (
						<div className='border-primary-500/20 bg-primary-50/60 text-primary-700 dark:border-primary-500/15 dark:bg-primary-500/10 dark:text-primary-300 rounded-2xl border p-4 text-xs font-semibold'>
							OAuth will open in a secure popup. Tokens are created by the backend
							after authorization.
						</div>
					) : (
						Object.entries(selectedCredentialFields).map(([fieldKey, field]) => {
							const isRequired = selectedRequiredFields.includes(fieldKey);
							const inputId = `credential-field-${fieldKey}`;
							const value = credentialFormValues[fieldKey];

							return (
								<div key={fieldKey}>
									<label
										htmlFor={inputId}
										className='mb-1.5 block text-[10px] font-black tracking-wider text-slate-500 uppercase dark:text-zinc-400'>
										{field.label}
										{isRequired ? ' *' : ''}
									</label>
									{field.type === 'boolean' ? (
										<label className='flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200'>
											<input
												id={inputId}
												type='checkbox'
												aria-label={field.label}
												checked={Boolean(value)}
												onChange={(e) =>
													setCredentialFormValues((prev) => ({
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
											required={isRequired}
											value={String(value ?? '')}
											onChange={(e) =>
												setCredentialFormValues((prev) => ({
													...prev,
													[fieldKey]: e.target.value,
												}))
											}
											placeholder={field.placeholder}
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
											required={isRequired}
											value={String(value ?? '')}
											onChange={(e) =>
												setCredentialFormValues((prev) => ({
													...prev,
													[fieldKey]:
														field.type === 'number'
															? e.target.value
															: e.target.value,
												}))
											}
											placeholder={field.placeholder}
											aria-label={field.label}
											className='focus:border-primary-500/80 focus:ring-primary-500/10 dark:focus:border-primary-500 dark:focus:ring-primary-500/15 block h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:bg-white focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:placeholder:text-zinc-600'
										/>
									)}
									{field.description && field.type !== 'boolean' && (
										<p className='mt-1.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
											{field.description}
										</p>
									)}
								</div>
							);
						})
					)}

					<div className='mt-2 flex items-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-zinc-500'>
						<ShieldCheck size={11} className='text-emerald-500' />
						<span>Encrypted with AES-256 and never shown again after saving.</span>
					</div>
				</div>

				{/* Modal Actions Footer */}
				<div className='mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-zinc-800/60'>
					<button
						disabled={isConnecting}
						onClick={() => setModalStep(1)}
						className='h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-4.5 text-[11px] font-black transition-all hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'>
						Back
					</button>
					<button
						disabled={isConnecting || !canSubmitConnection}
						onClick={handleAuthorize}
						className='bg-primary-400 text-primary-950 hover:bg-primary-500 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-[11px] font-black shadow-md transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-40'>
						{isConnecting ? (
							<>
								<svg
									className='text-primary-950 h-3.5 w-3.5 animate-spin'
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
								<span>Connecting...</span>
							</>
						) : (
							<span>Connect</span>
						)}
					</button>
				</div>
			</motion.div>
		)}
	</div>
);

export default ConnectModal;
