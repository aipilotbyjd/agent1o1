import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, ChevronDown, Loader2, Plus } from 'lucide-react';
import {
	useConnectOAuthConnector,
	useConnectorCredentials,
	useConnectors,
} from '@/api/modules/connectors';
import { useWorkspaceContext } from '@/context/workspace';
import useOnClickOutside from '@/hooks/useOnClickOutside';
import type { TConnectorCredential } from '@/types/connector.type';
import { useWorkflowEditor } from '../../../_context/WorkflowEditorProvider.context';
import NodeIcon from '../../library/NodeIcon.partial';
import { tintStyle } from '../../library/library.util';

type Props = {
	connectorKey?: string;
	value?: string;
	onChange: (credentialId: string) => void;
};

const isExpired = (credential: TConnectorCredential) =>
	credential.is_expired ||
	(credential.expires_at ? new Date(credential.expires_at) < new Date() : false);

/**
 * Account picker for nodes that run through a connector: pick one of the
 * workspace's connected accounts, or connect another without leaving the canvas.
 */
const AccountSelect = ({ connectorKey, value, onChange }: Props) => {
	const { dispatch } = useWorkflowEditor();
	const { activeWorkspaceId } = useWorkspaceContext();
	const { data: allCredentials = [], isLoading } = useConnectorCredentials(activeWorkspaceId);
	const { data: connectors = [] } = useConnectors();
	const connectOAuth = useConnectOAuthConnector(activeWorkspaceId);

	const [open, setOpen] = useState(false);
	const [error, setError] = useState<string>();
	const rootRef = useRef<HTMLDivElement>(null);
	useOnClickOutside(rootRef, () => setOpen(false));

	const connector = connectors.find((item) => item.key === connectorKey);
	const appName = connector?.name ?? connectorKey ?? 'app';

	const accounts = useMemo(
		() =>
			connectorKey
				? allCredentials.filter((credential) => credential.connector?.key === connectorKey)
				: allCredentials,
		[allCredentials, connectorKey],
	);
	const selected = accounts.find((credential) => credential.id === value);

	// A single connected account is the obvious choice — pick it up front.
	useEffect(() => {
		if (!value && accounts.length === 1) onChange(accounts[0].id);
	}, [value, accounts, onChange]);

	const connectNew = async () => {
		setOpen(false);
		setError(undefined);

		if (!connector?.is_oauth) {
			dispatch({ type: 'SET_LINK_CREDENTIALS_OPEN', open: true });
			return;
		}

		try {
			const result = await connectOAuth.mutateAsync({
				connector_id: connector.id,
				name: `${connector.name} account`,
			});
			if (result.credentialId) onChange(result.credentialId);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : 'Could not connect the account.');
		}
	};

	const icon = (
		<span
			className='flex size-5 shrink-0 items-center justify-center rounded-md text-[9px] font-bold'
			style={tintStyle(connector?.color ?? undefined)}>
			<NodeIcon icon={connector?.icon ?? undefined} size={12} />
		</span>
	);

	if (!isLoading && accounts.length === 0) {
		return (
			<div className='flex flex-col gap-1'>
				<button
					type='button'
					disabled={connectOAuth.isPending}
					onPointerDown={(event) => event.stopPropagation()}
					onClick={connectNew}
					className='nodrag flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'>
					{connectOAuth.isPending ? (
						<Loader2 size={12} className='animate-spin' />
					) : (
						icon
					)}
					{connectOAuth.isPending ? 'Waiting for authorization…' : `Connect ${appName}`}
				</button>
				{error && <span className='text-[10px] font-medium text-rose-500'>{error}</span>}
			</div>
		);
	}

	return (
		<div ref={rootRef} className='relative flex flex-col gap-1'>
			<button
				type='button'
				aria-haspopup='listbox'
				aria-expanded={open}
				disabled={isLoading || connectOAuth.isPending}
				onPointerDown={(event) => event.stopPropagation()}
				onClick={() => setOpen((current) => !current)}
				className={[
					'nodrag flex w-full items-center gap-2 rounded-lg border bg-white px-2 py-1.5 text-left shadow-xs transition disabled:opacity-60 dark:bg-zinc-900',
					open
						? 'border-primary-400 ring-2 ring-primary-400/20'
						: 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600',
				].join(' ')}>
				{connectOAuth.isPending ? <Loader2 size={14} className='animate-spin text-zinc-400' /> : icon}
				<span
					className={[
						'flex-1 truncate text-[11px] font-semibold',
						selected ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-400',
					].join(' ')}>
					{isLoading
						? 'Loading accounts…'
						: connectOAuth.isPending
							? 'Waiting for authorization…'
							: (selected?.name ?? `Select ${appName} account`)}
				</span>
				{selected && isExpired(selected) && (
					<span className='rounded-full bg-rose-50 px-1.5 py-px text-[9px] font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'>
						Expired
					</span>
				)}
				<ChevronDown
					size={13}
					className={`shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
				/>
			</button>

			{open && (
				<div
					role='listbox'
					onPointerDown={(event) => event.stopPropagation()}
					className='nodrag nowheel absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40'>
					<div className='px-2.5 pt-2 pb-1 text-[9px] font-bold tracking-wide text-zinc-400 uppercase'>
						{appName} accounts
					</div>
					<div className='max-h-48 overflow-y-auto px-1 pb-1'>
						{accounts.map((credential) => {
							const expired = isExpired(credential);
							const active = credential.id === value;
							return (
								<button
									key={credential.id}
									type='button'
									role='option'
									aria-selected={active}
									onClick={() => {
										onChange(credential.id);
										setOpen(false);
									}}
									className={[
										'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition',
										active
											? 'bg-primary-50 dark:bg-primary-950/30'
											: 'hover:bg-zinc-50 dark:hover:bg-zinc-800',
									].join(' ')}>
									<span className='flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-bold text-zinc-600 uppercase dark:bg-zinc-800 dark:text-zinc-300'>
										{credential.name.charAt(0)}
									</span>
									<span className='flex min-w-0 flex-1 flex-col'>
										<span className='truncate text-[11px] font-semibold text-zinc-800 dark:text-zinc-100'>
											{credential.name}
										</span>
										<span className='text-[9px] text-zinc-400 capitalize'>
											{credential.scope}
											{credential.is_default ? ' · default' : ''}
										</span>
									</span>
									{expired && <AlertCircle size={12} className='shrink-0 text-rose-500' />}
									{active && <Check size={13} className='shrink-0 text-primary-600' />}
								</button>
							);
						})}
					</div>
					<button
						type='button'
						onClick={connectNew}
						className='flex w-full items-center gap-2 border-t border-zinc-100 px-3 py-2 text-[11px] font-semibold text-primary-600 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-primary-400 dark:hover:bg-zinc-800'>
						<Plus size={13} />
						Connect new {appName} account
					</button>
				</div>
			)}

			{error && <span className='text-[10px] font-medium text-rose-500'>{error}</span>}
		</div>
	);
};

export default AccountSelect;
