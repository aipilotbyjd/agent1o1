import { useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Braces, KeyRound, Lock, Plus, Search } from 'lucide-react';
import useOnClickOutside from '@/hooks/useOnClickOutside';
import { useEditorSecrets } from '../../_hooks/useEditorSecrets.hook';

type Props = {
	onPick: (key: string) => void;
	/** "+ New secret", with whatever was typed in the search as the name. */
	onCreate: (name: string) => void;
	onClose: () => void;
	/** Open above the field: there's no room below it. */
	dropUp?: boolean;
};

/**
 * The workspace's secrets and variables as a searchable list: picking one
 * inserts its `{{ secrets.KEY }}` reference. Only names are listed; a
 * secret's value never reaches the browser.
 */
const SecretPicker = ({ onPick, onCreate, onClose, dropUp = false }: Props) => {
	const { secrets, isReady } = useEditorSecrets();
	const [query, setQuery] = useState('');
	const [active, setActive] = useState(0);
	const ref = useRef<HTMLDivElement>(null);
	// Its toggle button opens and closes it on its own.
	useOnClickOutside(ref, (event) => {
		if (!(event.target as HTMLElement).closest('[data-secret-picker-toggle]')) onClose();
	});

	const shown = useMemo(() => {
		const q = query.trim().toLowerCase();
		return secrets.filter(
			(secret) =>
				!q ||
				secret.key.toLowerCase().includes(q) ||
				(secret.description ?? '').toLowerCase().includes(q),
		);
	}, [secrets, query]);

	// The last row is "+ New secret".
	const rows = shown.length + 1;
	const choose = (index: number) =>
		index < shown.length ? onPick(shown[index].key) : onCreate(query.trim());

	const onKeyDown = (event: KeyboardEvent) => {
		// Keep typing here from reaching the canvas's keyboard shortcuts.
		event.stopPropagation();
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			setActive((index) => (index + 1) % rows);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			setActive((index) => (index - 1 + rows) % rows);
		} else if (event.key === 'Enter') {
			event.preventDefault();
			choose(active);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			onClose();
		}
	};

	return (
		<div
			ref={ref}
			role='dialog'
			aria-label='Insert a secret'
			onKeyDown={onKeyDown}
			onMouseDown={(event) => event.stopPropagation()}
			className={`nodrag nowheel absolute right-0 z-40 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900 ${
				dropUp ? 'bottom-full mb-1' : 'top-full mt-1'
			}`}>
			<div className='flex items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800'>
				<Search size={13} className='shrink-0 text-zinc-400' />
				<input
					autoFocus
					value={query}
					onChange={(event) => {
						setQuery(event.target.value);
						setActive(0);
					}}
					placeholder='Search secrets…'
					aria-label='Search secrets'
					className='min-w-0 flex-1 bg-transparent text-xs font-semibold text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100'
				/>
			</div>

			<ul aria-label='Secrets' className='max-h-56 overflow-y-auto py-1'>
				{!isReady && (
					<li className='px-3 py-2 text-[11px] text-zinc-400'>Loading secrets…</li>
				)}
				{isReady && secrets.length === 0 && (
					<li className='px-3 py-2 text-[11px] text-zinc-400'>
						No secrets yet. Add your first one below.
					</li>
				)}
				{isReady && secrets.length > 0 && shown.length === 0 && (
					<li className='px-3 py-2 text-[11px] text-zinc-400'>
						Nothing matches “{query}”.
					</li>
				)}
				{shown.map((secret, index) => (
					<li key={secret.id}>
						<button
							type='button'
							onMouseEnter={() => setActive(index)}
							onClick={() => onPick(secret.key)}
							className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left ${
								index === active ? 'bg-zinc-100 dark:bg-zinc-800' : ''
							}`}>
							<span
								className={`flex size-6 shrink-0 items-center justify-center rounded-md ${
									secret.is_secret
										? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
										: 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
								}`}>
								{secret.is_secret ? <Lock size={12} /> : <Braces size={12} />}
							</span>
							<span className='min-w-0 flex-1'>
								<span className='block truncate font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-100'>
									{secret.key}
								</span>
								{secret.description && (
									<span className='block truncate text-[10px] text-zinc-400'>
										{secret.description}
									</span>
								)}
							</span>
							<span className='shrink-0 text-[9px] font-bold text-zinc-400 uppercase'>
								{secret.is_secret ? 'Secret' : 'Variable'}
							</span>
						</button>
					</li>
				))}
			</ul>

			<button
				type='button'
				onMouseEnter={() => setActive(shown.length)}
				onClick={() => onCreate(query.trim())}
				className={`text-primary-700 dark:text-primary-300 flex w-full items-center gap-2 border-t border-zinc-100 px-3 py-2 text-left text-[11px] font-bold dark:border-zinc-800 ${
					active === shown.length ? 'bg-zinc-100 dark:bg-zinc-800' : ''
				}`}>
				<Plus size={13} />
				{query.trim() ? `New secret “${query.trim()}”` : 'New secret'}
				<KeyRound size={12} className='ml-auto opacity-50' />
			</button>
		</div>
	);
};

export default SecretPicker;
