import { useEditorWorkspaceId } from '../../../_hooks/useEditorWorkspaceId.hook';
import { useEffect, useId, useMemo, useState } from 'react';
import {
	AlertCircle,
	Check,
	Loader2,
	Plus,
	Search,
	Users,
	UserRound,
	X,
	ArrowUpRight,
} from 'lucide-react';
import {
	FloatingFocusManager,
	FloatingPortal,
	FloatingOverlay,
	useClick,
	useDismiss,
	useFloating,
	useInteractions,
	useRole,
} from '@floating-ui/react';
import { useConnectorCredentials, useConnectors } from '@/api/modules/connectors';
import type { TConnectorCredential } from '@/types/connector.type';
import { isConnectorUnavailable } from '@/types/connector.type';
import AccountConnectionSetup from './AccountConnectionSetup.partial';

type Props = {
	connectorKey?: string;
	value?: string;
	onChange: (credentialId: string) => void;
	/** Open the shared account popup without rendering an inline field. */
	popupOnly?: boolean;
	onClose?: () => void;
};

const isExpired = (credential: TConnectorCredential) => credential.is_expired;

const accountScope = (credential: TConnectorCredential) =>
	credential.scope === 'team' ? 'Shared with team' : 'Personal account';

const formatAccountDate = (date: string | null) => {
	if (!date) return null;
	const parsed = new Date(date);
	return Number.isNaN(parsed.getTime())
		? null
		: parsed.toLocaleString(undefined, {
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: '2-digit',
			});
};

const AccountChoiceCard = ({
	account,
	active,
	current,
	duplicateName,
	radioName,
	onSelect,
}: {
	account: TConnectorCredential;
	active: boolean;
	current: boolean;
	duplicateName: boolean;
	radioName: string;
	onSelect: (id: string) => void;
}) => {
	const expired = isExpired(account);
	const added = duplicateName ? formatAccountDate(account.created_at) : null;
	const lastUsed = formatAccountDate(account.last_used_at);
	const initials =
		account.name
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((word) => word.charAt(0))
			.join('')
			.toUpperCase() || 'A';
	return (
		<label
			className={`group flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition focus-within:ring-2 focus-within:ring-zinc-400 ${active ? 'border-zinc-600 bg-zinc-50 shadow-sm dark:border-zinc-400 dark:bg-zinc-800/70' : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/60 dark:border-zinc-700 dark:bg-zinc-900/30 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/40'}`}>
			<input
				type='radio'
				name={radioName}
				value={account.id}
				checked={active}
				onChange={() => onSelect(account.id)}
				className='sr-only'
			/>
			<span
				aria-hidden
				className={`flex size-10 shrink-0 items-center justify-center rounded-xl border text-xs font-semibold ${active ? 'border-zinc-200 bg-white text-zinc-800 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100' : 'border-zinc-100 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'}`}>
				{initials}
			</span>
			<span className='min-w-0 flex-1'>
				<span className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1'>
					<span
						title={account.name}
						className='max-w-full truncate text-sm font-semibold'>
						{account.name}
					</span>
					{current && (
						<span className='rounded bg-zinc-200/70 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'>
							Current
						</span>
					)}
					{account.is_default && (
						<span className='text-[10px] text-zinc-500'>Default</span>
					)}
				</span>
				<span className='mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]'>
					<span
						className={`flex items-center gap-1.5 ${expired ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
						<span
							className={`size-1.5 rounded-full ${expired ? 'bg-amber-500' : 'bg-emerald-500'}`}
						/>
						{expired ? 'Needs reconnection' : 'Ready to use'}
					</span>
					{added && (
						<span className='text-zinc-500 dark:text-zinc-400'>Added {added}</span>
					)}
				</span>
				{lastUsed && (
					<span className='mt-1.5 block text-[11px] text-zinc-400'>
						Last used {lastUsed}
					</span>
				)}
			</span>
			<span
				aria-hidden
				className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${active ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900' : 'border-zinc-300 group-hover:border-zinc-400 dark:border-zinc-600'}`}>
				{active && <Check size={12} strokeWidth={2.5} />}
			</span>
		</label>
	);
};

