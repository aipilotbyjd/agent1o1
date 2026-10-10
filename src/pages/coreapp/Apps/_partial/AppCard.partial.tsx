import { motion } from 'framer-motion';
import { Key, Users } from 'lucide-react';
import { CONNECTOR_UNAVAILABLE_LABEL, isConnectorUnavailable } from '@/types/connector.type';
import type { IConnectedApp } from '../_types/apps.type';
import { getCredentialAttention } from '../_helper/credentialHealth.helper';
import { isOAuthCredentialType } from '../_helper/connectorCatalog.helper';

const STATUS_BADGE_STYLES = {
	expired: 'border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400',
	attention: 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400',
	active: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
} as const;

const STATUS_DOT_STYLES = {
	expired: 'bg-red-500',
	attention: 'bg-amber-500',
	active: 'bg-emerald-500',
} as const;

/** One badge per card: the worst state any of the app's accounts is in. */
const AppStatusBadge = ({ app }: { app: IConnectedApp }) => {
	const status = app.isExpired
		? 'expired'
		: app.credentials.some((credential) => getCredentialAttention(credential, app.isOAuth))
			? 'attention'
			: 'active';
	const label = { expired: 'Expired', attention: 'Needs attention', active: 'Active' }[status];

	return (
		<span
			className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold whitespace-nowrap ${STATUS_BADGE_STYLES[status]}`}>
			<span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_STYLES[status]}`} />
			{label}
		</span>
	);
};

interface IAppCardProps {
	app: IConnectedApp;
	/** Owners and admins only; everyone else can view accounts but not connect. */
	canManage: boolean;
	isBusy: boolean;
	onAction: () => void;
}

const AppCard = ({ app, canManage, isBusy, onAction }: IAppCardProps) => {
	const IconComponent = app.icon;
	const CategoryIcon = app.categoryIcon;
	return (
		<motion.article
			key={app.id}
			layout
			initial={{ opacity: 0, scale: 0.96, y: 10 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.96, y: 10 }}
			whileHover={{ y: -6 }}
			transition={{ type: 'spring', stiffness: 350, damping: 25 }}
			className='group hover:border-primary-500/30 dark:hover:border-primary-500/30 relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg sm:min-h-[248px] sm:p-6 dark:border-zinc-800/80 dark:bg-[#11131c]'>
			{/* Brand glow */}
			<div
				className='pointer-events-none absolute -inset-px -z-10 rounded-3xl opacity-0 blur-md transition-all duration-500 group-hover:opacity-10'
				style={{
					background: `radial-gradient(circle at 30% 0%, ${app.color} 0%, transparent 70%)`,
				}}
			/>

			{/* Header: icon + status */}
			<div className='flex items-start justify-between gap-3'>
				<div
					className='relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-inner transition-transform duration-300 group-hover:scale-105'
					style={{ backgroundColor: app.color }}>
					<IconComponent className='h-7 w-7 text-white' />
				</div>
				{app.isConnected && <AppStatusBadge app={app} />}
			</div>

			{/* Name + category */}
			<h3 className='mt-4 truncate text-base font-extrabold text-slate-900 dark:text-white'>
				{app.name}
			</h3>
			<p className='mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-zinc-500'>
				<CategoryIcon className='h-3.5 w-3.5 shrink-0' />
				<span className='truncate'>{app.categoryLabel}</span>
				<span aria-hidden='true'>·</span>
				<span className='shrink-0'>{app.isOAuth ? 'OAuth' : 'API key'}</span>
			</p>

			{/* Description */}
			<p className='mt-2 line-clamp-2 text-xs leading-relaxed font-semibold text-slate-400 dark:text-zinc-500'>
				{app.description}
			</p>

			{/* Footer */}
			<div className='mt-auto pt-4'>
				<div className='mb-3 flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-zinc-500'>
					{app.isConnected ? (
						<>
							<Users size={12} className='text-emerald-500' />
							<span className='text-slate-800 dark:text-zinc-200'>
								{app.credentials.length}
							</span>
							<span>
								{app.credentials.length === 1 ? 'account' : 'accounts'} connected
							</span>
						</>
					) : (
						<>
							<Key size={12} />
							<span>
								{app.isOAuth ? 'Sign in with OAuth' : 'Connect with an API key'}
							</span>
						</>
					)}
				</div>
				<button
					onClick={onAction}
					disabled={
						isBusy ||
						(!app.isConnected && (isConnectorUnavailable(app.connector) || !canManage))
					}
					title={
						!app.isConnected && !canManage
							? 'Only workspace owners and admins can connect apps.'
							: !app.isConnected && isConnectorUnavailable(app.connector)
								? `${app.name} isn't set up on this server yet.`
								: undefined
					}
					className={`h-10 w-full cursor-pointer rounded-xl text-xs font-extrabold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${
						app.isConnected
							? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 dark:bg-emerald-500/5 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
							: 'bg-primary-400 text-primary-950 hover:bg-primary-500'
					}`}>
					{app.isConnected
						? !canManage
							? 'View accounts'
							: app.isExpired
								? 'Reconnect'
								: 'Manage accounts'
						: !canManage
							? 'Admins only'
							: isConnectorUnavailable(app.connector)
								? CONNECTOR_UNAVAILABLE_LABEL
								: isOAuthCredentialType(app.connector)
									? 'Authorize'
									: 'Connect'}
				</button>
			</div>
		</motion.article>
	);
};

export default AppCard;
