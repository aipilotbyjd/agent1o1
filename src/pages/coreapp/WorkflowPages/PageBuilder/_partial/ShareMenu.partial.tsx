import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import QRCode from 'qrcode';
import {
	Check,
	Copy,
	Download,
	ExternalLink,
	Globe,
	ImageIcon,
	KeyRound,
	Lock,
	Mail,
	MessageCircle,
	Pencil,
	QrCode,
	RefreshCw,
	Share2,
	TriangleAlert,
	Users,
	X,
} from 'lucide-react';
import { ApiError, notify } from '@/api/core';
import { useRotateWorkflowPageLink, useUpdateWorkflowPage } from '@/api/modules/workflow-pages';
import { useConfirm } from '@/context/confirm';
import paths from '@/Routes/paths';
import type { TPageAccess, TPageSharePreview, TWorkflowPage } from '@/types/workflow-page.type';
import { usePageBuilder } from '../_context/PageBuilder.context';
import { panelInputClass, Toggle } from './controls.partial';

const OPTIONS: { value: TPageAccess; label: string; hint: string; icon: typeof Users }[] = [
	{
		value: 'workspace',
		label: 'Workspace members',
		hint: 'People in this workspace, from inside the app.',
		icon: Users,
	},
	{
		value: 'link',
		label: 'Anyone with the link',
		hint: 'No sign-in needed. Runs use your workspace’s credits.',
		icon: Globe,
	},
	{
		value: 'password',
		label: 'Anyone with the link and password',
		hint: 'Visitors enter a password first.',
		icon: Lock,
	},
];

const XMark = () => (
	<svg viewBox='0 0 24 24' width={14} height={14} className='fill-current' aria-hidden>
		<path d='M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z' />
	</svg>
);

const LinkedInMark = () => (
	<svg viewBox='0 0 24 24' width={14} height={14} className='fill-current' aria-hidden>
		<path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
	</svg>
);

const cardLabelClass =
	'flex items-center gap-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300';

const Section = ({
	title,
	children,
	action,
}: {
	title: string;
	children: ReactNode;
	action?: ReactNode;
}) => (
	<section className='space-y-2.5 border-t border-zinc-100 px-4 py-3.5 dark:border-white/[0.06]'>
		<div className='flex items-center justify-between gap-2'>
			<h3 className='text-[11px] font-bold tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
				{title}
			</h3>
			{action}
		</div>
		{children}
	</section>
);

