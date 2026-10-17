import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Plus } from 'lucide-react';
import type { TConnector, TConnectorCredential } from '@/types/connector.type';
import { connectorToApp } from '@/pages/coreapp/Apps/_helper/connectorCatalog.helper';
import type { TPromptAppShortcut } from '../../_hooks/usePromptMentionItems.hook';
import { credentialMentionToken, readableColor } from '../../_helper/promptMentions.helper';

type Props = {
	shortcuts: TPromptAppShortcut[];
	onInsert: (credential: TConnectorCredential, connector: TConnector) => void;
	onConnect: (connector: TConnector) => void;
};

// The prompt keeps its cursor, so an inserted account lands where the user was typing.
const keepPromptFocus = (event: MouseEvent) => event.preventDefault();

const itemClass =
	'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/[0.04]';

/** One icon per app: its menu inserts one of its accounts into the prompt, or connects one. */
const PromptAppShortcuts = ({ shortcuts, onInsert, onConnect }: Props) => {
	const [openId, setOpenId] = useState<string | null>(null);
	const rootRef = useRef<HTMLDivElement>(null);

	// A fixed backdrop can't do this here: the prompt sits inside a transformed parent.
	useEffect(() => {
		if (!openId) return;
		const close = (event: PointerEvent | KeyboardEvent) => {
			if (
				event instanceof KeyboardEvent
					? event.key === 'Escape'
					: !rootRef.current?.contains(event.target as Node)
			)
				setOpenId(null);
		};
		document.addEventListener('pointerdown', close);
		document.addEventListener('keydown', close);
		return () => {
			document.removeEventListener('pointerdown', close);
			document.removeEventListener('keydown', close);
		};
	}, [openId]);

	return (
		<div ref={rootRef} className='flex items-center gap-2.5'>
			{shortcuts.map(({ connector, accounts }) => {
				const app = connectorToApp(connector);
				const AppIcon = app.icon;
				const color = readableColor(app.color);
				const open = openId === connector.id;
				return (
					<div key={connector.id} className='relative'>
						<button
							type='button'
							onMouseDown={keepPromptFocus}
							onClick={() => setOpenId(open ? null : connector.id)}
							aria-label={connector.name}
							aria-expanded={open}
							title={connector.name}
							className='relative flex items-center justify-center rounded-md p-1 text-zinc-500 transition hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900'
							style={{ color }}>
							<AppIcon className='h-[18px] w-[18px]' />
							{accounts.length > 0 && (
								<span className='absolute right-0.5 bottom-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950' />
							)}
						</button>
						{open && (
							<div className='absolute bottom-full left-0 z-50 mb-2.5 w-64 rounded-xl border border-zinc-200 bg-white/95 p-3 text-left shadow-xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95'>
								<div className='mb-2 flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800/50'>
									<span style={{ color }}>
										<AppIcon className='h-3.5 w-3.5' />
									</span>
									<span className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>
										{connector.name}
									</span>
								</div>
								<div className='flex flex-col space-y-1'>
									{accounts.map((account) => (
										<button
											key={account.id}
											type='button'
											onMouseDown={keepPromptFocus}
											onClick={() => {
												onInsert(account, connector);
												setOpenId(null);
											}}
											className={itemClass}>
											<span className='truncate'>
												Insert {credentialMentionToken(account, connector)}
											</span>
											{account.is_expired ? (
												<span className='shrink-0 text-[10px] font-bold text-amber-600 dark:text-amber-400'>
													Expired
												</span>
											) : (
												account.is_default && (
													<span className='shrink-0 text-[10px] font-medium text-zinc-400'>
														Default
													</span>
												)
											)}
										</button>
									))}
									<button
										type='button'
										onMouseDown={keepPromptFocus}
										onClick={() => {
											onConnect(connector);
											setOpenId(null);
										}}
										className={itemClass}>
										<span>
											{accounts.length
												? 'Connect another account…'
												: `Connect ${connector.name}…`}
										</span>
										{accounts.length ? (
											<span className='text-[10px] font-bold text-emerald-500'>
												Connected
											</span>
										) : (
											<Plus size={13} className='text-zinc-400' />
										)}
									</button>
								</div>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};

export default PromptAppShortcuts;