/** A compact node field opens a focused chooser, outside the canvas transform. */
const AccountSelect = ({ connectorKey, value, onChange, popupOnly = false, onClose }: Props) => {
	const activeWorkspaceId = useEditorWorkspaceId();
	const {
		data: allCredentials = [],
		isLoading,
		isError,
		refetch,
	} = useConnectorCredentials(activeWorkspaceId);
	const { data: connectors = [] } = useConnectors();
	const [open, setOpen] = useState(popupOnly);
	const [adding, setAdding] = useState(false);
	const [connectionBusy, setConnectionBusy] = useState(false);
	const [search, setSearch] = useState('');
	const [pendingId, setPendingId] = useState(value);
	const descriptionId = useId();
	const radioName = useId();
	const [error, setError] = useState<string>();
	const headingId = useId();
	const {
		refs: { setReference, setFloating },
		context,
	} = useFloating({
		open,
		onOpenChange: (next) => {
			setOpen(next);
			setSearch('');
			if (next) {
				setPendingId(value);
				setAdding(false);
			}
		},
	});

	const connector = connectors.find((item) => item.key === connectorKey);
	const appName = connector?.name ?? connectorKey ?? 'app';
	const isUnavailable = isConnectorUnavailable(connector);
	const accounts = useMemo(
		() =>
			connectorKey
				? allCredentials.filter(
						(credential) =>
							credential.connector?.key === connectorKey ||
							credential.connector_id === connector?.id,
					)
				: allCredentials,
		[allCredentials, connectorKey, connector?.id],
	);
	const selected = accounts.find((credential) => credential.id === value);
	const expired = selected ? isExpired(selected) : false;
	const pendingAccount = accounts.find((account) => account.id === pendingId);
	const duplicateNames = new Set(
		accounts
			.filter(
				(account, index) =>
					accounts.findIndex((other) => other.name === account.name) !== index,
			)
			.map((account) => account.name),
	);
	const filteredAccounts = accounts
		.filter((account) =>
			`${account.name} ${accountScope(account)}`
				.toLowerCase()
				.includes(search.trim().toLowerCase()),
		)
		.sort(
			(a, b) =>
				Number(b.id === value) - Number(a.id === value) ||
				Number(isExpired(a)) - Number(isExpired(b)),
		);

	const click = useClick(context, {
		enabled: !isLoading && !isError && !connectionBusy && accounts.length > 0,
	});
	const dismiss = useDismiss(context, { enabled: !connectionBusy });
	const role = useRole(context, { role: 'dialog' });
	const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

	useEffect(() => {
		if (!popupOnly && !adding && !value && accounts.length === 1 && !isExpired(accounts[0]))
			onChange(accounts[0].id);
	}, [value, accounts, onChange, adding, popupOnly]);

	useEffect(() => {
		if (popupOnly && !open) onClose?.();
	}, [popupOnly, open, onClose]);

	// An empty account list opens straight into "connect", once per change of
	// what it depends on, so cancelling it sticks.
	const shouldStartAdding = Boolean(
		popupOnly &&
		open &&
		!isLoading &&
		!isError &&
		accounts.length === 0 &&
		connector &&
		!isUnavailable,
	);
	const addingKey = `${popupOnly}:${open}:${isLoading}:${isError}:${accounts.length}:${connector?.id ?? ''}:${isUnavailable}`;
	const [syncedAddingKey, setSyncedAddingKey] = useState<string | null>(null);
	if (syncedAddingKey !== addingKey) {
		setSyncedAddingKey(addingKey);
		if (shouldStartAdding) setAdding(true);
	}

	const connectNew = () => {
		setError(undefined);
		if (!connector || isUnavailable) {
			setError(`${appName} connections aren't available yet. Please try again later.`);
			return;
		}
		setSearch('');
		setAdding(true);
		setOpen(true);
	};

	const busy = isLoading;
	const empty = !isLoading && !isError && accounts.length === 0;
	const title = isLoading
		? 'Loading accounts…'
		: isError
			? 'Couldn’t load accounts'
			: empty
				? `Connect ${appName}`
				: (selected?.name ?? (value ? 'Account unavailable' : 'Choose an account'));
	const subtitle = isError
		? 'Click to try again'
		: empty
			? isUnavailable
				? 'Connections aren’t available yet'
				: 'Add an account to use this step'
			: selected
				? accountScope(selected)
				: value
					? 'Choose another connected account'
					: `Use a connected ${appName} account`;

	return (
		<div
			className='nodrag flex flex-col gap-1.5'
			onPointerDown={(event) => event.stopPropagation()}
			onKeyDown={(event) => event.stopPropagation()}>
			<div className={popupOnly ? 'hidden' : undefined}>
				<button
					ref={setReference}
					type='button'
					disabled={busy || (empty && isUnavailable)}
					{...getReferenceProps({
						onClick: (event) => {
							event.stopPropagation();
							if (isError) {
								setOpen(false);
								void refetch();
							} else if (empty) void connectNew();
						},
					})}
					aria-label={
						empty || isError || busy
							? title
							: `${appName} account: ${selected?.name ?? 'Choose an account'}`
					}
					aria-haspopup={empty || isError ? undefined : 'dialog'}
					aria-expanded={empty || isError ? undefined : open}
					title={subtitle}
					className={`flex min-h-9 w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none disabled:opacity-50 ${open ? 'border-zinc-400 bg-zinc-50 dark:border-zinc-500 dark:bg-zinc-800' : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800'}`}>
					{busy ? (
						<Loader2 size={14} className='shrink-0 animate-spin text-zinc-400' />
					) : (
						<UserRound size={14} className='shrink-0 text-zinc-400' />
					)}
					<span className='min-w-0 flex-1 truncate text-[11px] font-medium text-zinc-800 dark:text-zinc-100'>
						{title}
					</span>
					{expired && <AlertCircle size={13} className='shrink-0 text-amber-500' />}
					{!busy && (
						<span className='ml-1 shrink-0 border-l border-zinc-200 pl-2 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'>
							{empty ? <Plus size={13} /> : 'Change'}
						</span>
					)}
				</button>
				{selected && expired && (
					<p className='text-[10px] text-amber-700 dark:text-amber-400'>
						Reconnect this account in Apps before running.
					</p>
				)}
				{empty && !busy && (
					<p className='text-[10px] text-zinc-500 dark:text-zinc-400'>{subtitle}</p>
				)}
				{error && (
					<p role='alert' className='text-[10px] text-rose-600 dark:text-rose-400'>
						{error}
					</p>
				)}
			</div>
			{open && (popupOnly || (!isError && !busy && (adding || !empty))) && (
				<FloatingPortal>
					<FloatingOverlay
						lockScroll
						className='fixed inset-0 z-[9999] grid items-center justify-items-center overflow-y-auto bg-zinc-950/45 p-4 backdrop-blur-[3px] sm:p-8'>
						<FloatingFocusManager context={context}>
							<div
								ref={setFloating}
								{...getFloatingProps({
									onPointerDown: (event) => event.stopPropagation(),
									onClick: (event) => event.stopPropagation(),
									onKeyDown: (event) => event.stopPropagation(),
								})}
								aria-labelledby={headingId}
								aria-describedby={descriptionId}
								className='nodrag nowheel flex max-h-[90svh] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl dark:border-zinc-700 dark:bg-[#18181b] dark:text-zinc-100'>
								{adding && connector ? (
									<AccountConnectionSetup
										key={connector.id}
										connector={connector}
										headingId={headingId}
										descriptionId={descriptionId}
										onBusyChange={setConnectionBusy}
										onBack={() => {
											setAdding(false);
											if (!accounts.length) setOpen(false);
										}}
										onClose={() => setOpen(false)}
										onConnected={(id) => {
											onChange(id);
											setOpen(false);
											setAdding(false);
										}}
									/>
								) : (
									<>
										<header className='shrink-0 px-6 pt-6 pb-5 sm:px-8 sm:pt-8'>
											<div className='mb-4 flex items-center justify-between'>
												<span className='flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400'>
													<span className='flex size-6 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800'>
														<UserRound size={13} />
													</span>
													{appName} connection
												</span>
												<button
													type='button'
													aria-label='Close account chooser'
													onClick={() => setOpen(false)}
													className='rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 focus-visible:outline-zinc-400 dark:hover:bg-zinc-800'>
													<X size={18} />
												</button>
											</div>
											<h2
												id={headingId}
												className='text-[24px] leading-8 font-semibold tracking-tight'>
												Choose an account
											</h2>
											<p
												id={descriptionId}
												className='mt-2 text-sm leading-5 text-zinc-500 dark:text-zinc-400'>
												Choose which {appName} account to use for this step.
											</p>
										</header>
										<div className='min-h-0 overflow-y-auto px-6 pb-6 sm:px-8'>
											<div className='relative mb-5'>
												<Search
													size={17}
													className='pointer-events-none absolute top-3 left-3.5 text-zinc-400'
												/>
												<input
													aria-label='Search accounts'
													value={search}
													onChange={(event) =>
														setSearch(event.target.value)
													}
													placeholder='Search your accounts'
													className='h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 pr-10 pl-10 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500'
												/>
												{search && (
													<button
														type='button'
														aria-label='Clear account search'
														onClick={() => setSearch('')}
														className='absolute top-3 right-3 rounded p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100'>
														<X size={15} />
													</button>
												)}
											</div>
											{(['team', 'personal'] as const).map((scope) => {
												const group = filteredAccounts.filter(
													(account) => account.scope === scope,
												);
												if (!group.length) return null;
												const ScopeIcon =
													scope === 'team' ? Users : UserRound;
												return (
													<fieldset key={scope} className='mb-5 min-w-0'>
														<legend className='mb-2.5 flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400'>
															<ScopeIcon size={14} />
															{scope === 'team'
																? 'Team accounts'
																: 'Personal accounts'}
															<span className='ml-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800'>
																{group.length}
															</span>
														</legend>
														<div className='space-y-2'>
															{group.map((credential) => (
																<AccountChoiceCard
																	key={credential.id}
																	account={credential}
																	active={
																		credential.id === pendingId
																	}
																	current={
																		credential.id === value
																	}
																	duplicateName={duplicateNames.has(
																		credential.name,
																	)}
																	radioName={radioName}
																	onSelect={setPendingId}
																/>
															))}
														</div>
													</fieldset>
												);
											})}
											{isLoading ? (
												<p
													role='status'
													className='py-6 text-sm text-zinc-500'>
													Loading accounts…
												</p>
											) : isError ? (
												<div
													role='alert'
													className='py-6 text-sm text-rose-600'>
													Couldn’t load accounts.{' '}
													<button
														type='button'
														onClick={() => void refetch()}
														className='underline'>
														Try again
													</button>
												</div>
											) : (
												!filteredAccounts.length && (
													<div className='rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center dark:border-zinc-700'>
														<p className='text-sm font-medium'>
															No accounts found
														</p>
														<p className='mt-1 text-xs text-zinc-500'>
															Try another name or connect a new
															account.
														</p>
													</div>
												)
											)}
											<button
												type='button'
												onClick={connectNew}
												disabled={isUnavailable}
												className='mt-1 flex w-full items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3.5 text-left transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-zinc-400 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-800'>
												<span className='flex size-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>
													<Plus size={16} />
												</span>
												<span>
													<span className='block text-sm font-medium'>
														Connect another account
													</span>
													<span className='mt-1 block text-xs text-zinc-500 dark:text-zinc-400'>
														{isUnavailable
															? 'New connections aren’t available yet'
															: `Sign in to a different ${appName} account`}
													</span>
												</span>
												<ArrowUpRight
													size={16}
													className='ml-auto shrink-0 text-zinc-400'
												/>
											</button>
											{pendingAccount && isExpired(pendingAccount) && (
												<p className='mt-4 flex items-start gap-2 text-xs leading-5 text-amber-700 dark:text-amber-400'>
													<AlertCircle
														size={15}
														className='mt-0.5 shrink-0'
													/>
													This connection has expired. Reconnect it in
													Apps before running this step.
												</p>
											)}
										</div>
										<footer className='flex shrink-0 items-center justify-between gap-4 border-t border-zinc-200 bg-zinc-50 px-6 py-4 sm:px-8 dark:border-zinc-800 dark:bg-zinc-900/50'>
											<div
												aria-live='polite'
												className='hidden min-w-0 flex-1 sm:block'>
												<p className='text-[10px] font-medium text-zinc-400'>
													{pendingAccount
														? pendingId === value
															? 'Current account'
															: 'Selected account'
														: 'No account selected'}
												</p>
												<p
													title={pendingAccount?.name}
													className='mt-1 truncate text-xs font-medium text-zinc-700 dark:text-zinc-200'>
													{pendingAccount?.name ??
														'Choose an account to continue'}
												</p>
											</div>
											<div className='ml-auto flex items-center gap-2'>
												<button
													type='button'
													onClick={() => setOpen(false)}
													className='rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-xs font-medium hover:bg-zinc-100 focus-visible:outline-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700'>
													Cancel
												</button>
												<button
													type='button'
													disabled={
														isLoading || isError || !pendingAccount
													}
													onClick={() => {
														if (
															pendingAccount &&
															pendingAccount.id !== value
														)
															onChange(pendingAccount.id);
														setOpen(false);
													}}
													className='flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-xs font-medium text-white hover:bg-zinc-700 focus-visible:outline-zinc-400 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white'>
													<Check size={14} />
													Use this account
												</button>
											</div>
										</footer>
									</>
								)}
							</div>
						</FloatingFocusManager>
					</FloatingOverlay>
				</FloatingPortal>
			)}
		</div>
	);
};

export default AccountSelect;
