import { useState } from 'react';
import { Check, Copy, Globe, KeyRound, Lock, RefreshCw, Users } from 'lucide-react';
import { ApiError, notify } from '@/api/core';
import { useRotateWorkflowPageLink, useUpdateWorkflowPage } from '@/api/modules/workflow-pages';
import { useConfirm } from '@/context/confirm';
import paths from '@/Routes/paths';
import type { TPageAccess } from '@/types/workflow-page.type';
import { usePageBuilder } from '../_context/PageBuilder.context';
import { panelInputClass, Toggle } from './controls.partial';

const OPTIONS: { value: TPageAccess; label: string; hint: string; icon: typeof Users }[] = [
	{ value: 'workspace', label: 'Workspace members', hint: 'People in this workspace, from inside the app.', icon: Users },
	{ value: 'link', label: 'Anyone with the link', hint: 'No sign-in needed. Runs use your workspace’s credits.', icon: Globe },
	{ value: 'password', label: 'Anyone with the link and password', hint: 'Visitors enter a password first.', icon: Lock },
];

const ShareMenu = ({ onClose }: { onClose: () => void }) => {
	const { ws, page } = usePageBuilder();
	const { confirm } = useConfirm();
	const update = useUpdateWorkflowPage(ws, page.id, [403]);
	const rotate = useRotateWorkflowPageLink(ws, page.id);
	const [password, setPassword] = useState('');
	const [passwordError, setPasswordError] = useState<string | null>(null);
	const [limit, setLimit] = useState(page.max_runs_per_day?.toString() ?? '');
	const [copied, setCopied] = useState(false);
	const [choosingPassword, setChoosingPassword] = useState(false);

	const url =
		page.access === 'workspace'
			? `${window.location.origin}${paths.usePage(ws, page.id)}`
			: `${window.location.origin}${paths.publicPage(page.public_token)}`;

	const onAccessError = (error: unknown) => {
		if (ApiError.is(error) && error.status === 403) {
			notify.error('Sharing outside your workspace needs a plan that includes public pages.');
		} else if (ApiError.is(error) && error.isValidation) {
			setPasswordError(error.field('password') ?? error.message);
		}
	};

	const chooseAccess = (access: TPageAccess) => {
		if (access === page.access) return;
		if (access === 'password' && !page.has_password) {
			setChoosingPassword(true);
			return;
		}
		setChoosingPassword(false);
		update.mutate({ access }, { onError: onAccessError });
	};

	const savePassword = () => {
		setPasswordError(null);
		if (password.length < 6) {
			setPasswordError('Use at least 6 characters.');
			return;
		}
		update.mutate(
			{ password, access: 'password' },
			{
				onSuccess: () => {
					setPassword('');
					setChoosingPassword(false);
					notify.success('Password saved. Anyone who had the old one needs the new one.');
				},
				onError: onAccessError,
			},
		);
	};

	const saveLimit = () => {
		const value = limit.trim() === '' ? null : Number(limit);
		if (value !== null && (!Number.isInteger(value) || value < 1)) {
			setLimit(page.max_runs_per_day?.toString() ?? '');
			return;
		}
		if (value !== page.max_runs_per_day) update.mutate({ max_runs_per_day: value });
	};

	const onRotate = async () => {
		const ok = await confirm({
			title: 'Create a new link?',
			message: 'The current link stops working straight away. Anyone you shared it with will need the new one.',
			confirmText: 'Create new link',
		});
		if (ok) rotate.mutate(undefined, { onSuccess: () => notify.success('New link created.') });
	};

	const copy = () =>
		navigator.clipboard.writeText(url).then(() => {
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1800);
		});

	return (
		<div className='w-[380px] rounded-xl border border-zinc-200 bg-white shadow-xl ring-1 ring-black/5 dark:border-white/10 dark:bg-zinc-950 dark:ring-white/5'>
			<div className='border-b border-zinc-100 px-4 py-3 dark:border-white/[0.06]'>
				<p className='text-sm font-bold text-zinc-900 dark:text-zinc-100'>Who can use this page</p>
			</div>

			<div role='radiogroup' aria-label='Access' className='space-y-1 p-2'>
				{OPTIONS.map((option) => {
					const active = page.access === option.value || (option.value === 'password' && choosingPassword);
					return (
						<button
							key={option.value}
							type='button'
							role='radio'
							aria-checked={active}
							onClick={() => chooseAccess(option.value)}
							disabled={update.isPending}
							className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${
								active
									? 'bg-primary-50 ring-primary-400/50 dark:bg-primary-400/10 ring-1'
									: 'hover:bg-zinc-50 dark:hover:bg-white/[0.03]'
							}`}>
							<option.icon
								size={15}
								className={`mt-0.5 shrink-0 ${active ? 'text-primary-700 dark:text-primary-400' : 'text-zinc-400'}`}
							/>
							<span className='min-w-0'>
								<span className='block text-xs font-semibold text-zinc-800 dark:text-zinc-100'>{option.label}</span>
								<span className='block text-[10px] leading-snug text-zinc-500 dark:text-zinc-400'>{option.hint}</span>
							</span>
						</button>
					);
				})}
			</div>

			{(page.access === 'password' || choosingPassword) && (
				<div className='space-y-1.5 border-t border-zinc-100 px-4 py-3 dark:border-white/[0.06]'>
					<label htmlFor='page-password' className='flex items-center gap-1.5 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300'>
						<KeyRound size={12} />
						{page.has_password ? 'Change password' : 'Set a password'}
					</label>
					<div className='flex gap-2'>
						<input
							id='page-password'
							type='password'
							autoComplete='new-password'
							value={password}
							placeholder={page.has_password ? '••••••••' : 'At least 6 characters'}
							onChange={(e) => setPassword(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && savePassword()}
							className={panelInputClass}
						/>
						<button
							type='button'
							onClick={savePassword}
							disabled={!password || update.isPending}
							className='h-8 shrink-0 rounded-lg bg-zinc-900 px-3 text-xs font-bold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900'>
							Save
						</button>
					</div>
					{passwordError && <p className='text-[10px] text-rose-500'>{passwordError}</p>}
				</div>
			)}

			<div className='space-y-2 border-t border-zinc-100 px-4 py-3 dark:border-white/[0.06]'>
				<p className='text-[11px] font-semibold text-zinc-700 dark:text-zinc-300'>
					{page.access === 'workspace' ? 'Link for members' : 'Public link'}
				</p>
				<div className='flex gap-2'>
					<input readOnly value={url} aria-label='Page link' onFocus={(e) => e.target.select()} className={`${panelInputClass} font-mono text-[11px]`} />
					<button
						type='button'
						onClick={() => void copy()}
						className='flex h-8 shrink-0 items-center gap-1 rounded-lg border border-zinc-200 px-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/[0.05]'>
						{copied ? <Check size={13} className='text-emerald-500' /> : <Copy size={13} />}
						{copied ? 'Copied' : 'Copy'}
					</button>
				</div>
				{!page.is_published && (
					<p className='text-[10px] text-amber-600 dark:text-amber-400'>Publish the page before sharing the link.</p>
				)}
				{page.access !== 'workspace' && (
					<button
						type='button'
						onClick={() => void onRotate()}
						disabled={rotate.isPending}
						className='inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'>
						<RefreshCw size={11} className={rotate.isPending ? 'animate-spin' : ''} />
						Create a new link
					</button>
				)}
			</div>

			<div className='space-y-3 border-t border-zinc-100 px-4 py-3 dark:border-white/[0.06]'>
				<Toggle
					label='Accepting runs'
					hint='Turn off to pause the page without unpublishing it.'
					checked={page.is_enabled}
					onChange={(is_enabled) => update.mutate({ is_enabled })}
				/>
				<div className='flex items-center justify-between gap-3'>
					<label htmlFor='page-limit' className='min-w-0'>
						<span className='block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300'>Runs per day</span>
						<span className='block text-[10px] text-zinc-400 dark:text-zinc-500'>Leave empty for no limit.</span>
					</label>
					<input
						id='page-limit'
						type='number'
						min={1}
						inputMode='numeric'
						value={limit}
						placeholder='∞'
						onChange={(e) => setLimit(e.target.value)}
						onBlur={saveLimit}
						onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
						className={`${panelInputClass} w-24 text-right`}
					/>
				</div>
			</div>

			<div className='flex justify-end border-t border-zinc-100 px-4 py-2.5 dark:border-white/[0.06]'>
				<button type='button' onClick={onClose} className='text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'>
					Done
				</button>
			</div>
		</div>
	);
};

export default ShareMenu;