const StatusChip = ({ page }: { page: TWorkflowPage }) => {
	const { label, className } = !page.is_published
		? {
				label: 'Not published',
				className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
			}
		: !page.is_enabled
			? {
					label: 'Paused',
					className: 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300',
				}
			: {
					label: 'Live',
					className:
						'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
				};
	return (
		<span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${className}`}>
			{label}
		</span>
	);
};

/** The card a chat app shows for the link, drawn the way most of them do. */
const LinkCard = ({ preview, host }: { preview: TPageSharePreview; host: string }) => (
	<div className='overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-zinc-900'>
		{preview.image_url ? (
			<img src={preview.image_url} alt='' className='aspect-[1.91/1] w-full object-cover' />
		) : (
			<div
				className='flex aspect-[1.91/1] w-full items-end p-4'
				style={{
					background: `linear-gradient(135deg, ${preview.theme_color}, color-mix(in srgb, ${preview.theme_color} 55%, #000))`,
				}}>
				<span className='line-clamp-2 text-lg leading-tight font-extrabold text-white'>
					{preview.title}
				</span>
			</div>
		)}
		<div className='space-y-0.5 px-3 py-2.5'>
			<p className='truncate text-[10px] font-semibold tracking-wide text-zinc-400 uppercase'>
				{host}
			</p>
			<p className='truncate text-xs font-bold text-zinc-900 dark:text-zinc-100'>
				{preview.title}
			</p>
			<p className='line-clamp-2 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400'>
				{preview.description}
			</p>
		</div>
	</div>
);

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
	const [showQr, setShowQr] = useState(false);
	const [qr, setQr] = useState<string | null>(null);
	const [editingCard, setEditingCard] = useState(false);
	const [card, setCard] = useState({
		share_title: page.share.title ?? '',
		share_description: page.share.description ?? '',
		share_image_url: page.share.image_url ?? '',
	});
	const [cardError, setCardError] = useState<string | null>(null);

	const isPublic = page.access !== 'workspace';
	const url =
		page.access === 'workspace'
			? `${window.location.origin}${paths.usePage(ws, page.id)}`
			: `${window.location.origin}${paths.publicPage(page.public_token)}`;
	const { host, pathname } = new URL(url);
	const preview = page.share_preview;
	const canShare = page.is_published;

	useEffect(() => {
		if (!showQr) return;
		let cancelled = false;
		QRCode.toDataURL(url, { width: 480, margin: 1, errorCorrectionLevel: 'M' }).then((data) => {
			if (!cancelled) setQr(data);
		});
		return () => {
			cancelled = true;
		};
	}, [showQr, url]);

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

	const saveCard = () => {
		setCardError(null);
		update.mutate(
			{
				share_title: card.share_title.trim() || null,
				share_description: card.share_description.trim() || null,
				share_image_url: card.share_image_url.trim() || null,
			},
			{
				onSuccess: () => setEditingCard(false),
				onError: (error) => {
					if (ApiError.is(error) && error.isValidation) {
						setCardError(
							error.field('share_image_url')
								? 'Use a full image link that starts with https://'
								: (error.field('share_title') ??
										error.field('share_description') ??
										error.message),
						);
					}
				},
			},
		);
	};

	const onRotate = async () => {
		const ok = await confirm({
			title: 'Create a new link?',
			message:
				'The current link stops working straight away. Anyone you shared it with will need the new one.',
			confirmText: 'Create new link',
		});
		if (ok) rotate.mutate(undefined, { onSuccess: () => notify.success('New link created.') });
	};

	const copy = () =>
		navigator.clipboard.writeText(url).then(() => {
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1800);
		});

	const title = preview?.title ?? page.name;
	const text = encodeURIComponent(title);
	const link = encodeURIComponent(url);
	const targets = [
		{
			label: 'Email',
			icon: <Mail size={14} />,
			href: `mailto:?subject=${text}&body=${encodeURIComponent(`${title}\n\n${url}`)}`,
		},
		{
			label: 'WhatsApp',
			icon: <MessageCircle size={14} />,
			href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
		},
		{
			label: 'LinkedIn',
			icon: <LinkedInMark />,
			href: `https://www.linkedin.com/sharing/share-offsite/?url=${link}`,
		},
		{ label: 'X', icon: <XMark />, href: `https://x.com/intent/post?text=${text}&url=${link}` },
	];
	const nativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

	return (
		<div className='flex max-h-[calc(100vh-72px)] w-[400px] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl ring-1 ring-black/5 dark:border-white/10 dark:bg-zinc-950 dark:ring-white/5'>
			<div className='flex items-center gap-2 px-4 py-3'>
				<p className='text-sm font-bold text-zinc-900 dark:text-zinc-100'>Share page</p>
				<StatusChip page={page} />
				<button
					type='button'
					onClick={onClose}
					aria-label='Close'
					className='ml-auto flex size-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200'>
					<X size={15} />
				</button>
			</div>

			<div className='min-h-0 flex-1 overflow-y-auto'>
				{!page.is_published && (
					<div className='mx-4 mb-3 flex gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'>
						<TriangleAlert size={14} className='mt-px shrink-0' />
						Publish the page first. Until then the link won’t open for anyone.
					</div>
				)}

				<Section title='Link'>
					<div className='flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 p-1 pl-2.5 dark:border-white/10 dark:bg-zinc-900'>
						<Globe size={13} className='shrink-0 text-zinc-400' />
						<p className='flex min-w-0 flex-1 text-xs' title={url}>
							<span className='shrink-0 text-zinc-500 dark:text-zinc-400'>
								{host}
							</span>
							<span className='truncate font-medium text-zinc-900 dark:text-zinc-100'>
								{pathname}
							</span>
						</p>
						<a
							href={url}
							target='_blank'
							rel='noopener noreferrer'
							aria-label='Open the page in a new tab'
							title='Open'
							className='flex size-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-white'>
							<ExternalLink size={13} />
						</a>
						<button
							type='button'
							onClick={() => void copy()}
							className='bg-primary-400 text-primary-950 flex h-7 shrink-0 items-center gap-1 rounded-md px-2.5 text-xs font-bold transition hover:brightness-105'>
							{copied ? <Check size={13} /> : <Copy size={13} />}
							{copied ? 'Copied' : 'Copy'}
						</button>
					</div>

					{isPublic ? (
						<>
							<div
								className={`grid grid-cols-5 gap-1.5 ${canShare ? '' : 'pointer-events-none opacity-40'}`}>
								{targets.map((target) => (
									<a
										key={target.label}
										href={target.href}
										target='_blank'
										rel='noopener noreferrer'
										aria-disabled={!canShare}
										className='flex flex-col items-center gap-1 rounded-lg border border-zinc-200 py-2 text-[10px] font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-white'>
										{target.icon}
										{target.label}
									</a>
								))}
								<button
									type='button'
									onClick={() => setShowQr((open) => !open)}
									aria-pressed={showQr}
									className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[10px] font-semibold transition ${
										showQr
											? 'border-primary-400 bg-primary-50 text-primary-900 dark:bg-primary-400/10 dark:text-primary-200'
											: 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-white'
									}`}>
									<QrCode size={14} />
									QR code
								</button>
							</div>

							{showQr && canShare && (
								<div className='flex items-center gap-3 rounded-lg border border-zinc-200 p-2.5 dark:border-white/10'>
									<div className='size-24 shrink-0 overflow-hidden rounded-md bg-white p-1'>
										{qr && (
											<img
												src={qr}
												alt={`QR code for ${title}`}
												className='size-full'
											/>
										)}
									</div>
									<div className='min-w-0 space-y-2'>
										<p className='text-[11px] leading-snug text-zinc-500 dark:text-zinc-400'>
											Scanning opens the page. Put it on posters, slides or
											printed handouts.
										</p>
										{qr && (
											<a
												href={qr}
												download={`${page.name.replace(/[^\w-]+/g, '-').toLowerCase() || 'page'}-qr.png`}
												className='inline-flex h-7 items-center gap-1 rounded-md border border-zinc-200 px-2 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/[0.05]'>
												<Download size={12} />
												Download PNG
											</a>
										)}
									</div>
								</div>
							)}

							<div className='flex items-center justify-between gap-2'>
								{nativeShare && canShare ? (
									<button
										type='button'
										onClick={() =>
											void navigator
												.share({ title, url })
												.catch(() => undefined)
										}
										className='inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'>
										<Share2 size={11} />
										More options…
									</button>
								) : (
									<span />
								)}
								<button
									type='button'
									onClick={() => void onRotate()}
									disabled={rotate.isPending}
									className='inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'>
									<RefreshCw
										size={11}
										className={rotate.isPending ? 'animate-spin' : ''}
									/>
									Create a new link
								</button>
							</div>
						</>
					) : (
						<p className='text-[11px] leading-snug text-zinc-500 dark:text-zinc-400'>
							Only members of this workspace can open this link. Choose{' '}
							<span className='font-semibold text-zinc-700 dark:text-zinc-200'>
								Anyone with the link
							</span>{' '}
							below to share it outside.
						</p>
					)}
				</Section>

				<Section title='Who can open it'>
					<div role='radiogroup' aria-label='Access' className='space-y-1'>
						{OPTIONS.map((option) => {
							const active =
								page.access === option.value ||
								(option.value === 'password' && choosingPassword);
							return (
								<button
									key={option.value}
									type='button'
									role='radio'
									aria-checked={active}
									onClick={() => chooseAccess(option.value)}
									disabled={update.isPending}
									className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
										active
											? 'border-primary-400 bg-primary-50/70 dark:bg-primary-400/10'
											: 'border-transparent hover:bg-zinc-50 dark:hover:bg-white/[0.03]'
									}`}>
									<option.icon
										size={15}
										className={`shrink-0 ${active ? 'text-primary-700 dark:text-primary-400' : 'text-zinc-400'}`}
									/>
									<span className='min-w-0 flex-1'>
										<span className='block text-xs font-semibold text-zinc-800 dark:text-zinc-100'>
											{option.label}
										</span>
										<span className='block text-[10px] leading-snug text-zinc-500 dark:text-zinc-400'>
											{option.hint}
										</span>
									</span>
									<span
										aria-hidden
										className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
											active
												? 'border-primary-500 bg-primary-500'
												: 'border-zinc-300 dark:border-zinc-600'
										}`}>
										{active && (
											<span className='size-1.5 rounded-full bg-white' />
										)}
									</span>
								</button>
							);
						})}
					</div>

					{(page.access === 'password' || choosingPassword) && (
						<div className='space-y-1.5 rounded-lg bg-zinc-50 p-2.5 dark:bg-white/[0.03]'>
							<label
								htmlFor='page-password'
								className='flex items-center gap-1.5 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300'>
								<KeyRound size={12} />
								{page.has_password ? 'Change password' : 'Set a password'}
							</label>
							<div className='flex gap-2'>
								<input
									id='page-password'
									type='password'
									autoComplete='new-password'
									value={password}
									placeholder={
										page.has_password ? '••••••••' : 'At least 6 characters'
									}
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
							{passwordError && (
								<p className='text-[10px] text-rose-500'>{passwordError}</p>
							)}
						</div>
					)}
				</Section>

				{isPublic && preview && (
					<Section
						title='Link preview'
						action={
							!editingCard && (
								<button
									type='button'
									onClick={() => setEditingCard(true)}
									className='inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'>
									<Pencil size={11} />
									Customize
								</button>
							)
						}>
						<LinkCard preview={preview} host={host} />
						{editingCard ? (
							<div className='space-y-2'>
								<label className='block space-y-1'>
									<span className={cardLabelClass}>Title</span>
									<input
										value={card.share_title}
										maxLength={120}
										placeholder={page.name}
										onChange={(e) =>
											setCard({ ...card, share_title: e.target.value })
										}
										className={panelInputClass}
									/>
								</label>
								<label className='block space-y-1'>
									<span className={cardLabelClass}>Description</span>
									<textarea
										value={card.share_description}
										maxLength={300}
										rows={2}
										placeholder='Worked out from the first text on the page'
										onChange={(e) =>
											setCard({ ...card, share_description: e.target.value })
										}
										className={`${panelInputClass} resize-none`}
									/>
								</label>
								<label className='block space-y-1'>
									<span className={cardLabelClass}>
										<ImageIcon size={11} />
										Image link
									</span>
									<input
										value={card.share_image_url}
										maxLength={2048}
										placeholder='Uses the page’s cover when empty'
										onChange={(e) =>
											setCard({ ...card, share_image_url: e.target.value })
										}
										className={panelInputClass}
									/>
								</label>
								{cardError && (
									<p className='text-[10px] text-rose-500'>{cardError}</p>
								)}
								<div className='flex items-center justify-end gap-2'>
									<button
										type='button'
										onClick={() => {
											setEditingCard(false);
											setCardError(null);
										}}
										className='h-7 rounded-md px-2.5 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'>
										Cancel
									</button>
									<button
										type='button'
										onClick={saveCard}
										disabled={update.isPending}
										className='h-7 rounded-md bg-zinc-900 px-3 text-[11px] font-bold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900'>
										Save preview
									</button>
								</div>
							</div>
						) : (
							<p className='text-[10px] leading-snug text-zinc-400 dark:text-zinc-500'>
								What WhatsApp, Slack, LinkedIn and others show for the link. Apps
								may keep an old preview for a while after a change.
							</p>
						)}
					</Section>
				)}

				<Section title='Limits'>
					<Toggle
						label='Accepting runs'
						hint='Turn off to pause the page without unpublishing it.'
						checked={page.is_enabled}
						onChange={(is_enabled) => update.mutate({ is_enabled })}
					/>
					<div className='flex items-center justify-between gap-4'>
						<label htmlFor='page-limit' className='min-w-0 flex-1'>
							<span className='block text-xs font-semibold text-zinc-800 dark:text-zinc-100'>
								Runs per day
							</span>
							<span className='block text-[10px] text-zinc-500 dark:text-zinc-400'>
								Leave empty for no limit.
							</span>
						</label>
						<div className='w-24 shrink-0'>
							<input
								id='page-limit'
								type='number'
								min={1}
								inputMode='numeric'
								value={limit}
								placeholder='No limit'
								onChange={(e) => setLimit(e.target.value)}
								onBlur={saveLimit}
								onKeyDown={(e) =>
									e.key === 'Enter' && (e.target as HTMLInputElement).blur()
								}
								className={`${panelInputClass} text-right`}
							/>
						</div>
					</div>
				</Section>
			</div>
		</div>
	);
};

export default ShareMenu;
