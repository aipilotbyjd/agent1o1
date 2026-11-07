import { useEffect, useRef, useState } from 'react';
import {
	Check,
	ChevronRight,
	Key,
	MoreHorizontal,
	RefreshCw,
	Search,
	Star,
	Trash2,
	Pencil,
	X as CloseIcon,
	Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { TConnectorCredential } from '@/types/connector.type';
import { isConnectorUnavailable } from '@/types/connector.type';
import type { IConnectedApp } from '../_types/apps.type';
import { formatRelativeTime, getCredentialAttention } from '../_helper/credentialHealth.helper';

/** Below this many accounts a search box is just clutter. */
const SEARCH_THRESHOLD = 4;

interface IAccountsModalProps {
	app: IConnectedApp;
	testingId: string | null;
	/** Owners and admins only; everyone else sees the accounts read-only. */
	canManage: boolean;
	busyId: string | null;
	onClose: () => void;
	onSelect: (credentialId: string) => void;
	onAdd: () => void;
	onTest: (credentialId: string) => void;
	onSetDefault: (credentialId: string) => void;
	/** Resolves `false` when the rename failed, so the field stays open. */
	onRename: (credentialId: string, name: string) => Promise<boolean>;
	onDelete: (credential: TConnectorCredential) => void;
	onReconnect: (credential: TConnectorCredential) => void;
}

const AccountsModal = ({
	app,
	testingId,
	canManage,
	busyId,
	onClose,
	onSelect,
	onAdd,
	onTest,
	onSetDefault,
	onRename,
	onDelete,
	onReconnect,
}: IAccountsModalProps) => {
	const IconComponent = app.icon;
	const canAdd = !isConnectorUnavailable(app.connector);
	const [query, setQuery] = useState('');
	const [menuId, setMenuId] = useState<string | null>(null);
	const [renamingId, setRenamingId] = useState<string | null>(null);
	const [renameValue, setRenameValue] = useState('');
	const renameInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (renamingId) renameInputRef.current?.select();
	}, [renamingId]);

	useEffect(() => {
		if (!menuId) return;
		const close = () => setMenuId(null);
		window.addEventListener('click', close);
		return () => window.removeEventListener('click', close);
	}, [menuId]);

	const normalisedQuery = query.trim().toLowerCase();
	const visibleCredentials = app.credentials.filter(
		(credential) =>
			credential.name.toLowerCase().includes(normalisedQuery) ||
			(credential.account_label ?? '').toLowerCase().includes(normalisedQuery),
	);

	/** Two connections to the same provider account are almost always a mistake. */
	const duplicateOf = (credential: TConnectorCredential) =>
		credential.account_label
			? app.credentials.find(
					(other) =>
						other.id !== credential.id &&
						other.account_label?.toLowerCase() ===
							credential.account_label!.toLowerCase(),
				)
			: undefined;

	const startRename = (credential: TConnectorCredential) => {
		setMenuId(null);
		setRenamingId(credential.id);
		setRenameValue(credential.name);
	};

	const submitRename = async (credential: TConnectorCredential) => {
		const name = renameValue.trim();
		if (!name || name === credential.name) {
			setRenamingId(null);
			return;
		}
		if (await onRename(credential.id, name)) setRenamingId(null);
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.96, y: 15 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.96, y: 15 }}
			className='relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-zinc-800/80 dark:bg-[#11131c]'>
			<button
				aria-label='Close accounts'
				onClick={onClose}
				className='hover:text-slate-650 absolute top-4 right-4 cursor-pointer rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'>
				<CloseIcon className='h-4.5 w-4.5' />
			</button>

			<div className='flex items-center gap-3.5 border-b border-slate-100 pb-4 dark:border-zinc-800/40'>
				<div
					className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-inner'
					style={{ backgroundColor: app.color }}>
					<IconComponent className='h-5.5 w-5.5' />
				</div>
				<div>
					<h2 className='text-base font-black text-slate-900 dark:text-white'>
						{app.name} accounts
					</h2>
					<p className='text-[10px] font-bold text-slate-400 dark:text-zinc-500'>
						{app.credentials.length}{' '}
						{app.credentials.length === 1 ? 'account' : 'accounts'} connected · the
						default is used when a step doesn&apos;t pick one
					</p>
				</div>
			</div>

			{app.credentials.length >= SEARCH_THRESHOLD && (
				<div className='relative mt-4'>
					<Search className='absolute top-3 left-3.5 h-4 w-4 text-slate-400' />
					<input
						type='search'
						aria-label={`Search ${app.name} accounts`}
						placeholder='Search accounts...'
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						className='focus:border-primary-500/80 focus:ring-primary-500/10 block h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-10 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:bg-white focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100'
					/>
				</div>
			)}

			<ul className='-mx-1 mt-4 flex-1 space-y-2 overflow-y-auto px-1 pb-1'>
				{visibleCredentials.length === 0 && (
					<li className='py-6 text-center text-xs font-semibold text-slate-400 dark:text-zinc-500'>
						No accounts match &ldquo;{query}&rdquo;.
					</li>
				)}
				{visibleCredentials.map((credential) => {
					const attention = getCredentialAttention(credential, app.isOAuth);
					const duplicate = duplicateOf(credential);
					const isTesting = testingId === credential.id;
					const isBusy = busyId === credential.id;
					const isRenaming = renamingId === credential.id;

					return (
						<li
							key={credential.id}
							className='hover:border-primary-500/40 dark:hover:border-primary-500/40 relative flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/50 p-3.5 transition-all hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-900'>
							<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm dark:bg-zinc-800 dark:text-zinc-400'>
								<Key className='h-4 w-4' />
							</div>

							<div className='min-w-0 flex-1'>
								{isRenaming ? (
									<form
										onSubmit={(event) => {
											event.preventDefault();
											void submitRename(credential);
										}}
										className='flex items-center gap-1.5'>
										<input
											ref={renameInputRef}
											aria-label='Account name'
											value={renameValue}
											disabled={isBusy}
											onChange={(event) => setRenameValue(event.target.value)}
											onKeyDown={(event) => {
												if (event.key !== 'Escape') return;
												event.stopPropagation();
												setRenamingId(null);
											}}
											className='border-primary-500/60 focus:ring-primary-500/10 h-8 min-w-0 flex-1 rounded-lg border bg-white px-2.5 text-xs font-bold text-slate-900 outline-none focus:ring-4 dark:bg-zinc-950 dark:text-zinc-100'
										/>
										<button
											type='submit'
											aria-label='Save name'
											disabled={isBusy || !renameValue.trim()}
											className='bg-primary-400 text-primary-950 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg disabled:opacity-40'>
											<Check className='h-3.5 w-3.5' />
										</button>
										<button
											type='button'
											aria-label='Cancel rename'
											onClick={() => setRenamingId(null)}
											className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 dark:border-zinc-700 dark:text-zinc-400'>
											<CloseIcon className='h-3.5 w-3.5' />
										</button>
									</form>
								) : (
									<button
										type='button'
										onClick={() => onSelect(credential.id)}
										className='block w-full cursor-pointer text-left'>
										<span className='flex flex-wrap items-center gap-1.5'>
											<span className='truncate text-xs font-extrabold text-slate-900 dark:text-white'>
												{credential.name}
											</span>
											{credential.is_default && (
												<span className='border-primary-500/20 bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400 rounded border px-1.5 py-0.5 text-[9px] font-bold'>
													Default
												</span>
											)}
											{attention && (
												<span
													className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${attention.level === 'expired' ? 'border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400' : 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
													{attention.label}
												</span>
											)}
										</span>
										{credential.account_label && (
											<span className='mt-0.5 block truncate text-[11px] font-bold text-slate-600 dark:text-zinc-300'>
												{credential.account_label}
											</span>
										)}
										<span className='mt-0.5 block truncate text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
											{credential.scope === 'team'
												? 'Shared with workspace'
												: 'Private'}
											{' · '}
											{credential.last_used_at
												? `Last used ${formatRelativeTime(credential.last_used_at)}`
												: 'Never used'}
										</span>
										{credential.last_tested_at &&
											credential.last_test_ok !== null && (
												<span
													className={`mt-1 flex items-center gap-1 text-[10px] font-bold ${credential.last_test_ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
													{credential.last_test_ok ? (
														<Check className='h-3 w-3 shrink-0' />
													) : (
														<CloseIcon className='h-3 w-3 shrink-0' />
													)}
													<span className='truncate'>
														{credential.last_test_ok
															? `Working · checked ${formatRelativeTime(credential.last_tested_at)}`
															: (credential.last_test_message ??
																'Last check failed')}
													</span>
												</span>
											)}
										{duplicate && (
											<span className='mt-1 block text-[10px] font-bold text-amber-600 dark:text-amber-400'>
												Same account as &ldquo;{duplicate.name}&rdquo;
											</span>
										)}
									</button>
								)}
							</div>

							{!isRenaming && canManage && (
								<div className='flex shrink-0 items-center gap-1'>
									{credential.is_expired && app.isOAuth ? (
										<button
											type='button'
											disabled={isBusy}
											onClick={() => onReconnect(credential)}
											className='bg-primary-400 text-primary-950 hover:bg-primary-500 h-8 cursor-pointer rounded-lg px-3 text-[10px] font-black transition-all disabled:opacity-50'>
											Reconnect
										</button>
									) : (
										<button
											type='button'
											aria-label={`Test ${credential.name}`}
											title='Test connection'
											disabled={isTesting}
											onClick={() => onTest(credential.id)}
											className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-wait dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'>
											{isTesting ? (
												<RefreshCw className='h-4 w-4 animate-spin' />
											) : (
												<Activity className='h-4 w-4' />
											)}
										</button>
									)}
									<button
										type='button'
										aria-label={`More actions for ${credential.name}`}
										aria-expanded={menuId === credential.id}
										onClick={(event) => {
											event.stopPropagation();
											setMenuId((current) =>
												current === credential.id ? null : credential.id,
											);
										}}
										className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'>
										<MoreHorizontal className='h-4 w-4' />
									</button>
									<ChevronRight
										onClick={() => onSelect(credential.id)}
										className='h-4 w-4 cursor-pointer text-slate-300 dark:text-zinc-600'
									/>
								</div>
							)}

							{menuId === credential.id && (
								<div
									role='menu'
									tabIndex={-1}
									onClick={(event) => event.stopPropagation()}
									onKeyDown={(event) => {
										if (event.key !== 'Escape') return;
										event.stopPropagation();
										setMenuId(null);
									}}
									className='absolute top-12 right-3 z-10 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-zinc-800 dark:bg-zinc-900'>
									<MenuItem
										icon={Pencil}
										label='Rename'
										onClick={() => startRename(credential)}
									/>
									{!credential.is_default && (
										<MenuItem
											icon={Star}
											label='Make default'
											onClick={() => {
												setMenuId(null);
												onSetDefault(credential.id);
											}}
										/>
									)}
									{app.isOAuth && !credential.is_expired && (
										<MenuItem
											icon={RefreshCw}
											label='Reconnect'
											onClick={() => {
												setMenuId(null);
												onReconnect(credential);
											}}
										/>
									)}
									<MenuItem
										icon={Trash2}
										label='Disconnect'
										danger
										onClick={() => {
											setMenuId(null);
											onDelete(credential);
										}}
									/>
								</div>
							)}
						</li>
					);
				})}
			</ul>

			{!canManage && (
				<p className='mt-4 shrink-0 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[11px] font-semibold text-slate-500 dark:bg-zinc-900 dark:text-zinc-400'>
					Only workspace owners and admins can add, test or change accounts.
				</p>
			)}
			{canManage && (
				<button
					type='button'
					onClick={onAdd}
					disabled={!canAdd}
					title={canAdd ? undefined : `${app.name} isn't set up on this server yet.`}
					className='bg-primary-400 text-primary-950 hover:bg-primary-500 mt-4 h-10 w-full shrink-0 cursor-pointer rounded-xl text-xs font-extrabold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'>
					Add another account
				</button>
			)}
		</motion.div>
	);
};

const MenuItem = ({
	icon: Icon,
	label,
	danger,
	onClick,
}: {
	icon: typeof Pencil;
	label: string;
	danger?: boolean;
	onClick: () => void;
}) => (
	<button
		type='button'
		role='menuitem'
		onClick={onClick}
		className={`flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left text-xs font-bold transition-colors ${danger ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10' : 'text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800'}`}>
		<Icon className='h-3.5 w-3.5' />
		{label}
	</button>
);

export default AccountsModal;
